# Contract: Domain API

The interface between the UI and the domain layer (`app/src/domain/`). Views call only these
functions; they never change the store directly. Every command checks permissions itself and
returns `{ ok: true, ... }` or `{ ok: false, error }`, so a rejection is visible without the UI
(REQ-02). Entity shapes are in [../data-model.md](../data-model.md). **(V2)** marks changes.

## Commands

### `publishChange(store, actorId, input)` — REQ-01, 02, 03, 04, 06, 09, 10, 11, 16, 20
`input` *(V2)*: `{ gameId, changeType: 'cancelled' | 'moved', newField?, newKickoff?, instruction,
verification: { source, confirmedAt } }`. For `moved`, an omitted or unchanged `newField` /
`newKickoff` means "keep the current value".

Rejections (checked in this order; each appends a `publish-rejected` activity entry and changes
nothing else):

| Error | When | UI message |
|-------|------|------------|
| `not-authorized` | actor is not admin | — (control not shown) |
| `game-started` | current kickoff has passed (REQ-20) | "This game has already started." |
| `game-cancelled` *(V2)* | current status is Cancelled (REQ-03, D-7) | "This game is cancelled. A cancellation is final." |
| `verification-required` | source or time missing (REQ-01) | "A verification record (source and time) is required." |
| `verification-in-future` | `confirmedAt` > now (REQ-01) | "The verification time cannot be later than now." |
| `invalid-change` | unknown type; `moved` that changes nothing; new kickoff not in the future (REQ-03) | Explains which detail is invalid |
| `instruction-required` | instruction empty | "Enter an instruction for families." |

On success: creates the Notice; supersedes the previous current notice and all active heads-ups
for the game; cancels their pending escalations; appends a `publish` activity entry; resolves
recipients; appends in-app + email deliveries with status `sent` (or `failed`) at `publishedAt`
*(V2)*; if urgent, appends texts at `publishedAt` and schedules calls at +2 min for parents;
otherwise schedules texts at +5 min for every recipient (parents and coaches, CR-9).
Returns `{ ok: true, noticeId }`.

### `sendHeadsUp(store, actorId, { gameId, message })` — REQ-05, 06, 07, 08
Rejections (each appends a `heads-up-rejected` activity entry):

| Error | When |
|-------|------|
| `not-authorized` | actor is not the coach of a team in the game |
| `game-started` | current kickoff has passed |
| `official-decision-published` *(V2)* | the game has a current FINAL notice (CR-1, D-6). UI: "An official decision has already been published." |
| `message-required` | message empty |

On success: creates the HeadsUp for the coach's team; appends a `heads-up` activity entry;
appends in-app + email deliveries (`sent`) to the coach's team recipients. No escalation, no
change to official status.

### `confirmReceipt(store, actorId, noticeId)` — REQ-12, 10, 13
- Rejects when the actor was not a recipient of the notice or the notice is superseded
  (`not-recipient`, `superseded`).
- Records the confirmation (idempotent). *(V2, CR-8)* Then cancels pending escalations for every
  recipient of the notice who is now confirmed under the per-child rule, which may include other
  parents of the same family, but only those whose named children are all confirmed.

### `advanceClock(store, minutes)` / `tick(store, now)` — REQ-10, 11, 13, 19, 20
Moves the demo clock forward, then, in order:
1. `processDueEscalations`: for each pending escalation with `dueAt ≤ now`, in `dueAt` order:
   cancel it if the notice is superseded, the recipient is confirmed, or *(V2)* `dueAt` ≥ the
   game's current kickoff; otherwise append the text or call (`sent`/`failed`, at `dueAt`,
   trigger `no-confirmation-5min` / `no-confirmation-2min`).
2. *(V2)* `processDeliveryReports`: for each `sent` record with `at + 1 min ≤ now` and no report,
   append a `delivered` record (trigger `delivery-report`, `reportFor`, `at = sent.at + 1 min`).
   It runs after step 1, so a text or call sent during a clock jump gets its report in the same
   jump. *(Changed during implementation: T068 had the reverse order, which delayed those
   reports by one tick.)*

### `resetDemo(store)` — REQ-19
Restores the seed data and the demo start time.

## Queries

| Function | Returns | REQ |
|----------|---------|-----|
| `can(store, actorId, action, target)` | boolean; actions: `publish` *(V2: false when started or cancelled)*, `heads-up` *(V2: false when started or a FINAL notice exists)*, `view-status`, `view-activity-log` | 02, 03, 05, 19, 20 |
| `resolveRecipients(store, gameId, audience)` | Recipient[]; `audience` = `{ kind: 'final' }` or `{ kind: 'heads-up', teamId }` | 07, 08, 17 |
| `gameStatus(store, gameId)` | `{ kind, title, changeType, old, new, instruction, author, publishedAt, verification, headsUps[], started }` *(V2: `started`)* | 03, 04, 05, 20 |
| `parentGames(store, parentId)` | *(V2)* games of the parent's eligible children with current kickoff today (started or not) or later, each with `gameStatus`, `labelKind` (final/unconfirmed/scheduled), `started`, and unconfirmed alerts | 15, 08, 20 |
| `alertsFor(store, personId)` | messages for the person with flags `confirmed`, `superseded`, *(V2)* `started`, and `unconfirmed = !confirmed && !superseded && !started` (per-child rule for `confirmed`) | 12, 17, 20 |
| `noticeStatus(store, noticeId, viewerId)` | per-recipient rows `{ family, person, children, channels: {in-app, email, text, call}, confirmedSelf, confirmed }`; `notConfirmed[]` = `{ familyId, label, parents: [{ name, children }] }` listing only parents notified about unconfirmed children, with only those children *(V2, CR-8)*; summary string | 13, 14, 08 |
| `deliveryLog(store, viewerId)` | DeliveryRecord[] the viewer may see (admin: all; coach: own team), including *(V2)* report records | 13, VI |
| `activityLog(store, viewerId)` | ActivityLogEntry[] (admin only) | 06 |
| `childDisplayName(child)` | "Maya R." | 18 |
| `isConfirmedFor(store, notice, personId)`, `childConfirmed(store, notice, childId)`, `familyConfirmed(store, notice, familyId)` *(V2)* | per-child confirmation helpers (research R-15) | 10, 13 |

## Wording rules (REQ-03, 04, 05, 14, 20)

- Final notices begin with `FINAL – ` and the change:
  - `FINAL – Moved: Field 3 → Field 7` (field only)
  - `FINAL – Time changed: Sun 10:00 → Sun 13:00` (time only)
  - *(V2)* `FINAL – Moved: Field 3, 10:00 → Field 7, 13:00` (both; weekday added only if the day changes)
  - `FINAL – Cancelled`
- Heads-ups begin with `UNCONFIRMED – `; once superseded they show `Superseded by FINAL notice`.
- *(V2)* Started games carry the tag `Started`; a started game's unconfirmed alert shows
  `Game started – no confirmation needed`.
- *(V2)* Channel statuses are shown as `sent`, `delivered` or `failed (<reason>)`.
- Confirmation wording uses only "confirmed receipt" / "Confirm receipt". The strings "read",
  "seen" and "everyone has seen it" do not appear in any user-visible text (checked by a test).
