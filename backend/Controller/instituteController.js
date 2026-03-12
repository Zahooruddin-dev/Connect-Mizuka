const db = require('../db/queryInstitute');
const dbAuth = require('../db/queryAuth');
async function createInstitute(req, res) {
	const { name } = req.body;
	const adminId = req.user.id;
	const userRole = req.user.role;

	if (!name) return res.status(400).json({ message: 'Name is required' });

	try {
		if (userRole !== 'admin') {
			return res
				.status(403)
				.json({ message: 'Only Global Admins can create institutes.' });
		}

		const newInst = await db.createInstituteQuery(name);
		await db.createDefaultChannelQuery(newInst.id);
		const membership = await db.linkToAdminQuery(newInst.id, adminId);

		res.status(201).json({
			message: 'Institute created successfully',
			institute: newInst,
			membership,
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create institute' });
	}
}
async function getGlobalKey(req, res) {
	const { instituteId } = req.params;
	const adminId = req.user.id;

	try {
		const isAuthorized = await db.verifyAdminOfInstitute(adminId, instituteId);
		if (!isAuthorized) {
			return res
				.status(403)
				.json({ message: 'Not authorized for this institute' });
		}
		const institute = await db.getInstituteByIdQuery(instituteId);
		res.status(200).json({ message: 'Global key sent', institute });
	} catch (error) {
		res.status(500).json({ error: 'Failed to get institute info' });
	}
}
async function getAdminDashboard(req, res) {
	const adminId = req.user.id;
	try {
		const institutes = await db.getAdminInstitutes(adminId);
		if (!institutes || institutes.length === 0) {
			return res.status(404).json({ message: 'No institutes found' });
		}
		res.status(200).json({ managedInstitutes: institutes });
	} catch (error) {
		res.status(500).json({ message: 'Error loading dashboard' });
	}
}
async function searchMembers(req, res) {
	const { instituteId } = req.params;
	const { query } = req.query;
	const userId = req.user.id;
	const searchTerm = `%${query}%`;

	try {
		const users = await db.searchInstituteMembers(
			instituteId,
			userId,
			searchTerm,
		);
		res.status(200).json({ users });
	} catch (error) {
		res.status(500).json({ error: 'Failed to search members' });
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
	getInstituteMembers,
};
