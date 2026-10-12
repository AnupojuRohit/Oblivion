# Oblivion GitHub audit task — working checklist

Repository: https://github.com/AnupojuRohit/Oblivion

## Confirmed by source inspection (main branch, 2026-10-12)

- [ ] Navbar (src/components/layout/navbar.tsx) fetches /api/auth/me only once in a mount effect and keeps auth state locally. Review how successful login/registration updates the navbar without a full reload.
- [ ] Desktop navbar shows “Become Instructor” only when there is no user. Signed-in students should be able to access the existing application flow; check its status (pending/approved/rejected) and display the appropriate action.
- [ ] Logout handler ignores the response status and has no error handling; make its UI state change conditional on a completed logout request or show an actionable error.
- [ ] User persistence is implemented using Mongoose User in collection users; passwordHash is select:false and authService hashes passwords with bcryptjs (12 rounds). Sessions are stored in the sessions collection, use random tokens in an HTTP-only cookie named learnhub_session, and store only SHA-256 hashes server-side.
- [ ] Course collection is courses; instructor ownership is checked in course service. Public course listing filters status: PUBLISHED.
- [ ] Free direct enrollment endpoint rejects non-zero price. Trace src/modules/orders/order.service.ts and order verification/webhook fulfillment before concluding if paid flow is complete.
- [ ] Dashboard catches database errors and substitutes empty enrollments / fallback state; make sure genuine database errors aren't misrepresented as “no enrollments.”
- [ ] Course publishing requires title, description, category, pricing, and at least one section/lesson. Trace each curriculum mutation and ensure lessonCount stays correct.
- [ ] An instructor application route exists at src/app/api/instructor/apply/route.ts, which accepts STUDENT accounts and persists applications as PENDING. Do not bypass the existing approval process.

## Work remaining
- [ ] Inspect order create/verify and webhook routes; verify signature checks, idempotency, server-computed amount, and enrollment creation only after verified payment.
- [ ] Inspect storage upload and media delivery code; ensure uploaded video bytes are really stored, persisted, playable, and access-controlled.
- [ ] Inspect admin application approval action and ensure role change is server-authorized.
- [ ] Fix auth state synchronization in navbar and student instructor-application link. Preserve existing design and architecture.
- [ ] Add/adjust tests and run lint, typecheck, test suite, and production build; report real command outcomes.
- [ ] Verify separate student/instructor end-to-end journeys and regression-test AI Finder, certificates, saved resources, dashboards.

## Safety and scope
Do not overwrite user work or change main directly. Keep the changes on fix/marketplace-auth-audit. Do not reveal environment secrets, create fake payment success, or claim tests were run unless they actually were. Record files changed, root causes, test output, and unresolved setup requirements.
