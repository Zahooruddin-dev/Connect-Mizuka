import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from './services/AuthContext';
import socket from './services/socket';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/Institutegate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatSkeleton from './components/ChatSkeleton';
import VideoCall from './components/VideoCall';

const firstChannelCache = new Map();
let pingFired = false;

function WakingBanner({ visible }) {
	return (
		<div
			className={`fixed top-0 left-0 right-0 z-[1700] flex items-center justify-center gap-2.5 px-5 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-strong)] text-[13px] font-medium text-[var(--text-secondary)] pointer-events-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
				visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
			}`}
			role='status'
			aria-live='polite'
		>
			<span
				className='w-3.5 h-3.5 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--teal-600)] animate-spin-fast shrink-0'
				aria-hidden='true'
			/>
			Mizuka Engine is waking up — this takes about 30 seconds on first load.
		</div>
	);
}

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } =
		useAuth();
	const [activeChannel, setActiveChannel] = useState(null);
	const [activeP2P, setActiveP2P] = useState(null);
	const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [highlightMessageId, setHighlightMessageId] = useState(null);
	const [isWaking, setIsWaking] = useState(false);
	const [showVideo, setShowVideo] = useState(false);
	const [defaultChannel, setDefaultChannel] = useState(
		() => firstChannelCache.get(activeInstitute?.id) ?? null,
	);

	const lastKnownWidth = useRef(window.innerWidth);

	useEffect(() => {
		if (pingFired) return;
		pingFired = true;
		let wakingTimer = null;
		let cancelled = false;
		const ping = async () => {
			wakingTimer = setTimeout(() => {
				if (!cancelled) setIsWaking(true);
			}, 2000);
			try {
				await fetch(`${import.meta.env.VITE_API_URL ?? ''}/ping`, {
					method: 'GET',
				});
			} catch {
			} finally {
				clearTimeout(wakingTimer);
				if (!cancelled) setIsWaking(false);
			}
		};
		ping();
		return () => {
			cancelled = true;
			clearTimeout(wakingTimer);
		};
	}, []);

	useEffect(() => {
		const onResize = () => {
			const newWidth = window.innerWidth;
			const widthChanged = Math.abs(newWidth - lastKnownWidth.current) > 10;
			if (!widthChanged) return;
			lastKnownWidth.current = newWidth;
			const isNowDesktop = newWidth >= 768;
			setSidebarOpen(isNowDesktop);
			setIsMobile(!isNowDesktop);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	useEffect(() => {
		setActiveChannel(null);
		setActiveP2P(null);
		const cached = firstChannelCache.get(activeInstitute?.id);
		setDefaultChannel(cached ?? null);
	}, [activeInstitute?.id]);

	const handleChannelsLoaded = useCallback(
		(channels) => {
			if (!channels.length || !activeInstitute?.id) return;
			const first = channels[0];
			firstChannelCache.set(activeInstitute.id, first);
			setDefaultChannel(first);
		},
		[activeInstitute?.id],
	);

	useEffect(() => {
		if (!activeInstitute) return;
		const join = () => socket.emit('join_institute_room', activeInstitute.id);
		if (socket.connected) join();
		else socket.once('connect', join);
		return () => socket.off('connect', join);
	}, [activeInstitute]);

	useEffect(() => {
		if (!activeChannel) return;
		const handleChannelDeleted = ({ channelId }) => {
			if (String(activeChannel.id) === String(channelId))
				setActiveChannel(null);
		};
		socket.on('channel_deleted', handleChannelDeleted);
		return () => socket.off('channel_deleted', handleChannelDeleted);
	}, [activeChannel?.id]);

	const handleChannelRenamed = useCallback((updatedChannel) => {
		setActiveChannel((prev) => {
			if (!prev || String(prev.id) !== String(updatedChannel.id)) return prev;
			return { ...prev, name: updatedChannel.name };
		});
	}, []);

	const handleStartP2P = useCallback(
		({ roomId, otherUserId, otherUsername }) => {
			setActiveP2P({ roomId, otherUserId, otherUsername });
			setActiveChannel(null);
		},
		[],
	);

	const handleChannelSelect = useCallback((channel) => {
		setActiveChannel(channel);
		setActiveP2P(null);
	}, []);

	const handleCloseP2P = useCallback(() => setActiveP2P(null), []);
	const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
	const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);

	const handleJumpToMessage = useCallback((channelId, messageId) => {
		setActiveP2P(null);
		setActiveChannel((prev) => {
			if (prev && String(prev.id) === String(channelId)) return prev;
			return { id: channelId, name: '' };
		});
		setHighlightMessageId(messageId);
	}, []);

	const handleJumpToP2PMessage = useCallback(
		(roomId, messageId, otherUserId, otherUsername) => {
			setActiveChannel(null);
			setActiveP2P({ roomId, otherUserId, otherUsername });
			setHighlightMessageId(messageId);
		},
		[],
	);

	const handleHighlightConsumed = useCallback(
		() => setHighlightMessageId(null),
		[],
	);

	const banner = <WakingBanner visible={isWaking} />;

	if (!user)
		return (
			<>
				{banner}
				<LoginPage />
			</>
		);
	if (institutes.length === 0 || !activeInstitute)
		return (
			<>
				{banner}
				<InstituteGate />
			</>
		);

	const effectiveChannel = activeChannel ?? defaultChannel ?? null;
	const isAdmin = isActiveAdmin();

	return (
		<>
			{banner}
			<div className='flex h-svh w-screen overflow-hidden bg-[var(--bg-base)]'>
				<Sidebar
					activeChannel={effectiveChannel?.id ?? null}
					onChannelSelect={handleChannelSelect}
					user={user}
					onLogout={logout}
					isAdmin={isAdmin}
					onClose={handleCloseSidebar}
					isOpen={sidebarOpen}
					activeInstitute={activeInstitute}
					onStartP2P={handleStartP2P}
					activeP2P={activeP2P}
					onJumpToMessage={handleJumpToMessage}
					onJumpToP2PMessage={handleJumpToP2PMessage}
					onChannelsLoaded={handleChannelsLoaded}
				/>
				<button
					className='self-start px-3.5 py-[7px] rounded-lg border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] text-[13px] font-medium font-[inherit] cursor-pointer transition-[background,border-color,color] duration-150 hover:bg-teal-500/[0.06] hover:border-[var(--teal-700)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
					onClick={() => setShowVideo((prev) => !prev)}
				>
					Video Call
				</button>
				<div className='flex-1 min-w-0 flex flex-col overflow-hidden'>
					{!sidebarOpen && isMobile && (
						<div
							className='flex items-center gap-2.5 px-3.5 h-12 min-h-[48px] bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0'
							role='banner'
						>
							<button
								className='flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-muted)] transition-[background,color] duration-150 shrink-0 hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)] focus-visible:outline-offset-2'
								onClick={handleOpenSidebar}
								aria-label='Open navigation menu'
							>
								<Menu size={20} strokeWidth={2} aria-hidden='true' />
							</button>
						</div>
					)}

					{!sidebarOpen && !isMobile && (
						<button
							className='fixed top-3 left-3 z-30 flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] shadow-sm transition-[background,color] duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
							onClick={handleOpenSidebar}
							aria-label='Open navigation'
						>
							<Menu size={20} strokeWidth={2} aria-hidden='true' />
						</button>
					)}
					{showVideo && <VideoCall />}

					{activeP2P ? (
						<ChatArea
							roomId={activeP2P.roomId}
							otherUsername={activeP2P.otherUsername}
							otherUserId={activeP2P.otherUserId}
							user={user}
							onCloseP2P={handleCloseP2P}
							onStartP2P={handleStartP2P}
							highlightMessageId={highlightMessageId}
							onHighlightConsumed={handleHighlightConsumed}
						/>
					) : effectiveChannel ? (
						<ChatArea
							channelId={effectiveChannel.id}
							channelLabel={effectiveChannel.name}
							instituteId={activeInstitute.id}
							user={user}
							onChannelRenamed={handleChannelRenamed}
							onStartP2P={handleStartP2P}
							isAdmin={isAdmin}
							highlightMessageId={highlightMessageId}
							onHighlightConsumed={handleHighlightConsumed}
						/>
					) : (
						<ChatSkeleton isP2P={false} />
					)}
				</div>
			</div>
		</>
	);
}

export default App;
