# Deployment runbook

## Live deployment evidence — 5 November 2026

The app is live at https://saarthi-learning-platform.onrender.com on Render's free Singapore web service, backed by the dedicated `saarthi` database in the free Atlas `saarthi` cluster in AWS Singapore. Authentication/session secrets and the restricted application's database credential are stored in Render's environment settings. Only the two outbound ranges shown in this service's Render dashboard at setup time, `74.220.52.0/24` and `74.220.60.0/24`, were added to the Atlas access list.

The deployment reached `live`. Render's HTTP health-check path is `/ready`; public HTTPS checks returned 200 for `/ready`, `/health`, home, signup and SMS recovery. Logged-out protected routes redirected to login, foreign-origin form submissions returned 403, and session cookies carried Secure and HttpOnly. Render's production dependency installation reported zero vulnerabilities. No demo credentials or test accounts were seeded into this database.

At initial live verification neither SMS nor email delivery credentials were configured, so registration/recovery displayed their unavailable states. Carrier delivery, live OTP registration/recovery and first-administrator bootstrap remain pending provider configuration and the user's verified account. The local isolated-transport tests cover the implemented mobile flows; they are not evidence of live carrier delivery.

## Render, MongoDB Atlas and mobile OTP

The repository includes `render.yaml` for a Node web service in Singapore. It uses a free Render plan, host-generated authentication/session secrets, HTTPS cookies and an external persistent MongoDB Atlas database. Free hosting may sleep when idle; use an appropriate paid plan when availability requirements justify it. Do not run `demo:local` as the deployment start command: that database resets on restart. Use `npm start`.

1. Create a free Atlas cluster and an application database user with `readWrite` on only the `saarthi` database. Put its authenticated `mongodb+srv` connection string, including `/saarthi`, in Render's `MONGO_URL` secret.
2. Allow the Render service's documented outbound CIDR ranges in the Atlas project network access list. Keep authentication/TLS enabled. Do not use an unrestricted `0.0.0.0/0` entry.
3. Set `NODE_ENV=production`, `TRUST_PROXY=1`, Node 24 and independent random `JWT_SECRET` and `SESSION_SECRET` values. The Render blueprint generates the last two automatically. Never commit credentials.
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and either `TWILIO_MESSAGING_SERVICE_SID` (the blueprint option) or `TWILIO_FROM_NUMBER` in Render's environment settings. The sender must support SMS and the recipient countries must be enabled. Complete Twilio's sender/account setup; trial accounts may restrict recipient numbers. No production mock SMS provider or browser-visible OTP exists.
5. Deploy `main` using `npm ci --omit=dev` and `npm start`. Configure the host health check to `/ready`, which pings MongoDB. `/health` remains HTTP liveness only.
6. Register using SMS, receive and verify an actual code, sign in, and check mobile recovery from a separate logged-out browser. The automated transport tests do not certify carrier delivery.
7. Bootstrap the first administrator by setting `admin: true` on that verified account in MongoDB. Never create a public administrator with the documented demo credentials. Publish learning content through the admin interface.

Existing email-verified accounts can link or replace a mobile at `/auth/mobile`. The old phone remains until the replacement has been verified. SMS-registered accounts use their phone for recovery; an email supplied as a login identifier is not proof of email ownership, so email recovery is disabled for those accounts until email ownership has separately been established. Email OTP remains available for email-verified accounts when Brevo is configured.

SMS codes are generated with cryptographic randomness, protected with a server-keyed digest in MongoDB, expire after 10 minutes, permit five guesses and are consumed atomically. Resends require a 60-second interval. Shared MongoDB counters limit code requests to five per destination per UTC clock hour across purposes; failed delivery attempts count toward that budget. An additional per-connection limit permits ten code requests per 15 minutes. Codes and provider request objects are never logged. MongoDB TTL cleanup is asynchronous; explicit expiry checks enforce validity immediately.

Password recovery returns the same public response for known/unknown mobile numbers and delivery/rate-limit failures. Successful reset revokes all authentication sessions and invalidates other codes. Phone numbers are assigned only after verification, with a unique sparse MongoDB index. The app initializes required indexes before opening its production listener.

Provider references: [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource), [Render Blueprint specification](https://render.com/docs/blueprint-spec), [Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/).

## Required configuration

Use Node.js 24+, a persistent MongoDB database, `MONGO_URL`, independent random `JWT_SECRET` and `SESSION_SECRET`, `NODE_ENV=production`, and the host's `PORT`. HTTPS is required for production authentication cookies. Configure `TRUST_PROXY` only for the actual trusted proxy arrangement.

Run `npm ci --omit=dev`, then `npm start`. A Dockerfile is included for container-based hosts. The Compose file is a local development configuration: it intentionally uses development cookies for HTTP localhost and a named MongoDB volume. Run `docker compose up --build` after configuring the two secrets. Container builds have not been verified unless recorded in the test evidence.

Production flash/session state uses `connect-mongo`; authentication sessions, progress, planner entries, quiz snapshots and audit records also persist in MongoDB. Keep the database reachable only by the application and authenticated administrative clients.

## Optional integrations

### Brevo email verification and password recovery

The deployed application already supports Brevo's transactional HTTPS API. On the free Brevo plan, complete account onboarding, add a sender under Settings > Senders, Domains, IPs > Senders, and verify that sender email. Create a standard API key under Settings > SMTP & API > API Keys & MCP. Use Restricted access with All on Transactional email and None on unrelated resources; this resource requires All permission to send. Do not convert it to an MCP key or use an SMTP password in place of the API key.

In the existing Render service's Environment settings, set `BREVO_API_KEY` to this secret and `GOOGLE_USER` to the exact verified sender email. `GOOGLE_USER` is a legacy variable name for the sender address; it does not require a Gmail password or Google OAuth credentials. Keep all existing database/session variables. Save and deploy so the variables become active. Then verify a real signup and password reset through the application; live delivery remains unverified until the recipient confirms receipt.

Email transport failures log only a safe provider status. Provider request headers, authentication secrets and OTP email bodies must never be written to logs. `tests/email.test.js` verifies accepted requests, safe failures and missing-credential handling with a simulated transport. Together with the existing suite, 31 unit tests and 39 integration tests passed after this change; syntax checks covered 123 JavaScript files and EJS templates.

References: [Brevo sender setup](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email), [API keys](https://help.brevo.com/hc/en-us/articles/40159485019794-Create-and-manage-your-API-keys), [key permissions](https://help.brevo.com/hc/en-us/articles/40158277171474-About-API-key-permissions).

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
