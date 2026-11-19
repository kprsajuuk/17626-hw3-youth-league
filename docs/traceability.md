# Requirements Traceability Matrix

Two results are kept side by side. **V1 status** is the evaluation of tag `v1` (commit `0f11290`, 2026-11-16 and 2026-11-17). **V2 status** is the current implementation (tag `v2`, commit `8f6aa67`). The full V1 write-ups and screenshots remain in `docs/evaluation/v1/`.

Each row traces one requirement through four steps:

> stakeholder interview evidence → goal in the unified goal model (`docs/goal-model.md`) → requirement in `specs/001-game-change-notice/spec.md` → code that implements it

**How each requirement was checked**

- **Unit tests**: `app/tests/` (V2: 95 / 95 passed; V1: 72 / 72 passed).
- **Scripted walkthrough**: steps A1–H1 from `specs/001-game-change-notice/quickstart.md`, run in a real browser.
- **Exploratory probes**: X1–X6 (Member 1), plus the probes behind OBS-7 and OBS-8 (Member 2) and OBS-10 and OBS-11 (Member 3), also run in a real browser. Results are in `docs/evaluation/v1/` (one evaluation per team member, merged in `team-summary.md`).
- **Code review** of REQ-01…REQ-20 against `app/src/`. The V1 review covered REQ-01…REQ-19 (Member 2, OBS-9). REQ-20 was added in V2.

**Status meaning**

- **V1 status** and **V2 status** say whether that version meets the requirement as written in the spec at that version.
- A requirement can be fully satisfied but still leave its stakeholder goal only partly met. Those cases are flagged in the **Notes** column and explained as observations (OBS-x) in `docs/evaluation/v1/team-summary.md`.

**Citation format**

- `YH:` / `LN:` / `YG:` = the transcript set of Member 1 / Member 2 / Member 3.
- `B` / `M` / `R` = Brenda / Mike / Ray, followed by the turn number.

| Requirement | Interview evidence | Goal model reference | Code / implementation | Verified by | V1 status | V2 status | Notes |
|---|---|---|---|---|---|---|
| **REQ-01** Verification record (source and time) required before publishing | YH:B40, LN:B34, YG:B111 | G-03, D-1 | `domain/notices.js` `publishChange()` (verification check, `VERIFICATION_SOURCES`); `ui/adminView.js` publish form ("Verified with", "Confirmed at") | notices.test.js; walkthrough A2, A3 | Fully satisfied | Fully satisfied | The implementation also rejects a verification time later than "now". That rule is not in the spec (OBS-6). |
| **REQ-02** Only the administrator can publish or change official status | YH:B55, LN:B68, YG:B113 | G-04, G-05 (CF-2) | `domain/permissions.js` `can(…,'publish')`; `domain/notices.js` `publishChange()` (role check); `ui/coachView.js` and `ui/parentView.js` (no publish form) | permissions.test.js, notices.test.js; walkthrough A1 | Fully satisfied | Fully satisfied | Enforced in the domain layer, not just hidden in the UI. |
| **REQ-03** Change is cancelled, or moved (field, time, or both); a cancellation is final; entry shows old → new and an instruction | YG:R39, YG:M73, YH:M76 | G-11, G-12, G-14, D-2, D-7 | `domain/notices.js` `CHANGE_TYPES`, `publishChange()` (rejects a later change to a cancelled game, and accepts field, time, or both); `ui/adminView.js`; `ui/components.js` `gameDetail()` | notices.test.js; walkthrough A3, D1 | Fully satisfied | Fully satisfied | V1 let a cancelled game be moved (OBS-2) and needed two notices to change field and time (OBS-7). V2 writes both rules into the spec and rejects a further change with "This game is cancelled. A cancellation is final." |
| **REQ-04** Notice marked FINAL with author and time; replaces earlier notices and heads-ups | YH:R63, YH:B63 | G-10 | `domain/notices.js` `publishChange()` (supersede), `gameStatus()` (author, publishedAt), `noticeHistory()`; `ui/components.js` badges | notices.test.js, delivery.test.js; walkthrough A3, F3, H1 | Fully satisfied | Fully satisfied | |
| **REQ-05** Coach heads-up only while no FINAL notice exists; always UNCONFIRMED; superseded by FINAL | YH:R52, YH:R54, YH:B59, YG:R47 | G-07, G-08, D-6 (CF-1) | `domain/notices.js` `sendHeadsUp()` (rejects `official-decision-published` when `currentNoticeId` is set); `ui/coachView.js` `headsUpForm()` | notices.test.js, permissions.test.js; walkthrough F1, F3 | Partially satisfied | Fully satisfied | V1 was partially satisfied: a heads-up could be sent after FINAL (OBS-1). V2 rejects that attempt and does not offer the control. |
| **REQ-06** Every publish, heads-up and notice logged; log cannot be edited | YH:B63, LN:B48, YG:M73 | G-06 | `domain/log.js` `appendActivity()`, `appendDelivery()` (frozen entries, no update/delete); `domain/queries.js` `activityLog()`; admin "Activity log" tab | notices.test.js, permissions.test.js; walkthrough A4 | Fully satisfied | Fully satisfied | Rejected publish attempts are logged too. |
| **REQ-07** Final notices only to affected teams; heads-ups only to the coach's own team | YH:B46, YG:B111, YG:R20 | G-22 | `domain/recipients.js` `resolveRecipients()` | recipients.test.js, notices.test.js; walkthrough B1, F1 | Fully satisfied | Fully satisfied | |
| **REQ-08** Court-order-restricted parent excluded from the child's notices, views and lists | YH:B32, YG:B66 | G-23, G-24, G-25, D-4 | `domain/recipients.js` `isRestricted()`, `resolveRecipients()`; `domain/queries.js` `parentGames()`; `domain/confirmations.js` (confirmation counted per child) | recipients.test.js, confirmations.test.js; walkthrough B2, B3 | Fully satisfied | Fully satisfied | V1 met the exclusion, but one parent's confirmation covered the whole family, including a restricted child (OBS-10). V2 counts confirmation per child, so that confirmation does not cover the restricted child. |
| **REQ-09** In-app alert and email to every recipient on publish | YH:B49, YG:M73, YG:B20 | G-26, G-27 | `domain/delivery.js` `dispatchFinalNotice()`, `deliver()` | delivery.test.js; walkthrough B1 | Fully satisfied | Fully satisfied | |
| **REQ-10** Text if not confirmed within 5 min; immediately if urgent (≤ 2 h); confirmation is per child | YG:M73, YH:M23 | G-28, G-30 (CF-3), G-33, D-4 | `domain/delivery.js` `dispatchFinalNotice()`, `processDueEscalations()`; `domain/confirmations.js` `confirmReceipt()` (stops escalation per child) | delivery.test.js, confirmations.test.js; walkthrough C1, D2 | Fully satisfied | Fully satisfied | V2 follows the revised rule: a restricted parent's confirmation does not stop follow-up for that child (OBS-10), and coaches do receive texts (OBS-11). An urgent change can still send several messages at once; that trade-off is left open for Mike (OBS-3, CR-3), not treated as an unmet requirement. |
| **REQ-11** Urgent: call parents still unconfirmed after 2 min | YH:M23, YH:M67 | G-31, G-85 | `domain/delivery.js` `schedule()`, `CALL_DELAY`, `processDueEscalations()` (parents only, urgent only) | delivery.test.js, confirmations.test.js; walkthrough C2 | Fully satisfied | Fully satisfied | The 2-minute delay is a team assumption made during clarify. |
| **REQ-12** Recipient confirms receipt; alert stays prominent until then, unless the game has started | YG:M73, LN:M11 | G-34, G-35 | `domain/confirmations.js` `confirmReceipt()`; `domain/queries.js` `alertsFor()`; `ui/parentView.js` | confirmations.test.js; walkthrough C2, E3 | Fully satisfied | Fully satisfied | V1 left an unconfirmed alert under "Needs your confirmation" after kickoff (OBS-8). V2 moves those alerts out and stops further texts and calls (REQ-20). |
| **REQ-13** Coach and admin see per-recipient, per-channel status (sent / delivered / failed) and the not-confirmed list | YH:R31, LN:R23, YG:R41 | G-33, G-36, G-37 | `domain/log.js` (`sent`, `delivered`, `failed`); `domain/delivery.js` `channelResult()`; `domain/confirmations.js` `noticeStatus()`; `ui/components.js` `noticeStatusTable()` | confirmations.test.js, delivery.test.js; walkthrough C3, E3 | Partially satisfied | Fully satisfied | V1 was partially satisfied: "sent" never appeared (OBS-9), and one confirmation covered the whole family (OBS-10). V2 records "sent", then "delivered" or "failed", and keeps a family on the list until each affected child is confirmed. |
| **REQ-14** Wording claims only "receipt confirmed", never "read" or "seen" | YG:B100, YG:B111 | G-38 | `domain/confirmations.js` (summary text); `ui/parentView.js` | wording.test.js; walkthrough E3 | Fully satisfied | Fully satisfied | |
| **REQ-15** Parent sees all children's games, including games started earlier the same day, with current status in one view | YH:M65, LN:M9, YG:M42 | G-39 | `domain/queries.js` `parentGames()`; `ui/parentView.js`; `ui/components.js` ("Started") | queries.test.js; walkthrough G1 | Fully satisfied | Fully satisfied | V1 removed a game after kickoff and had no "Started" tag (OBS-8). V2 keeps it until the end of that day and tags it "Started" (REQ-20). |
| **REQ-16** Initial alerts dispatched within 1 min of publishing | YG:R47 | G-80 | `domain/delivery.js` `dispatchFinalNotice()` (called synchronously from `publishChange()`, timestamped at publish) | delivery.test.js; walkthrough B1 (all at 08:30) | Fully satisfied | Fully satisfied | Simulated time only; real delivery speed is not testable in a mock. |
| **REQ-17** One notice per change per channel per parent, naming every child; FINAL replaces heads-up | YG:M77, YG:M84, YG:M116 | G-82, G-83, G-85 | `domain/recipients.js` `resolveRecipients()` (one entry per parent, all children); `domain/delivery.js` `renderNoticeContent()`, `dispatchHeadsUp()` (no escalation); `domain/queries.js` `alertsFor()` | recipients.test.js, notices.test.js; walkthrough B4, F3 | Fully satisfied | Fully satisfied | **Goal tension with G-85:** see OBS-3. |
| **REQ-18** *(assumption)* Children shown as first name + last initial; no addresses | — (Constitution VII) | supports G-23 | `domain/recipients.js` `childDisplayName()`; `data/seed.js` (no address field) | wording.test.js, delivery.test.js; walkthrough B5 | Fully satisfied | Fully satisfied | |
| **REQ-19** *(assumption)* Persona switch and demo clock; permissions still enforced | — (demo support) | — | `ui/demoBar.js` (persona switch, +1/+5 min, reset); `domain/clock.js` `advanceClock()`; `domain/store.js` `resetDemo()`; `domain/permissions.js` `can()` | permissions.test.js | Fully satisfied | Fully satisfied | |
| **REQ-20** *(new in V2; assumption from OBS-8)* A started game is tagged "Started"; publish and heads-up are refused; unconfirmed alerts stop escalating | — (V1 evaluation OBS-8; OQ-7) | G-11, G-02, G-39, G-85 | `domain/store.js` `gameStarted()`; `domain/notices.js` `publishChange()`, `sendHeadsUp()`; `domain/queries.js` `alertsFor()`, `parentGames()`; `ui/components.js` | notices.test.js, queries.test.js | Not in V1 | Fully satisfied | Not in V1. V2 keeps a started game visible until the end of that day and stops further confirmation prompts, texts, and calls. |

## Summary

| | Count |
|---|---|
| Requirements | 20 (17 from stakeholder evidence, 3 assumptions; REQ-20 added in V2) |
| Fully satisfied in V1 | 17 of 19 |
| Partially satisfied in V1 | 2 (REQ-05, REQ-13) |
| Fully satisfied in V2 | 20 |
| Partially satisfied in V2 | 0 |
| Not satisfied | 0 |
| V1 findings that V2 changed in the spec and the code | REQ-03 (OBS-2, OBS-7), REQ-05 (OBS-1), REQ-08 / REQ-10 / REQ-13 (OBS-10), REQ-12 / REQ-15 (OBS-8), REQ-13 (OBS-9) |
| Left as an open stakeholder question, not an unmet requirement | Urgent messages can still arrive together (OBS-3, CR-3) |

V1 met 17 of 19 requirements as they were then written. REQ-05 and REQ-13 were only partial. The other problems were gaps in the specification. V2 revised the spec first, then the code. Against the revised spec, REQ-01 through REQ-20 are fully satisfied. The V1 observations and screenshots remain in `docs/evaluation/v1/`.

## Not yet verified

These success criteria need real users and timing: SC-001 (publish in under 2 minutes), SC-003 (a parent understands the status within 15 seconds) and SC-004 (a coach finds the families who have not confirmed within 30 seconds).
