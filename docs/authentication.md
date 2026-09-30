# Authentication

LearnHub uses server-side database sessions, not browser storage or refresh-token JWTs. On registration or login, the password is hashed with bcrypt, a cryptographically random session token is generated, and only its SHA-256 hash (keyed with `SESSION_SECRET`) is stored in MongoDB. The raw token is sent in an `httpOnly`, `SameSite=Lax` cookie for seven days.

The `sessions` collection has a unique token hash, TTL expiry index, and user index. `POST /api/auth/logout` invalidates the current session; `POST /api/auth/logout-all` invalidates every session for the signed-in user.

Public registration always creates a `STUDENT`; instructor/admin roles are intentionally not client-controlled. `requireUser`, `requireRole`, `requireInstructor`, and `requireAdmin` enforce server-side authorization.
