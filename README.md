# Oblivion

**Oblivion is a learning marketplace built with Next.js, TypeScript, MongoDB, and Mongoose.** It provides course discovery, course authoring, learning workflows, authentication, payments, and an AI-assisted educational resource finder.

The codebase is organized as a **modular monolith**: one deployable Next.js application, with clear modules for authentication, courses, enrollments, orders, categories, and external integrations. This keeps deployment simple while making business rules easier to find and test.

## What the application does

- Account registration, login, server-side sessions, and role-based access.
- Course catalogue and course details.
- Instructor application and administrator review.
- Course authoring with sections and lessons.
- Enrollment and Razorpay checkout/payment verification.
- Learning progress, reviews, saved resources, and certificates.
- AI-assisted educational resource discovery using YouTube Data API and Gemini.

**Current instructor workspace scope:** an approved instructor sees two primary actions: **Upload course** and **My uploaded courses**. Public course discovery and course visibility should be tested separately before treating the publishing journey as complete.

## Technology

| Area | Technology | Why it is used |
| --- | --- | --- |
| Web application | Next.js App Router, React | Routes, server-rendered pages, and UI |
| Language | TypeScript | Explicit data shapes and safer refactoring |
| Styling | Tailwind CSS and reusable UI components | Consistent responsive interface |
| API | Next.js Route Handlers | HTTP boundary for browser and integration requests |
| Validation | Zod | Validate untrusted request data at runtime |
| Business logic | Domain services under `src/modules` | Centralize rules instead of duplicating them in UI/API code |
| Database | MongoDB Atlas and Mongoose | Persist users, sessions, courses, orders, and learning data |
| Payments | Razorpay | Checkout, payment signature verification, webhooks, refunds |
| AI resources | YouTube Data API and Gemini | Retrieve real candidates and assist with resource ranking |
| Deployment | Vercel-compatible Next.js app | Deploy the web application without splitting it into services prematurely |

## Architecture

```text
Browser
  │
  ▼
Next.js pages and reusable components
  │  user action / fetch
  ▼
Route Handler (HTTP boundary)
  ├── Authenticate the session
  ├── Validate request data with Zod
  ├── Call a domain service
  └── Convert result/errors into a consistent response
          │
          ▼
Domain service (business rules)
  ├── Authorization and ownership checks
  ├── State transitions and calculations
  └── Repository/model operations
          │
          ▼
MongoDB through Mongoose

External integrations:
  ├── Razorpay: checkout, payment verification, webhooks, refunds
  └── YouTube Data API + Gemini: educational resource discovery
```

### Why a modular monolith?

The app has multiple business domains, but they do not yet require independently deployed services. Keeping one deployment reduces operational complexity. Separating domain modules gives us boundaries now, while leaving open the option to extract a service if scale or team ownership eventually justifies it.

## Repository layout

```text
src/
├── app/                 # Next.js pages, layouts, and API route handlers
│   └── api/             # HTTP endpoints
├── components/          # Reusable UI and domain components
├── infrastructure/      # Database and external-provider clients
├── lib/                 # Shared helpers: auth, env, errors, API responses
└── modules/              # Domain modules and business rules
    ├── auth/
    ├── categories/
    ├── courses/
    ├── enrollments/
    ├── instructor/
    └── orders/
docs/                    # Engineering notes and walkthroughs
```

A useful rule of thumb:

- **Page/component:** What should the user see and interact with?
- **Route handler:** What HTTP request is being made, and what is its response?
- **Schema:** Is the incoming data valid?
- **Service:** Is the requested business operation allowed, and what state changes?
- **Model:** How is the data stored and constrained?
- **Infrastructure client:** How does the application talk to MongoDB or an external provider?

## Important engineering decisions

### 1. Validate data at the boundary

Browser input and API payloads are untrusted. Route handlers parse inputs with Zod schemas before asking services to use them. Database schema validation is useful too, but it does not replace request validation.

### 2. Authorize on the server

Hiding a button is only a UI decision. Every sensitive operation must verify the authenticated user and their role on the server. Course mutations also check ownership, so one instructor cannot edit another instructor's course by changing an ID in a request.

### 3. Keep passwords and sessions safer

Passwords are hashed with bcrypt before persistence. A session token is generated for the browser cookie, while the database stores a hash of the token. The session cookie is managed on the server and should not be exposed to client-side JavaScript.

### 4. Use a consistent API response envelope

Successful responses use `{ success: true, data }`; failures use `{ success: false, error: { code, message } }`. This gives clients one predictable response shape. Unexpected internal errors should not expose stack traces or secrets.

### 5. Treat payment as a state transition

Creating checkout is not proof of payment. The server derives the amount from the stored course, verifies Razorpay signatures, records payment state, and creates enrollment only after a verified payment path. Webhooks can be retried, so event processing needs duplicate handling.

### 6. Keep persistence separate from public response shapes

Services explicitly map internal documents into public objects. This avoids accidentally returning fields that should remain internal and reduces accidental API changes when database models evolve.

### 7. Make failure visible

An unavailable database is different from a valid empty result. Pages and API routes should communicate failures accurately rather than silently showing empty data that looks like a successful query.

## Core flows to explain

### Login

1. The route handler receives the login request.
2. Zod validates the email and password shape.
3. The auth service looks up the user and compares the password with the stored bcrypt hash.
4. The server creates a random session token and stores its hash with an expiry.
5. The raw token is set in an HTTP-only cookie; the response returns the public user profile, not the password hash.

### Instructor course creation

1. A student submits an instructor application.
2. An administrator reviews it and grants the instructor role through the existing review flow.
3. The server page checks the role before rendering the course editor.
4. The API validates course input.
5. The course service verifies instructor permission and category existence.
6. The course is created as a draft, associated with its instructor.
7. The “My uploaded courses” query filters by that instructor's ID.

### Paid enrollment

1. The server loads a published course and calculates the amount from its stored price.
2. An order is persisted and a Razorpay order is created.
3. The client completes checkout.
4. The server verifies the payment signature or processes a verified webhook.
5. The order state is updated and an enrollment is created.
6. Duplicate requests/events must not create duplicate enrollments.

## Local development

Requirements: Node.js compatible with the installed Next.js version, npm, and a configured MongoDB database.

```bash
npm install
cp .env.example .env.local
# Add the required values to .env.local
npm run dev
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not commit `.env.local` or paste secret values into issue reports. Use the environment variable names in `.env.example` to configure local services.

## Faculty walkthrough

See [docs/engineering-guide.md](docs/engineering-guide.md) for a presentation-friendly explanation of the architecture, key engineering concepts, demo sequence, and likely questions.

## Project status and verification

This repository is actively being improved. A code review or a formatting change is not proof that every workflow works end-to-end. Before a production claim, run lint, type checking, tests, and a production build, then verify critical journeys with configured MongoDB, Razorpay, storage, YouTube, and Gemini credentials. Record which checks actually passed.
