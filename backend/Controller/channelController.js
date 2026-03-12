const db = require('../db/queryChannel');
const dbAuth = require('../db/queryAuth');
const dbChannel = require('../db/queryChannel');
const dbInstitute = require('../db/queryInstitute');

async function createChannel(req, res) {
	const { name, institute_id, is_private } = req.body;
	const adminId = req.user.id;
	const userRole = req.user.role;

	if (!adminId || !name || !institute_id) {
		return res
			.status(400)
			.json({ message: 'Missing channel name, institute ID, or admin ID' });
	}
	try {
		if (userRole !== 'admin') {
			return res
				.status(403)
				.json({ message: 'Access Denied: Global Admin role required.' });
		}
		const isAuthorized = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			institute_id,
		);
		if (!isAuthorized) {
			return res
				.status(403)
				.json({ message: 'Access Denied: You do not manage this institute' });
		}
		const channel = await db.createChannelQuery(name, institute_id, is_private);
		res.status(201).json({ message: 'Channel created', channel });
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}

async function updateChannel(req, res) {
	const { channelId } = req.params;
	const { name, is_private } = req.body;
	const adminId = req.user.id;

	try {
		if (req.user.role !== 'admin') {
			return res
				.status(403)
				.json({ message: 'Only admins can update channels.' });
		}
		const existing = await dbChannel.getChannelById(channelId);
		if (!existing) {
			return res.status(404).json({ error: 'Channel not found' });
		}

		const isAuthorized = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			existing.institute_id,
		);
		if (!isAuthorized) {
			return res.status(403).json({
				message: 'Access Denied: You are not an admin of this institute',
			});
		}

		const updated = await dbChannel.updateChannelQuery(channelId, {
			name: name ?? existing.name,
			is_private: is_private ?? existing.is_private,
		});
		res.status(200).json({ message: 'Channel updated', channel: updated });
	} catch (error) {
		res.status(500).json({ error: 'Failed to update channel' });
	}
}

async function getChannelsForInstitute(req, res) {
	const { instituteId } = req.params;
	try {
		const channels = await db.getChannelsByInstitute(instituteId);
		res.status(200).json({
			channels: channels.map((ch) => ({
				id: ch.id || ch._id,
				name: ch.name,
				institute_id: ch.institute_id,
				is_private: ch.is_private,
				created_at: ch.created_at,
			})),
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channels' });
	}
}

async function getChannelById(req, res) {
	const { channelId } = req.params;
	try {
		const channel = await db.getChannelById(channelId);
		if (!channel) {
			return res.status(404).json({ error: 'Channel not found' });
		}
		res.status(200).json({
			channel: {
				id: channel.id || channel._id,
				name: channel.name,
				institute_id: channel.institute_id,
				is_private: channel.is_private,
				created_at: channel.created_at,
			},
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channel' });
	}
}

async function searchChannelMessages(req, res) {
	const { channelId } = req.params;
	const { searchTerm } = req.query;
	try {
		const message = await db.searchChannelMessagesQuery(channelId, searchTerm);
		if (!message) {
			return res.status(404).json({ error: 'Channel messages not found' });
		}
		res.status(200).json({ message });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channel messages' });
	}
}

async function deleteChannelById(req, res) {
	const { channelId } = req.params;
	const adminId = req.user.id;
	try {
		if (req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Admins only.' });
		}
		const channel = await dbChannel.getChannelById(channelId);
		if (!channel) {
			return res.status(404).json({ error: 'Channel not found' });
		}
		const isAuthorized = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			channel.institute_id,
		);
		if (!isAuthorized) {
			return res.status(403).json({
				message: 'Access Denied: You are not an admin of this institute',
			});
		}
		const deleted = await dbChannel.deleteChannelQuery(channelId);
		res.status(200).json({ message: 'Channel deleted', channel: deleted });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete channel' });
	}
}

module.exports = {
	createChannel,
	getChannelsForInstitute,
	getChannelById,
	deleteChannelById,
	updateChannel,
	searchChannelMessages,
};
