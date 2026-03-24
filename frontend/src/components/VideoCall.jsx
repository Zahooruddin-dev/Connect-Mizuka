import React, { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';

export default function VideoCall() {
	const [remoteSocketId, setRemoteSocketId] = useState('');
	const [remoteStream, setRemoteStream] = useState(null);
	const [localStream, setLocalStream] = useState(null);
	const localVideoRef = useRef();
	const remoteVideoRef = useRef();
	const remoteSocketIdRef = useRef('');

	const pc = useRef(null);

	if (!pc.current) {
		pc.current = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }],
		});
	}

	useEffect(() => {
		if (localVideoRef.current && localStream) {
			localVideoRef.current.srcObject = localStream;
		}
	}, [localStream]);

	useEffect(() => {
		if (remoteVideoRef.current && remoteStream) {
			remoteVideoRef.current.srcObject = remoteStream;
		}
	}, [remoteStream]);

	useEffect(() => {
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				setLocalStream(stream);
				stream
					.getTracks()
					.forEach((track) => pc.current.addTrack(track, stream));
			});

		pc.current.ontrack = (event) => {
			console.log('Remote track received');
			setRemoteStream(event.streams[0]);
		};

		pc.current.onicecandidate = (event) => {
			if (event.candidate && remoteSocketIdRef.current) {
				socket.emit('ice-candidate', {
					to: remoteSocketIdRef.current,
					candidate: event.candidate,
				});
			}
		};

		const handleIncoming = async ({ from, offer }) => {
			remoteSocketIdRef.current = from;
			setRemoteSocketId(from);
			await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
			const answer = await pc.current.createAnswer();
			await pc.current.setLocalDescription(answer);
			socket.emit('call:accepted', { to: from, answer });
		};

		const handleAnswered = async ({ answer }) => {
			await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
		};

		const handleIceCandidate = async ({ candidate }) => {
			try {
				if (pc.current.remoteDescription && candidate) {
					await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
				}
			} catch (e) {
				console.error('Error adding ice candidate', e);
			}
		};

		socket.on('call:incoming', handleIncoming);
		socket.on('call:answered', handleAnswered);
		socket.on('ice-candidate', handleIceCandidate);

		return () => {
			socket.off('call:incoming', handleIncoming);
			socket.off('call:answered', handleAnswered);
			socket.off('ice-candidate', handleIceCandidate);
		};
	}, []);

	const startCall = async () => {
		const offer = await pc.current.createOffer();
		await pc.current.setLocalDescription(offer);
		socket.emit('call:user', { to: remoteSocketId, offer });
	};

	const handleRemoteIdChange = (e) => {
		remoteSocketIdRef.current = e.target.value;
		setRemoteSocketId(e.target.value);
	};

	return (
		<div className='flex flex-col h-full w-full bg-base p-6 gap-6 overflow-y-auto'>
			<div className='flex flex-col gap-4 bg-surface p-5 rounded-lg border border-border-base shadow-sm'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-xl font-bold text-text-primary'>
						Video Signaling
					</h2>
					<p className='text-sm text-text-muted italic font-mono'>
						My ID: {socket.id}
					</p>
				</div>

				<div className='flex gap-3'>
					<input
						type='text'
						placeholder='Paste Remote Socket ID...'
						value={remoteSocketId}
						onChange={handleRemoteIdChange}
						className='flex-1 bg-input border border-border-base rounded-md px-4 py-2 text-text-primary outline-none focus:border-teal-500 transition-colors'
					/>
					<button
						onClick={startCall}
						className='bg-teal-600 hover:bg-teal-700 text-teal-50 px-6 py-2 rounded-md font-medium transition-all active:scale-95'
					>
						Start Call
					</button>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 flex-1'>
				<div className='relative bg-panel rounded-xl border-2 border-border-strong overflow-hidden aspect-video shadow-lg'>
					<video
						ref={localVideoRef}
						autoPlay
						playsInline
						muted
						className='w-full h-full object-cover mirror-mode'
					/>
					<div className='absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-sm'>
						<span className='text-xs font-mono text-teal-300 uppercase tracking-widest'>
							Local Feed (You)
						</span>
					</div>
				</div>

				<div className='relative bg-panel rounded-xl border-2 border-border-strong overflow-hidden aspect-video shadow-lg'>
					<video
						ref={remoteVideoRef}
						autoPlay
						playsInline
						className='w-full h-full object-cover'
					/>

					<div className='absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-sm border border-white/10'>
						<span className='text-xs font-mono text-text-secondary uppercase tracking-widest'>
							{remoteSocketId
								? `Peer: ${remoteSocketId.substring(0, 8)}...`
								: 'Waiting for Peer...'}
						</span>
					</div>

					{!remoteStream && (
						<div className='absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm z-10'>
							<div className='w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4' />
							<p className='text-text-muted text-sm font-medium italic'>
								Establishing Handshake...
							</p>
						</div>
					)}
				</div>
			</div>

			<style
				dangerouslySetInnerHTML={{
					__html: `.mirror-mode { transform: scaleX(-1); }`,
				}}
			/>
		</div>
	);
}
