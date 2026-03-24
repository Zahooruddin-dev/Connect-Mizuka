import { useState, useCallback, useEffect, useRef } from 'react';
import socket from '../services/socket';

function createPC() {
    return new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    });
}

export function useCallManager({ user, onToast }) {
    const [callState, setCallState] = useState(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteSocketIdRef = useRef(null);
    const iceCandidateQueue = useRef([]);
    const callStateRef = useRef(null);
    const durationInterval = useRef(null);

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    const stopTimer = useCallback(() => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        durationInterval.current = setInterval(() => {
            setCallState((prev) =>
                prev?.phase === 'active'
                    ? { ...prev, duration: (prev.duration || 0) + 1 }
                    : prev,
            );
        }, 1000);
    }, [stopTimer]);

    const cleanup = useCallback(() => {
        console.log('[cleanup] Cleaning up call resources');
        stopTimer();
        localStreamRef.current?.getTracks().forEach((t) => {
            console.log(`[cleanup] Stopping track: ${t.kind} enabled=${t.enabled}`);
            t.stop();
        });
        localStreamRef.current = null;
        pcRef.current?.close();
        pcRef.current = null;
        remoteSocketIdRef.current = null;
        iceCandidateQueue.current = [];
        setCallState(null);
    }, [stopTimer]);

    const sendICE = useCallback(() => {
        const to = remoteSocketIdRef.current;
        console.log(`[sendICE] to=${to}, queued=${iceCandidateQueue.current.length}`);
        if (!to) {
            console.warn('[sendICE] No remote socket ID, cannot send ICE candidates');
            return;
        }
        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            console.log(`[sendICE] Emitting ice-candidate to ${to}:`, candidate?.candidate);
            socket.emit('ice-candidate', { to, candidate });
        }
    }, []);

    const flushICE = useCallback(async () => {
        const pc = pcRef.current;
        console.log(`[flushICE] pc=${!!pc}, queued=${iceCandidateQueue.current.length}`);
        if (!pc) return;
        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            try {
                console.log('[flushICE] Adding queued ICE candidate:', candidate?.candidate);
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.warn('[flushICE] Failed to add ICE candidate', err);
            }
        }
    }, []);

    const getMedia = useCallback(async (callType) => {
        console.log(`[getMedia] Requesting media for callType=${callType}`);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === 'video',
                audio: true,
            });
            console.log(`[getMedia] Got stream id=${stream.id}`);
            stream.getTracks().forEach((t) =>
                console.log(`[getMedia] Track: kind=${t.kind} enabled=${t.enabled} readyState=${t.readyState} label=${t.label}`)
            );
            return stream;
        } catch (err) {
            console.error('[getMedia] Failed to get media:', err.name, err.message);
            throw err;
        }
    }, []);

    const buildPC = useCallback((stream) => {
        console.log('[buildPC] Creating RTCPeerConnection');
        const pc = createPC();
        pcRef.current = pc;

        stream.getTracks().forEach((track) => {
            console.log(`[buildPC] Adding track to PC: kind=${track.kind}`);
            pc.addTrack(track, stream);
        });

        pc.onicecandidate = (e) => {
            if (!e.candidate) {
                console.log('[onicecandidate] ICE gathering complete');
                return;
            }
            const to = remoteSocketIdRef.current;
            console.log(`[onicecandidate] Got candidate, remote=${to}, type=${e.candidate.type}, protocol=${e.candidate.protocol}`);
            if (to) {
                console.log(`[onicecandidate] Sending immediately to ${to}`);
                socket.emit('ice-candidate', { to, candidate: e.candidate });
            } else {
                console.log('[onicecandidate] No remote yet, queuing candidate');
                iceCandidateQueue.current.push(e.candidate);
            }
        };

        pc.onicegatheringstatechange = () => {
            console.log(`[PC] ICE gathering state: ${pc.iceGatheringState}`);
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[PC] ICE connection state: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'failed') {
                console.error('[PC] ICE connection FAILED - no audio/video possible');
            }
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                console.log('[PC] ICE connected successfully!');
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[PC] Connection state: ${pc.connectionState}`);
        };

        pc.onsignalingstatechange = () => {
            console.log(`[PC] Signaling state: ${pc.signalingState}`);
        };

        pc.ontrack = (e) => {
            console.log(`[ontrack] Received remote track: kind=${e.track.kind} streams=${e.streams.length}`);
            e.track.onunmute = () => console.log(`[ontrack] Track unmuted: ${e.track.kind}`);
            e.track.onended = () => console.log(`[ontrack] Track ended: ${e.track.kind}`);
            const remoteStream = e.streams?.[0] ?? new MediaStream([e.track]);
            console.log(`[ontrack] Remote stream id=${remoteStream.id} tracks=${remoteStream.getTracks().length}`);
            setCallState((prev) => (prev ? { ...prev, remoteStream } : prev));
        };

        return pc;
    }, []);

    const startCall = useCallback(
        async ({ targetUserId, targetUsername, callType }) => {
            console.log(`[startCall] target=${targetUserId} (${targetUsername}), type=${callType}`);
            if (callStateRef.current) {
                console.warn('[startCall] Already in a call, ignoring');
                return;
            }
            try {
                const stream = await getMedia(callType);
                localStreamRef.current = stream;
                const pc = buildPC(stream);
                console.log('[startCall] Creating offer...');
                const offer = await pc.createOffer();
                console.log('[startCall] Offer created, setting local description...');
                await pc.setLocalDescription(offer);
                console.log('[startCall] Local description set, emitting call:user');
                socket.emit('call:user', {
                    toUserId: targetUserId,
                    callerId: user.id,
                    callerUsername: user.username,
                    callType,
                    offer,
                });
                setCallState({
                    phase: 'outgoing',
                    callType,
                    targetUsername,
                    targetUserId,
                    localStream: stream,
                    isMuted: false,
                    isCameraOff: false,
                });
            } catch (err) {
                console.error('[startCall] Error:', err);
                cleanup();
                onToast('Could not access microphone/camera', 'error');
            }
        },
        [user, getMedia, buildPC, cleanup, onToast],
    );

    const acceptCall = useCallback(async () => {
        const cs = callStateRef.current;
        console.log(`[acceptCall] phase=${cs?.phase}`);
        if (!cs || cs.phase !== 'incoming') return;
        try {
            const { callType, callerSocketId, offer, callerUsername } = cs;
            console.log(`[acceptCall] Accepting from socket=${callerSocketId}, type=${callType}`);
            const stream = await getMedia(callType);
            localStreamRef.current = stream;
            remoteSocketIdRef.current = callerSocketId;
            console.log(`[acceptCall] remoteSocketId set to ${callerSocketId}`);
            const pc = buildPC(stream);
            console.log('[acceptCall] Setting remote description (offer)...');
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('[acceptCall] Remote description set, flushing queued ICE...');
            await flushICE();
            console.log('[acceptCall] Creating answer...');
            const answer = await pc.createAnswer();
            console.log('[acceptCall] Answer created, setting local description...');
            await pc.setLocalDescription(answer);
            console.log(`[acceptCall] Emitting call:accepted to ${callerSocketId}`);
            socket.emit('call:accepted', { to: callerSocketId, answer, callType });
            sendICE();
            setCallState({
                phase: 'active',
                callType,
                remoteUsername: callerUsername,
                remoteSocketId: callerSocketId,
                localStream: stream,
                remoteStream: null,
                isMuted: false,
                isCameraOff: false,
                duration: 0,
            });
            startTimer();
        } catch (err) {
            console.error('[acceptCall] Error:', err);
            cleanup();
            onToast('Could not access microphone/camera', 'error');
        }
    }, [getMedia, buildPC, flushICE, sendICE, cleanup, startTimer, onToast]);

    const rejectCall = useCallback(() => {
        const cs = callStateRef.current;
        if (!cs || cs.phase !== 'incoming') return;
        console.log(`[rejectCall] Rejecting call from ${cs.callerSocketId}`);
        socket.emit('call:rejected', { to: cs.callerSocketId });
        setCallState(null);
    }, []);

    const endCall = useCallback(() => {
        const cs = callStateRef.current;
        if (!cs) return;
        const to = cs.remoteSocketId ?? remoteSocketIdRef.current ?? cs.callerSocketId ?? null;
        console.log(`[endCall] Ending call, notifying ${to}`);
        if (to) socket.emit('call:end', { to });
        cleanup();
        onToast('Call ended', 'info');
    }, [cleanup, onToast]);

    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach((t) => {
            t.enabled = !t.enabled;
            console.log(`[toggleMute] Audio track enabled=${t.enabled}`);
        });
        setCallState((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : prev));
    }, []);

    const toggleCamera = useCallback(() => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach((t) => {
            t.enabled = !t.enabled;
            console.log(`[toggleCamera] Video track enabled=${t.enabled}`);
        });
        setCallState((prev) =>
            prev ? { ...prev, isCameraOff: !prev.isCameraOff } : prev,
        );
    }, []);

    useEffect(() => {
        const onIncoming = ({ from, fromUserId, callerUsername, callType, offer }) => {
            console.log(`[socket:call:incoming] from=${from}, callType=${callType}, hasOffer=${!!offer}`);
            if (callStateRef.current) {
                console.warn('[socket:call:incoming] Already in call, rejecting');
                socket.emit('call:rejected', { to: from });
                return;
            }
            setCallState({
                phase: 'incoming',
                callType,
                callerUsername,
                callerSocketId: from,
                callerUserId: fromUserId,
                offer,
            });
        };

        const onAnswered = async ({ from, answer }) => {
            console.log(`[socket:call:answered] from=${from}, hasAnswer=${!!answer}`);
            remoteSocketIdRef.current = from;
            if (!pcRef.current) {
                console.error('[socket:call:answered] No PC exists!');
                return;
            }
            try {
                console.log('[socket:call:answered] Setting remote description (answer)...');
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('[socket:call:answered] Remote description set, flushing ICE...');
                sendICE();
                setCallState((prev) =>
                    prev?.phase === 'outgoing'
                        ? {
                            ...prev,
                            phase: 'active',
                            remoteUsername: prev.targetUsername,
                            remoteSocketId: from,
                            remoteStream: null,
                            duration: 0,
                          }
                        : prev,
                );
                startTimer();
            } catch (err) {
                console.error('[socket:call:answered] Error setting remote description:', err);
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            if (!candidate) return;
            const pc = pcRef.current;
            console.log(`[socket:ice-candidate] received, pc=${!!pc}, hasRemoteDesc=${!!pc?.remoteDescription}, type=${candidate.type}`);
            if (!pc) {
                console.warn('[socket:ice-candidate] No PC, dropping candidate');
                return;
            }
            try {
                if (pc.remoteDescription) {
                    console.log('[socket:ice-candidate] Adding directly to PC');
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    console.log('[socket:ice-candidate] No remote desc yet, queuing');
                    iceCandidateQueue.current.push(candidate);
                }
            } catch (err) {
                console.warn('[socket:ice-candidate] Failed to add:', err);
            }
        };

        const onRejected = () => {
            console.log('[socket:call:rejected] Call was rejected');
            cleanup();
            onToast('Call declined', 'info');
        };
        const onEnded = () => {
            console.log('[socket:call:ended] Remote ended the call');
            cleanup();
            onToast('Call ended', 'info');
        };
        const onUserOffline = () => {
            console.log('[socket:call:user_offline] Target user is offline');
            cleanup();
            onToast('User is offline', 'warning');
        };

        socket.on('call:incoming', onIncoming);
        socket.on('call:answered', onAnswered);
        socket.on('ice-candidate', onIceCandidate);
        socket.on('call:rejected', onRejected);
        socket.on('call:ended', onEnded);
        socket.on('call:user_offline', onUserOffline);

        return () => {
            socket.off('call:incoming', onIncoming);
            socket.off('call:answered', onAnswered);
            socket.off('ice-candidate', onIceCandidate);
            socket.off('call:rejected', onRejected);
            socket.off('call:ended', onEnded);
            socket.off('call:user_offline', onUserOffline);
        };
    }, [sendICE, flushICE, cleanup, startTimer, onToast]);

    useEffect(
        () => () => {
            cleanup();
        },
        [cleanup],
    );

    return {
        callState,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
    };
}