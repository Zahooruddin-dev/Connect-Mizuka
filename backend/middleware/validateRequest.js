const validate = (schema) => (req, res, next) => {
	try {
    schema.pasrse(req.body)
    next()
	} catch (error) {
		const errorMessage = error.errors.map((err) => err.message).join(', ');
		return res.status(400).json({ message: errorMessage });
	}
};
module.exports={validate}