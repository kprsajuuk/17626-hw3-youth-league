# Data Model: Game Change Notice

Phase 1 output for [plan.md](plan.md). All data is in-memory mock data (Constitution VI).
Times are demo-clock timestamps (see research R-3). IDs are short strings.

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
| email | string \| null | null → email delivery fails |
| phone | string \| null | null → text and call deliveries fail |
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

Derived: **official status** = the current notice's change, else "As scheduled".
Derived: **current kickoff / field** = new details of the current notice, else `scheduled`.

### VerificationRecord (embedded in Notice)
| Field | Type | Validation |
|-------|------|------------|
| source | `City` \| `Parks Department` | required (REQ-01) |
| confirmedAt | timestamp | required, not later than now (REQ-01) |

### Notice (FINAL)
| Field | Type | Notes / validation |
|-------|------|------------|
| id | string | |
| gameId | Game id | game kickoff must not have passed |
| kind | `final` | |
| changeType | `cancelled` \| `field` \| `time` | REQ-03 |
| old | `{ kickoff, field }` | game's current details before this notice |
| new | `{ kickoff?, field? }` | `field` → new field ≠ old; `time` → new kickoff ≠ old, in future |
| instruction | string | required, non-empty; pre-filled per change type |
| verification | VerificationRecord | required |
| authorId | Person id | must be admin (REQ-02) |
| publishedAt | timestamp | |
| urgent | boolean | `min(old.kickoff, new.kickoff) − publishedAt ≤ 2 h` (REQ-10) |
| state | `current` \| `superseded` | |
| supersededBy | Notice id \| null | |

### HeadsUp (UNCONFIRMED)
| Field | Type | Notes / validation |
|-------|------|------------|
| id | string | |
| gameId | Game id | game must include the coach's team; kickoff not passed |
| teamId | Team id | sending coach's team — the audience (REQ-05, OQ-3) |
| message | string | required |
| authorId | Person id | must be the coach of `teamId` |
| sentAt | timestamp | |
| state | `active` \| `superseded` | |
| supersededBy | Notice id \| null | |

Heads-ups never change `Game.currentNoticeId`, never escalate, never require confirmation.

### Recipient (derived, stored per message)
| Field | Type | Notes |
|-------|------|-------|
| personId | Person id | |
| familyId | Family id \| null | null for coaches |
| childIds | Child id[] | eligible children named in this message (REQ-08, REQ-17) |

### DeliveryRecord (delivery log entry, append-only)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| messageId | Notice or HeadsUp id | |
| personId | Person id | |
| channel | `in-app` \| `email` \| `text` \| `call` | |
| status | `delivered` \| `failed` | failed when the needed contact is null |
| reason | string \| null | e.g. "No phone on file" |
| at | timestamp | |
| trigger | `publish` \| `urgent` \| `no-confirmation-5min` \| `no-confirmation-2min` | why it was sent |
| content | string | rendered message text for this recipient |

### ReceiptConfirmation
| Field | Type | Notes |
|-------|------|-------|
| noticeId | Notice id | final notices only |
| personId | Person id | |
| at | timestamp | |

Derived: a **family is confirmed** for a notice when any of its recipient parents has a
confirmation for that notice (Clarifications 2026-11-16).

### ScheduledEscalation
| Field | Type | Notes |
|-------|------|-------|
| noticeId | Notice id | |
| personId | Person id | |
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
| content | string | full summary of what was published/sent |

## State transitions

**Game official status**

```text
As scheduled ──publish(final)──▶ FINAL notice n1 current
FINAL n1 ──publish(final n2)──▶ FINAL n2 current, n1 superseded
(no transition back to "As scheduled": withdrawing a change is out of scope, G-13)
```

**Heads-up**: `active ──publish(final for same game)──▶ superseded`; otherwise stays `active`.

**ScheduledEscalation**

```text
pending ──clock ≥ dueAt and family not confirmed──▶ sent (DeliveryRecord appended)
pending ──family confirms──▶ cancelled
pending ──notice superseded──▶ cancelled
```

## Rules by requirement

| Rule | REQ |
|------|-----|
| Publish rejected without verification source + time, or if author is not admin | REQ-01, REQ-02 |
| Heads-up rejected unless author is coach of `teamId` and the game includes `teamId` | REQ-05 |
| Recipients = parents with ≥1 eligible child on audience teams + audience coaches | REQ-07, REQ-08 |
| Eligible child = on audience team and no restriction for (parent, child) | REQ-08 |
| One recipient per parent per message, naming all eligible children | REQ-17 |
| On publish: in-app + email per recipient at `publishedAt` | REQ-09, REQ-16 |
| Non-urgent: schedule text at +5 min per recipient | REQ-10 |
| Urgent: text at publish; schedule call at +2 min per recipient parent | REQ-10, REQ-11 |
| Confirmation by any parent cancels pending escalations for the family | REQ-10, Clarifications |
| Summary text: "N of M confirmed receipt" (M = recipient families) | REQ-13, REQ-14 |
| Child display = first name + last initial in every view and message (simplest way to meet the shared-view rule) | REQ-18 |
