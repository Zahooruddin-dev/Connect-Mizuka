const { z } = require('zod');

const createChannelSchema = z.object({
	name: z
		.string()
		.min(2, 'Channel name must be at least 2 characters')
		.max(64, 'Channel name must be at most 64 characters')
		.regex(/^[a-z0-9-_]+$/, 'Channel name may only contain lowercase letters, numbers, hyphens and underscores'),
	institute_id: z.string().min(1, 'Institute ID is required'),
	is_private: z.boolean().optional(),
});

const updateChannelSchema = z.object({
	name: z
		.string()
		.min(2, 'Channel name must be at least 2 characters')
		.max(64, 'Channel name must be at most 64 characters')
		.regex(/^[a-z0-9-_]+$/, 'Channel name may only contain lowercase letters, numbers, hyphens and underscores')
		.optional(),
	is_private: z.boolean().optional(),
});

module.exports = { createChannelSchema, updateChannelSchema };