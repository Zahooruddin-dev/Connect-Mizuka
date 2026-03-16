const { z } = require('zod');

const createInstituteSchema = z.object({
	name: z
		.string()
		.min(2, 'Institute name must be at least 2 characters')
		.max(100, 'Institute name must be at most 100 characters')
		.regex(/^[a-zA-Z0-9 _-]+$/, 'Institute name may only contain letters, numbers, spaces, hyphens and underscores'),
});

module.exports = { createInstituteSchema };