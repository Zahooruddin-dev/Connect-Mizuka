import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:3000/api',
	timeout: 10000,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('mizuka_token');
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

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
		const res = await api.post('/auth/register', {
			username,
			email,
			password,
			role,
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchUserInfo = async (userId) => {
	try {
		const res = await api.get(`/auth/user-info/${userId}`);
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

export const updateProfile = async (
	userId,
	{ username, email, currentPassword, newPassword } = {},
) => {
	try {
		const res = await api.put(`/auth/update-profile/${userId}`, {
			...(username !== undefined && { username }),
			...(email !== undefined && { email }),
			...(currentPassword !== undefined && { currentPassword }),
			...(newPassword !== undefined && { newPassword }),
		});
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
		const res = await api.post('/auth/reset-password', {
			email,
			code,
			newPassword,
		});
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

export const fetchMemberships = async (userId) => {
	try {
		const res = await api.get(`/auth/my-memberships/${userId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchInstituteDashboard = async (adminId) => {
	try {
		const res = await api.get(`/institute/dashboard/${adminId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const createInstitute = async (adminId, name) => {
	try {
		const res = await api.post('/institute/create', { adminId, name });
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
export const searchInstituteMembers = async (instituteId, searchTerm, currentUserId) => {
  try {
    const res = await api.get(`/institute/${instituteId}/search-members`, {
      params: { 
        query: searchTerm, 
        userId: currentUserId 
      }
    });
    return res.data.users;
  } catch (err) {
    console.error("Search Error:", err);
    return [];
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
export const getOrCreateP2PRoom = async (user1, user2) => {
	try {
		const res = await api.post('/p2p/room', {
			user1,
			user2,
		});
		return res.data;
	} catch (err) {
		return { error: err.response?.data?.message || 'Failed to create chat room' };
	}
};

export const fetchP2PMessages = (roomId, limit = 50, offset = 0) =>
	api.get(`/p2p/messages/${roomId}`, { params: { limit, offset } });


export const deleteP2PMessage = async (messageId, userId,roomId) => {
	try {
		const res = await api.patch(`/p2p/messages/${messageId}/delete`, {
			userId,
			roomId,
		});
		return res.data;
	} catch (error) {
		console.error('Error deleting messages', error);
		throw error;
	}
};
export const editP2PMessage = async (messageId, userId,roomId,content) => {
	try {
		const res = await api.patch(`/p2p/messages/${messageId}/edit`, {
			userId,
			roomId,
			content
		});
		return res.data;
	} catch (error) {
		console.error('Error editing messages', error);
		throw error;
	}
};

export const fetchP2PChatrooms = (userId) =>
	api.get(`/p2p/chatrooms/${userId}`);

export const createChannel = async (
	adminId,
	instituteId,
	name,
	isPrivate = false,
) => {
	try {
		const res = await api.post('/channel/create', {
			adminId,
			institute_id: instituteId,
			name,
			is_private: isPrivate,
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const updateChannel = async (
	channelId,
	adminId,
	{ name, isPrivate } = {},
) => {
	try {
		const res = await api.put(`/channel/${channelId}`, {
			adminId,
			...(name !== undefined && { name }),
			...(isPrivate !== undefined && { is_private: isPrivate }),
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const deleteChannel = async (channelId, adminId) => {
	try {
		const res = await api.delete(`/channel/${channelId}`, {
			data: { adminId },
		});
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

export const fetchMessages = (channelId, limit = 20, offset = 0) =>
	api.get(`/messages/${channelId}`, { params: { limit, offset } });

export const deleteMessage = (messageId, userId) =>
	api.delete(`/messages/message/${messageId}`, { data: { userId } });

export default api;
