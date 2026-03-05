import api from './api';

export const getOrCreateP2PRoom = async (user1, user2) => {
	try {
		console.log('[API] Calling POST /p2p/room with:', { user1, user2 });

		const res = await api.post('/p2p/room', {
			user1,
			user2,
		});

		console.log('[API] P2P room response:', res.data);
		return res.data;
	} catch (err) {
		const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
		console.error('[API] P2P room error:', errorMsg);
		console.error('[API] Full error:', err);

		return { error: errorMsg };
	}
};

export const fetchP2PMessages = (roomId, limit = 50, offset = 0) => {
	console.log('[API] Calling GET /p2p/messages/:roomId with:', { roomId, limit, offset });
	return api.get(`/p2p/messages/${roomId}`, { params: { limit, offset } });
};

export const deleteP2PMessage = (messageId, userId) => {
	console.log('[API] Calling DELETE /p2p/messages/:messageId with:', { messageId, userId });
	return api.delete(`/p2p/messages/${messageId}`, { data: { userId } });
};

export const fetchP2PChatrooms = (userId) => {
	console.log('[API] Calling GET /p2p/chatrooms/:userId with:', { userId });
	return api.get(`/p2p/chatrooms/${userId}`);
};