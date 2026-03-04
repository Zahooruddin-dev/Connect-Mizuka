const db = require('../db/queryChannel');
const dbAuth = require('../db/queryAuth');
const dbChannel = require('../db/queryChannel');
const dbInstitute = require('../db/queryInstitute');

async function createChannel(req, res) {
	const { name, institute_id, is_private, adminId } = req.body;
	if (!adminId || !name || !institute_id) {
		return res
			.status(400)
			.json({ message: 'Missing channel name, institute ID, or admin ID' });
	}
	try {
		const user = await dbAuth.getUserById(adminId);
		if (!user || user.role !== 'admin') {
			return res.status(403).json({
				message:
					'Access Denied: Only users with the Admin role can create channels.',
			});
		}
		const isAuthorized = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			institute_id,
		);
		if (!isAuthorized) {
			return res.status(403).json({
				message:
					'Access Denied: You are not an admin of this specific institute',
			});
		}
		const channel = await db.createChannelQuery(name, institute_id, is_private);

		res.status(201).json({
			message: 'Channel created successfully',
			channel: {
				id: channel.id || channel._id,
				name: channel.name,
				institute_id: channel.institute_id,
				is_private: channel.is_private,
				created_at: channel.created_at,
			},
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}

async function updateChannel(req, res) {
	const { channelId } = req.params;
	const { name, is_private, adminId } = req.body;

	if (!adminId) {
		return res.status(400).json({ message: 'Missing admin ID' });
	}
	if (!name && is_private === undefined) {
		return res.status(400).json({ message: 'Nothing to update' });
	}

	try {
		const user = await dbAuth.getUserById(adminId);
		if (!user || user.role !== 'admin') {
			return res.status(403).json({
				message: 'Access Denied: Only admins can update channels.',
			});
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

		res.status(200).json({
			message: 'Channel updated successfully',
			channel: {
				id: updated.id || updated._id,
				name: updated.name,
				institute_id: updated.institute_id,
				is_private: updated.is_private,
				created_at: updated.created_at,
			},
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to update channel' });
	}
}

async function getChannelsForInstitute(req, res) {
	const { instituteId } = req.params;
	try {
		const channels = await db.getChannelsByInstitute(instituteId);
		res.status(200).json({
			channels: channels.map(ch => ({
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

async function deleteChannelById(req, res) {
	const { channelId } = req.params;
	const { adminId } = req.body;

	if (!adminId) {
		return res.status(400).json({ message: 'Missing admin ID' });
	}

	try {
		const user = await dbAuth.getUserById(adminId);
		if (!user || user.role !== 'admin') {
			return res.status(403).json({
				message: 'Access Denied: Only admins can delete channels.',
			});
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
		if (!deleted) {
			return res.status(404).json({ error: 'Channel not found' });
		}

		res.status(200).json({
			message: 'Channel deleted successfully',
			channel: {
				id: deleted.id || deleted._id,
				name: deleted.name,
				institute_id: deleted.institute_id,
			},
		});
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
};