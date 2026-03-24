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
	const outgoingTimer = useRef(null);

	useEffect(() => {
		callStateRef.current = callState;
	}, [callState]);

	const stopTimer = useCallback(() => {
		if (durationInterval.current) {
			clearInterval(durationInterval.current);
			durationInterval.current = null;
		}
	}, []);

	const clearOutgoingTimer = useCallback(() => {
		if (outgoingTimer.current) {
			clearTimeout(outgoingTimer.current);
			outgoingTimer.current = null;
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
		stopTimer();
		clearOutgoingTimer();
		localStreamRef.current?.getTracks().forEach((t) => t.stop());
		localStreamRef.current = null;
		pcRef.current?.close();
		pcRef.current = null;
		remoteSocketIdRef.current = null;
		iceCandidateQueue.current = [];
		setCallState(null);
	}, [stopTimer, clearOutgoingTimer]);

	const sendICE = useCallback(() => {
		const to = remoteSocketIdRef.current;
		if (!to) return;
		while (iceCandidateQueue.current.length > 0) {
			const candidate = iceCandidateQueue.current.shift();
			socket.emit('ice-candidate', { to, candidate });
		}
	}, []);

	const flushICE = useCallback(async () => {
		const pc = pcRef.current;
		if (!pc) return;
		while (iceCandidateQueue.current.length > 0) {
			const candidate = iceCandidateQueue.current.shift();
			try {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			} catch (err) {
				console.warn('[flushICE] Failed to add ICE candidate', err);
			}
		}
	}, []);

	const getMedia = useCallback(async (callType) => {
		try {
			return await navigator.mediaDevices.getUserMedia({
				video: callType === 'video',
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 48000,
					channelCount: 1,
				},
			});
		} catch (err) {
			throw err;
		}
	}, []);

	const buildPC = useCallback((stream) => {
		const pc = createPC();
		pcRef.current = pc;

		stream.getTracks().forEach((track) => pc.addTrack(track, stream));

		pc.onicecandidate = (e) => {
			if (!e.candidate) return;
			const to = remoteSocketIdRef.current;
			if (to) {
				socket.emit('ice-candidate', { to, candidate: e.candidate });
			} else {
				iceCandidateQueue.current.push(e.candidate);
			}
		};

		pc.oniceconnectionstatechange = () => {
			if (pc.iceConnectionState === 'failed') {
				console.error('[PC] ICE connection FAILED');
			}
		};

		pc.ontrack = (e) => {
			const remoteStream = e.streams?.[0] ?? new MediaStream([e.track]);
			setCallState((prev) => (prev ? { ...prev, remoteStream } : prev));
		};

		return pc;
	}, []);

	const startCall = useCallback(
		async ({ targetUserId, targetUsername, callType }) => {
			if (callStateRef.current) return;
			try {
				const stream = await getMedia(callType);
				localStreamRef.current = stream;
				const pc = buildPC(stream);
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);
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

				outgoingTimer.current = setTimeout(() => {
					const cs = callStateRef.current;
					if (cs?.phase !== 'outgoing') return;
					const to = remoteSocketIdRef.current;
					if (to) socket.emit('call:end', { to });
					cleanup();
					onToast('No answer', 'info');
				}, 15000);
			} catch (err) {
				cleanup();
				onToast('Could not access microphone/camera', 'error');
			}
		},
		[user, getMedia, buildPC, cleanup, onToast],
	);

	const acceptCall = useCallback(async () => {
		const cs = callStateRef.current;
		if (!cs || cs.phase !== 'incoming') return;
		try {
			const { callType, callerSocketId, offer, callerUsername } = cs;
			const stream = await getMedia(callType);
			localStreamRef.current = stream;
			remoteSocketIdRef.current = callerSocketId;
			const pc = buildPC(stream);
			await pc.setRemoteDescription(new RTCSessionDescription(offer));
			await flushICE();
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			socket.emit('call:accepted', { to: callerSocketId, answer, callType });
			sendICE();

			setCallState((prev) => ({
				...prev,
				phase: 'active',
				callType,
				remoteUsername: callerUsername,
				remoteSocketId: callerSocketId,
				localStream: stream,
				isMuted: false,
				isCameraOff: false,
				duration: 0,
			}));
			startTimer();
		} catch (err) {
			cleanup();
			onToast('Could not access microphone/camera', 'error');
		}
	}, [getMedia, buildPC, flushICE, sendICE, cleanup, startTimer, onToast]);

	const rejectCall = useCallback(() => {
		const cs = callStateRef.current;
		if (!cs || cs.phase !== 'incoming') return;
		socket.emit('call:rejected', { to: cs.callerSocketId });
		setCallState(null);
	}, []);

	const endCall = useCallback(() => {
		const cs = callStateRef.current;
		if (!cs) return;
		const to =
			cs.remoteSocketId ??
			remoteSocketIdRef.current ??
			cs.callerSocketId ??
			null;
		if (to) socket.emit('call:end', { to });
		cleanup();
		onToast('Call ended', 'info');
	}, [cleanup, onToast]);

	const toggleMute = useCallback(() => {
		if (!localStreamRef.current) return;
		localStreamRef.current.getAudioTracks().forEach((t) => {
			t.enabled = !t.enabled;
		});
		setCallState((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : prev));
	}, []);

	const toggleCamera = useCallback(() => {
		if (!localStreamRef.current) return;
		localStreamRef.current.getVideoTracks().forEach((t) => {
			t.enabled = !t.enabled;
		});
		setCallState((prev) =>
			prev ? { ...prev, isCameraOff: !prev.isCameraOff } : prev,
		);
	}, []);

	useEffect(() => {
		const onIncoming = ({
			from,
			fromUserId,
			callerUsername,
			callType,
			offer,
		}) => {
			if (callStateRef.current) {
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
			clearOutgoingTimer();
			remoteSocketIdRef.current = from;
			if (!pcRef.current) return;
			try {
				await pcRef.current.setRemoteDescription(
					new RTCSessionDescription(answer),
				);
				sendICE();
				setCallState((prev) =>
					prev?.phase === 'outgoing'
						? {
								...prev,
								phase: 'active',
								remoteUsername: prev.targetUsername,
								remoteSocketId: from,
								duration: 0,
							}
						: prev,
				);
				startTimer();
			} catch (err) {
				console.error(
					'[socket:call:answered] Error setting remote description:',
					err,
				);
			}
		};

		const onIceCandidate = async ({ candidate }) => {
			if (!candidate) return;
			const pc = pcRef.current;
			if (!pc) return;
			try {
				if (pc.remoteDescription) {
					await pc.addIceCandidate(new RTCIceCandidate(candidate));
				} else {
					iceCandidateQueue.current.push(candidate);
				}
			} catch (err) {
				console.warn('[socket:ice-candidate] Failed to add:', err);
			}
		};

		const onRejected = () => {
			const cs = callStateRef.current;
			const name = cs?.targetUsername
				? cs.targetUsername[0].toUpperCase() + cs.targetUsername.slice(1)
				: 'User';
			cleanup();
			onToast(`${name} declined the call`, 'info');
		};

		const onEnded = () => {
			const cs = callStateRef.current;
			const isIncoming = cs?.phase === 'incoming';
			cleanup();
			if (isIncoming) {
				onToast('Caller cancelled the call', 'info');
			} else {
				onToast('Call ended', 'info');
			}
		};

		const onUserOffline = () => {
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
	}, [sendICE, flushICE, cleanup, clearOutgoingTimer, startTimer, onToast]);

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
