const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues.map((err) => err.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
        console.error("SYSTEM ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = validate;