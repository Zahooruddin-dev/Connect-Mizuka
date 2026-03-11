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
		const membership = await db.linkToAdminQuery(newInst.id, adminId);
		res.status(201).json({
			message: 'Institute created and admin linked successfully',
			institute: newInst,
			membership,
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
		const institutes = await db.getAdminInstitutes(adminId);
		if (!institutes || institutes.length === 0) {
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
async function searchMembers(req, res) {
	const { instituteId } = req.params;
	const { query, userId } = req.query;
	const searchTerm = `%${query}%`;
	try {
		const users = await db.searchInstituteMembers(
			instituteId,
			userId,
			searchTerm,
		);
		if (!users) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.status(200).json({ users });
	} catch (error) {
		res.status(500).json({ error: 'Failed to search members', error });
	}
}
async function getInstituteMembers(req, res) {
	const { instituteId } = req.params;
	try {
		const members = await db.getInstituteMembersQuery(instituteId);
		if (!members) {
			return res.status(404).json({ message: 'members not found' });
		}
		res.status(200).json({ members });
	} catch (error) {
		res.status(500).json({ error: 'Failed to get members', error });
	}
}

module.exports = {
	createInstitute,
	getGlobalKey,
	getAdminDashboard,
	searchMembers,
	getInstituteMembers
};
