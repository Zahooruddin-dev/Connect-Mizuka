import { useState, useEffect } from 'react';
import { useAuth } from './services/AuthContext';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/Institutegate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './styles/app.css';

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } = useAuth();
	const [activeChannel, setActiveChannel] = useState(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);

	// automatically hide sidebar on small screens
	useEffect(() => {
		const arb = () => {
			if (window.innerWidth < 768) {
				setSidebarOpen(false);
			} else {
				setSidebarOpen(true);
			}
		};
		arb();
		window.addEventListener('resize', arb);
		return () => window.removeEventListener('resize', arb);
	}, []);

	if (!user) {
		return <LoginPage />;
	}

	if (institutes.length === 0 || !activeInstitute) {
		return <InstituteGate />;
	}

	const effectiveChannel = activeChannel || {
		id: activeInstitute.id,
		label: 'general',
	};

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
					user={user}
				/>
			</div>
		</div>
	);
}

export default App;