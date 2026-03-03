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
	} catch (error) {
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

export const fetchChannelsByInstitute = async (instituteId) => {
	try {
		const res = await api.get(`/channel/institute/${instituteId}`);
		return res.data;
	} catch (err) {
		return err.response?.data || { message: 'Network error' };
	}
};

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

export const fetchMessages = (channelId, limit = 20, offset = 0) =>
	api.get(`/messages/${channelId}`, { params: { limit, offset } });

export const deleteMessage = (messageId, userId) =>
	api.delete(`/messages/message/${messageId}`, { data: { userId } });

export const deleteChannel = (channelId, userId) =>
	api.delete(`/messages/channel/${channelId}`, { data: { userId } });

export default api;
