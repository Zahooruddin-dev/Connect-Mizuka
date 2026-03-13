import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from './services/AuthContext';
import socket from './services/socket';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/Institutegate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatSkeleton from './components/ChatSkelton';
import './styles/app.css';

// Module-level cache so the first-channel fallback survives
// re-renders and is instant on institute switches.
// Shape: Map<instituteId, Channel>
const firstChannelCache = new Map();

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } =
		useAuth();
	const [activeChannel, setActiveChannel] = useState(null);
	const [activeP2P, setActiveP2P] = useState(null);
	const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [highlightMessageId, setHighlightMessageId] = useState(null);
	// First channel available to this user in the active institute.
	// Used as fallback when no channel is explicitly selected.
	const [defaultChannel, setDefaultChannel] = useState(
		() => firstChannelCache.get(activeInstitute?.id) ?? null,
	);

	useEffect(() => {
		const onResize = () => setSidebarOpen(window.innerWidth >= 768);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);
	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	// Reset active selections and load cached default when institute changes.
	useEffect(() => {
		setActiveChannel(null);
		setActiveP2P(null);
		const cached = firstChannelCache.get(activeInstitute?.id);
		setDefaultChannel(cached ?? null);
	}, [activeInstitute?.id]);

	// Called by Sidebar once the channel list resolves. Cache the first entry
	// so the fallback is instant on subsequent visits to this institute.
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

	const handleHighlightConsumed = useCallback(() => {
		setHighlightMessageId(null);
	}, []);

	if (!user) return <LoginPage />;
	if (institutes.length === 0 || !activeInstitute) return <InstituteGate />;

	// Use the explicitly selected channel, then the cached first channel,
	// then null — ChatArea handles null gracefully with an empty state.
	const effectiveChannel = activeChannel ?? defaultChannel ?? null;
	const isAdmin = isActiveAdmin();


	return (
		<div className='app-layout'>
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

			<div className='main-content'>
				{!sidebarOpen &&
					(isMobile ? (
						<div className='mobile-topbar' role='banner'>
							<button
								className='mobile-menu-btn'
								onClick={handleOpenSidebar}
								aria-label='Open navigation menu'
							>
								<Menu size={20} strokeWidth={2} aria-hidden='true' />
							</button>
						</div>
					) : (
						<button
							className='sidebar-toggle'
							onClick={handleOpenSidebar}
							aria-label='Open navigation'
						>
							<Menu size={20} strokeWidth={2} aria-hidden='true' />
						</button>
					))}
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
					// Channels are still loading — shows a neutral placeholder.
									<ChatSkeleton isP2P={false} />

				)}
			</div>
		</div>
	);
}

export default App;
