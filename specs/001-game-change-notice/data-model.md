# Data Model: Game Change Notice

Phase 1 output for [plan.md](plan.md). All data is in-memory mock data (Constitution VI).
Times are demo-clock timestamps (see research R-3). IDs are short strings.
**(V2)** marks fields, values and rules changed for V2 (CR-1…CR-9).

## Entities

### Team
| Field | Type | Notes |
|-------|------|-------|
| id | string | e.g. `u10-blue` |
| name | string | e.g. "U10 Blue" |
| coachId | Person id | one coach per team in the seed |

### Child
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| firstName, lastName | string | Shared views show `firstName + " " + lastName[0] + "."` only (REQ-18) |
| teamId | Team id | one team per child |

No address field exists (REQ-18).

### Person
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| name | string | adult display name (fictional) |
| role | `admin` \| `coach` \| `parent` | persona role (REQ-02, REQ-19) |
| email | string \| null | null → email delivery fails at once |
| phone | string \| null | null → text and call deliveries fail at once |
| familyId | Family id \| null | parents only |

### Family
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| label | string | e.g. "Family B" — used in coach lists |
| parentIds | Person id[] | |
| childIds | Child id[] | |

### CourtOrderRestriction
| Field | Type | Notes |
|-------|------|-------|
| parentId | Person id | |
| childId | Child id | the parent must not receive anything about this child (REQ-08) |

### Game
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| teamIds | Team id[] | 1–2 league teams |
| scheduled | `{ kickoff, field }` | original schedule, never changed |
| currentNoticeId | Notice id \| null | latest FINAL notice; null = as scheduled |

Derived:
- **official status** = the current notice's change, else "As scheduled".
- **current kickoff / field** = new details of the current notice where set, else the old ones
  (`currentDetails()`).
- **cancelled** *(V2)* = the current notice has `changeType: 'cancelled'` (REQ-03, D-7).
- **change pending** *(V2)* = `currentNoticeId === null` (D-6; heads-ups allowed only then).
- **started** *(V2)* = current kickoff ≤ demo now (REQ-20). Never stored.

### VerificationRecord (embedded in Notice)
| Field | Type | Validation |
|-------|------|------------|
| source | `City` \| `Parks Department` | required (REQ-01) |
| confirmedAt | timestamp | required, not later than now (REQ-01, *(V2)* now in the spec, CR-4) |

### Notice (FINAL)
| Field | Type | Notes / validation |
|-------|------|------------|
| id | string | |
| gameId | Game id | game not started, *(V2)* not cancelled |
| kind | `final` | |
| changeType | `cancelled` \| `moved` *(V2)* | REQ-03 (V1 had `field` \| `time`; research R-10) |
| old | `{ kickoff, field }` | game's current details before this notice |
| new | `{ kickoff?, field? }` | `cancelled` → `{}`. `moved` → only changed details; at least one present and different from `old`; `kickoff` in the future (REQ-03, CR-4, CR-5) |
| instruction | string | required, non-empty; pre-filled per change type |
| verification | VerificationRecord | required |
| authorId | Person id | must be admin (REQ-02) |
| publishedAt | timestamp | |
| urgent | boolean | `min(old.kickoff, new.kickoff ?? old.kickoff) − publishedAt ≤ 2 h` (REQ-10) |
| state | `current` \| `superseded` | |
| supersededBy | Notice id \| null | |
| recipients | Recipient[] | resolved at publish |

Derived label *(V2, R-10)*: field only → `FINAL – Moved: <old field> → <new field>`; time only →
`FINAL – Time changed: <old> → <new>`; both → `FINAL – Moved: <old field>, <old time> → <new
field>, <new time>`; cancelled → `FINAL – Cancelled`.

### HeadsUp (UNCONFIRMED)
| Field | Type | Notes / validation |
|-------|------|------------|
| id | string | |
| gameId | Game id | game includes the coach's team; not started; *(V2)* no current FINAL notice (D-6) |
| teamId | Team id | sending coach's team — the audience (REQ-05, OQ-3) |
| message | string | required |
| authorId | Person id | must be the coach of `teamId` |
| sentAt | timestamp | |
| state | `active` \| `superseded` | |
| supersededBy | Notice id \| null | |
| recipients | Recipient[] | |

Heads-ups never change `Game.currentNoticeId`, never escalate, never require confirmation.

### Recipient (derived, stored per message)
| Field | Type | Notes |
|-------|------|-------|
| personId | Person id | |
| familyId | Family id \| null | null for coaches |
| teamId | Team id \| null | coaches only |
| childIds | Child id[] | eligible children named in this message (REQ-08, REQ-17). *(V2)* Also the set of children this person's confirmation covers (R-15) |

### DeliveryRecord (delivery log entry, append-only)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| messageId | Notice or HeadsUp id | |
| personId | Person id | |
| channel | `in-app` \| `email` \| `text` \| `call` | |
| status | `sent` *(V2)* \| `delivered` \| `failed` | dispatch → `sent`, or `failed` at once when the contact is missing; a later report record → `delivered` (CR-7, R-14) |
| reason | string \| null | e.g. "No phone on file" |
| at | timestamp | |
| trigger | `publish` \| `urgent` \| `no-confirmation-5min` \| `no-confirmation-2min` \| `delivery-report` *(V2)* | why the record exists |
| reportFor | DeliveryRecord id \| null *(V2)* | set on `delivery-report` records: the `sent` record it reports on |
| content | string | rendered message text for this recipient |

Channel status shown in views = status of the **latest** record for (message, person, channel).

### ReceiptConfirmation
| Field | Type | Notes |
|-------|------|-------|
| noticeId | Notice id | final notices only |
| personId | Person id | |
| at | timestamp | |

Derived *(V2, per child, CR-8, R-15; replaces the V1 family rule)*:
- **child confirmed** for a notice: some recipient whose `childIds` include the child has a
  confirmation for that notice.
- **recipient confirmed**: a parent when all of their `childIds` are confirmed; a coach when the
  coach has confirmed.
- **family confirmed**: all children of the family that appear in some recipient's `childIds` for
  that notice are confirmed.

### ScheduledEscalation
| Field | Type | Notes |
|-------|------|-------|
| noticeId | Notice id | |
| personId | Person id | parent or coach (text); parent only (call) |
| channel | `text` \| `call` | |
| dueAt | timestamp | publish + 5 min (text, non-urgent) or + 2 min (call, urgent) |
| state | `pending` \| `sent` \| `cancelled` | |

### ActivityLogEntry (append-only)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| type | `publish` \| `heads-up` \| `publish-rejected` \| `heads-up-rejected` | |
| authorId | Person id | |
| at | timestamp | |
| content | string | full summary of what was published/sent, or the rejection reason |

## State transitions

**Game official status** *(V2)*

```text
As scheduled ──publish(moved n1)──────▶ FINAL Moved n1 current
As scheduled ──publish(cancelled n1)──▶ FINAL Cancelled n1 current   (terminal, D-7)
FINAL Moved n1 ──publish(moved n2)─────▶ FINAL Moved n2 current, n1 superseded
FINAL Moved n1 ──publish(cancelled n2)─▶ FINAL Cancelled n2 current, n1 superseded (terminal)
FINAL Cancelled ──publish(any)─────────▶ rejected: game-cancelled
any ──kickoff passes──▶ same status, tagged Started; publish rejected: game-started
(no transition back to "As scheduled": withdrawing a change is out of scope, G-13)
```

**Heads-up** *(V2)*: can be created only while the game is "As scheduled" and not started.
`active ──publish(final for same game)──▶ superseded`; otherwise stays `active`.

**DeliveryRecord chain per (message, person, channel)** *(V2)*

```text
(dispatch, contact present) ──▶ sent ──1 simulated min──▶ delivered (new record, delivery-report)
(dispatch, contact missing) ──▶ failed (reason)
```

**ScheduledEscalation** *(V2 conditions)*

```text
pending ──clock ≥ dueAt, recipient not confirmed, dueAt < current kickoff──▶ sent (DeliveryRecord appended)
pending ──recipient becomes confirmed (per child)──▶ cancelled
pending ──notice superseded──▶ cancelled
pending ──dueAt ≥ current kickoff (game started)──▶ cancelled
```

**FINAL alert in a recipient's view** *(V2)*

```text
needs confirmation ──recipient confirmed──▶ receipt confirmed
needs confirmation ──notice superseded──▶ superseded (earlier messages)
needs confirmation ──game started──▶ "Game started – no confirmation needed" (earlier messages)
```

## Rules by requirement

| Rule | REQ |
|------|-----|
| Publish rejected without verification source + time, with a verification time in the future, or if author is not admin | REQ-01, REQ-02 |
| *(V2)* Publish rejected when the game is cancelled (`game-cancelled`) | REQ-03 (CR-2, D-7) |
| *(V2)* Move must change field, kickoff or both; new kickoff in the future | REQ-03 (CR-4, CR-5) |
| *(V2)* Heads-up rejected once a FINAL notice exists (`official-decision-published`) | REQ-05 (CR-1, D-6) |
| Heads-up rejected unless author is coach of `teamId` and the game includes `teamId` | REQ-05 |
| Publish and heads-up rejected once the game has started | REQ-20 (edge case in V1) |
| Recipients = parents with ≥1 eligible child on audience teams + audience coaches | REQ-07, REQ-08 |
| Eligible child = on audience team and no restriction for (parent, child) | REQ-08 |
| One recipient per parent per message, naming all eligible children | REQ-17 |
| On publish: in-app + email per recipient, status `sent` (or `failed`), at `publishedAt` | REQ-09, REQ-16, REQ-13 |
| *(V2)* 1 simulated minute after each `sent` record: a `delivered` report record | REQ-13 (CR-7) |
| Non-urgent: schedule text at +5 min per recipient (parents and coaches) | REQ-10 (CR-9) |
| Urgent: text at publish to every recipient; schedule call at +2 min per recipient parent | REQ-10, REQ-11 |
| *(V2)* Confirmation counts per child; escalations stop per recipient once all their named children are confirmed | REQ-10 (CR-8) |
| *(V2)* No text or call due at or after the current kickoff | REQ-10, REQ-11, REQ-20 |
| *(V2)* Not-confirmed list: families with an unconfirmed affected child; names only parents notified about those children | REQ-13 (CR-8), REQ-08 |
| Summary text: "N of M confirmed receipt" (M = recipient families) | REQ-13, REQ-14 |
| *(V2)* Started games tagged "Started"; parent view keeps same-day started games; their alerts leave "needs confirmation" | REQ-20, REQ-15, REQ-12 |
| Child display = first name + last initial in every view and message | REQ-18 |
