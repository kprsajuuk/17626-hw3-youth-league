---

description: "Task list for the Game Change Notice prototype"
---

# Tasks: Game Change Notice

**Input**: Design documents from `specs/001-game-change-notice/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The plan (research R-7) specifies browser-run unit tests for the domain rules.
Within each story, write the tests first and confirm they fail before implementing.

**Organization**: Tasks are grouped by user story (US1–US6 = spec User Stories 1–6).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story the task belongs to (US1…US6)

## Rules for every task (Constitution I, II, V, VI, VII)

- Every source file starts with a comment naming the REQ IDs it implements, and every function
  that implements a rule carries a `// REQ-xx` comment.
- Implement only what the cited REQ and the contracts describe. No rides, coach records,
  schedule editing, settings panel or "withdraw change" (out of scope).
- No network code (`fetch`, `XMLHttpRequest`, CDN `<script>`/`<link>`) in `app/src/`. All
  channels only append DeliveryRecords.
- Plain ES modules, no dependencies, no build step (plan.md). Run with
  `python3 -m http.server 8000 --directory app`.

## Path Conventions

Single front-end project under `app/` (plan.md): source in `app/src/`, tests in `app/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project skeleton and test runner

- [X] T001 Create the directory skeleton `app/`, `app/src/data/`, `app/src/domain/`, `app/src/ui/`, `app/tests/` exactly as listed in plan.md "Source Code"
- [X] T002 [P] Create `app/index.html`: `<header id="demo-bar">`, a persistent banner "Demo prototype — mock data, no real messages are sent.", `<main id="view">`, a link to `styles.css`, and `<script type="module" src="src/main.js">`; no external resources (Constitution VI)
- [X] T003 [P] Create `app/styles.css` with base layout plus badge classes from contracts/ui-views.md "Visual distinctions": `.badge-final` (solid dark-green, bold "FINAL"), `.badge-unconfirmed` (dashed amber outline, striped background), `.badge-superseded` (grey, struck-through), `.alert-prominent` (top-of-view highlighted card); badges always contain text, not color alone (REQ-05)
- [X] T004 [P] Create `app/tests/harness.js` exporting `test(name, fn)`, `assertEqual(actual, expected, msg)`, `assertTrue(cond, msg)`, `assertDeepEqual(a, b, msg)` and `run()`, which renders one green/red line per test plus a pass/fail total into the page
- [X] T005 Create `app/tests/index.html` that imports `harness.js` and each `*.test.js` file listed in plan.md "Source Code", then calls `run()` (`queries.test.js` is added in T050)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Seed data, store, clock, logs, permissions and UI shell used by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create `app/src/data/seed.js` exporting `DEMO_START = "2026-11-21T08:30"` (Saturday) and a `seed()` function that returns fresh fictional fixtures (research R-9, data-model.md):
  - Persons: admin "Brenda (League Admin)"; coaches "Ray (Coach U10 Blue)", "Coach U10 Red", "Coach U12 Red", "Coach U12 Gold"; parents with `email`/`phone` strings or `null`
  - Teams `u10-blue`, `u10-red`, `u12-red`, `u12-gold`
  - U10 Blue: exactly 10 families, A–I plus Mike's family M:
    - Family B: parent X "Xavier Bell" (restricted for only child B1 "Bea Bell") and parent Y "Yolanda Bell"
    - Family D: one parent with two children on U10 Blue
    - Family E: parent W "Wes Evans" (restricted for E1 "Eli Evans", not for E2 "Emma Evans", both on U10 Blue) and parent "Erin Evans"
    - Family F: `email: null`
    - Family G: `phone: null`
    - Family M: "Mike Moreno" with "Max Moreno" on U10 Blue and "Mia Moreno" on U12 Red
  - Other teams: U10 Red 4 families, U12 Red 4 families including Mike, U12 Gold 3 families
  - Restrictions: `[{parentId: X, childId: B1}, {parentId: W, childId: E1}]`
  - Games, each with `scheduled: { kickoff, field }`:
    - `g-u10` U10 Blue vs U10 Red, 2026-11-21T10:00, "Field 3"
    - `g-u12` U12 Red vs U12 Gold, 2026-11-22T10:00, "Field 5"
    - `g-past` U12 Gold vs U12 Red, 2026-11-21T07:00, "Field 1"
  - No address fields anywhere (REQ-18)
- [X] T007 Create `app/src/domain/store.js`:
  - `createStore()` builds state `{ now, people, families, teams, children, restrictions, games, notices, headsUps, deliveries, confirmations, escalations, activity }` from `seed()` with `now = DEMO_START`
  - Also provides `subscribe(fn)`, `notify()`, `nextId(prefix)` and `resetDemo(store)`, which restores the seed and the start time (REQ-19)
- [X] T008 Create `app/src/domain/clock.js` (REQ-19, research R-3):
  - `now(store)`, `advanceClock(store, minutes)` and `tick(store, newNow)`
  - `onTick(store, handler)`: a handler registry that `tick` calls after moving time, then `notify()`
  - Time only moves forward
- [X] T009 [P] Create `app/src/domain/log.js` (REQ-06):
  - `appendActivity(store, { type, authorId, content })` with `type` ∈ `publish | heads-up | publish-rejected | heads-up-rejected`
  - `appendDelivery(store, { messageId, personId, channel, status, reason, trigger, content })` with `channel` ∈ `in-app | email | text | call`, `status` ∈ `delivered | failed`, `trigger` ∈ `publish | urgent | no-confirmation-5min | no-confirmation-2min`
  - Both stamp `at = now(store)` and `Object.freeze` each entry; export no update or delete functions
- [X] T010 [P] Create `app/src/domain/permissions.js` exporting `can(store, actorId, action, target)` (REQ-02, REQ-05, REQ-19):
  - `publish`: admin only, and the target game's kickoff not passed
  - `heads-up`: coach whose team is in `target` game, and kickoff not passed
  - `view-status`: admin for any notice; a coach for notices whose game includes their team
  - `view-activity-log`: admin only
- [X] T011 [P] Create `app/src/domain/recipients.js` with `childDisplayName(child)` → `firstName + " " + lastName[0] + "."` (e.g. "Bea B."); every view and message must use it (REQ-18). `resolveRecipients` is added in T027
- [X] T012 [P] Create `app/src/ui/format.js`: `formatTime(ts)` → "Sat 10:00", `formatClock(ts)` → "Sat 08:30" and `formatDateTime(ts)`
- [X] T013 [P] Create `app/src/ui/components.js` with `el(tag, attrs, ...children)` DOM helper, `statusBadge(kind)` for `final | unconfirmed | superseded | scheduled` using the T003 classes, `gameCard(game, status)` and `table(columns, rows)`
- [X] T014 Create `app/src/ui/demoBar.js` (REQ-19):
  - Renders a persona `<select>` grouped Administrator / Coaches / Parents, the demo clock via `formatClock`, and buttons **+1 min**, **+5 min** and **Reset demo** calling `advanceClock` / `resetDemo`
  - Keeps the selected persona id in module state
- [X] T015 Create `app/src/main.js`:
  - Creates the store and renders the demo bar
  - Routes the view by persona role to `adminView`, `coachView` or `parentView` (empty `render(store, personaId, root)` stubs created here in `app/src/ui/adminView.js`, `coachView.js`, `parentView.js`)
  - Re-renders on `subscribe`; advances the clock by 1 s of real time every second via `tick`
- [X] T016 [P] Write `app/tests/permissions.test.js` covering `can()` for each action and role, including "Ray cannot publish", "parent cannot publish", "U10 Blue coach cannot heads-up a U12 game" and "nobody can publish for g-past" (REQ-02, REQ-05)
- [X] T017 [P] Write `app/tests/wording.test.js` part 1: `childDisplayName` returns first name + last initial, and no seed person or child object has an address field (REQ-18)

**Checkpoint**: `app/tests/` shows green for T016–T017. The app loads, persona switching and clock buttons work, and the views are empty.

---

## Phase 3: User Story 1 - Administrator publishes a verified change (Priority: P1) 🎯 MVP

**Goal**: Brenda publishes one verified FINAL status per game; coaches and parents cannot; every attempt is logged.

**Independent Test**: quickstart.md section A (steps A1–A5).

### Tests for User Story 1

- [X] T018 [P] [US1] Write `app/tests/notices.test.js` publish tests:
  - REQ-01: rejects with `verification-required` when source or `confirmedAt` is missing, and with `verification-in-future` when `confirmedAt` is later than now
  - REQ-02: rejects with `not-authorized` for Ray and for a parent
  - REQ-03: cancel/field/time each produce the labels "FINAL – Cancelled", "FINAL – Moved: Field 3 → Field 7" and "FINAL – Time changed: Sat 10:00 → Sat 13:00"
  - Other rejections: `invalid-change` for an unchanged or missing new field/time; `instruction-required`; `game-started` for `g-past`
  - REQ-04: a second publish sets the first notice to `superseded` with `supersededBy`
  - REQ-06: each rejection and publish appends one frozen activity entry, and a rejection changes nothing else

### Implementation for User Story 1

- [X] T019 [US1] Create `app/src/domain/delivery.js` exporting `dispatchFinalNotice(store, notice)` that currently returns `[]`, with a comment that delivery is added in T028 (US2). This keeps US1 runnable on its own
- [X] T020 [US1] Implement `publishChange(store, actorId, input)` in `app/src/domain/notices.js` per contracts/domain-api.md (REQ-01, REQ-02, REQ-03, REQ-04, REQ-06):
  - `input` is `{ gameId, changeType: 'cancelled'|'field'|'time', newField?, newKickoff?, instruction, verification: { source: 'City'|'Parks Department', confirmedAt } }`
  - Check `can(..., 'publish')` and validate in the contract's order: `not-authorized`, `game-started`, `verification-required`, `verification-in-future`, `invalid-change` ("`field` → new field ≠ old; `time` → new kickoff ≠ old, in future"), `instruction-required`
  - On any rejection, append `publish-rejected` and return `{ ok:false, error }`
  - On success, build the Notice: `old` = the game's current details, `new`, `authorId`, `publishedAt`, and `urgent = min(old.kickoff, new.kickoff ?? old.kickoff) − publishedAt ≤ 2 h`
  - Mark the previous current notice `superseded`, set `game.currentNoticeId`, append a `publish` activity entry with the full summary, call `dispatchFinalNotice`, `notify()`, and return `{ ok:true, noticeId }`
- [X] T021 [US1] Implement `gameStatus(store, gameId)` in `app/src/domain/notices.js` (REQ-03, REQ-04):
  - Returns `{ label, changeType, old, new, instruction, author, publishedAt, verification, headsUps: [] }`
  - Label wording comes exactly from contracts/domain-api.md "Wording rules"; `label = "As scheduled"` when there is no notice
- [X] T022 [P] [US1] Create `app/src/domain/queries.js` with `activityLog(store, viewerId)`, which returns entries newest first for the admin and `[]` for others (REQ-06)
- [X] T023 [US1] Implement `app/src/ui/adminView.js` (REQ-01, REQ-02, REQ-03, REQ-04, REQ-06):
  - Games list with a status badge per game
  - Game detail showing old → new, instruction, author, time and verification
  - Publish form, hidden when `can()` is false:
    - Change type radio buttons, then new field (text) or new time (`datetime-local`)
    - Instruction pre-filled per type: cancelled "No game today; do not travel."; field "Go to {new field} at the original time."; time "Arrive for the new kickoff at {new time}."
    - Verification source select (City / Parks Department) and verification time
    - **Publish FINAL notice** button; rejection reasons shown inline in plain words, e.g. "A verification record (source and time) is required before publishing."
  - Read-only activity log table
- [X] T024 [P] [US1] Implement `app/src/ui/coachView.js` first part: the coach's team games with status badge and game detail, read-only, with no publish controls (REQ-02)
- [X] T025 [P] [US1] Implement `app/src/ui/parentView.js` first part: a read-only list of the games of the parent's children with status badge and details (REQ-02; extended in US2 and US5)

**Checkpoint**: Quickstart A1–A5 pass and `notices.test.js` publish tests are green.

---

## Phase 4: User Story 2 - Affected families are notified and acknowledge (Priority: P1)

**Goal**: The right recipients (and only them) get in-app + email, and parents confirm receipt.

**Independent Test**: quickstart.md section B, plus confirming receipt as one parent.

**Depends on**: US1 (a notice must be published).

### Tests for User Story 2

- [X] T026 [P] [US2] Write `app/tests/recipients.test.js` (REQ-07, REQ-08, REQ-17):
  - REQ-07: `resolveRecipients(g-u10, {kind:'final'})` includes U10 Blue and U10 Red parents and both coaches, and no U12 person
  - REQ-08: X is absent; Y is present with `childIds:[B1]`; W is present with `childIds:[E2]` only
  - REQ-17: the Family D parent appears once with both children; Mike appears once with only Max for g-u10
- [X] T027 [US2] Implement `resolveRecipients(store, gameId, audience)` in `app/src/domain/recipients.js` (research R-5):
  - `audience` ∈ `{kind:'final'}` (all teams in the game) or `{kind:'heads-up', teamId}`
  - For each parent, eligible children = their children on the audience teams minus the (parent, child) restrictions; drop parents with none
  - One entry `{ personId, familyId, childIds }` per parent, plus the audience teams' coaches with `familyId: null, childIds: []`
  - Comment the REQ-07, REQ-08 and REQ-17 rules
- [X] T028 [US2] Replace the stub in `app/src/domain/delivery.js` with a real `dispatchFinalNotice(store, notice)` (REQ-09, REQ-16, REQ-08):
  - For each recipient, render content: label + old → new + instruction + "For: " + eligible child names via `childDisplayName`; never mention restricted children
  - Append `in-app` (always delivered) and `email` deliveries (`failed`, reason "No email on file" if `email` is null), both with `trigger:'publish'` at `publishedAt`
  - Store recipients on the notice as `notice.recipients`
- [X] T029 [P] [US2] Write `app/tests/delivery.test.js` part 1: every recipient gets exactly one in-app and one email record at `publishedAt` (REQ-09, REQ-16); Family F's email is `failed` with a reason (REQ-13 edge case); no record exists for X (REQ-08)
- [X] T030 [P] [US2] Write `app/tests/confirmations.test.js` part 1: `confirmReceipt` records a confirmation; confirming twice keeps one; rejects `not-recipient` for X and for a U12 parent; rejects `superseded` for an old notice (REQ-12)
- [X] T031 [US2] Create `app/src/domain/confirmations.js` with `confirmReceipt(store, actorId, noticeId)` per contracts/domain-api.md: idempotent, rejects `not-recipient` / `superseded`, then calls `notify()` (REQ-12). Escalation cancelling is added in T057
- [X] T032 [US2] Add `alertsFor(store, personId)` to `app/src/domain/queries.js` (REQ-12, REQ-17):
  - Returns the person's messages newest first, each with `{ id, kind, label, content, children, unconfirmed, superseded }`
  - `unconfirmed` = a current final notice without a confirmation from this person or their family
- [X] T033 [US2] Extend `app/src/ui/parentView.js` with the top "Unconfirmed alerts" section (`.alert-prominent`):
  - Each card shows the FINAL label, old → new, effect time, instruction, child names and a **Confirm receipt** button
  - After confirming, the card leaves the prominent section and shows "Receipt confirmed"
  - Never uses "read" or "seen" (REQ-12, REQ-14)
- [X] T034 [P] [US2] Extend `app/src/ui/coachView.js` with the coach's own alerts and a **Confirm receipt** button (REQ-12)
- [X] T035 [US2] Add `deliveryLog(store, viewerId)` to `app/src/domain/queries.js` (admin: all records; coach: records whose message's game includes their team, limited to that team's families and the coach; others: `[]`). Render a read-only delivery log table (time, recipient, channel, status, reason, trigger, content) in `app/src/ui/adminView.js` (REQ-06, REQ-13, Constitution VI)

**Checkpoint**: Quickstart B1–B5 pass; recipients, delivery part 1 and confirmations part 1 tests are green.

---

## Phase 5: User Story 3 - Coach sees who has not acknowledged (Priority: P1)

**Goal**: Per-recipient, per-channel status and the not-confirmed family list for coach and admin.

**Independent Test**: quickstart.md section E.

**Depends on**: US2 (deliveries and confirmations exist).

### Tests for User Story 3

- [X] T036 [P] [US3] Add to `app/tests/confirmations.test.js` the `noticeStatus` tests (REQ-13, REQ-14):
  - After confirmations from 8 U10 Blue families (Y for Family B), the coach's summary equals "8 of 10 confirmed receipt" and `notConfirmed` lists the other 2
  - Family E counts as confirmed when Erin confirms
  - X is in no row
  - Family F's email channel shows `failed`
  - The coach of U10 Blue sees only U10 Blue families; the admin sees both teams
- [X] T037 [P] [US3] Add to `app/tests/wording.test.js` part 2: build a scenario (publish, heads-up, some confirmations), render each persona view (admin, Ray, Mike, Y) into a detached `<div>` with its `render(store, personaId, root)`, and assert that no `textContent` matches `/\bread\b/i`, `/\bseen\b/i` or "everyone has seen it" (REQ-14, SC-007)

### Implementation for User Story 3

- [X] T038 [US3] Implement `noticeStatus(store, noticeId, viewerId)` in `app/src/domain/confirmations.js` (REQ-13, REQ-14):
  - Check `can(..., 'view-status')`; scope rows to the coach's team families (admin: all)
  - Rows `{ family, person, children, channels: { 'in-app', email, text, call } (each 'delivered' | 'failed' | '—'), confirmed }`
  - `notConfirmed`: family labels whose parents have no confirmation
  - Summary: `` `${confirmed} of ${total} confirmed receipt` `` with `total` = recipient families in scope
- [X] T039 [US3] Add `noticeStatusTable(status)` to `app/src/ui/components.js`: the summary line, a "Not yet confirmed" list first, then the full table, with children shown via `childDisplayName` (REQ-13, REQ-18)
- [X] T040 [US3] Add a "Notice status" panel for the current notice of each own-team game to `app/src/ui/coachView.js`, plus the coach-scoped delivery log from `deliveryLog` (REQ-13)
- [X] T041 [P] [US3] Add a "Notice status" panel per published notice to the game detail in `app/src/ui/adminView.js` (REQ-13)

**Checkpoint**: Quickstart E1–E3 pass; the P1 chain (US1–US3) is the demonstrable MVP.

---

## Phase 6: User Story 4 - Coach sends an unconfirmed heads-up (Priority: P2)

**Goal**: The coach's UNCONFIRMED heads-up reaches their own team only, never changes the official status, and a FINAL notice supersedes it.

**Independent Test**: quickstart.md section F.

**Depends on**: US2 (`resolveRecipients`, delivery). Independent of US3.

### Tests for User Story 4

- [X] T042 [P] [US4] Add heads-up tests to `app/tests/notices.test.js` (REQ-05, REQ-07, REQ-08, REQ-17):
  - `sendHeadsUp` by Ray for g-u10 delivers in-app + email to U10 Blue recipients only (no U10 Red, no X)
  - `gameStatus` label is unchanged
  - Rejects `not-authorized` for the U12 Red coach on g-u10 and for Brenda, `message-required` for an empty message, and `game-started` for g-past
  - It schedules no escalations
  - After `publishChange` on g-u10, the heads-up state is `superseded`, and `alertsFor(parent)` shows one current FINAL alert with the heads-up flagged superseded

### Implementation for User Story 4

- [X] T043 [US4] Implement `sendHeadsUp(store, actorId, { gameId, message })` in `app/src/domain/notices.js` per contracts/domain-api.md (REQ-05, REQ-06):
  - Check `can(..., 'heads-up')`; `teamId` = the actor's team
  - Create the HeadsUp `{ state: 'active', supersededBy: null }` and append a `heads-up` activity entry (or `heads-up-rejected` on failure)
  - Call `dispatchHeadsUp`
- [X] T044 [US4] Add `dispatchHeadsUp(store, headsUp)` to `app/src/domain/delivery.js` (REQ-05, REQ-07, REQ-08):
  - Recipients come from `resolveRecipients(store, gameId, {kind:'heads-up', teamId})`
  - Content starts "UNCONFIRMED – not official yet: " + message + child names
  - Append in-app + email records only; no text, no call, no escalation
- [X] T045 [US4] Extend `publishChange` in `app/src/domain/notices.js` to mark every active heads-up of the game `superseded` with `supersededBy = notice.id`, and add the game's heads-ups to `gameStatus(...).headsUps` (REQ-04, REQ-05)
- [X] T046 [US4] Extend `alertsFor` in `app/src/domain/queries.js` so a heads-up has `kind:'heads-up'`, label "UNCONFIRMED", never `unconfirmed:true` (it needs no confirmation), and `superseded:true` once replaced; a family never has two current alerts for one game (REQ-17)
- [X] T047 [US4] Add a heads-up form to `app/src/ui/coachView.js`, shown only when `can(..., 'heads-up')` (REQ-05):
  - A message textarea and the note "Goes to all families of {team}. Labelled UNCONFIRMED – it does not change the official status."
  - A **Send UNCONFIRMED heads-up** button, with inline errors
- [X] T048 [P] [US4] Render heads-ups with `.badge-unconfirmed` / `.badge-superseded` and the text "Superseded by FINAL notice" in the game details of `app/src/ui/adminView.js` and `app/src/ui/coachView.js`, and in the parent alerts of `app/src/ui/parentView.js` (REQ-05)

**Checkpoint**: Quickstart F1–F3 pass and the heads-up tests are green.

---

## Phase 7: User Story 5 - Parent sees all children's games in one view (Priority: P2)

**Goal**: A parent sees every eligible child's upcoming games with the current status and labels in one view.

**Independent Test**: quickstart.md section G.

**Depends on**: US1 (status). Uses US2/US4 alerts when present.

### Tests for User Story 5

- [X] T049 [P] [US5] Create `app/tests/queries.test.js` (REQ-15, REQ-08):
  - `parentGames(Mike)` returns g-u10 and g-u12 (not g-past) with labels "As scheduled" before any change and FINAL labels after `publishChange` on both
  - `parentGames(X)` contains no game for B1
  - `parentGames(W)` lists g-u10 only for E2
- [X] T050 [US5] Add `queries.test.js` to the imports in `app/tests/index.html`

### Implementation for User Story 5

- [X] T051 [US5] Implement `parentGames(store, parentId)` in `app/src/domain/queries.js` (REQ-15, REQ-08):
  - Includes upcoming games (kickoff ≥ now) of the parent's children, excluding restricted children
  - Each entry is `{ game, children (eligible, display names), status: gameStatus(...), labelKind: 'final'|'unconfirmed'|'scheduled', unconfirmedAlerts }`
  - `labelKind` is 'unconfirmed' when only an active heads-up exists
  - Sorted by kickoff
- [X] T052 [US5] Replace the first-part list in `app/src/ui/parentView.js` with a "My children's games" section from `parentGames`: one card per game showing the children, badge, current kickoff/field, old → new and instruction. Add an "Earlier messages" section listing superseded notices and heads-ups (REQ-15, REQ-04, REQ-05)

**Checkpoint**: Quickstart G1 passes and `queries.test.js` is green.

---

## Phase 8: User Story 6 - Delivery escalation for parents who miss alerts (Priority: P3)

**Goal**: The text fallback after 5 minutes, and for urgent changes an immediate text plus a call after 2 minutes, to anyone whose family is still unconfirmed.

**Independent Test**: quickstart.md sections C, D and H.

**Depends on**: US2 (delivery, confirmations).

### Tests for User Story 6

- [X] T053 [P] [US6] Add escalation tests to `app/tests/delivery.test.js` (REQ-10, REQ-11, Clarifications 2026-11-16):
  - Urgent g-u10 at 08:30: a `text` (`trigger:'urgent'`) for every recipient at 08:30 and no call; after `advanceClock(2)`, a `call` (`trigger:'no-confirmation-2min'`) for every unconfirmed parent only, never for coaches
  - If Mike confirms at 08:30, his family gets no call
  - Non-urgent g-u12: no text at publish; after `advanceClock(5)`, texts (`no-confirmation-5min`) to unconfirmed recipients only; no call at any time
  - Family B: Y confirms at +2, so no Family B member gets a text at +5 (and X never had any record)
  - A second publish before +5 cancels the first notice's pending escalations and schedules new ones
  - A time move from tomorrow to within 2 h is urgent
  - Family G's text/call records are `failed` with reason "No phone on file"

### Implementation for User Story 6

- [X] T054 [US6] In `dispatchFinalNotice` in `app/src/domain/delivery.js`, when `notice.urgent`, append a `text` for every recipient at `publishedAt` (`trigger:'urgent'`) and schedule a `call` escalation at `publishedAt + 2 min` for each recipient parent (not coaches). Otherwise schedule a `text` escalation at `publishedAt + 5 min` for each recipient. Escalations are `{ noticeId, personId, channel, dueAt, state:'pending' }` (REQ-10, REQ-11)
- [X] T055 [US6] Add `processDueEscalations(store)` to `app/src/domain/delivery.js`:
  - For each pending escalation with `dueAt ≤ now`: if the person's family (or the coach themself) has confirmed, set it `cancelled`
  - Otherwise append a delivery (`text`/`call`, `failed` with reason "No phone on file" if `phone` is null, trigger `no-confirmation-5min` or `no-confirmation-2min`, same content) and set it `sent`
  - Register it with `onTick` when the store is created (REQ-10, REQ-11)
- [X] T056 [US6] In `publishChange` in `app/src/domain/notices.js`, cancel all pending escalations of the superseded notice before dispatching the new one (REQ-04, REQ-10, Edge case "two changes")
- [X] T057 [US6] In `confirmReceipt` in `app/src/domain/confirmations.js`, set every pending escalation for that notice to `cancelled` for all parents in the actor's family (or the coach) (REQ-10, Clarifications 2026-11-16)
- [X] T058 [US6] Make sure `advanceClock` in `app/src/domain/clock.js` runs `tick` handlers for the whole interval, so escalations due inside a +5 min jump fire with their own `dueAt` as `at`. Update `log.js` `appendDelivery` to accept an optional `at` override for this case (REQ-10, REQ-19)
- [X] T059 [US6] Show the trigger in plain words ("Urgent – sent at once", "No confirmation after 5 min", "No confirmation after 2 min") in the delivery log tables in `app/src/ui/adminView.js` and `app/src/ui/coachView.js` (REQ-13)

**Checkpoint**: Quickstart C, D and H pass and all delivery tests are green.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Constitution compliance checks and end-to-end validation

- [X] T060 [P] Traceability audit: run `grep -rn "REQ-" app/src` and confirm that every REQ-01…REQ-19 appears at least once and every file has a REQ header comment; fix gaps in the files concerned (Constitution II)
- [X] T061 [P] Scope and mock audit: run `grep -rnE "fetch\(|XMLHttpRequest|https?://|ride|carpool|attendance|playing.?time" app/src` and confirm there are no matches outside comments (Constitution V, VI)
- [X] T062 [P] Privacy audit: in each persona view, confirm no full child surname and no address is visible, and X never appears in any delivery log, status table or recipient list (REQ-08, REQ-18, Constitution VII)
- [X] T063 Open <http://localhost:8000/tests/> and confirm every test is green; record the pass count in `specs/001-game-change-notice/quickstart.md` under a new "Last validated" line
- [X] T064 Run the quickstart.md walkthroughs A–H and the success-criteria checks end to end, and note any mismatch as a spec gap (Constitution I: revise the spec first, not the code)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks all user stories
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on US1 (it publishes notices)
- **US3 (Phase 5)**: depends on US2
- **US4 (Phase 6)**: depends on US2; independent of US3
- **US5 (Phase 7)**: depends on US1; richer once US2/US4 exist
- **US6 (Phase 8)**: depends on US2; independent of US3–US5
- **Polish (Phase 9)**: after all desired stories

```text
Setup → Foundational → US1 → US2 ─┬─ US3
                          │       ├─ US4
                          │       └─ US6
                          └─ US5
```

These stories are not fully independent: the P1 stories form one chain (publish → notify →
confirm), as in the goal model (G-04 → G-21 → G-33).

### Within Each User Story

- Tests first, and confirm they fail
- Domain functions before UI
- Several tasks edit the same file across stories (`notices.js`, `delivery.js`, `queries.js`,
  views). Within a story, tasks on the same file run in order; across stories, finish one story
  before editing its shared file in another.

### Parallel Opportunities

- Phase 1: T002, T003, T004 in parallel
- Phase 2: T009, T010, T011, T012, T013 in parallel after T007–T008; T016, T017 in parallel
- US1: T018 and T022 in parallel; T024 and T025 in parallel after T021
- US2: T026, T029, T030 in parallel (tests); T034 parallel with T033
- US3: T036 and T037 in parallel; T041 parallel with T040
- After US2: US3, US4 and US6 can be built by different team members, in different files where
  possible (US4: coach heads-up form; US6: delivery.js escalations)
- Polish: T060, T061, T062 in parallel

---

## Parallel Example: User Story 2

```text
Task: "T026 Write app/tests/recipients.test.js (REQ-07, REQ-08, REQ-17)"
Task: "T029 Write app/tests/delivery.test.js part 1 (REQ-09, REQ-16)"
Task: "T030 Write app/tests/confirmations.test.js part 1 (REQ-12)"
```

## Parallel Example: after US2 (three team members)

```text
Member 1: Phase 5 (US3) — confirmations.js noticeStatus, status panels
Member 2: Phase 6 (US4) — sendHeadsUp, dispatchHeadsUp, coach heads-up form
Member 3: Phase 8 (US6) — escalation scheduling and processing in delivery.js
```

---

## Implementation Strategy

### MVP First (P1 chain)

1. Phase 1 Setup, then Phase 2 Foundational
2. US1: publish a verified FINAL status. **Validate** with quickstart A
3. US2: notify the right families and confirm receipt. **Validate** with quickstart B
4. US3: coach status. **Validate** with quickstart E. This is the MVP that demonstrates
   G-02 → G-21

### Incremental Delivery

5. US4 heads-up (CF-1), then quickstart F
6. US5 combined parent view, then quickstart G
7. US6 escalation (CF-3), then quickstart C, D, H
8. Polish audits, then a full quickstart run; tag the result as V1 in git (Constitution Governance)

---

## Notes

- [P] tasks touch different files and depend on no unfinished task
- Each task cites its REQ IDs; keep the `// REQ-xx` comments in code
- Commit after each task or logical group; stop at any checkpoint to validate
- If a walkthrough fails because the spec is unclear or wrong, update spec.md first (Constitution I)
