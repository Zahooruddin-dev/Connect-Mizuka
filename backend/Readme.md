
# Mizuka Chat Engine v2.0 - Backend README

This engine supports a Flexible Enrollment model. Users can register a standalone account and connect to a specific institute later using a UUID.

## 1. Required Database Migration

To allow users to register without being forced into an institute immediately, run this command in your Postgres console:

```sql
-- Allow institute_id to be empty (NULL)
ALTER TABLE users ALTER COLUMN institute_id DROP NOT NULL;

```

---

## 2. Updated API Reference (REST)

### **Authentication & Onboarding**

* **Registration** (`POST /api/auth/register`)
* **Body:** `{ "username", "email", "password", "role", "institute_id": "" }`
* **Behavior:** Creates user with `institute_id` as `NULL`.


* **Link Institute** (`PATCH /api/auth/link-institute`)
* **Body:** `{ "userId": "UUID", "instituteId": "UUID" }`
* **Behavior:** Updates the user record to join a school.
* **Requirement:** Show a "Join School" screen if `user.institute_id` is null after login.



### **Messaging & History**

* **Get History** (`GET /api/messages/channel/:channelId`)
* **Query Params:** `limit` (default 20), `offset` (default 0).
* **Logic:** Returns messages from newest to oldest based on the offset.


* **Delete Message** (`DELETE /api/messages/message/:messageId`)
* **Body:** `{ "userId": "UUID" }`
* **Logic:** Only allows deletion if `userId` matches `sender_id`.


* **Delete Channel** (`DELETE /api/messages/channel/:channelId`)
* **Body:** `{ "userId": "UUID" }`
* **Logic:** Only allows deletion if the user role in the database is "admin".



---

## 3. Socket.io Events (Real-Time)

| Event | Type | Payload | Use Case |
| --- | --- | --- | --- |
| `join_institute` | **Emit** | `channel_id` | Subscribes to a specific chat room. |
| `send_message` | **Emit** | `{ channel_id, content, sender_id, username }` | Broadcasts live text. |
| `receive_message` | **Listen** | `{ id, content, username, created_at }` | Updates the UI message list. |
| `typing` | **Emit** | `{ channel_id, username }` | Triggers the active indicator. |
| `Display_typing` | **Listen** | `{ username }` | Shows who is currently active. |
| `hide_typing` | **Listen** | (none) | Removes the indicator. |

---

## 4. Frontend Integration Checklist

To accommodate the independent user logic, your React frontend should follow this gatekeeping flow:

1. **Auth Check:** Is there a token/user? If no, show `LoginPage`.
2. **Institute Check:** Does `user.institute_id` exist?
* **No:** Redirect to `OnboardingScreen` to request a School ID.
* **Yes:** Proceed to `Dashboard` (Sidebar + ChatArea).


3. **Socket Connection:** Only `connect()` and `emit('join_institute')` once the user has a valid `institute_id`.

---

## 5. Ready-to-Use Test IDs

* **Public Hallway:** `c1111111-1111-1111-1111-111111111111`
* **Faculty Lounge:** `c2222222-2222-2222-2222-222222222222`
* **IT Helpdesk:** `c3333333-3333-3333-3333-333333333333`
* **Executive Board:** `c4444444-4444-4444-4444-444444444444`


