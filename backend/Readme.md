

# Mizuka Chat Engine v3.0 - Multi-Tenant Backend

This backend supports a **Many-to-Many Relationship** model. A single user can now be an Admin in one institute and a Member in another, verified by a central junction table.

---

## 1. Required Database Migration (Neon Console)

Run this to move from a single `institute_id` column to a secure relationship table.

```sql
-- 1. Create the Junction Table
CREATE TABLE user_institutes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'teacher')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, institute_id)
);

-- 2. (Optional) Cleanup: Only do this once code no longer references users.institute_id
-- ALTER TABLE users DROP COLUMN institute_id;

```

---

## 2. Updated API Reference (REST)

### **Administrative Actions (Admin Only)**

* **Create Institute** (`POST /api/institute/create`)
* **Body:** `{ "name": "School Name", "adminId": "UUID" }`
* **Logic:** Executes a transaction to (1) Create Institute, (2) Create "General Hallway" channel, (3) Link Admin in `user_institutes`.


* **Admin Dashboard** (`GET /api/institute/dashboard/:adminId`)
* **Logic:** Returns all institutes managed by this specific admin, including their **Global Invite Keys** (IDs).


* **Create Channel** (`POST /api/channel/create`)
* **Body:** `{ "name", "institute_id", "adminId", "is_private" }`
* **Security:** Backend verifies if `adminId` is registered as an `'admin'` for that specific `institute_id` before inserting.



---

### **Onboarding & Joining**

* **Join Institute** (`POST /api/auth/link-to-institute`)
* **Body:** `{ "userId": "UUID", "instituteId": "UUID" }`
* **Behavior:** Inserts a record into `user_institutes` with `role: 'member'`.


* **Check Membership** (`GET /api/auth/my-memberships/:userId`)
* **Logic:** Returns all institutes the user currently belongs to.



---

## 3. Security Design: The "Double-Lock"

Every administrative request now validates two things:

1. **Identity:** Is the `adminId` valid?
2. **Authority:** Does the `user_institutes` table confirm this user is an `'admin'` for **this specific** `institute_id`?

This prevents "Cross-Institute" attacks where an admin from School A tries to delete channels in School B.

---

## 4. Frontend Integration Flow

1. **Auth Check:** User logs in.
2. **Fetch Institutes:** Frontend calls `GET /api/auth/my-memberships/:userId`.
3. **Gatekeeping:**
* If array is empty: Show `InstituteGate` (Enter Invite Code).
* If array has items: Load Sidebar with Institute Switcher.


4. **Admin UI:** If `role === 'admin'` for the active institute, show "Create Channel" and "Invite Key" buttons.

---

## 5. Socket.io Event Contract

| Event | Type | Payload | Notes |
| --- | --- | --- | --- |
| `join_institute` | **Emit** | `channel_id` | Joins a specific UUID room. |
| `send_message` | **Emit** | `{ channel_id, message, sender_id, username }` | Note: Uses `message` not `content`. |
| `receive_message` | **Listen** | `{ id, text, from, timestamp }` | Note: Uses `text` not `content`. |

