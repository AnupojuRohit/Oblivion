# Instructor dashboard

The `/dashboard` route and all child routes require an authenticated `INSTRUCTOR` session. The server layout enforces this before rendering any dashboard UI.

Course details are saved through the Phase 2 validated course APIs. The curriculum editor uses the section and lesson APIs directly, so every change is checked for course ownership on the server. Publishing also uses the server-side readiness validation; an instructor cannot publish a course with no lessons.

Analytics are derived from each instructor's own course records (enrollment counts and ratings). “Estimated gross” is an indication based on current course price times enrollment count; payment-backed revenue and real order records are intentionally deferred until the payments phase rather than invented in the UI.
