const db = require('../db/queryInstitute');
const dbAuth = require('../db/queryAuth');

async function createInstitute(req, res) {
	const { name, adminId } = req.body;
	if (!adminId || !name) {
		return res.status(400).json({ message: 'Name and Admin ID are required' });
	}
	try {
		const user = await dbAuth.getUserById(adminId);
		if (!user || user.role !== 'admin') {
			return res.status(403).json({
				message:
					'Access Denied: Only users with the Admin role can create institutes.',
			});
		}
		const instituteCreation = await db.createInstituteQuery(name);
		const defaultChannelInstitute = await db.createDefaultChannelQuery(
			instituteCreation.id,
		);
		const linkToAdmin = await db.linkToAdminQuery(instituteCreation.id);
		res.status(201).json({
			message: 'Institute and default channel created',
			instituteCreation,
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}
async function getGlobalKey(req, res) {
	const { instituteId, adminId } = req.body;
	try {
		const user = await dbAuth.getUserById(adminId);
		if (!user || user.role !== 'admin') {
			return res.status(403).json({
				message:
					'Access Denied: Only users with the Admin role can create institutes.',
			});
		}
		const institute = await db.getInstituteByIdQuery(instituteId);
		res.status(201).json({
			message: 'Global key/id sent',
			institute,
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to get institute id' });
	}
}
module.exports = {
	createInstitute,
  getGlobalKey
};
