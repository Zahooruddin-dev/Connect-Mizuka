import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401 || error.response?.status === 403) {
			window.dispatchEvent(new Event('mizuka:session-expired'));
		}
		return Promise.reject(error);
	},
);

// ── AUTH ──────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
	try {
		const res = await api.post('/auth/login', { email, password });
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const register = async (username, email, password, role) => {
	try {
		const res = await api.post('/auth/register', { username, email, password, role });
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchUserInfo = async () => {
	try {
		const res = await api.get('/auth/user-info');
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const getUserProfile = async (userId) => {
	try {
		const res = await api.get(`/auth/user-profile/${userId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'User not found or Network error' };
	}
};

export const updateProfile = async ({ username, email, currentPassword, newPassword, profilePicture } = {}) => {
	try {
		const isFileUpload = profilePicture instanceof File;

		if (isFileUpload) {
			const form = new FormData();
			if (username        !== undefined) form.append('username',         username);
			if (email           !== undefined) form.append('email',            email);
			if (currentPassword !== undefined) form.append('currentPassword',  currentPassword);
			if (newPassword     !== undefined) form.append('newPassword',      newPassword);
			form.append('profile_picture', profilePicture);

			const res = await api.put('/auth/update-profile', form, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			return res.data;
		}

		const res = await api.put('/auth/update-profile', {
			...(username        !== undefined && { username }),
			...(email           !== undefined && { email }),
			...(currentPassword !== undefined && { currentPassword }),
			...(newPassword     !== undefined && { newPassword }),
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const changePassword = async (oldPassword, newPassword) => {
	try {
		const res = await api.patch('/auth/change-password', { oldPassword, newPassword });
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const requestPasswordReset = async (email) => {
	try {
		const res = await api.post('/auth/request-reset', { email });
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const resetPassword = async (email, code, newPassword) => {
	try {
		const res = await api.post('/auth/reset-password', { email, code, newPassword });
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const linkToInstitute = async (userId, instituteId) => {
	try {
		const res = await api.post('/auth/link-to-institute', {
			userId,
			institute_id: instituteId,
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchMemberships = async () => {
	try {
		const res = await api.get('/auth/my-memberships');
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

// ── INSTITUTE ─────────────────────────────────────────────────────────────

export const fetchInstituteDashboard = async () => {
	try {
		const res = await api.get('/institute/dashboard');
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const createInstitute = async (name) => {
	try {
		const res = await api.post('/institute/create', { name });
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const getInstituteMembers = async (instituteId) => {
	try {
		const res = await api.get(`/institute/${instituteId}/institute-members`);
		return res.data.members;
	} catch (err) {
		console.error('Error in getting members:', err);
		return [];
	}
};

export const searchInstituteMembers = async (instituteId, searchTerm) => {
	try {
		const res = await api.get(`/institute/${instituteId}/search-members`, {
			params: { query: searchTerm },
		});
		return res.data.users;
	} catch (err) {
		console.error('Search Error:', err);
		return [];
	}
};

// ── CHANNEL ───────────────────────────────────────────────────────────────

export const createChannel = async (instituteId, name, isPrivate = false) => {
	try {
		const res = await api.post('/channel/create', {
			institute_id: instituteId,
			name,
			is_private: isPrivate,
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchChannel = async (channelId) => {
	try {
		const res = await api.get(`/channel/${channelId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchChannelsByInstitute = async (instituteId) => {
	try {
		const res = await api.get(`/channel/institute/${instituteId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const updateChannel = async (channelId, { name, isPrivate } = {}) => {
	try {
		const res = await api.put(`/channel/${channelId}`, {
			...(name      !== undefined && { name }),
			...(isPrivate !== undefined && { is_private: isPrivate }),
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const deleteChannel = async (channelId) => {
	try {
		const res = await api.delete(`/channel/${channelId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const searchChannelMessages = async (channelId, searchTerm) => {
	try {
		const res = await api.get(`/channel/${channelId}/search-messages`, {
			params: { searchTerm },
		});
		return res.data.messages || res.data.message || [];
	} catch (err) {
		console.error('Search Error:', err);
		return [];
	}
};

// ── MESSAGES ──────────────────────────────────────────────────────────────

export const fetchMessages = (channelId, limit = 20, offset = 0) =>
	api.get(`/messages/${channelId}`, { params: { limit, offset } });

export const deleteMessage = (messageId) =>
	api.delete(`/messages/message/${messageId}`);

// ── P2P ───────────────────────────────────────────────────────────────────

export const getOrCreateP2PRoom = async (otherUserId) => {
	try {
		const res = await api.post('/p2p/room', { otherUserId });
		return res.data;
	} catch (err) {
		return { error: err.response?.data?.message || 'Failed to create chat room' };
	}
};

export const fetchP2PMessages = (roomId, limit = 50, offset = 0) =>
	api.get(`/p2p/messages/${roomId}`, { params: { limit, offset } });

export const searchP2PMessages = async (roomId, searchTerm) => {
	try {
		const res = await api.get(`/p2p/messages/${roomId}/search`, {
			params: { searchTerm },
		});
		return res.data.messages || res.data.message || [];
	} catch (err) {
		console.error('Search Error:', err);
		return [];
	}
};

export const editP2PMessage = async (messageId, content) => {
	try {
		const res = await api.patch(`/p2p/messages/${messageId}/edit`, { content });
		return res.data;
	} catch (err) {
		console.error('Error editing message:', err);
		throw err;
	}
};

export const deleteP2PMessage = async (messageId) => {
	try {
		const res = await api.patch(`/p2p/messages/${messageId}/delete`);
		return res.data;
	} catch (err) {
		console.error('Error deleting message:', err);
		throw err;
	}
};

export const fetchUnreadCounts = () => api.get('/p2p/unread-counts');

export const fetchUserChatrooms = async () => {
	try {
		const res = await api.get('/p2p/rooms');
		return res.data.rooms || [];
	} catch (err) {
		return [];
	}
};

export const markRoomAsRead = async (roomId) => {
	try {
		const res = await api.post(`/p2p/read/${roomId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export default api;