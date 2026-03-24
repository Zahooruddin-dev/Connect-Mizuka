import React, { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';
export default VideoCall = () => {
	const [remoteSocketId, setRemoteSocketId] = useState('');
	const localVideoRef = useRef();
	const remoteVideoRef = useRef();
	const pc = useRef(
		new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun1.google.com:1902' }],
		}),
	);
	useEffect(() => {
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				localVideoRef.current.srcObject = stream;
				stream
					.getTracks()
					.forEach((track) => pc.current.addTrack(track, stream));
			});
		pc.current.ontrack = (event) => {
			remoteVideoRef.current.srcObject = event.streams[0];
		};
		pc.current.onicecandidate = (event) => {
			if (event.candidate && remoteSocketId) {
				socket.emit('ice-candidate', {
					to: remoteSocketId,
					candidate: event.candidate,
				});
			}
		};
		socket.on('call:incoming', async ({ from, offer }) => {
			setRemoteSocketId(from);
			await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
			const answer = await pc.current.createAnswer();
			await pc.current.setLocalDescription(answer);
			socket.emit('call:accepted', { to: from, answer });
		});
		socket.on('call:answered', async ({ answer }) => {
			await pc.candidate.setRemoteDescription(
				new RTCSessionDescription(answer),
			);
		});
		socket.on('ice-candidate', async ({ candidate }) => {
			await pc.current.addIceCandidate(new RTCSessionDescription(candidate));
		});
		return () => socket.off();
	}, [remoteSocketId]);
	const startCall = async () => {
		const offer = await pc.current.offer();
		await pc.current.setLocalDescription(offer);
		socket.emit('call:user', { to: remoteSocketId, offer });
	};
	return (
		<div className='flex flex-col h-full w-full bg-base p-6 gap-6 overflow-y-auto'>
			<div className='flex flex-col gap-4 bg-surface p-5 rounded-lg border border-border-base shadow-sm animate-[card-enter_0.4s_ease-out]'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-xl font-bold text-text-primary tracking-tight'>
						Video Signaling
					</h2>
					<p className='text-sm text-text-muted'>
						Enter a peer's Socket ID to establish a P2P connection.
					</p>
				</div>

				<div className='flex gap-3'>
					<input
						type='text'
						placeholder='Paste Remote Socket ID...'
						value={remoteSocketId}
						onChange={(e) => setRemoteSocketId(e.target.value)}
						className='flex-1 bg-input border border-border-base rounded-md px-4 py-2 text-text-primary focus:outline-none focus:border-teal-500 transition-colors'
					/>
					<button
						onClick={startCall}
						className='bg-teal-600 hover:bg-teal-700 text-teal-50 px-6 py-2 rounded-md font-medium transition-all active:scale-95 flex items-center gap-2'
					>
						<span className='w-2 h-2 bg-teal-200 rounded-full animate-pulse' />
						Start Call
					</button>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 flex-1'>
				<div className='relative group bg-panel rounded-xl border-2 border-border-strong overflow-hidden aspect-video shadow-lg animate-[ccm-card-in_0.5s_ease-out]'>
					<video
						ref={localVideoRef}
						autoPlay
						playsInline
						muted
						className='w-full h-full object-cover mirror-mode'
					/>
					<div className='absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-sm border border-white/10'>
						<span className='text-xs font-mono text-teal-300 uppercase tracking-widest'>
							Local Feed (You)
						</span>
					</div>
					<div className='absolute top-4 right-4 flex gap-2'>
						<div className='w-3 h-3 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]' />
					</div>
				</div>

				<div className='relative bg-panel rounded-xl border-2 border-border-strong overflow-hidden aspect-video shadow-lg animate-[ccm-card-in_0.6s_ease-out]'>
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

					{!remoteVideoRef.current?.srcObject && (
						<div className='absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm'>
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
					__html: `
      .mirror-mode { transform: scaleX(-1); }
    `,
				}}
			/>
		</div>
	);
};
