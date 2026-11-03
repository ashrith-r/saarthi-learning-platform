# Verification record — 3 November 2026

This record distinguishes browser exercises, database-backed HTTP checks, source inspection and unavailable external verification. A passing route response alone is not recorded as a working workflow.

## Environment and preservation

`npm run demo:local` starts a new `mongodb-memory-server` database, random authentication/session secrets and opt-in synthetic fixture accounts. Integration suites use separate temporary databases and close them after testing. No production database or user-created content was used. Browser-created resources, drafts and notes were reset by restarting the disposable demo. A final browser mock attempt was completed for the submission check and the disposable demo was reset again afterward; the running demo is back to its original fixtures. Historical quote records and replaced PDF binary data were preserved.

`DEMO_RESTORE_FILE` can restore a private EJSON snapshot when intentionally supplied. A normal restart without that variable resets the demo. This reset behavior is separate from production persistence, which was tested against the same database across two production-mode application processes.

## Automated evidence

The final database suite passes 32 reported tests: 30 workflow cases, one production restart case and the enclosing workflow test. The unit/HTTP suite passes 28 tests. Syntax checks pass for 115 JavaScript files and EJS templates. The internal-link crawl verifies the destinations discovered in rendered admin/student pages, following redirects and rejecting error responses. Reproduce with `npm run check`, `npm test`, `npm run test:integration` and `node scripts/inventory.js`.

The current generated source inventory finds 84 route declarations, 48 templates, 105 links, 43 forms and 287 controls. These counts describe source elements, not a claim that every control was clicked. Generated inventories and link results are in `verification/`. Actual workflow results follow.

| Area / role | Action and expected result | Observed result / method |
|---|---|---|
| Public | Home, updates, login, register tab, password-recovery form and health load | Pass, HTTP checks; browser login exercised |
| Accounts | Wrong password and short registration password rejected | Pass, HTTP; no account created |
| Email verification | Wrong OTP leaves account unverified; correct purpose-bound OTP verifies once | Pass, real DB fixture and controller; delivery not tested |
| Password reset | Valid OTP changes fixture password and revokes old authentication | Pass, real DB fixture and controller; delivery not tested |
| Session access | Logged-out/revoked sessions cannot enter protected pages | Pass, unit and DB checks |
| Isolation | A second account cannot read attempts or update another account's planner task | Pass, DB checks |
| Admin shell | Editors and curriculum forms render one dark workspace | Pass, 15 editor destinations checked by HTTP; admin and quiz builder inspected in browser |
| Curriculum | Create/edit exam, subject and chapter; relationships persist and student page changes | Pass, DB checks including invalid and missing records |
| Dynamic categories and course types | Add a new announcement category and curriculum course type; subsequent admin forms suggest saved values and public filters/pages render saved records | Pass, DB checks |
| Materials | Create, edit, publish and hide a resource; student page reflects visibility | Pass, DB checks; browser created a link and found it through student search |
| Legacy materials | Existing lecture opens in the unified manager, saves order/title and retains metadata | Pass, DB checks |
| Ordering | Lower positions precede higher positions within video/document groups | Pass, DB assertions on rendered student order |
| Preview | Staff can preview hidden materials; student query cannot reveal them | Pass, DB checks |
| Archive | Archive removes material from student pages; restore retains previous visibility | Pass, DB; browser archive/restore and notices exercised |
| PDF | Upload/read/replace and archive access; obsolete file URL no longer serves replaced file | Pass, multipart/GridFS/HTTP checks; PDF viewer interaction not tested |
| Upload errors | Invalid signature, oversized PDF and unsupported question-image MIME rejected | Pass, HTTP checks |
| Resource search | Search plus kind filter finds published resource and excludes other kinds | Pass, DB and browser |
| Notes/bookmarks/completion | Save, refresh and sign in again; saved values remain | Pass, DB and browser |
| Goals | Goal validation and derived metrics | Pass, source/unit coverage; goal form browser save not separately exercised |
| Planner | Create/edit/reschedule/complete; impossible dates rejected and long titles retained | Pass, DB checks; responsive agenda inspected in browser |
| Timezones | Local calendar uses valid browser timezone and invalid setting falls back to UTC | Pass, Asia/Kolkata, Pacific/Kiritimati and America/Los_Angeles DB checks; browser showed Asia/Calcutta |
| Questions | Create text question, edit text/options and assemble a draft quiz | Pass, DB; quiz selection/creation exercised in browser |
| Images | Reject unsupported images; missing provider has an explicit unavailable response | Pass for rejection/configuration behavior; actual Cloudinary transfer unverified |
| CSV | Preview validates rows before import | Pass, real DB preview, confirmed import and invalid-row rejection; browser file chooser not separately exercised |
| Publishing | Draft → reviewed → published; draft cannot start and editor cannot publish | Pass, DB checks |
| Test start | Six simultaneous starts resolve to one active attempt | Pass, DB concurrency check with unique active key |
| Test controls | Select, clear, flag, next/previous, autosave and refresh recovery | Pass, browser and DB checks |
| Submission | Inline keep-working/submit controls; one correct and five skipped | Pass, browser result 4/24, 17% accuracy; repeat submit safe in DB |
| Expiry | Saves after deadline rejected; worker finalizes abandoned attempt | Pass, DB checks |
| Stale attempt | Already-finalized save response opens results | Implemented after browser exposed stale-tab conflict; server idempotency checked; final browser normal submit passed |
| Results/revision | Correct scoring, solutions, private targeted revision and ownership | Pass, unit/DB; result and solutions inspected in browser |
| Legacy results | Prior attempts remain linked; detailed analysis scope explicitly identified | Rendered/HTTP checked; detailed historical question data remain in legacy result flow |
| Announcements/settings | Saved notice appears publicly; name changes without promotional headlines | Pass, DB checks |
| Roles/audit | Editor restrictions and administrator role controls; material archive/restore events recorded | Pass for editor restrictions and material audits; browser did not promote a user |
| Navigation | Same scene instance through admin/material changes; browser Back restores page | Pass, browser DOM instance matched before/after navigation |
| Keyboard | First Tab reaches Skip to content; visible controls remain keyboard reachable | Skip link exercised; complete screen-reader session not performed |
| Motion | App reduced-motion toggle makes static scene and persists setting | Pass, browser; OS reduced-motion media query inspected in code, OS setting not changed |
| Responsive | Desktop 1280, phone 390 and tablet 820; no page-level horizontal overflow in inspected screens | Pass, browser captures and DOM check; all device/browser combinations not tested |
| Restart | Production secure cookies, auth and notes survive app process restart | Pass, separate production processes with test-only secrets and temporary DB; trusted local proxy header used, public HTTPS not tested |

## Defects corrected

- Replaced white legacy Administration surfaces and its separate layout.
- Removed fireworks, duplicate recent-chapter section, quote management routes and irrelevant entity-count chart.
- Protected task surfaces from the planet and replaced narrow phone calendar columns with an agenda.
- Added persistent scene navigation for script-free workspace pages, query forms, abortable requests, history handling and unsaved-change controls. Complex editors, lessons and assessment runs use native navigation.
- Unified legacy/current material forms; added ordering, staff preview, search/filter, archive/restore and saving feedback.
- Fixed duplicate concurrent test starts, inline confirmation, stale-attempt recovery, task title editing, timezone boundaries, missing curriculum validation, accessible public-nav label and misleading empty search feedback.

## Explicitly unverified / release gates

No live Brevo, Cloudinary or Gemini credentials were configured. OTP generation/consumption and missing-provider handling are tested, but real email delivery, hosted image transfer and generated-question quality are not. The browser did not establish external YouTube/Vimeo/direct-video playback; URL normalization and embedding logic are tested. Do not advertise these as verified integrations.

Docker is unavailable on this machine, so image build and Compose were not run. Public hosting, real TLS/proxy configuration, database backup restore, load testing, Windows high-contrast mode, complete screen-reader testing and browser network throttling/offline emulation were not performed. The internal leave/stay guard was also exercised with an edited planner title: Keep editing retained the draft and the original fixture title was restored and saved. Error handling and unsaved-work guards were inspected and exercised in the cases listed above; this is not a substitute for network fault injection.

The dependency advisory request failed both DNS and network access attempts; no current vulnerability total is asserted. Prior advisory counts are historical. The Impeccable engine/detector could not initialize its cache; visual review uses captures and a fresh independent reviewer. Full browser video recording is not available through the current browser controls; this document is the recorded walkthrough, accompanied by viewport captures.
