---
name: Saarthi Observatory
description: Visual system for the Saarthi learning workspace and administration screens.
colors:
  canvas: "#03060b"
  surface: "#0b111c"
  sidebar: "rgba(7,12,20,.86)"
  ink: "#edf3fc"
  secondary: "#a7b3c5"
  blue: "#73adff"
  link: "#92bdff"
  action: "#ec9657"
  action-hover: "#ffb47e"
  on-action: "#16110e"
  border: "#ffffff1c"
  surface-border: "#ffffff18"
  field: "#060b13"
  field-ink: "#e6f0ff"
  field-border: "#ffffff25"
  legacy-field-border: "#ffffff30"
  legacy-surface-border: "#ffffff20"
  focus: "#f7a064"
  field-focus: "#82b4ff"
  selected: "#ffffff0c"
  selected-ink: "#e1edff"
  secondary-action: "#ffffff07"
  secondary-action-ink: "#e0eafa"
  secondary-action-border: "#ffffff30"
  secondary-action-hover: "#ffffff12"
  disabled: "#283548"
  disabled-ink: "#9eacc0"
typography:
  display:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "clamp(30px,3.2vw,42px)"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  public-display:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "clamp(38px,5.3vw,68px)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "clamp(30px,3.2vw,42px)"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    letterSpacing: "-0.5px"
  body:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  study-body:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  field:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
    fontSize: "16px"
rounded:
  control: "8px"
  surface: "14px"
  action: "10px"
  public-nav: "16px"
  badge: "6px"
spacing:
  compact: "12px"
  field-gap: "14px"
  pair-gap: "16px"
  grid-gap: "20px"
  standard: "24px"
  mobile-card: "20px"
  material-gap: "28px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.action}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.on-action}"
  button-secondary:
    backgroundColor: "{colors.secondary-action}"
    textColor: "{colors.secondary-action-ink}"
    rounded: "{rounded.action}"
    padding: "12px 18px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.field-ink}"
    rounded: "{rounded.control}"
    typography: "{typography.field}"
    padding: "12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
  navigation-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.selected-ink}"
    rounded: "{rounded.control}"
    padding: "12px"
---

# Design System: Saarthi Observatory

## Overview

**Creative North Star: "The Learning Observatory"**

A practical learning workspace sits inside a quiet observatory. Near-black space, stable layered stars, blue overhead illumination and a shaded procedural planet establish the scene. Opaque working panels protect curriculum, assessments and administration; orange identifies useful actions.

Atmosphere lives in geometry, lighting and motion. Words describe the actual page, feature or next step: functional titles and necessary instructions, with no promotional or motivational taglines. The user-pinned Resq.io screenshots and Laststack reference establish the visual direction; they are not generated assets or an approved raster composition.

**Key Characteristics:**
- Near-black space with stable stars, blue overhead light and a dimensional side planet.
- Opaque working surfaces, cool readable text and orange primary actions.
- Persistent scene continuity on supported workspace pages, with native navigation elsewhere.
- Functional copy, responsive controls and static reduced-motion scenes.

Extracted from the actual cascade in views/layouts/boilerplate.ejs: Bootstrap, public/css/style.css, studio.css, design-system.css, cosmos.css, observatory.css, then **workspace.css last**. The last stylesheet governs operational surfaces, header spacing, planet size and the planner agenda. The frontmatter owns portable tokens; .impeccable/design.json extends them with motion, breakpoints and eight component previews.

The scene uses code-native WebGL/Canvas plus the deterministic static star asset public/images/stars.svg. observatory.js and planet-state.js own scene/camera behavior; workspace.js owns supported navigation; form-state.js supplies unsaved/saving feedback; cosmos.js handles uploads, navigation reveal and safe content refresh. No generated comp, seed key or raster texture exists. Engine context/detector tooling could not initialize its binary/cache; no detector success is claimed.

Release evidence is the nine authoritative JPEG viewport captures in .impeccable/review/repair: admin desktop/mobile/tablet, student desktop/mobile, planner desktop/mobile and quiz desktop/mobile. Their actual sizes are (1265 × 889), (375 × 812) and tablet (805 × 960), differing from the requested overrides in the brief. The independent ship disposition covers the scored planner fix and visible batch regressions; it is not a full production or every-screen certification.

## Colors

Warm orange identifies primary actions; blue supports orientation and illumination. Opaque blue-black task surfaces sit over Space Black; only peripheral navigation and decorative layers retain translucency.

### Primary
- **Action Orange:** primary actions and warm accents. Hover lightens the button; action text remains dark. No sparks or particle emission.

### Secondary
- **Atmospheric Blue:** planet rim, overhead light, wayfinding, links and chapter geometry. Field focus uses a lighter blue outline.

### Neutral
- **Space Black:** shared canvas behind the scene and application.
- **Workspace Surface:** opaque working cards, feature panels and administrator forms with low-opacity white borders. The desktop sidebar remains translucent.
- **Cool White and Blue Grey:** primary and secondary text.
- **Inset Black:** inputs and selectors, distinguished by brighter translucent borders.

**The Task Accent Rule.** Orange marks primary actions; blue supports orientation and light. Historical aliases such as --purple resolve to blue and do not authorize purple accents.

Browser surfaces remain dark: cool scrollbars, blue selection with white text, an orange caret and visible orange keyboard focus. Workspace fields use the final blue focus outline; generic Bootstrap fields retain their earlier blue focus treatment where no workspace selector applies.

## Typography

**Display and Body Font:** self-hosted Manrope, with Inter, system-ui and sans-serif fallbacks. The variable font at /fonts/manrope.ttf covers weights (200–800), uses font-display: swap and retains its OFL license.

Workspace titles, including Dashboard, share the headline size and weight. Public pages use the larger public-display role. Standard card titles use the lighter title role; feature-card headings use (25px) and weight (500). Body copy uses (15px); study paragraphs and form labels use (14px), while shared workspace text fields use the field role to avoid phone focus zoom. Legacy administrator headings use (32px), (24px) and (20px) for the first three levels. Workspace buttons use (12px); authentication buttons retain their page-specific (13px). Metrics use tabular numerals.

Workspace titles become (32px) at 1100px and below, (29px) at 767px, then (28px) at 479px. Public titles become (40px), then (36px), at the latter two breakpoints. Introductory copy is capped at (57ch) and stays (14px), including phones. Authentication story titles use (40px) on desktop and (30px) on phones. Use balanced wrapping and restrained negative tracking.

**The Functional Copy Rule.** Titles name a destination or task. Supporting copy explains features, status or instructions. Add no promotional taglines, motivational slogans or fabricated claims.

## Layout

The workspace caps at (1600px), with a (244px) left rail and content padding of (284px) left and (40px) right. At 1199px the rail narrows to (216px) and left padding becomes (244px). The final stylesheet keeps the right gutter at (40px), then (28px) below 959px and (18px) below 767px; it overrides the earlier wide-screen planet reserve.

The planet canvas is (360px), positioned (70px) from the top and (-90px) from the right. Heading bands use a (250px) right reserve, (250px) minimum height and vertically stacked actions. Below 959px, the canvas becomes (320px) at top (160px), right (-115px), and headings reserve (220px). Below 767px, it becomes (270px) at top (210px), right (-165px), with reduced opacity; headings reserve (85px) and at least (230px) height. Earlier 470–490px planet rules are overridden. Keep task names and actions clear of the decorative area.

At 959px navigation becomes a horizontally scrollable strip with a thin scrollbar and swipe hint. The selected link scrolls into view after fonts settle and on resize. Account/logout stays reachable. At 767px workspace side padding is (18px), search hides and heading actions wrap beneath copy.

Material management uses two columns with a (28px) gap and stacks at 1100px. Paired fields use (16px) gaps and stack at 767px, alongside learning and authentication panels. Metrics move from four columns to two. Chapter cards move from three columns to two below 1200px and to one at 479px. Recent-chapter geometry becomes a two-column grid at 600px. Cards use (24px) padding on desktop and (20px) on phones, with (24px) lower separation; forms keep a (14px) field rhythm.

The next-seven-days planner is a chronological vertical agenda at every viewport. Each day is a two-column row: weekday/date on the left, wrapped tasks on the right. The date column narrows from (80px) to (70px) on phones. Do not restore the seven-column desktop calendar; it caused dense task text to collide.

Public navigation is a floating glass bar capped at (1320px) with responsive gutters. Public hero content aligns left beside the shared side planet. Keep administration compact and task-focused; preserve native forms and disclosures.

## Elevation & Depth

Depth comes from blue overhead light, tonal layering and the planet's terrain shading. Opaque working cards have no ambient shadow; thin translucent borders separate layers. Public navigation adds a (16px) backdrop blur. The planet combines procedural terrain, clouds, directional shading, a blue atmospheric rim and subtle night-side heat. No scene layer intercepts pointers or overlays form text.

Primary-button hover uses 0 5px 20px -9px #ff943b85; the content-update notice uses 0 12px 36px #0008. Chapter cards retain a slight hover lift and brighter border; reduced motion removes transforms.

**The Native Continuity Rule.** Navigation and form submission work independently of animation. Keep the scene mounted during supported workspace navigation; interpolate from the current pose to the next section pose plus URL variation over (1200ms), taking the shortest yaw path. Complex editors, lessons and tests use native navigation. Root view-transition animations are disabled.

The planet shader caps at (512px) per side and device pixel ratio at (1.5), with preserveDrawingBuffer enabled. Drawing intervals are (50ms) on desktop and (80ms) on phones. Canvas stars are deterministically seeded and capped at (230), layered over the static SVG star field; positions remain stable at a fixed viewport, with subtle alpha variation only. Sparks are removed. Pause while hidden and keep lessons/test runs quiet. The saved motion toggle or OS reduced-motion preference renders a static target pose; the OS preference takes precedence. Missing WebGL or context loss produces a CSS dark circular silhouette with a blue rim glow, using the same responsive dimensions and positions as the shader canvas.

## Shapes

Fields and selected navigation use the control radius; actions use the action radius, working panels the surface radius, and floating public navigation the public-nav radius. Thin translucent strokes establish boundaries. Milestone chips keep compact badge corners. The circular planet and crisp four-point chapter stars contrast with rectangular task surfaces; they are native geometry rather than emoji glyphs.

## Components

**Buttons:** warm primary fill, dark text, thin warm border and minimum (44px) height. Hover brightens the fill and adds a small orange glow. Secondary actions use translucent fill, pale cool text and a visible stroke; hover strengthens the fill and cool border. Preserve orange keyboard focus and muted disabled states.

**Inputs:** visible labels, inset dark fields, the field typography role, (12px) padding and a minimum (44px) height, except checkboxes/radios. Workspace focus uses a (2px) blue outline offset by (2px); generic keyboard focus uses an orange outline offset by (4px). Legacy administrator fields have a slightly stronger border. Retain readable placeholders and native file/select affordances.

**Cards and metrics:** opaque working panels with the surface radius, thin white border and no ambient shadow. Legacy administrator cards, tables, modals and forms use the shared dark workspace. Metrics form a divided strip with genuine values. Milestone chips retain muted olive semantic status treatment; this is not a third brand accent.

**Navigation:** icons support text labels. Selection uses a translucent white wash, cool text, a thin stroke and a desktop orange dot. Active links use aria-current. On small screens preserve the selected surface, horizontal scrolling, selected-link reveal and overflow cue.

**Recent chapters:** up to four genuine saved chapter links pair native (24px) SVG stars with chapter names and status. Blue and warm orange alternate. Hover/focus enlarge and rotate stars; reduced motion removes the transform. Use clear empty guidance when no progress is saved.

**Material manager and publishing:** labeled chapter selection, video/document/website kind, URL or PDF upload and explicit visibility. Choosing a PDF selects document kind. Uploads announce progress and recover from failure. PDF size is limited to (15 MB). Native disclosures expose editable records; ordering, private student preview, recoverable archive/restore, search and filtering remain explicit actions. Publishing controls describe visibility and required steps directly.

**Content update notice and form state:** a fixed actionable status surface with a raised cool fill and orange refresh button, stacking inside mobile gutters. Every five seconds, visible non-admin pages check revisions. Preserve safe-refresh boundaries around embedded media, dirty input and assessment runs. Shared forms announce unsaved/saving state. Supported links, GET query forms and history navigation use an inline “Leave without saving” / “Keep editing” guard; canceling a query clears its submitting flag. Native unload retains the browser guard. Failed revision checks retain existing content. This is navigation protection, not a claim of autosave or universal network-failure recovery.

**Observatory scene:** decorative WebGL/Canvas elements are aria-hidden and never intercept pointers. Persistent navigation covers script-free dashboard, library, planner, practice catalog, insights, admin overview, materials, publishing and site settings, including GET query forms and history. Other routes retain native navigation; incompatible fetched pages fall back to it. Keep the renderer in code; a component preview must not pretend to reproduce the full scene.

## Do's and Don'ts

### Do:
- **Do** use the complete CSS cascade, with workspace.css last, when extending the system.
- **Do** preserve stable stars, blue overhead light, a shaded planet and opaque readable task surfaces.
- **Do** write functional titles, features, status messages and necessary instructions.
- **Do** retain native navigation, keyboard focus, reduced motion and the no-WebGL fallback.
- **Do** use genuine chapters, recorded progress and useful empty states.
- **Do** preserve upload feedback and safe refresh around student work and playback.
- **Do** keep the planner agenda chronological and readable at every viewport.

### Don't:
- **Don't** restore the former light or purple identity or add emojis.
- **Don't** add promotional taglines, motivational slogans or fabricated claims.
- **Don't** let atmosphere obscure form labels, primary actions or navigation.
- **Don't** restore sparks, fireworks or motivational decoration.
- **Don't** delay navigation or submission to finish animation.
- **Don't** invent a generated comp, seed key, texture asset or completed design-engine verification.
