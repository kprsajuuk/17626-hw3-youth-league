# Research: Game Change Notice

Phase 0 output for [plan.md](plan.md). Each item resolves a Technical Context unknown.

## R-1 Application stack

- **Decision**: A static single-page app in plain HTML, CSS and JavaScript (ES modules), with no
  framework, no build step and no third-party runtime dependencies.
- **Rationale**: Constitution VIII asks for the simplest front-end app with in-memory state.
  The team machine has no Node.js, and a no-build app runs with only a browser and a static file
  server (`python3 -m http.server`, available on macOS). About 6 screens and a small state model do
  not need a framework. No CDN means no external service at runtime (Constitution VI).
- **Alternatives considered**: React/Vite (needs Node and a build; more setup than the feature
  needs). Preact + htm from a CDN (adds a network dependency and a library the team must learn).
  A Python backend (rejected by Constitution VIII; the spec needs no server-side behavior).

## R-2 State and persistence

- **Decision**: One in-memory store, seeded from a mock-data module on page load. State changes go
  through domain functions; views re-render from the store after each change. Reloading the page
  or pressing "Reset demo" restores the seed.
- **Rationale**: The spec needs no persistence, and a reset makes each evaluation session start
  from the same known state. Mock data only (Constitution VI).
- **Alternatives considered**: `localStorage` persistence (state survives reloads, which makes
  demos harder to repeat and is not required).

## R-3 Simulated clock and escalation timing

- **Decision**: A demo clock owned by the store. It starts at a fixed demo time (Saturday
  08:30), runs at real speed, and has controls to advance by +1 min and +5 min (REQ-19). Pending
  escalations (text at +5 min, urgent call at +2 min) are stored as scheduled actions with a due
  time and are evaluated every time the clock changes. All log timestamps use the demo clock.
- **Rationale**: A fixed start time makes the urgent scenario (kickoff 10:00, 90 min away)
  repeatable. Scheduled actions that are re-evaluated on each tick make "time passes" behavior
  testable with a fake clock in unit tests and visible in the demo.
- **Alternatives considered**: `setTimeout` per escalation (cannot be fast-forwarded and is hard to
  test). A clock that only moves by button (an evaluator could not show "dispatched within
  1 minute" naturally).

## R-4 Dispatch timing (REQ-16)

- **Decision**: In-app and email deliveries (and the urgent text) are created synchronously in the
  same operation as the publish and carry the publish timestamp.
- **Rationale**: This meets "within 1 minute" by construction and is checkable in the delivery
  log (SC-005).
- **Alternatives considered**: An artificial queue delay (adds nothing to the evaluation).

## R-5 Recipient resolution and privacy (REQ-07, REQ-08, REQ-17, REQ-18)

- **Decision**: One pure function computes recipients for a game and audience (final: all league
  teams in the game; heads-up: the sending coach's team). For each parent it keeps only children
  on the affected teams that the parent is not restricted for; a parent left with no eligible
  child is dropped. One recipient entry per parent names all their eligible children. Coaches of
  the audience teams are added. Child names are formatted by one display helper (first name +
  last initial) used by every view.
- **Rationale**: One path for both notices and heads-ups (the OQ-3 decision) means the privacy
  rule is enforced in exactly one place and tested once. Formatting in one helper makes REQ-18
  hard to bypass.
- **Alternatives considered**: Filtering at render time (a restricted parent could still be in
  the data sent to a view or log).

## R-6 Append-only logs (REQ-06)

- **Decision**: Activity log and delivery log are arrays that domain code only appends to; each
  entry is frozen (`Object.freeze`) and no UI offers edit or delete. Delivery status is stored on
  the delivery record at creation (simulation is instant), so no later mutation is needed.
- **Rationale**: Meets "users cannot edit the log" with no extra machinery.
- **Alternatives considered**: Hash-chained log (security theatre for a mock prototype).

## R-7 Testing

- **Decision**: Domain modules are pure and independent of the DOM. A browser test page
  (`app/tests/index.html`) runs `*.test.js` files with a ~40-line assertion helper and shows
  pass/fail. Each test is named after the REQ and scenario it checks. UI behavior is checked
  manually against the scenarios in [quickstart.md](quickstart.md).
- **Rationale**: No Node or test framework is needed; tests run in the same browser and server as
  the app. Constitution IV requires scenarios a person can check in the prototype; the
  quickstart covers that, and unit tests guard the privacy and escalation rules.
- **Alternatives considered**: `node --test` (Node not installed; the files stay compatible if a
  teammate wants to run them under Node later). Playwright end-to-end tests (setup cost too high
  for the sprint).

## R-8 Persona switching and permissions (REQ-02, REQ-05, REQ-19)

- **Decision**: A persona bar lists Brenda (administrator), the coaches, and the seeded parents.
  Each view asks one `can(persona, action, target)` function before showing a control, and each
  domain command checks the same function again and rejects the call if it fails.
- **Rationale**: The spec requires that attempts are rejected, not just hidden. Checking in the
  domain layer makes that testable without the UI.
- **Alternatives considered**: Hiding controls only (would not satisfy "the system rejects such
  attempts").

## R-9 Seed data design

- **Decision**: Fictional league with four teams (U10 Blue, U10 Red, U12 Red, U12 Gold) and
  fixtures chosen so every scenario in the spec can be shown without editing data:
  - U10 Blue has 10 families (for "8 of 10 confirmed receipt").
  - Family B: parent X restricted for only child B1; parent Y unrestricted.
  - Family E: parent W restricted for E1, but not for E2 (both on U10 Blue).
  - Family D: two children on U10 Blue (one notice naming both).
  - Mike: one child on U10 Blue, one on U12 Red.
  - One family with no email and one with no phone (failed channels).
  - Game U10 Blue vs U10 Red today at 10:00 on Field 3 (urgent at the 08:30 demo start); game
    U12 Red vs U12 Gold tomorrow at 10:00 (non-urgent); a past game today at 07:00 (no changes
    allowed).
- **Rationale**: Scenarios become click-through checks, which supports SC-001…SC-007.
- **Alternatives considered**: An editor for mock data (out of scope, G-18).
