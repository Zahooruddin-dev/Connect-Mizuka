const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: 'Token required' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = {
			...decoded,
			id: decoded.id ?? decoded.userId ?? decoded.user_id,
		};

		if (!req.user.id) {
			return res.status(401).json({ error: 'Invalid token payload' });
		}

		next();
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ error: 'Token expired' });
		}
		return res.status(403).json({ error: 'Invalid token' });
	}
}

function restrictToAdmin(req, res, next) {
	if (req.user.role !== 'admin') {
		return res.status(403).json({ error: 'Admin privileges required' });
	}
	next();
}

module.exports = { verifyToken, restrictToAdmin };