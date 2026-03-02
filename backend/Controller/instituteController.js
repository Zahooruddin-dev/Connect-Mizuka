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
		const newInst = await db.createInstituteQuery(name);
		await db.createDefaultChannelQuery(newInst.id);
		await db.linkToAdminQuery(newInst.id, adminId);
		res.status(201).json({
			message: 'Institute created and admin linked successfully',
			institute: newInst,
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}
async function getGlobalKey(req, res) {
	const { instituteId, adminId } = req.params;
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

async function getAdminDashboard(req, res) {
	const { adminId } = req.params;
	try {
		const institute = await db.getAdminInstitutes(adminId);
		if (!institute) {
			return res
				.status(404)
				.json({ message: 'No institutes found for this admin' });
		}
		res.status(200).json({
			managedInstitutes: institutes,
		});
	} catch (error) {
		res.status(500).json({ message: 'Error loading dashboard' });
	}
}

module.exports = {
	createInstitute,
	getGlobalKey,
	getAdminDashboard,
};
