import api from './api';

export const getOrCreateP2PRoom = async (user1, user2) => {
	try {
		const res = await api.post('/p2p/room', { user1, user2 });
		return res.data;
	} catch (err) {
		const errorMsg =
			err.response?.data?.message ||
			err.response?.data?.error ||
			err.message ||
			'Unknown error';
		return { error: errorMsg };
	}
};

export const fetchP2PMessages = (roomId, userId, limit = 50, offset = 0) =>
	api.get(`/p2p/messages/${roomId}`, { params: { userId, limit, offset } });

export const deleteP2PMessage = async (messageId, userId) => {
	try {
		const res = await api.patch(`/p2p/message/${messageId}/delete`, {
			userId,
			roomId,
		});
		return res.data;
	} catch (error) {
		console.error('Error deleting messages', error);
		throw error;
	}
};

export const fetchP2PChatrooms = (userId) =>
	api.get(`/p2p/chatrooms/${userId}`);

export const fetchUnreadCounts = async (userId) => {
	try {
		const res = await api.get(`/p2p/unread/${userId}`);
		return res.data.unreadCounts || [];
	} catch {
		return [];
	}
};

export const markRoomAsRead = async (roomId, userId) => {
	try {
		console.log('Marking room as read:', roomId, userId);
		await api.post(`/p2p/read/${roomId}`, { userId });
		console.log('Marked room as read successfully');
	} catch (error) {
		console.error('Error marking room as read:', error);
	}
};
