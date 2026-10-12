# Oblivion engineering cleanup checklist

Repository: https://github.com/AnupojuRohit/Oblivion
Working branch: `fix/marketplace-auth-audit`

## Completed in this branch

- [x] Focus instructor workspace on Upload course and My uploaded courses.
- [x] Keep the existing instructor application and administrator approval flow.
- [x] Make the shared application error type easier to read and explain.
- [x] Format and document the auth service, session helpers, and public-user mapping.
- [x] Format and document course permissions, course persistence schema, and course service.
- [x] Format and document payment order creation, payment verification, webhook handling, and refunds.
- [x] Make course API route handling and instructor application validation more explicit.
- [x] Document the project architecture, engineering decisions, core flows, and faculty Q&A in `docs/engineering-guide.md`.
- [x] Align the README with the current architecture and instructor workspace scope.
- [x] Add unit coverage for instructor ownership and administrator permissions.

## Verification status

The changes were reviewed through GitHub source inspection. This connector session cannot execute the repository's npm scripts locally, so the following are **not yet verified for this branch**:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Student login/logout browser flow.
- [ ] Instructor application and administrator approval flow.
- [ ] Instructor upload/list/edit ownership flow.
- [ ] Payment checkout, verified payment, webhook retry, and refund with Razorpay test credentials.
- [ ] Storage and media upload/playback with configured storage credentials.
- [ ] AI Finder integration with configured YouTube and Gemini credentials.

## Known engineering checks to retain

- API routes should validate untrusted input with Zod and use the shared response envelope.
- Sensitive actions must authenticate and authorize on the server; hiding a link is not a security boundary.
- Course mutation paths must call ownership checks before saving changes.
- The public catalogue must filter to published courses.
- Payment amounts must come from stored course prices, and enrollment must follow verified payment.
- Webhook retries need duplicate-event handling.
- Database failures should not be presented as a successful empty result.
- Never commit `.env.local`, API keys, or provider secrets.

## Scope notes

The instructor workspace currently focuses on course upload and the instructor's own course list. Public discovery/visibility is a later phase and should not be claimed as verified merely because a course can be saved as a draft. Preserve the administrator approval flow unless the product decision explicitly changes.
