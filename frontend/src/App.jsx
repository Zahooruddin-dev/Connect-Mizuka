import { useState, useEffect } from 'react';
import { useAuth } from './services/AuthContext';
import socket from './services/socket';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/Institutegate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './styles/app.css';

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } = useAuth();
	const [activeChannel, setActiveChannel] = useState(null);
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
			console.log('[App] join_institute_room:', activeInstitute.id, '| socket.id:', socket.id)
			socket.emit('join_institute_room', activeInstitute.id)
		}

		if (socket.connected) {
			join()
		} else {
			console.log('[App] socket not connected yet, queuing join...')
			socket.once('connect', join)
		}

		return () => socket.off('connect', join)
	}, [activeInstitute]);

	if (!user) return <LoginPage />;
	if (institutes.length === 0 || !activeInstitute) return <InstituteGate />;

	const effectiveChannel = activeChannel || {
		id: activeInstitute.id,
		name: 'general',
	};

	function handleChannelRenamed(updatedChannel) {
		if (activeChannel && String(activeChannel.id) === String(updatedChannel.id)) {
			setActiveChannel(prev => ({ ...prev, name: updatedChannel.name }))
		}
	}

	return (
		<div className='app-layout'>
			{sidebarOpen && (
				<Sidebar
					activeChannel={effectiveChannel.id}
					onChannelSelect={setActiveChannel}
					user={user}
					onLogout={logout}
					isAdmin={isActiveAdmin()}
					onClose={() => setSidebarOpen(false)}
					isOpen={sidebarOpen}
				/>
			)}
			<div className='main-content'>
				{!sidebarOpen && (
					<button
						className='sidebar-toggle'
						onClick={() => setSidebarOpen(true)}
						aria-label='Open navigation'
					>
						☰
					</button>
				)}
				<ChatArea
					key={effectiveChannel.id}
					channelId={effectiveChannel.id}
					channelLabel={effectiveChannel.name}
					instituteId={activeInstitute.id}
					user={user}
					onChannelRenamed={handleChannelRenamed}
				/>
			</div>
		</div>
	);
}

export default App;