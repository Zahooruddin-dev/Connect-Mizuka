import { useState } from 'react';
import { useAuth } from './services/AuthContext';
import LoginPage from './pages/LoginPage';
import InstituteGate from './components/Institutegate';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './styles/app.css';

function App() {
	const { user, institutes, activeInstitute, logout, isActiveAdmin } = useAuth();
	const [activeChannel, setActiveChannel] = useState(null);

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
			<Sidebar
				activeChannel={effectiveChannel.id}
				onChannelSelect={setActiveChannel}
				user={user}
				onLogout={logout}
				isAdmin={isActiveAdmin()}
			/>
			<ChatArea
				key={effectiveChannel.id}
				channelId={effectiveChannel.id}
				channelLabel={effectiveChannel.label}
				user={user}
			/>
		</div>
	);
}

export default App;
