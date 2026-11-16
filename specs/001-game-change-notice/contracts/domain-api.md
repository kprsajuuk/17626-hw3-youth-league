# Contract: Domain API

The interface between the UI and the domain layer (`app/src/domain/`). Views call only these
functions; they never change the store directly. Every command checks permissions itself and
returns `{ ok: true, ... }` or `{ ok: false, error }`, so a rejection is visible without the UI
(REQ-02). Entity shapes are in [../data-model.md](../data-model.md).

## Commands

### `publishChange(store, actorId, input)` — REQ-01, 02, 03, 04, 06, 09, 10, 11, 16
`input`: `{ gameId, changeType, newField?, newKickoff?, instruction, verification: { source, confirmedAt } }`

- Rejects (`ok: false`) when: actor is not admin (`not-authorized`); verification source or
  time missing (`verification-required`); `confirmedAt` in the future (`verification-in-future`);
  game kickoff has passed (`game-started`); new field/time missing or unchanged (`invalid-change`);
  instruction empty (`instruction-required`). Each rejection appends a `publish-rejected`
  activity entry and changes nothing else.
- On success: creates the Notice; supersedes the previous current notice and all active
  heads-ups for the game; cancels their pending escalations; appends a `publish` activity
  entry; resolves recipients; appends in-app + email deliveries at `publishedAt`; if urgent,
  appends texts at `publishedAt` and schedules calls at +2 min for parents; otherwise schedules
  texts at +5 min for every recipient.
- Returns `{ ok: true, noticeId }`.

### `sendHeadsUp(store, actorId, { gameId, message })` — REQ-05, 06, 07, 08
- Rejects when the actor is not the coach of a team in the game (`not-authorized`), the message
  is empty (`message-required`) or kickoff has passed (`game-started`).
- On success: creates the HeadsUp for the coach's team; appends a `heads-up` activity entry;
  appends in-app + email deliveries to the coach's team recipients. No escalation, no change to
  official status.

### `confirmReceipt(store, actorId, noticeId)` — REQ-12, 10
- Rejects when the actor was not a recipient of the notice or the notice is superseded
  (`not-recipient`, `superseded`).
- Records the confirmation (idempotent) and cancels pending escalations for the actor's family
  (or the actor, for a coach).

### `advanceClock(store, minutes)` / `tick(store, now)` — REQ-10, 11, 19
- Moves the demo clock forward, then sends every pending escalation with `dueAt ≤ now` whose
  family is still unconfirmed (appends a DeliveryRecord with trigger
  `no-confirmation-5min` / `no-confirmation-2min`).

### `resetDemo(store)` — REQ-19
Restores the seed data and the demo start time.

## Queries

| Function | Returns | REQ |
|----------|---------|-----|
| `can(store, actorId, action, target)` | boolean; actions: `publish`, `heads-up`, `view-status`, `view-activity-log` | 02, 05, 19 |
| `resolveRecipients(store, gameId, audience)` | Recipient[]; `audience` = `{ kind: 'final' }` or `{ kind: 'heads-up', teamId }` | 07, 08, 17 |
| `gameStatus(store, gameId)` | `{ label, changeType, old, new, instruction, author, publishedAt, verification, headsUps[] }` | 03, 04, 05 |
| `parentGames(store, parentId)` | upcoming games of the parent's eligible children, each with `gameStatus`, label (FINAL/UNCONFIRMED/As scheduled) and unconfirmed alerts | 15, 08 |
| `alertsFor(store, personId)` | messages for the person, flags `unconfirmed`, `superseded` | 12, 17 |
| `noticeStatus(store, noticeId, viewerId)` | per-recipient rows `{ family, person, channels: {in-app, email, text, call}, confirmed }`, `notConfirmed[]` families, summary string | 13, 14 |
| `deliveryLog(store, viewerId)` | DeliveryRecord[] the viewer may see (admin: all; coach: own team) | 13, VI |
| `activityLog(store, viewerId)` | ActivityLogEntry[] (admin only) | 06 |
| `childDisplayName(child)` | "Maya R." | 18 |

## Wording rules (REQ-04, 05, 14)

- Final notices begin with `FINAL – ` and the change, e.g. `FINAL – Moved: Field 3 → Field 7`,
  `FINAL – Time changed: Sat 10:00 → Sat 13:00`, `FINAL – Cancelled`.
- Heads-ups begin with `UNCONFIRMED – `; once superseded they show `Superseded by FINAL notice`.
- Confirmation wording uses only "confirmed receipt" / "Confirm receipt". The strings "read",
  "seen" and "everyone has seen it" do not appear in any user-visible text (checked by a test).
