import api from './api';

export const getOrCreateP2PRoom = async (otherUserId) => {
	try {
		const res = await api.post('/p2p/room', { otherUserId });
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

export const fetchP2PMessages = (roomId, limit = 50, offset = 0) =>
	api.get(`/p2p/messages/${roomId}`, { params: { limit, offset } });

export const fetchUnreadCounts = async () => {
	try {
		const res = await api.get('/p2p/unread-counts');
		return Array.isArray(res.data) ? res.data : res.data.unreadCounts || [];
	} catch {
		return [];
	}
};

export const markRoomAsRead = async (roomId) => {
	try {
		await api.post(`/p2p/read/${roomId}`);
	} catch (error) {
		console.error('Error marking room as read:', error);
	}
};
