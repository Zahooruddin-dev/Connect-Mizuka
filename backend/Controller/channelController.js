const db = require('../db/queryChannel');

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
					'Access Denied: Only users with the Admin role can create institutes.',
			});
		}
		const channel = await db.createChannelQuery(name, institute_id, is_private);

		res.status(201).json({
			message: 'Channel created successfully',
			channel
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}

module.exports = {
	createChannel,
};
