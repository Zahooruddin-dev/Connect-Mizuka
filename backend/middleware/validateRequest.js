const validate = (schema) => (req, res, next) => {
	try {
		schema.parse(req.body);
		next();
	} catch (error) {
		if (error.errors) {
			const errorMessage = error.errors.map((err) => err.message).join(', ');
			return res.status(400).json({ message: errorMessage });
		}
		console.error('Validation Middleware Error:', error);
		return res
			.status(500)
			.json({ message: 'Internal Server Error during validation' });
	}
};

module.exports = validate;
