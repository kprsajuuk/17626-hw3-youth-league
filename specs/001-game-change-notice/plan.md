# Implementation Plan: Game Change Notice

**Branch**: `001-game-change-notice` (V2 work on git branch `v2`) | **Date**: 2026-11-17 (V2;
V1 plan 2026-11-16) | **Spec**: [spec.md](spec.md) (Draft V2)

**Input**: Feature specification from `specs/001-game-change-notice/spec.md`, revised from the V1
evaluation as specified in `docs/v2-change-request.md` (CR-1…CR-9).

## Summary

The administrator publishes one verified official status for a game: cancelled, or moved (new
field, new time, or both). The prototype then sends simulated notices only to eligible families
of the affected teams, never to court-order-restricted parents. It escalates by text and call,
and shows coaches who has confirmed receipt. Coaches can send UNCONFIRMED heads-ups that a later
FINAL notice supersedes.

**V2 delta** (all inside the existing V1 architecture; no new modules, no new dependencies):

| CR | Spec change | Design change | Where |
|----|-------------|---------------|-------|
| CR-1 | REQ-05: heads-up only while no FINAL notice exists (D-6) | `can('heads-up')` false and `sendHeadsUp` rejects `official-decision-published` once `game.currentNoticeId` is set | research R-12 |
| CR-2 | REQ-03: a cancellation is final (D-7) | `can('publish')` false and `publishChange` rejects `game-cancelled` when the current status is Cancelled | R-11 |
| CR-4 | REQ-01 / REQ-03 validation written down | No behavior change; V1 rules now traced to the spec | R-11 |
| CR-5 | REQ-03: one "moved" notice may change field, time or both | `changeType` becomes `cancelled` \| `moved`; label derived from which details changed | R-10 |
| CR-6 | REQ-20 (new), REQ-10, REQ-12, REQ-15 | Derived `started` flag; same-day started games kept in parent view; alerts and escalations stop at kickoff | R-13 |
| CR-7 | REQ-13 "sent" status; simulated-delivery assumption | Dispatch writes `sent`; a `delivery-report` record (`delivered`) follows 1 simulated minute later | R-14 |
| CR-8 | REQ-10 / REQ-13 per-child confirmation (OQ-8) | Confirmation evaluated per child; one helper serves escalation, alerts and status | R-15 |
| CR-9 | REQ-10 includes coaches | None: V1 already texts coaches; regression test only | R-16 |
| CR-3 | Open questions OQ-6, accepted risk O-1 | None (documentation only) | — |

Technical approach (unchanged from V1, see [research.md](research.md)): a static, no-build
single-page app in plain HTML/CSS/JavaScript modules, with an in-memory store seeded with mock
data, a demo clock that drives scheduled events, and pure domain modules that hold all rules. The
domain modules have browser-run unit tests.

## Technical Context

**Language/Version**: JavaScript (ES2020 modules), HTML5, CSS3

**Primary Dependencies**: None (no framework, no CDN, no build tool)

**Storage**: In-memory only; seed module reloaded on page load or "Reset demo"

**Testing**: Browser test page (`app/tests/index.html`) with a tiny assertion helper; manual
walkthrough in [quickstart.md](quickstart.md). V2 adds or updates tests for REQ-03, REQ-05,
REQ-10, REQ-13 and REQ-20.

**Target Platform**: Current desktop Chrome, Firefox or Safari, served by `python3 -m http.server`

**Project Type**: Single front-end web app (prototype)

**Performance Goals**: Initial alerts timestamped at publish time (≤ 1 min, REQ-16); UI updates
feel instant (< 100 ms) for the seed size

**Constraints**: Mock data only; no network calls; no real messages; works offline from local files
served over localhost

**Scale/Scope**: 4 teams, ~25 families, 4 games; 3 persona views (admin, coach, parent) plus demo bar

No NEEDS CLARIFICATION items remain: the spec's V2 clarifications (2026-11-17) fixed the
behavioral choices, and the remaining design choices are resolved in research R-10…R-16.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Pre-research | Post-design |
|-----------|-------|--------------|-------------|
| I. Spec before implementation | Spec revised first (commit `9e04b27`), plan second; every planned V2 change maps to a CR and a REQ (REQ-01…REQ-20). Nothing extra: no "Reinstated" notice (CR-2 option A rejected), no informational follow-ups (OQ-4), no "Finished" state, no new clock controls | ✅ | ✅ |
| II. Stakeholder traceability | New D-6, D-7 and REQ-20 IDs exist in `docs/goal-model.md`; REQ-20 is labelled Assumption with its reason (OBS-8). New code must carry `// REQ-xx` (and the CR in comments where helpful) | ✅ | ✅ |
| III. Conflicts preserved | CF-3 urgent case kept unresolved (OQ-6); CR-2 and CR-8 decisions recorded with rejected alternatives; design builds the chosen option only | ✅ | ✅ |
| IV. Testable requirements | Every new spec scenario (US1 #10–13, US3 #6, US4 #8, US5 #4, US6 #8–9) has a quickstart step (V2 walkthroughs I–N) and a unit test | ✅ | ✅ |
| V. Scope discipline | No rides, coach records or schedule upkeep; G-13 stays out (cancellation final) | ✅ | ✅ |
| VI. Mock, never real | Delivery reports are simulated records in the same visible log; no network code | ✅ | ✅ |
| VII. Privacy by default | Per-child confirmation uses only `recipient.childIds`, which already exclude restricted children, so a restricted parent can never count for, or be listed with, that child (R-15). Started-game alerts and delivery reports reuse existing per-recipient content | ✅ | ✅ |
| VIII. Simplicity | Same single static app. Delivery reports are derived on each tick from `sent` records instead of a new scheduled-entity type (R-14); "started" is derived, not stored (R-13) | ✅ | ✅ |

**Gate result**: PASS, no violations. Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-game-change-notice/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0 (R-1…R-9 V1, R-10…R-16 V2)
├── data-model.md        # Phase 1 (V2 changes marked)
├── quickstart.md        # Phase 1 (V2 walkthroughs I–N added)
├── contracts/
│   ├── domain-api.md    # UI ↔ domain functions (V2 errors, changeType, queries)
│   └── ui-views.md      # what each persona sees and can do (V2 tags and hidden controls)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (V2 tasks appended by /speckit-converge)
```

### Source Code (repository root)

Unchanged layout; the V2 column names the files each change touches.

```text
app/
├── index.html
├── styles.css               # V2: "Started" tag style (CR-6)
├── src/
│   ├── main.js
│   ├── data/
│   │   └── seed.js          # V2: second unrestricted parent in Family O (R-9, US6 #6 in the UI)
│   ├── domain/
│   │   ├── store.js         # V2: gameStatusKind / isCancelled helper (CR-2, CR-6)
│   │   ├── clock.js         # V2: tick also processes delivery reports (CR-7)
│   │   ├── permissions.js   # V2: publish blocked on cancelled; heads-up blocked after FINAL (CR-1, CR-2)
│   │   ├── recipients.js    # unchanged
│   │   ├── notices.js       # V2: changeType moved, labels, new rejections (CR-1, CR-2, CR-5)
│   │   ├── delivery.js      # V2: sent + delivery reports; stop escalation at kickoff (CR-6, CR-7)
│   │   ├── confirmations.js # V2: per-child confirmation (CR-8)
│   │   ├── log.js           # V2: status `sent`, trigger `delivery-report`, `reportFor` (CR-7)
│   │   └── queries.js       # V2: started flag, same-day started games, alerts (CR-6)
│   └── ui/
│       ├── demoBar.js
│       ├── adminView.js     # V2: combined move form, new rejection messages, hide controls (CR-1, 2, 5, 6)
│       ├── coachView.js     # V2: hide heads-up after FINAL / when started (CR-1, CR-6)
│       ├── parentView.js    # V2: started games and started alerts (CR-6)
│       ├── components.js    # V2: "Started" tag, sent status, per-child receipt column (CR-6, 7, 8)
│       └── format.js
└── tests/
    ├── index.html
    ├── harness.js
    ├── fixtures.js
    ├── permissions.test.js  # V2: CR-1, CR-2, CR-6
    ├── recipients.test.js
    ├── notices.test.js      # V2: CR-1, CR-2, CR-5
    ├── delivery.test.js     # V2: CR-6, CR-7, CR-9 regression
    ├── confirmations.test.js# V2: CR-8 (Family E) + US6 #6 regression
    ├── queries.test.js      # V2: CR-6
    └── wording.test.js
```

**Structure Decision**: One front-end project under `app/`, kept apart from `docs/` (goal model)
and `specs/`. Domain modules are pure and DOM-free so they can be unit-tested; UI modules only
render and call the [domain API](contracts/domain-api.md). V2 changes stay inside existing modules.

## Complexity Tracking

Not applicable: the Constitution Check found no violations.
