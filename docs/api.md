## Finder

`GET /api/finder/search?q=&level=` returns verified YouTube candidates ranked deterministically and optionally refined by Gemini. The response includes the selected resource, alternatives, and a short roadmap. The server validates that Gemini can only choose from real candidate video IDs.

`POST /api/finder/search` accepts the same payload in JSON for client-side submissions.

## Payments

`POST /api/orders` creates a Razorpay checkout order from the server-side course price. `POST /api/orders/verify` verifies a successful client-side payment, marks the order paid, and creates the enrollment exactly once.

`POST /api/courses/:courseId/enroll` enrolls a user in a free course without creating a Razorpay order.

`POST /api/webhooks/razorpay` processes Razorpay webhooks with signature verification and idempotent payment handling.

`POST /api/admin/orders/:orderId/refund` refunds a paid order for admins and revokes the corresponding enrollment.

`GET /api/enrollments/me` returns the current user's enrollments.

## Learning

`GET /api/learn/:courseId` returns the full course player payload, the current enrollment state, and learner-visible resources for authenticated users who are enrolled, own the course, or are admins.

`POST /api/courses/:courseId/lessons/:lessonId/progress` updates lesson completion and resume position for enrolled learners.
# API conventions

Every endpoint returns a predictable envelope: `{ "success": true, "data": ... }` on success or `{ "success": false, "error": { "code", "message" } }` on failure.

## Marketplace

- `GET /api/categories` lists categories; `POST /api/categories` requires an admin.
- `GET /api/courses` supports `q`, `category`, `level`, `minPrice`, `maxPrice`, `rating`, `sort`, `page`, and `limit`.
- `POST /api/courses` requires an instructor. Direct edits use `PATCH`/`DELETE /api/courses/id/:courseId`; the explicit `id` segment avoids Next.js's otherwise ambiguous slug-versus-ID dynamic route. Curriculum, publish, and unpublish routes require the owner or an admin.
- `GET /api/courses?slug=:slug` returns published metadata and preview lessons to visitors. Full lesson content is only returned to an enrolled learner, course owner, or admin.
