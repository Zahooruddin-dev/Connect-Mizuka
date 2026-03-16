const { z, email } = require('zod');

const registerSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters long'),
	email: z.string().min(3, 'Username must be at least 3 characters long'),
	password: z.string().min(3, 'Password must be at least 6 characters long'),
	role: z.enum(['admin', 'member']).optional(),
	institute_id: z.string().optional().nullable(),
});
const loginSchema = z.object({
	email: z.string.email('Invalid email format'),
	password: z.string.password(1, 'Password is required'),
});
module.exports = { registerSchema, loginSchema };
