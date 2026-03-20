const db = require('../db/queryP2P');

async function isParticipant(roomId, userId) {
	const room = await db.getRoomById(roomId);
	if (!room) return false;
	return (
		String(room.user_one_id) === String(userId) ||
		String(room.user_two_id) === String(userId)
	);
}

async function getOrCreateChatroom(req, res) {
	const { otherUserId } = req.body;
	const myUserId = req.user.id;

	if (!otherUserId)
		return res.status(400).json({ message: 'Target user required' });
	if (String(myUserId) === String(otherUserId))
		return res.status(400).json({ message: 'Cannot chat with self' });

	const [u1, u2] = [myUserId, otherUserId].sort();

	try {
		const existingRoom = await db.findExistingRoomQuery(u1, u2);
		if (existingRoom) return res.json({ chatroom: existingRoom, isNew: false });

		const newRoom = await db.createNewRoom(u1, u2);
		res.status(201).json({ chatroom: newRoom, isNew: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getMessages(req, res) {
	const { roomId } = req.params;
	const myUserId = req.user.id;

	try {
		if (!(await isParticipant(roomId, myUserId))) {
			return res.status(403).json({ error: 'Access Denied: Not a participant' });
		}

		const messages = await db.getP2PMessagesQuery(roomId);
		await db.markMessagesAsRead(roomId, myUserId);
		res.status(200).json({ messages: messages || [] });
	} catch (error) {
		res.status(500).json({ error: 'History load failed: ' + error.message });
	}
}

async function searchP2PMessages(req, res) {
	const { roomId } = req.params;
	const { searchTerm } = req.query;
	const myUserId = req.user.id;

	try {
		if (!(await isParticipant(roomId, myUserId))) {
			return res.status(403).json({ error: 'Access Denied' });
		}

		const messages = await db.searchP2PMessagesQuery(roomId, searchTerm);
		res.status(200).json({ messages });
	} catch (error) {
		res.status(500).json({ error: 'Search failed: ' + error.message });
	}
}

async function deleteMsg(req, res) {
	const { messageId } = req.params;
	const myUserId = req.user.id;

	try {
		const deletedIds = await db.deleteP2PMessagesQuery(messageId, myUserId);
		if (!deletedIds || deletedIds.length === 0) {
			return res.status(404).json({ error: 'Message not found or unauthorized' });
		}
		return res.status(200).json({ success: true, deletedId: deletedIds[0] });
	} catch (error) {
		res.status(500).json({ error: 'Delete failed: ' + error.message });
	}
}

async function editMsg(req, res) {
	const { messageId } = req.params;
	const { content } = req.body;
	const myUserId = req.user.id;

	if (!content) return res.status(400).json({ message: 'Content is required' });

	try {
		const editIds = await db.editP2PMessagesQuery(messageId, myUserId, content);
		if (!editIds || editIds.length === 0) {
			return res.status(404).json({ error: 'Message not found or unauthorized' });
		}
		res.status(200).json({ success: true, messageId: editIds[0] });
	} catch (error) {
		res.status(500).json({ error: 'Edit failed: ' + error.message });
	}
}

async function markRoomAsRead(req, res) {
	const { roomId } = req.params;
	const myUserId = req.user.id;

	try {
		if (!(await isParticipant(roomId, myUserId))) {
			return res.status(403).json({ error: 'Unauthorized' });
		}

		await db.markMessagesAsRead(roomId, myUserId);
		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: 'Update failed: ' + error.message });
	}
}

async function getUnreadCounts(req, res) {
	const myUserId = req.user.id;
	try {
		const counts = await db.getUnreadCountsForUser(myUserId);
		res.status(200).json(counts || []);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getUserChatrooms(req, res) {
	const userId = req.user.id;
	try {
		const rooms = await db.getUserChatrooms(userId);
		res.status(200).json({ rooms });
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch chatrooms' });
	}
}
 async function searchAllP2PMessages(req, res) {
  const { roomIds, searchTerm } = req.body;
  const myUserId = req.user.id;

  if (!Array.isArray(roomIds) || !roomIds.length || !searchTerm?.trim()) {
    return res.status(400).json({ messages: [] });
  }

  try {
    const messages = await db.searchAllP2PMessagesQuery(
      roomIds,
      searchTerm,
      myUserId  
    );
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Search failed: ' + error.message });
  }
}
module.exports = {
	getOrCreateChatroom,
	getMessages,
	searchP2PMessages,
	getUnreadCounts,
	markRoomAsRead,
	deleteMsg,
	editMsg,
	getUserChatrooms,
	searchAllP2PMessages,
};