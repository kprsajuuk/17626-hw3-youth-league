# Implementation Plan: Game Change Notice

**Branch**: `001-game-change-notice` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-game-change-notice/spec.md`

## Summary

The administrator publishes one verified official status for a game (cancelled, field move, time
move). The prototype then sends simulated notices only to eligible families of the affected
teams, never to court-order-restricted parents. It escalates by text and call, and shows coaches
who has confirmed receipt. Coaches can send UNCONFIRMED heads-ups that a later FINAL notice
supersedes.

Technical approach (see [research.md](research.md)): a static, no-build single-page app in plain
HTML/CSS/JavaScript modules. It has an in-memory store seeded with mock data, a demo clock that
drives scheduled escalations, and pure domain modules that hold all rules (permissions,
recipients and privacy, delivery, confirmation). The domain modules have browser-run unit tests.

## Technical Context

**Language/Version**: JavaScript (ES2020 modules), HTML5, CSS3

**Primary Dependencies**: None (no framework, no CDN, no build tool)

**Storage**: In-memory only; seed module reloaded on page load or "Reset demo"

**Testing**: Browser test page (`app/tests/index.html`) with a tiny assertion helper; manual
walkthrough in [quickstart.md](quickstart.md)

**Target Platform**: Current desktop Chrome, Firefox or Safari, served by `python3 -m http.server`

**Project Type**: Single front-end web app (prototype)

**Performance Goals**: Initial alerts timestamped at publish time (≤ 1 min, REQ-16); UI updates
feel instant (< 100 ms) for the seed size

**Constraints**: Mock data only; no network calls; no real messages; works offline from local files
served over localhost

**Scale/Scope**: 4 teams, ~25 families, 3–4 games; 3 persona views (admin, coach, parent) plus demo bar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Pre-research | Post-design |
|-----------|-------|--------------|-------------|
| I. Spec before implementation | Every planned behavior maps to REQ-01…REQ-19; nothing extra (no settings panel, no withdraw, no data editor) | ✅ | ✅ |
| II. Stakeholder traceability | Spec IDs and citations checked against `docs/goal-model.md`: every G/D/O/CF ID and every interview citation is found there. Source files will carry `// REQ-xx` comments (task rule) | ✅ | ✅ |
| III. Conflicts preserved | CF-1…CF-3 decisions realized (heads-up, admin-only publish, text fallback); CF-4…CF-8 untouched (deferred areas) | ✅ | ✅ |
| IV. Testable requirements | Each REQ has a spec scenario and a quickstart step; domain rules also have unit tests | ✅ | ✅ |
| V. Scope discipline | No rides, coach records or schedule upkeep in the structure or data model | ✅ | ✅ |
| VI. Mock, never real | No network code; channels write DeliveryRecords only; visible delivery log; demo banner | ✅ | ✅ |
| VII. Privacy by default | Single `resolveRecipients` path for notices and heads-ups; restricted parents excluded before any message or log is created; child names via one helper; no address field exists | ✅ | ✅ |
| VIII. Simplicity | One static app, no backend, no dependencies | ✅ | ✅ |

**Gate result**: PASS, no violations. Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-game-change-notice/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── domain-api.md    # UI ↔ domain functions
│   └── ui-views.md      # what each persona sees and can do
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── index.html               # shell: demo bar + view container
├── styles.css               # FINAL / UNCONFIRMED / Superseded styles (REQ-05)
├── src/
│   ├── main.js              # boot: create store from seed, render, start clock
│   ├── data/
│   │   └── seed.js          # mock league fixtures (research R-9)
│   ├── domain/
│   │   ├── store.js         # state container, subscribe/notify, resetDemo
│   │   ├── clock.js         # demo clock, advance, tick (REQ-19)
│   │   ├── permissions.js   # can() (REQ-02, REQ-05)
│   │   ├── recipients.js    # resolveRecipients, childDisplayName (REQ-07, 08, 17, 18)
│   │   ├── notices.js       # publishChange, sendHeadsUp, gameStatus, supersede (REQ-01…06)
│   │   ├── delivery.js      # channel dispatch, escalation scheduling (REQ-09, 10, 11, 16)
│   │   ├── confirmations.js # confirmReceipt, noticeStatus, summary wording (REQ-12, 13, 14)
│   │   ├── log.js           # append-only activity + delivery logs (REQ-06)
│   │   └── queries.js       # parentGames, alertsFor, deliveryLog, activityLog (REQ-15)
│   └── ui/
│       ├── demoBar.js       # persona switch, clock controls, banner
│       ├── adminView.js
│       ├── coachView.js
│       ├── parentView.js
│       ├── components.js    # status badge, game card, notice status table, log table
│       └── format.js        # time and label formatting
└── tests/
    ├── index.html           # runs all tests in the browser
    ├── harness.js           # test(), assertEqual(), report
    ├── fixtures.js          # small seed variants
    ├── permissions.test.js
    ├── recipients.test.js
    ├── notices.test.js
    ├── delivery.test.js
    ├── confirmations.test.js
    └── wording.test.js      # REQ-14 forbidden words, REQ-18 name format
```

**Structure Decision**: One front-end project under `app/`, kept apart from `docs/` (goal model)
and `specs/`. Domain modules are pure and DOM-free so they can be unit-tested; UI modules only
render and call the [domain API](contracts/domain-api.md).

## Complexity Tracking

Not applicable: the Constitution Check found no violations.
