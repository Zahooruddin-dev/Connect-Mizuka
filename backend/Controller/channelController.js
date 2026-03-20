const db = require('../db/queryChannel');
const dbChannel = require('../db/queryChannel');
const dbInstitute = require('../db/queryInstitute');

async function createChannel(req, res) {
	const { name, institute_id, is_private } = req.body;
	const adminId = req.user.id;

	if (!name || !institute_id) {
		return res
			.status(400)
			.json({ message: 'Missing channel name or institute ID' });
	}

	try {
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
		res.status(500).json({ error: 'Failed to create channel' });
	}
}

async function updateChannel(req, res) {
	const { channelId } = req.params;
	const { name, is_private } = req.body;
	const adminId = req.user.id;

	try {
		const existing = await dbChannel.getChannelById(channelId);
		if (!existing) {
			return res.status(404).json({ error: 'Channel not found' });
		}

		const isAuthorized = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			existing.institute_id,
		);
		if (!isAuthorized) {
			return res
				.status(403)
				.json({ message: 'Access Denied: Institute management required' });
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

async function deleteChannelById(req, res) {
	const { channelId } = req.params;
	const adminId = req.user.id;

	try {
		const channel = await dbChannel.getChannelById(channelId);
		if (!channel) {
			return res.status(404).json({ error: 'Channel not found' });
		}

		const isAuthorized = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			channel.institute_id,
		);
		if (!isAuthorized) {
			return res
				.status(403)
				.json({ message: 'Access Denied: Institute management required' });
		}

		const deleted = await dbChannel.deleteChannelQuery(channelId);
		res.status(200).json({ message: 'Channel deleted', channel: deleted });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete channel' });
	}
}

async function getChannelsForInstitute(req, res) {
	const { instituteId } = req.params;
	try {
		const channels = await db.getChannelsByInstitute(instituteId);
		res.status(200).json({ channels });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channels' });
	}
}

async function getChannelById(req, res) {
	const { channelId } = req.params;
	try {
		const channel = await db.getChannelById(channelId);
		if (!channel) return res.status(404).json({ error: 'Channel not found' });
		res.status(200).json({ channel });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channel' });
	}
}

async function searchChannelMessages(req, res) {
	const { channelId } = req.params;
	const { searchTerm } = req.query;
	try {
		const message = await db.searchChannelMessagesQuery(channelId, searchTerm);
		res.status(200).json({ message });
	} catch (error) {
		res.status(500).json({ error: 'Failed to search messages' });
	}
}
async function searchAllChannelMessages(req, res) {
	const { channelIds, searchTerm } = req.body;

	if (!Array.isArray(channelIds) || !channelIds.length || !searchTerm?.trim()) {
		return res.status(400).json({ messages: [] });
	}

	try {
		const messages = await db.searchAllChannelsQuery(channelIds, searchTerm);
		res.status(200).json({ messages });
	} catch (error) {
		res.status(500).json({ error: 'Failed to search messages' });
	}
}

module.exports = {
	createChannel,
	getChannelsForInstitute,
	getChannelById,
	deleteChannelById,
	updateChannel,
	searchChannelMessages,
	searchAllChannelMessages,
};
