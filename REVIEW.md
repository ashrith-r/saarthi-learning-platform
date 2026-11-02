# Local review and improvement plan

> Updated implementation: the demo build now includes the studio dashboard, chapter workspace, bookmarks/notes/progress, calendar planner, goals/streaks, timed tests, autosave, snapshots, analytics/revision, editor permissions, publishing, CSV preview, audit events and persistent production sessions. See SRS.md for the current baseline. The audit notes below describe the earlier review; after the Cloudinary migration the remaining audit count is six moderate findings, with no high or critical findings.

## Changes made

- Restricted quiz-result queries to the logged-in student and validated attempt IDs.
- Rejected answers that do not belong to a question and stored unanswered grades as Boolean `false`.
- Enabled same-origin checks across authentication, admin writes (including uploads/AI) and quiz submissions. Missing or foreign Origin/Referer headers are rejected with HTTP 403.
- Checked session ownership, revocation and absolute lifetime when authenticating. Password resets revoke the user's sessions; logout also clears stale cookies. Refresh tokens include unique random identifiers.
- Separated email-verification and password-reset OTPs, enforced the ten-minute lifetime in queries, consumed codes atomically, renewed creation time when reissuing, and used cryptographic randomness.
- Added password length/type validation, removed sensitive user/token logging, and returned a real HTTP 500 response instead of redirecting errors back into failing pages.
- Escaped question data rendered through HTML in the quiz builder and fixed label clicks toggling a question twice.
- Loaded question-form subjects from subject records rather than a stale list on exam records.
- Limited uploads to six images, five MiB each, with JPEG/PNG/WebP MIME checks. Cloudinary also restricts image formats.
- Corrected image filename storage and an ES module import in the enrollment model.
- Added configurable AI model selection, a request timeout and an API key header instead of a key in the request URL.
- Removed unused dependencies and legacy commented email code, applied compatible dependency security updates, and added setup documentation, an environment example, syntax checks, regression tests and CI.

## Verification and limits

`npm run check` and `npm test` are the local verification commands. The tests use mocked database responses plus a real local HTTP server. MongoDB-backed registration, email delivery, Cloudinary uploads and Gemini responses have not been exercised with live credentials. Browser appearance and interactions still need manual checking.

The dependency audit fell from 26 findings (including one critical) to 8: six moderate and two high. The remaining high findings are the Cloudinary SDK and its storage adapter dependency chain. The moderate findings involve minimatch and dependents including nodemon and EJS-Mate's nested EJS tooling. Counts represent affected packages, not eight independently exploitable app vulnerabilities. Avoid a blind `npm audit fix --force`: the proposed changes include incompatible upgrades or downgrades. Migrate the Cloudinary upload adapter and review template/dev-tool dependencies separately.

## Highest-priority remaining improvements

1. **Abuse prevention:** shared rate limits and per-account OTP attempt limits, request cooldowns, and generic authentication messages to reduce account enumeration. Current origin checks do not stop same-origin brute force.
2. **Production sessions:** a persistent shared session store, cleanup/monitoring, and tests for concurrent refresh requests. The existing refresh rotation can race when several requests renew simultaneously.
3. **Validation:** consistent validation for every admin form, query filter, URL and AI response. Restrict resource links to safe HTTP/HTTPS URLs; verify AI output has four usable options and a valid answer index before presenting it.
4. **Data integrity:** validate referenced chapters/questions during quiz creation, prevent deleting questions used by existing quizzes/attempts, and snapshot questions/answers in attempts so later question edits cannot change historical results.
5. **Database testing:** run registration, resend, expiry, password-reset revocation and quiz workflows against a disposable MongoDB database; add concurrent-request cases.
6. **Scale and operations:** paginate the question bank/users, query counts directly, fetch independent dashboard datasets concurrently, and add structured error monitoring, backups and a deployment health check.
7. **Browser protection and accessibility:** replace the disabled Content Security Policy with a policy compatible with the current scripts/styles; test keyboard use, form labels, contrast and mobile layouts.

## Suggested features, in order

1. **Personal progress and bookmarks:** mark lectures/chapters complete, save notes and resume from the dashboard. The enrollment model provides a starting point but is not wired into student flows.
2. **Targeted revision:** turn existing quiz weakness tags into a practice queue, with spaced review and links back to the relevant chapter resources.
3. **Timed practice exams:** add server-enforced start/end times, autosaved answers, resume support and configurable scoring/negative marking.
4. **Performance history:** show score trends, accuracy by chapter, skipped-question counts and repeated mistakes.
5. **Resource search:** search lectures, notes, sheets and questions by exam, subject, chapter and difficulty.
6. **Admin publishing workflow:** drafts, preview, approval, version history and bulk question import with validation. Keep AI-generated questions as drafts until reviewed.

No Git repository was initialized and nothing was pushed. Apply these files to a branch in the destination repository once access is available.
