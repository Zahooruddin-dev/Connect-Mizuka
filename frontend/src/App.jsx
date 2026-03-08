import { useState, useEffect } from 'react';
import { useAuth } from './services/AuthContext';
import socket from './services/socket';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/InstituteGate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './styles/app.css';

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } = useAuth();
	const [activeChannel, setActiveChannel] = useState(null);
	const [activeP2P, setActiveP2P] = useState(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);

	useEffect(() => {
		const arb = () => {
			setSidebarOpen(window.innerWidth >= 768);
		};
		arb();
		window.addEventListener('resize', arb);
		return () => window.removeEventListener('resize', arb);
	}, []);

	useEffect(() => {
		if (!activeInstitute) return;

		const join = () => {
			console.log('[App] join_institute_room:', activeInstitute.id, '| socket.id:', socket.id);
			socket.emit('join_institute_room', activeInstitute.id);
		};

		if (socket.connected) {
			join();
		} else {
			console.log('[App] socket not connected yet, queuing join...');
			socket.once('connect', join);
		}

		return () => socket.off('connect', join);
	}, [activeInstitute]);

	useEffect(() => {
		const handleChannelDeleted = ({ channelId }) => {
			if (activeChannel && String(activeChannel.id) === String(channelId)) {
				setActiveChannel(null);
			}
		};

		socket.on('channel_deleted', handleChannelDeleted);
		return () => socket.off('channel_deleted', handleChannelDeleted);
	}, [activeChannel]);

	if (!user) return <LoginPage />;
	if (institutes.length === 0 || !activeInstitute) return <InstituteGate />;

	const effectiveChannel = activeChannel ? { id: activeChannel.id, name: activeChannel.name } : {
		id: activeInstitute.id,
		name: 'general',
	};

	function handleChannelRenamed(updatedChannel) {
		if (activeChannel && String(activeChannel.id) === String(updatedChannel.id)) {
			setActiveChannel((prev) => ({ ...prev, name: updatedChannel.name }));
		}
	}

	const handleStartP2P = ({ roomId, otherUserId, otherUsername }) => {
		console.log('[App] Starting P2P with:', { roomId, otherUserId, otherUsername });
		setActiveChannel(null);
		setActiveP2P({
			roomId,
			otherUserId,
			otherUsername,
		});
	};

	const handleChannelSelect = (channel) => {
		setActiveChannel(channel);
		setActiveP2P(null);
	};

	const handleCloseP2P = () => {
		console.log('[App] Closing P2P');
		setActiveP2P(null);
	};

	return (
		<div className="app-layout">
			{sidebarOpen && (
				<Sidebar
					activeChannel={effectiveChannel.id}
					onChannelSelect={handleChannelSelect}
					user={user}
					onLogout={logout}
					isAdmin={isActiveAdmin()}
					onClose={() => setSidebarOpen(false)}
					isOpen={sidebarOpen}
					activeInstitute={activeInstitute}
					onStartP2P={handleStartP2P}
					activeP2P={activeP2P}
				/>
			)}
			<div className="main-content">
				{!sidebarOpen && (
					<button
						className="sidebar-toggle"
						onClick={() => setSidebarOpen(true)}
						aria-label="Open navigation"
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
						isP2P={true}
					/>
				) : (
					<ChatArea
						channelId={effectiveChannel.id}
						channelLabel={effectiveChannel.name}
						instituteId={activeInstitute.id}
						user={user}
						onChannelRenamed={handleChannelRenamed}
						onStartP2P={handleStartP2P}
						isAdmin={isActiveAdmin()}
					/>
				)}
			</div>
		</div>
	);
}

export default App;