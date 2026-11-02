# Deployment runbook

## Required configuration

Use Node.js 24+, a persistent MongoDB database, `MONGO_URL`, independent random `JWT_SECRET` and `SESSION_SECRET`, `NODE_ENV=production`, and the host's `PORT`. HTTPS is required for production authentication cookies. Configure `TRUST_PROXY` only for the actual trusted proxy arrangement.

Run `npm ci --omit=dev`, then `npm start`. A Dockerfile is included for container-based hosts. The Compose file is a local development configuration: it intentionally uses development cookies for HTTP localhost and a named MongoDB volume. Run `docker compose up --build` after configuring the two secrets. Container builds have not been verified unless recorded in the test evidence.

Production flash/session state uses `connect-mongo`; authentication sessions, progress, planner entries, quiz snapshots and audit records also persist in MongoDB. Keep the database reachable only by the application and authenticated administrative clients.

## Optional integrations

- Brevo email: `BREVO_API_KEY`, verified sender in `GOOGLE_USER`.
- Cloudinary: `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`.
- Gemini: `GEMINI_API_KEY`, a supported `GEMINI_MODEL` for your account.

Use host-managed secrets. Do not package `.env`, seed demo users into production, or expose database ports publicly. Use the normal registration flow and bootstrap the first administrator directly in your own database.

## Release verification

1. Run syntax, unit/HTTP, and database integration tests.
2. Run `npm audit` against the registry; the current environment could not retrieve advisories. Earlier findings are historical.
3. Verify health at `/health`, registration, login, secure cookies, logout and password reset over HTTPS.
4. Create a chapter and draft quiz; review and publish it.
5. Complete a timed test, refresh mid-attempt, test expiry, and verify another account cannot read it.
6. Restart the app and verify persisted progress and sessions.
7. Confirm backup schedule, restore procedure, service error logs and a rollback image/version.

`/health` indicates that the HTTP process is responding; it is not a full database or external-service readiness check. Capture application errors through the hosting platform's logs. Email, upload, AI, public hosting, load tests and restore drills require environment-specific verification.

## PDF document storage

Uploaded learning PDFs live in MongoDB GridFS (`materials.files` and `materials.chunks`). Include both collections in backup/restore procedures and budget database capacity for document storage. Each upload is limited to 15 MB and checked for PDF MIME type and file signature. These checks are not a malware scanning service; add a scanning provider if your public deployment requires one. Replaced or detached binary files are retained; schedule an orphan-file cleanup policy when deploying at scale.

The material manager works without Cloudinary; Cloudinary is still used by the existing question-image workflow. Videos are linked, not uploaded or transcoded by this app. Test your chosen hosting provider's request-size limit against the 15 MB application limit.

## Current local release evidence — 3 November 2026

Production-mode secure-cookie behavior, database-backed session/authentication continuity and saved notes were exercised across an application process restart using a disposable database, test-only secrets and a local trusted proxy header. This verifies application persistence; it does not verify a public TLS deployment. Startup awaits the active-test unique index before accepting HTTP requests.

Docker is not installed in this environment, so Dockerfile/Compose builds are unverified. Installed production dependencies were listed successfully. The advisory registry failed DNS/network access attempts; rerun npm audit in the release environment. No dependency upgrade was guessed from an unavailable audit.

Before public release, run provider delivery/playback checks, the actual host/proxy/TLS tests, backup restoration, resource/load checks and CSP tightening for the remaining legacy inline scripts. No public deployment was performed. PDFs and archived records remain in database backups; replaced/detached GridFS files require an intentional retention/cleanup policy. See WORKFLOW-AUDIT.md for the complete verification boundary.
