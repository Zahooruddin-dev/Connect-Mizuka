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
			channel,
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}
async function updateChannelQuery(channelId, { name, is_private }) {
  const { rows } = await pool.query(
    `UPDATE channels
     SET name = $1, is_private = $2
     WHERE id = $3
     RETURNING id, name, is_private, institute_id`,
    [name, is_private, channelId]
  );
  return rows[0] || null;
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
		if (!channel) {
			return res.status(404).json({ error: 'Channel not found' });
		}
		res.status(200).json({ channel });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channel' });
	}
}
async function deleteChannelById(req, res) {
	const { channelId } = req.params;
	try {
		const channel = await dbChannel.deleteChannelQuery(channelId);
		if (!channel) {
			return res.status(404).json({ error: 'Channel not found' });
		}
		res.status(200).json({ channel });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channel' });
	}
}

module.exports = {
	createChannel,
	getChannelsForInstitute,
	getChannelById,
  deleteChannelById,
  updateChannelQuery
};
