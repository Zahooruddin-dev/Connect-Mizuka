const { z } = require('zod');

const registerSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters long'),
	email: z.string().email('Invalid email format'),
	password: z.string().min(6, 'Password must be at least 6 characters long'),
	role: z.enum(['admin', 'member']).optional(),
	institute_id: z.string().optional().nullable(),
});
const loginSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});
const resetPassordSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(6, 'Password must be at least 6 characters long'),
  code:z.int().min(6,'Code must be 6 integers long')
});
module.exports = { registerSchema, loginSchema,resetPassordSchema };
