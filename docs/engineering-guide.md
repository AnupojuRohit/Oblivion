# Oblivion — Engineering and Faculty Walkthrough

This guide is designed to help explain the project clearly during a faculty demonstration. It describes the current architecture and the reasoning behind the major engineering decisions. It does not claim that an unrun test or external integration has been verified.

## 1. A short introduction

> Oblivion is a learning marketplace where students can discover educational resources and courses, while approved instructors can create and manage course content. It is built as a modular monolith with Next.js, TypeScript, MongoDB/Mongoose, and external integrations for payments and AI-assisted resource discovery.

The engineering objective is to keep the system understandable and secure: validate inputs, authorize actions on the server, centralize business rules, and make failures predictable.

## 2. Architecture in one diagram

```text
User / Browser
      │
      ▼
Next.js UI (pages, layouts, components)
      │ HTTP request
      ▼
API Route Handler
      ├── Read session / authenticate
      ├── Validate request with Zod
      ├── Call domain service
      └── Return a consistent API response
                │
                ▼
          Domain Service
      ├── Business rules
      ├── Role / ownership checks
      ├── State transitions
      └── Database operations
                │
                ▼
        Mongoose Models
                │
                ▼
             MongoDB

External providers: Razorpay | YouTube Data API | Gemini
```

### How to explain each layer

| Layer | Responsibility | Why it exists |
| --- | --- | --- |
| UI | Render data and capture user actions | Keeps presentation separate from business rules |
| Route handler | Handle HTTP, auth context, input parsing, and response status | Creates a clear API boundary |
| Zod schema | Validate untrusted input at runtime | TypeScript types alone do not validate JSON received over HTTP |
| Service | Enforce business rules and coordinate changes | Prevents business logic from being copied into multiple routes |
| Model | Define persisted fields, defaults, constraints, and indexes | Keeps database structure explicit |
| Infrastructure | Connect to MongoDB and external providers | Isolates provider-specific details from domain logic |
| Shared library | Auth helpers, errors, env access, API response helpers | Reuses cross-cutting behavior consistently |

## 3. Why a modular monolith instead of microservices?

Oblivion has multiple domains—authentication, courses, enrollments, orders, and AI resource discovery—but a student project does not benefit automatically from many separately deployed services.

A modular monolith:
- keeps deployment and local development simpler;
- avoids network calls between services for operations that need a coordinated state change;
- still provides boundaries through domain modules;
- allows future extraction if a module later needs independent scaling or ownership.

The principle is **separation of concerns without premature infrastructure complexity**.

## 4. Folder map

- `src/app/`: Next.js pages, layouts, and API route handlers.
- `src/components/`: reusable UI components grouped by feature.
- `src/modules/auth/`: login, registration, sessions, and user roles.
- `src/modules/courses/`: course schema, model, permissions, view mapping, and service.
- `src/modules/orders/`: checkout orders, payment events, and payment state transitions.
- `src/modules/enrollments/`: access to courses after enrollment.
- `src/infrastructure/`: external system clients, including MongoDB and Razorpay.
- `src/lib/`: shared error handling, environment validation, auth helpers, and API response helpers.
- `docs/`: architecture and engineering notes.

A quick way to navigate unfamiliar code is to start at the route handler, follow its service call, then inspect the service's model and any permission helper it uses.

## 5. Core flow: login and session

1. The login route receives the request.
2. A Zod schema validates the payload.
3. The auth service normalizes the email and looks up the account.
4. bcrypt compares the supplied password against the stored password hash.
5. The server generates a cryptographically random session token.
6. Only a hash of that token is stored in MongoDB with an expiry.
7. The raw token is set as an HTTP-only cookie; the response exposes a public user object.

**Why these steps matter**
- Password hashing means the database does not store plaintext passwords.
- An HTTP-only cookie reduces the ability of client-side scripts to read the session token.
- Hashing stored session tokens limits the usefulness of a database leak.
- A public-user mapper prevents persistence-only fields from being returned to the browser.

## 6. Core flow: instructor onboarding and course upload

1. A student uses the instructor application page.
2. The application endpoint accepts student accounts and validates the bio and expertise fields.
3. The application is stored with a pending status.
4. The administrator review flow controls when the account receives the instructor role.
5. An instructor opens the upload page; server-side page guards check the role.
6. The API validates course details.
7. The course service verifies instructor permissions and confirms the category exists.
8. A draft course is created with the instructor's ID.
9. The “My uploaded courses” service query filters by the authenticated instructor's ID.

**Important distinction:** hiding navigation links is not security. Server-side checks protect the page and service even if someone manually sends an HTTP request.

The current instructor workspace is intentionally focused on **Upload course** and **My uploaded courses**. Public discovery/visibility should be treated as a later phase until its end-to-end behavior is verified.

## 7. Core flow: course ownership and publishing

- A course stores an `instructorId`.
- A mutation loads the course and checks whether the user is its owner or an administrator.
- Publishing checks that required course details and at least one section and lesson exist.
- The catalogue query filters to `PUBLISHED` courses.
- The lesson count is recalculated after curriculum changes.

**Why ownership checks are server-side:** a client can alter a course ID in a request. The server must not assume that a logged-in user owns the requested resource.

## 8. Core flow: paid enrollment

1. The server loads a published course.
2. It checks that the buyer is not already enrolled and is not purchasing their own course.
3. It computes the payment amount from the database price; it does not trust a price sent by the browser.
4. It creates a local order and a Razorpay order.
5. Checkout returns payment details to the browser.
6. Payment verification checks the Razorpay signature.
7. A verified payment changes the order state to paid and creates an enrollment.
8. A webhook path verifies the webhook signature and tracks provider events to handle retries.
9. A refund is restricted to administrators and removes the related enrollment after the refund operation.

**Terms to know**
- **Authentication:** who is making the request?
- **Authorization:** may this user perform this operation?
- **Validation:** is the submitted data shaped and constrained correctly?
- **Idempotency:** can retrying an operation safely avoid duplicating its effect?
- **State transition:** a controlled change such as `CREATED → PAID → REFUNDED`.

Payment flows deserve end-to-end tests with provider test credentials; source inspection alone is not enough to prove a payment flow is production-ready.

## 9. Error handling and API contracts

Success response:

```json
{ "success": true, "data": {} }
```

Failure response:

```json
{
  "success": false,
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "Course not found"
  }
}
```

Services can throw an `AppError` with an application code and HTTP status. The shared response helper translates known validation/database errors into an API envelope and keeps unexpected internal details out of the response.

This is useful because clients can handle errors consistently without understanding each route's internal implementation.

## 10. Engineering principles demonstrated

1. **Single responsibility:** route handlers focus on HTTP; services focus on business rules.
2. **Separation of concerns:** UI, validation, business logic, persistence, and integrations have distinct locations.
3. **Defense in depth:** validate inputs, authenticate the caller, authorize the action, and enforce database constraints.
4. **Least privilege:** each role should see and perform only the actions it needs; the server enforces the rule.
5. **Explicit contracts:** shared response envelopes and public DTO mapping reduce accidental API changes.
6. **Fail safely:** unexpected errors should not leak stack traces or secrets.
7. **Indexes for access patterns:** course status/category/level and text search indexes support common catalogue queries.
8. **Idempotent integration handling:** payment callbacks and webhooks may be repeated and need duplicate handling.
9. **Avoid premature microservices:** use clear module boundaries before adding distributed operational complexity.
10. **Verify, don't assume:** lint, typecheck, automated tests, production build, and configured end-to-end checks answer different questions.

## 11. Suggested demo sequence

1. Show the landing page and explain the student problem the marketplace addresses.
2. Sign in as a student and show the dashboard/course discovery.
3. Show the instructor application and explain why approval is separate from login.
4. Sign in as an approved instructor and show the two primary actions: Upload course and My uploaded courses.
5. Create or open a draft course and explain the route → schema → service → model path.
6. Open the service and point out server-side authorization and ownership checks.
7. Show the API response helper and explain consistent errors.
8. Explain the payment flow from server-calculated amount to signature verification and enrollment.
9. Finish with the modular monolith decision and the next testing milestones.

Use a prepared test account and known-good local configuration. Do not rely on live payment or AI calls during a faculty demo if the network or provider credentials are uncertain.

## 12. Likely faculty questions

**Why TypeScript?**  
It makes expected data shapes visible during development and refactoring. Runtime validation is still needed for external input.

**Why use both Zod and Mongoose validation?**  
Zod validates the API payload at the boundary and produces useful request errors. Mongoose validates persisted documents and applies database-oriented defaults and constraints. They protect different boundaries.

**Why not put database queries directly in the API route?**  
That couples HTTP handling to business rules and makes the same rules harder to reuse and test. Services provide one place for course ownership, payment, and state rules.

**Why is the amount calculated on the server?**  
A browser is controlled by the user. If it could choose the amount, it could request a lower price. The server uses the stored course price.

**Why are webhook signatures and event IDs important?**  
A webhook is an external request, so its signature must be verified. Providers retry delivery, so duplicate events must not create duplicate effects.

**Why not use microservices?**  
The current project can meet its goals with a single deployment. A modular monolith keeps deployment simpler while preserving code boundaries.

**How do you know it works?**  
Explain the checks actually run. Static type checking, lint, unit tests, production build, and end-to-end integration tests catch different categories of problems. Never describe an unrun test as passed.

## 13. Before presenting

- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Test login/logout with a student account.
- [ ] Test the approved-instructor upload/list flow.
- [ ] Confirm an instructor cannot edit another instructor's course.
- [ ] Test payment only with Razorpay test credentials.
- [ ] Keep `.env.local` and secrets out of screen shares and commits.
- [ ] If a check cannot run, state the blocker honestly and show the intended verification plan.
