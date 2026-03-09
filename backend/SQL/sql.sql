-- 1.  Institutes (The "Organizations")
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);

ALTER TABLE users ALTER COLUMN institute_id DROP NOT NULL;
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);
ALTER TABLE users DROP COLUMN institute_id;
CREATE TABLE p2p_chatrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- This ensures we don't have duplicate rooms for the same pair
    CONSTRAINT unique_user_pair UNIQUE(user_one_id, user_two_id),
    
    -- This ensures a user can't start a P2P chat with themselves
    CONSTRAINT separate_users CHECK (user_one_id <> user_two_id)
);

-- Indexing for fast lookups when checking if a room already exists
CREATE INDEX idx_p2p_room_users ON p2p_chatrooms (user_one_id, user_two_id);
CREATE TABLE p2p_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatroom_id UUID NOT NULL REFERENCES p2p_chatrooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing the chatroom_id so loading a conversation is nearly instant
CREATE INDEX idx_p2p_messages_room ON p2p_messages (chatroom_id);

-- Indexing created_at so we can quickly sort messages by time
CREATE INDEX idx_p2p_messages_time ON p2p_messages (created_at DESC);

ALTER TABLE p2p_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_p2p_messages_unread
  ON p2p_messages (chatroom_id, sender_id, is_read)
  WHERE is_read = FALSE;

  ALTER TABLE p2p_messages 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;