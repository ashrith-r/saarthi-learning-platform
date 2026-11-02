# Saarthi

An exam preparation platform built with Node.js, Express, MongoDB and EJS. Students can browse exams, subjects and chapters, access lectures and study materials, and take quizzes with feedback on weak topics. Administrators manage learning resources, announcements, questions and quizzes. AI question generation is optional.

## Run locally

1. Install Node.js 24 or newer and start MongoDB (or use a development MongoDB database).
2. Run `npm ci`.
3. Copy `.env.example` to `.env` and replace the placeholder secrets. Never commit `.env`.
4. Set `MONGO_URL`, `JWT_SECRET` and `SESSION_SECRET`. Use separate random secrets; `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` generates one.
5. Run `npm run dev` and open http://localhost:3000.

Use `npm start` to run without automatic reload. The server starts only after connecting to MongoDB.

Email registration and password reset require `BREVO_API_KEY` and a Brevo-verified sender in `GOOGLE_USER`. Image uploads require the three Cloudinary variables. AI generation requires `GEMINI_API_KEY`; set `GEMINI_MODEL` to a model available to your account. The supplied model default has not been verified against a live account.

New users are students by default. To bootstrap the first administrator, register and verify your own account, then set only that account's `admin` field to `true` in your development database. Existing administrators can manage other users' roles through the admin dashboard.

## Demo and specification

Run `npm run demo:local` for the isolated seeded demo. Read `DEMO.md`, `SRS.md` and `DEPLOYMENT.md` for credentials, the presentation sequence, requirements and hosting instructions.

## Checks

```sh
npm run check
npm test
npm audit
```

The syntax check compiles JavaScript and EJS templates. Regression tests cover quiz privacy and grading, OTP queries, session revocation, form origins, stale-cookie logout, and local HTTP responses. They stub database methods and do not send emails or upload files. Run `npm run test:integration` for disposable MongoDB-backed student/admin workflows. The first run downloads MongoDB. External provider credentials are needed to verify email, hosted question-image uploads and AI; PDF storage is tested through MongoDB.

## Deployment notes

- Use HTTPS and `NODE_ENV=production` for secure cookies.
- If your host uses a reverse proxy, configure `TRUST_PROXY` for the actual proxy hop count. Do not set it blindly.
- Production sessions now use MongoDB through connect-mongo.
- Authentication has a per-process request limit; use shared per-account limits before a multi-instance public launch.
- Review the unresolved dependency audit findings and the remaining work in `REVIEW.md`.
- Existing OTPs without the new purpose field will be rejected. Request a fresh code after updating.

## Push to your friend's repository later

This source folder has no Git history. Once you have access, clone your friend's repository into a separate folder and create a feature branch. Copy the reviewed source files into that clone, excluding `.env` and `node_modules`. Check the diff, run the checks above, commit, and push the feature branch for a pull request. Preserve the repository's existing history and configuration.

The included GitHub Actions workflow runs syntax checks and regression tests on pushes and pull requests.

## Learning-material management

Open `/admin/materials` as an administrator or content editor. Select a chapter, add a video lesson, PDF/document or web link, and choose whether students can see it. Existing lectures, notes and sheets can also be edited and hidden/published from this page. The older “add content” shortcut leads to the same manager.

PDF uploads are limited to 15 MB and stored in MongoDB GridFS, so a separate file-hosting account or local writable upload folder is not required. Published PDFs require a signed-in user; staff can preview unpublished PDFs. Existing PDFs can be replaced or detached. Back up the GridFS collections along with application data.

Videos support YouTube watch/share/shorts links, Vimeo and direct MP4/WebM links. Unsupported providers remain usable as external links. Provider availability, embedding permissions and HTTPS delivery remain controlled by the provider.

Students read the same database records. A five-second content-version check refreshes learning content or offers an update notice when current work should be protected. No build or deployment is needed after publishing. Personal notes live outside the refreshed learning-content region. The site name is editable at `/admin/site-settings`. Page titles and instructions describe their function; promotional taglines are not rendered.

Demo fixture scripts remain opt-in and their records are editable. Interface labels, validation rules and scoring logic are application behavior; educational records and the site name are managed as content.

## Consistency and reliability pass — 3 November 2026

All administrator editors now use the same dark workspace. The shared observatory has a stable star layer, blue illumination and a procedural planet; spark fireworks and quote management are removed. Script-free workspace navigation retains the scene, with native navigation for complex editors, lessons and test runs. The weekly planner is a chronological agenda using the browser timezone.

The material manager edits both legacy and new resources. Set display order, save a hidden draft and open Student preview before publishing, search/filter the student library, and archive/restore resources without deleting their history. Archived resources stay hidden from students, including their PDF URLs. Publication changes are visible immediately on new requests; open pages check revision every five seconds and protect current work.

See WORKFLOW-AUDIT.md and verification/workflow-results.json for actual verification and limitations. Core tests use temporary databases; production-mode restart persistence was verified locally. Live providers, external media playback, Docker and public hosting remain environment-specific release gates.
