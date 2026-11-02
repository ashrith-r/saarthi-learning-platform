# Saarthi demo guide

## Fast local demo

Run `npm ci`, then `npm run demo:local`. The first run downloads a temporary MongoDB server and can take several minutes. It requires internet access for that initial download. Open http://localhost:3000/auth/login.

| Role | Email | Password |
|---|---|---|
| Student | learner@saarthi.demo | SaarthiDemo!2026 |
| Administrator | admin@saarthi.demo | SaarthiDemo!2026 |

These are public demonstration credentials. The local demo uses an isolated disposable database, random authentication secrets, and preverified fixture accounts. Stop and restart it to reset the demonstration. Data is discarded when it stops. Never seed these accounts into a public or production database.

For a persistent **development** database, configure `.env`, set `ALLOW_DEMO_SEED=yes`, and run `npm run demo:seed`. This seed is additive and does not erase existing records. Use a separate database. If the student account already exists, seeding skips the fixture set.

## Eight-minute presentation

1. **Overview, 60 seconds.** Sign in as the student. Explain the exam countdown, weekly goal, completed chapters, saved resources, recommendation and agenda. Explain that the initial history is seeded demonstration data.
2. **Learn, 60 seconds.** Open the library, search for a chapter, enter its learning workspace, edit personal notes, bookmark it and mark it complete. Return to see the dashboard update.
3. **Plan, 45 seconds.** Create a study session, reschedule it and mark it complete. Explain that milestones derive from recorded activity.
4. **Practice, 90 seconds.** Start a published test. Answer, mark for review, clear and reselect. Wait for saved status, refresh, then submit. Show the correct answer and explanation. Choose the six-question mixed-subject Foundation sprint to show navigation; individual chapter checks contain one question for short demonstrations.
5. **Improve, 60 seconds.** Open performance, review a mistake, follow its chapter link, then start targeted revision.
6. **Publish, 90 seconds.** Sign out and sign in as administrator. Open the publishing desk. Preview the draft, mark it reviewed, then publish. Show version history and audit events. Preview a CSV before importing it.
7. **Close, 45 seconds.** Explain ownership protection, question snapshots, server deadlines, persistent production sessions and automated verification. Show the SRS traceability matrix.

## Rehearsal checks

- Download the temporary database before the presentation.
- Verify the classroom internet permits Bootstrap, icons and embedded video. Manrope is self-hosted. The illustrative video is labeled as a demo resource and is not a chapter-specific authored lesson.
- Start at a desktop width, then demonstrate the responsive layout at a narrow width.
- Use a separate browser profile for each role if both need to stay signed in.
- Test email, Cloudinary and Gemini separately if they will be shown. These optional integrations need real credentials; the core seeded journey does not.
- Run `npm run check`, `npm test`, and `npm run test:integration` before presenting.

## New content and theme demonstration

As administrator, open /admin/materials and select a chapter. Add a video URL, upload a PDF or save a resource link. Keep Publish to students checked, then open the linked student chapter. Edit the title or visibility and demonstrate the changed student view. Use /admin/site-settings to update the site name without changing code. Existing lectures/notes/sheets also support hide/publish from the material manager.

The current interface uses a black observatory scene, overhead blue illumination, a prominent dimensional planet, a stable star field and orange task actions. Navigate between the dashboard, library, tests and planner to see the planet camera rotate to each page's view. Reduced-motion mode displays a static scene. Page titles and descriptions name the function without motivational taglines. Demo records remain illustrative fixtures and can be edited through admin controls.

## Repaired demo sequence

1. Student: open library, search/filter a resource, save chapter notes/bookmark/completion and verify them after refresh.
2. Student: open planner, edit a task title/date/completion and inspect the local-timezone agenda on desktop and phone.
3. Student: start the mixed mock, choose/clear an answer, mark review, move next/previous, refresh and submit using inline confirmation. One correct and five skipped gives 4/24 and 17% accuracy in the fixture.
4. Administrator: open the shared Administration page, inspect drafts/incomplete chapters/activity, and follow curriculum editing links.
5. Administrator: select a material chapter, set order, save a hidden resource, use Student preview, then publish. Archive and restore it; show that student visibility follows its state.
6. Administrator: assemble a quiz using exam/subject/chapter selectors and questions, then review and publish through the publishing desk.
7. Toggle reduced scene motion. Navigate between script-free pages and use browser Back; the scene persists. Complex editors and test runs use native navigation.

Keep this walkthrough in the disposable demo. Restart without DEMO_RESTORE_FILE to restore fresh fixture data. The recorded verification is WORKFLOW-AUDIT.md; actual provider delivery/playback must be rehearsed separately before presenting those integrations.
