# Requirements Traceability Matrix — Prototype V1

Version: **V1** (commit `0f11290`, to be tagged `v1`). Evaluated 2026-11-16.

Each row traces one requirement through four steps:

> stakeholder interview evidence → goal in the unified goal model (`docs/goal-model.md`) → requirement in `specs/001-game-change-notice/spec.md` → code that implements it

**How each requirement was checked**

- **Unit tests**: `app/tests/` (72 / 72 passed).
- **Scripted walkthrough**: steps A1–H1 from `specs/001-game-change-notice/quickstart.md`, run in a real browser.
- **Exploratory probes**: X1–X6, also run in a real browser. Results are in `docs/evaluation/v1/` (one evaluation per team member, merged in `team-summary.md`).

**Status meaning**

- **Status** says whether the prototype meets the requirement *as written in the spec*.
- A requirement can be fully satisfied but still leave its stakeholder goal only partly met. Those cases are flagged in the **Notes** column and explained as observations (OBS-x) in `docs/evaluation/v1/team-summary.md`.

**Citation format**

- `YH:` / `LN:` / `YG:` = the transcript set of Member 1 / Member 2 / Member 3.
- `B` / `M` / `R` = Brenda / Mike / Ray, followed by the turn number.

| Requirement | Interview evidence | Goal model reference | Code / implementation | Verified by | Status | Notes |
|---|---|---|---|---|---|---|
| **REQ-01** Verification record (source and time) required before publishing | YH:B40, LN:B34, YG:B111 | G-03, D-1 | `domain/notices.js` `publishChange()` (verification check); `ui/adminView.js` publish form ("Verified with", "Confirmed at") | notices.test.js; walkthrough A2, A3 | Fully satisfied | The implementation also rejects a verification time later than "now". That rule is not in the spec (OBS-6). |
| **REQ-02** Only the administrator can publish or change official status | YH:B55, LN:B68, YG:B113 | G-04, G-05 (CF-2) | `domain/permissions.js` `can(…,'publish')`; `domain/notices.js` `publishChange()` (role check); `ui/coachView.js` and `ui/parentView.js` (no publish form) | permissions.test.js, notices.test.js; walkthrough A1 | Fully satisfied | Enforced in the domain layer, not just hidden in the UI. |
| **REQ-03** Change is cancelled / moved field / moved time; entry shows old → new and an instruction | YG:R39, YG:M73, YH:M76 | G-11, G-12, G-14, D-2 | `domain/notices.js` `publishChange()`, `noticeLabel()`, `gameStatus()`; `ui/components.js` `gameDetail()` | notices.test.js; walkthrough A3, D1 | Fully satisfied | The spec does not say which changes are allowed after a cancellation, so a cancelled game can be "moved" (OBS-2). The "change must differ" rule is not in the spec (OBS-6). |
| **REQ-04** Notice marked FINAL with author and time; replaces earlier notices and heads-ups | YH:R63, YH:B63 | G-10 | `domain/notices.js` `publishChange()` (supersede), `noticeHistory()`; `ui/components.js` badges | notices.test.js, delivery.test.js; walkthrough A3, F3, H1 | Fully satisfied | |
| **REQ-05** Coach heads-up, always UNCONFIRMED, never official, superseded by FINAL | YH:R52, YH:R54, YH:B59, YG:R47 | G-07, G-08 (CF-1) | `domain/notices.js` `sendHeadsUp()`, `headsUpsFor()`; `domain/delivery.js` `dispatchHeadsUp()`; `ui/coachView.js` `headsUpForm()` | notices.test.js, permissions.test.js, queries.test.js; walkthrough F1, F3 | Fully satisfied | **Goal only partly met:** a heads-up can still be sent *after* a FINAL notice, which contradicts G-07's condition "If ChangePending" (OBS-1). |
| **REQ-06** Every publish, heads-up and notice logged; log cannot be edited | YH:B63, LN:B48, YG:M73 | G-06 | `domain/log.js` `appendActivity()`, `appendDelivery()`; `domain/queries.js` `activityLog()`; admin "Activity log" tab | notices.test.js, permissions.test.js; walkthrough A4 | Fully satisfied | Rejected publish attempts are logged too. |
| **REQ-07** Final notices only to affected teams; heads-ups only to the coach's own team | YH:B46, YG:B111, YG:R20 | G-22 | `domain/recipients.js` `resolveRecipients()` | recipients.test.js, notices.test.js; walkthrough B1, F1 | Fully satisfied | |
| **REQ-08** Court-order-restricted parent excluded from the child's notices, views and lists | YH:B32, YG:B66 | G-23, G-24, G-25, D-4 | `domain/recipients.js` `isRestricted()`, `resolveRecipients()`; `domain/queries.js` `parentGames()`; `domain/confirmations.js` `noticeStatus()` | recipients.test.js and 4 other test files; walkthrough B2, B3, F1 | Fully satisfied | Parent X never appears in any view; parent W sees only Emma. |
| **REQ-09** In-app alert and email to every recipient on publish | YH:B49, YG:M73, YG:B20 | G-26, G-27 | `domain/delivery.js` `dispatchFinalNotice()`, `deliver()` | delivery.test.js; walkthrough B1 | Fully satisfied | |
| **REQ-10** Text if not confirmed within 5 min; immediately if urgent (≤ 2 h) | YG:M73, YH:M23 | G-28, G-30 (CF-3), O-1 | `domain/delivery.js` `dispatchFinalNotice()`, `processDueEscalations()`, `TEXT_DELAY`; `domain/notices.js` `URGENT_WINDOW` | delivery.test.js, confirmations.test.js; walkthrough C1, D2 | Fully satisfied | **Goal tension:** an urgent change sends three identical messages at once, plus a call (OBS-3). |
| **REQ-11** Urgent: call parents still unconfirmed after 2 min | YH:M23, YH:M67 | G-31 | `domain/delivery.js` `schedule()`, `CALL_DELAY`, `processDueEscalations()` | delivery.test.js, confirmations.test.js; walkthrough C2 | Fully satisfied | The 2-minute delay is a team assumption made during clarify. |
| **REQ-12** Recipient confirms receipt; alert stays prominent until then | YG:M73, LN:M11 | G-34, G-35 | `domain/confirmations.js` `confirmReceipt()`; `ui/components.js` `alertCard()`; `ui/parentView.js` | confirmations.test.js; walkthrough C2, E3 | Fully satisfied | |
| **REQ-13** Coach and admin see per-recipient, per-channel status and the not-confirmed list | YH:R31, LN:R23, YG:R41 | G-33, G-36, G-37 | `domain/confirmations.js` `noticeStatus()`; `domain/queries.js` `deliveryLog()`; `ui/components.js` `noticeStatusTable()`, `deliveryLogTable()` | confirmations.test.js, permissions.test.js; walkthrough C3, E3 | Fully satisfied | Missing contact details are shown as "failed – no phone/email on file". |
| **REQ-14** Wording claims only "receipt confirmed", never "read" or "seen" | YG:B100, YG:B111 | G-38 | `domain/confirmations.js` (summary text); `ui/parentView.js` | wording.test.js; walkthrough E3 | Fully satisfied | |
| **REQ-15** Parent sees all children's games with current status in one view | YH:M65, LN:M9, YG:M42 | G-39 | `domain/queries.js` `parentGames()`; `ui/parentView.js` | queries.test.js; walkthrough G1 | Fully satisfied | |
| **REQ-16** Initial alerts dispatched within 1 min of publishing | YG:R47 | G-80 | `domain/delivery.js` `dispatchFinalNotice()` (timestamped at publish) | delivery.test.js; walkthrough B1 (all at 08:30) | Fully satisfied | Simulated time only; real delivery speed is not testable in a mock. |
| **REQ-17** One notice per change per channel per parent, naming every child; FINAL replaces heads-up | YG:M77, YG:M84, YG:M116 | G-82, G-83, G-85 | `domain/recipients.js` `resolveRecipients()`; `domain/queries.js` `alertsFor()` | recipients.test.js, notices.test.js; walkthrough B4, F3 | Fully satisfied | **Goal tension with G-85:** see OBS-3. |
| **REQ-18** *(assumption)* Children shown as first name + last initial; no addresses | — (Constitution VII) | supports G-23 | `domain/recipients.js` `childDisplayName()`; `data/seed.js` (no address field) | wording.test.js, delivery.test.js; walkthrough B5 | Fully satisfied | |
| **REQ-19** *(assumption)* Persona switch and demo clock; permissions still enforced | — (demo support) | — | `ui/demoBar.js`; `domain/clock.js` `advanceClock()`; `domain/store.js` `resetDemo()` | permissions.test.js | Fully satisfied | |

## Summary

| | Count |
|---|---|
| Requirements | 19 (17 from stakeholder evidence, 2 assumptions) |
| Fully satisfied (as specified) | 19 |
| Partially satisfied / not satisfied | 0 |
| Requirements whose **stakeholder goal** is only partly met | 3 (REQ-05 → OBS-1, REQ-03 → OBS-2, REQ-10 / REQ-17 → OBS-3) |
| Implementation defects found | 0 |
| Requirements issues found | 6 (see `docs/evaluation/v1/team-summary.md`) |

Every requirement is met as written. The problems found are gaps or tensions **in the specification itself**, not coding errors. This is the expected outcome of spec-driven development: the agent built exactly what the spec said, so evaluation shows where the spec was incomplete. These findings feed the V2 revision.

## Not yet verified

These success criteria need real users and timing: SC-001 (publish in under 2 minutes), SC-003 (a parent understands the status within 15 seconds) and SC-004 (a coach finds the families who have not confirmed within 30 seconds).
