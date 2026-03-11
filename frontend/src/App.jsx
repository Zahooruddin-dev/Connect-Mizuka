import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './services/AuthContext';
import socket from './services/socket';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/InstituteGate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './styles/app.css';

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } =
		useAuth();
	const [activeChannel, setActiveChannel] = useState(null);
	const [activeP2P, setActiveP2P] = useState(null);
	const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
	const [highlightMessageId, setHighlightMessageId] = useState(null);

	useEffect(() => {
		const onResize = () => setSidebarOpen(window.innerWidth >= 768);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

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

	// Called from Sidebar when the user clicks a search result.
	// Selects the channel (if not already active) and sets the highlight target.
	const handleJumpToMessage = useCallback((channelId, messageId) => {
		setActiveP2P(null);
		setActiveChannel((prev) => {
			if (prev && String(prev.id) === String(channelId)) return prev;
			return { id: channelId, name: '' };
		});
		setHighlightMessageId(messageId);
	}, []);

	// ChatArea calls this once the highlight animation has been triggered
	// so that switching channels doesn't re-trigger the old highlight.
	const handleHighlightConsumed = useCallback(() => {
		setHighlightMessageId(null);
	}, []);

	if (!user) return <LoginPage />;
	if (institutes.length === 0 || !activeInstitute) return <InstituteGate />;

	const effectiveChannel = activeChannel ?? {
		id: activeInstitute.id,
		name: 'general',
	};
	const isAdmin = isActiveAdmin();

	return (
		<div className='app-layout'>
			{sidebarOpen && (
				<Sidebar
					activeChannel={effectiveChannel.id}
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
				/>
			)}

			<div className='main-content'>
				{!sidebarOpen && (
					<button
						className='sidebar-toggle'
						onClick={handleOpenSidebar}
						aria-label='Open navigation'
					>
						☰
					</button>
				)}

				{activeP2P ? (
					<ChatArea
						roomId={activeP2P.roomId}
						otherUsername={activeP2P.otherUsername}
						otherUserId={activeP2P.otherUserId}
						user={user}
						onCloseP2P={handleCloseP2P}
						onStartP2P={handleStartP2P}
					/>
				) : (
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
				)}
			</div>
		</div>
	);
}

export default App;
