const db = require('../db/queryInstitute');
async function createInstitute(req, res) {
  const { name } = req.body;
  const adminId = req.user.id; 

  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const newInst = await db.createInstituteQuery(name);
    await db.createDefaultChannelQuery(newInst.id);
    await db.linkToAdminQuery(newInst.id, adminId);

    res.status(201).json({
      message: 'Institute created successfully',
      institute: newInst
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create institute' });
  }
}async function getGlobalKey(req, res) {
  const { instituteId } = req.params;
  const adminId = req.user.id;

  try {
    const isAuthorized = await db.verifyAdminOfInstitute(adminId, instituteId);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You do not manage this institute' });
    }

    const institute = await db.getInstituteByIdQuery(instituteId);
    res.status(200).json({ institute });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get key' });
  }
}async function getAdminDashboard(req, res) {
  const adminId = req.user.id;
  try {
    const institutes = await db.getAdminInstitutes(adminId);
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
