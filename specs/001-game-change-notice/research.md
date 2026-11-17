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
  the delivery record at creation, so no later mutation is needed. *(V2)* A status change
  ("sent" → "delivered") is a **new** record, never an update (see R-14).
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
  - Family E: parent Wes restricted for Eli, but not for Emma (both on U10 Blue); parent Erin
    unrestricted. *(V2)* This is the CR-8 per-child scenario (US6 #8).
  - Family D: two children on U10 Blue (one notice naming both).
  - Mike: one child on U10 Blue, one on U12 Red.
  - One family with no email and one with no phone (failed channels).
  - Game U10 Blue vs U10 Red today at 10:00 on Field 3 (urgent at the 08:30 demo start); game
    U12 Red vs U12 Gold tomorrow at 10:00 (non-urgent); a past game today at 07:00 (no changes
    allowed; *(V2)* shows the "Started" tag, and Mike's U12 Red child plays in it).
- **Rationale**: Scenarios become click-through checks, which supports SC-001…SC-007.
- **Alternatives considered**: An editor for mock data (out of scope, G-18).
- *(V2)* **One seed addition.** The seed has no family with two *unrestricted* parents, so
  US6 #6 (two parents Y and Z, one confirms; the CR-8 regression check) could only be tested in
  unit tests, not in the UI as Constitution IV requires. V2 adds a second parent, **Olga Ortiz**
  (email and phone on file, no restriction), to Family O (U12 Red). It is a U12 family because
  that scenario is non-urgent ("kickoff tomorrow"), and only the U12 game is tomorrow. U10 Blue is
  untouched, so "8 of 10 confirmed receipt" still works; U12 recipients and delivery records grow
  by one person.
- *(V2)* The started-game-with-unconfirmed-alert scenario (US5 #4) needs no fixture: publish a
  time move to a few minutes ahead and advance the clock (R-13). No extra clock control is added.

---

## V2 research (2026-11-17)

Each item resolves a design choice raised by the V2 spec (CR-1…CR-9). The spec's
Clarifications (2026-11-17) settled the behavior; these items settle how to build it.

## R-10 One "moved" change type (CR-5, REQ-03)

- **Decision**: `changeType` is `cancelled` or `moved`. A move carries `new.field` and/or
  `new.kickoff`, holding only the details that actually change; at least one must differ from
  the current details, and a new kickoff must be in the future. The label depends on what
  changed:
  - field only: `FINAL – Moved: Field 3 → Field 7` (V1 wording, US1 #5)
  - time only: `FINAL – Time changed: Sun 10:00 → Sun 13:00` (V1 wording, US1 #6)
  - both: `FINAL – Moved: Field 3, 10:00 → Field 7, 13:00` (US1 #11). Times show `HH:MM` when
    the new kickoff is on the same day as the old one, and `Ddd HH:MM` otherwise.
  The publish form has "Cancelled" and "Moved"; "Moved" shows both a new-field and a
  new-kickoff input, each optional, pre-filled with the current values.
- **Rationale**: One notice per real change removes the duplicate notices and restarted
  escalation timers seen in OBS-7 (G-85), while keeping the V1 labels that existing scenarios
  check. Storing only changed details keeps `currentDetails()` unchanged.
- **Alternatives considered**: Keep `field` / `time` and add `field+time` (three move types for
  one concept; the form grows). Always store both new values (labels could no longer tell what
  changed without comparing).

## R-11 Cancellation is final; validation rules traced (CR-2, CR-4, REQ-01, REQ-03)

- **Decision**: A helper `isCancelled(store, game)` (current notice is a cancellation). `can(…,
  'publish', gameId)` returns false for a cancelled game, so the admin view shows no publish form
  and instead shows "This game is cancelled. A cancellation is final." `publishChange` rejects
  with the new error `game-cancelled` (checked after `not-authorized`, before validation of the
  input). The V1 rules for verification time (`verification-in-future`) and for unchanged or
  past details (`invalid-change`) stay as they are; only their trace changes (REQ-01, REQ-03).
- **Rationale**: Option B (spec Conflict Decisions, CR-2). Checking in both `can()` and the
  command keeps the R-8 pattern: hidden control and rejected call. A move followed by a
  cancellation (walkthrough H) still works because only the *current* status is checked.
- **Alternatives considered**: Reject only "cancel after cancel" (V1 behavior, OBS-2). A
  "Reinstated" change type (option A, rejected in the spec).

## R-12 Heads-up only while the change is pending (CR-1, REQ-05, D-6)

- **Decision**: `can(…, 'heads-up', gameId)` additionally requires `game.currentNoticeId === null`.
  `sendHeadsUp` rejects with the new error `official-decision-published`; the UI message is "An
  official decision has already been published." Both rejections are logged as
  `heads-up-rejected` (REQ-06).
- **Rationale**: D-6 defines "pending" as "no FINAL notice yet", which is exactly
  `currentNoticeId === null`; there is no withdraw, so it never returns to null.
- **Alternatives considered**: Allow it but label it "follow-up" (that is OQ-4, a new goal, not
  built).

## R-13 "Started" games (CR-6, REQ-20, REQ-10, REQ-12, REQ-15)

- **Decision**: "Started" is **derived**, never stored: `gameStarted()` (current kickoff ≤ demo
  now) already exists and is reused everywhere.
  - Game lists, game detail and parent cards show a "Started" tag next to the official status.
  - `can('publish')` and `can('heads-up')` already return false for started games (V1).
  - `parentGames()` keeps games whose current kickoff is today (same calendar day as the demo
    clock), started or not, plus all future games; each item gets `started: true|false`.
  - `alertsFor()` sets `started` on FINAL alerts; `unconfirmed` becomes
    `!confirmed && current && !started`. The parent view lists a started, unconfirmed alert under
    "Earlier messages" with "Game started – no confirmation needed"; Confirm receipt is not shown.
  - `processDueEscalations()` cancels a pending text or call whose `dueAt` is at or after the
    game's current kickoff, instead of sending it. Using `dueAt` (not "now") keeps a large clock
    jump exact: an escalation due before kickoff is still sent with its own timestamp.
  - Demo path: publish a verified time move to a kickoff a few minutes ahead (e.g. 08:40), then
    press +5 min until it passes. No new clock control is added (REQ-19 unchanged).
- **Rationale**: A derived flag cannot get out of date when the clock moves, and reuses the V1
  guards. "End of that day" uses the demo clock's calendar day, so it is testable.
- **Alternatives considered**: A stored `state: 'started'` set on tick (two sources of truth). A
  "+30 min" or "jump to kickoff" control (adds demo UI the spec does not ask for).

## R-14 "Sent" then "delivered" (CR-7, REQ-13, REQ-16, REQ-06)

- **Decision**: Every dispatch (`deliver()`) appends a record with status `sent`, or `failed`
  with a reason at once when the contact is missing. On every clock change, a new pass
  `processDeliveryReports()` finds `sent` records with `at + 1 min ≤ now` that have no report
  yet and appends a report record: same message, person and channel, status `delivered`,
  trigger `delivery-report`, `reportFor: <id of the sent record>`, `at = sent.at + 1 min`.
  Status views already take the latest record per channel, so they show "sent", then
  "delivered". In-app deliveries follow the same rule (simplest, and matches US3 #6).
- **Rationale**: Append-only (R-6, REQ-06) with no new scheduled-entity type: the pending reports
  are derived from the log itself (Constitution VIII). The prototype has no simulated cause for
  a late failure, so every report is `delivered`; "failed with a reason" stays the immediate
  missing-contact case, which the spec's assumption allows. REQ-16 still holds because the
  `sent` record carries the publish timestamp.
- **Alternatives considered**: Mutating the record's status (breaks append-only). Random
  failures (non-repeatable demos and tests). A `ScheduledReport` entity (more state for no
  behavior gain).

## R-15 Per-child receipt confirmation (CR-8, REQ-10, REQ-13, REQ-08)

- **Decision**: One set of pure helpers in `confirmations.js`, used by escalation, alerts and
  status:
  - `childConfirmed(notice, childId)`: some recipient whose `childIds` include the child has
    confirmed the notice.
  - `isConfirmedFor(notice, personId)`: for a parent, every child in that parent's `childIds` is
    confirmed; for a coach, the coach's own confirmation.
  - `familyConfirmed(notice, familyId)`: every child that appears in some recipient's
    `childIds` for that family is confirmed.
  - `confirmReceipt()` records the confirmation, then cancels pending escalations for **every**
    recipient for whom `isConfirmedFor` is now true (not "the whole family").
  - `noticeStatus().notConfirmed` lists, per unconfirmed family, only the parents notified about
    an unconfirmed child, each with only those unconfirmed children.
  Because `recipient.childIds` never contains a child the parent is restricted for (R-5), a
  restricted parent's confirmation can never count for that child, and that parent can never
  be listed next to that child (Constitution VII).
- **Rationale**: Matches the spec rule exactly and gives the V1 result for ordinary two-parent
  families (US6 #6 regression). Deriving from `childIds` keeps the privacy rule in one place.
- **Alternatives considered**: Option B, "a restricted parent's confirmation never counts"
  (rejected in the spec). Storing confirmations per child (the parent confirms one notice, not
  each child; the derivation is enough).
- **Edge**: a child on the affected team with no notified parent (every parent restricted) is
  not in any recipient's `childIds`, so it is not counted for the family; there is nobody to
  contact. The seed has no such case.

## R-16 Texts to coaches (CR-9, REQ-10)

- **Decision**: No change. V1 `dispatchFinalNotice()` already schedules the 5-minute text (or
  sends the urgent text) for every recipient and the call only for parents. Add a regression
  test for US6 #9.
- **Rationale**: The spec was made consistent with the existing behavior.
- **Alternatives considered**: None; the spec decision is fixed (OQ-9 open with Ray).
