# Prototype V1 Evaluation — Member 2

**Evaluator:** Member 2. OBS-7 and OBS-8 come from Member 2's own use of the prototype. The screenshots for OBS-7 and OBS-8 were captured afterwards with a Claude-assisted headless browser (Playwright, Chromium) against tag `v1`, following the steps described below. OBS-9 comes from a Claude-assisted review of the code against `spec.md`, which Member 2 checked.
**Version evaluated:** tag `v1`. Run it with `python3 -m http.server 8000 --directory app` and open <http://localhost:8000/>.
**Team summary:** [`../team-summary.md`](../team-summary.md). The OBS IDs below are team IDs.

> Write this evaluation from your own use of the prototype. Put screenshots in [`screenshots/`](screenshots/). Number your observations with team IDs (OBS-n): take the next free number in the team summary and add your row there as `OBS-n (M2)`. Gaps in the numbering are fine.

## How I evaluated

- Walkthrough steps followed (see `specs/001-game-change-notice/quickstart.md`)
- Extra situations I tried (things a stakeholder might plausibly do that the spec may not cover):
  - Brenda needs to move a game to another field **and** another time (OBS-7).
  - Looking at a game after its kickoff time has passed, as Brenda, Ray and a parent (OBS-8).
- Code review: each requirement REQ-01…REQ-19 was checked against the code in `app/src/` (OBS-9; results are in `docs/traceability.md`).

## Observations

### OBS-7 — Field and time cannot be changed in one notice

- **What I did:** As Brenda, I opened the publish form to move a game to another field and another time at once (e.g. Field 3 at 10:00 → Field 7 at 13:00).
- **What I saw:** The change type is a single choice (radio buttons): cancelled, moved field or moved time. Moving both takes two FINAL notices in a row. The second notice supersedes the first, so every family gets two alerts, and the 5-minute text and 2-minute call timers start over. (screenshots: `screenshots/OBS-7_one_change_type_only.png` shows the single-choice form; `screenshots/OBS-7_admin_two_final_notices.png` and `screenshots/OBS-7_mike_two_alerts.png` show the result of moving Field 3 → Field 7 and then 10:00 → 13:00: Mike has one current FINAL notice and one superseded FINAL notice for the same real-world change.)
- **Classification:** requirements issue. REQ-03 says a change "MUST be one of: cancelled, moved to another field, moved to another time". The code follows that exactly (`CHANGE_TYPES` and `publishChange()` in `domain/notices.js`; the radio group in `ui/adminView.js`).
- **Goal(s) affected:** G-14 *OldAndNewDetailsAndActionShown*, G-85 *DuplicateAndTrivialNotifications* (YG:M77), G-02 *OfficialStatusClearAndCurrent*.
- **What needs to change:** spec change. REQ-03: "moved" can change the field, the time, or both, in one notice. This also matches CR-2's "Reinstated", which already allows "a new field and/or time". Team decision; no stakeholder clarification needed. **Decided 2026-11-16: adopted (CR-5).**
- **Same as an existing team observation?** New (CR-5).

### OBS-8 — Games that have started have no visible tag

- **What I did:** Advanced the demo clock past a game's kickoff, then looked at the game as Brenda, Ray and a parent.
- **What I saw:**
  - Brenda and Ray see no "Started" or "In progress" tag. They only find out when an attempt fails with "This game has already started…".
  - Parents don't see the game at all, because `parentGames()` hides games whose kickoff has passed.
  - An unconfirmed FINAL alert for that game stays under "Needs your confirmation", because `alertsFor()` ignores time.

  (screenshots, demo clock at Sat 10:01 after a FINAL field move for the 10:00 U10 game: `screenshots/OBS-8_admin_no_started_tag.png`: Brenda sees only "FINAL" and "Kickoff has passed — no changes can be published" inside the opened game; the 07:00 game still reads "As scheduled". `screenshots/OBS-8_coach_no_started_tag.png`: Ray's list shows no started tag. `screenshots/OBS-8_mike_game_gone_alert_still_open.png`: Max's U10 game is gone from Mike's "My children's games", but its alert is still under "Needs your confirmation (1)".)
- **Classification:** requirements issue (missing information). No requirement says how a started game is shown or what happens to its unconfirmed alerts. The code blocks changes after kickoff (`gameStarted()` in `domain/store.js`) but has no spec to follow for the display.
- **Goal(s) affected:** G-11 *GameEntryShowsCurrentStatus*, G-02 *OfficialStatusClearAndCurrent*, G-39 *EachChildGameStatusInOneView*, G-85.
- **What needs to change:** a spec change (new requirement: a "Started" tag in every view, and alerts for started games stop asking for confirmation) **and stakeholder clarification**. There is no interview evidence, so ask Brenda / Ray whether a started game and its change history still matter (OQ-7). **Decided 2026-11-16: adopted in full (CR-6, new REQ-20); parents still see a started game until the end of that day.**
- **Same as an existing team observation?** New (CR-6).

### OBS-9 — Delivery status has no "sent" state

- **What I did:** Compared REQ-13 with the delivery code and the status tables shown to Brenda and Ray.
- **What I saw:** REQ-13 asks for per-channel status "sent / delivered / failed". `domain/log.js` only allows `delivered` and `failed`, so "sent" never appears.
- **Classification:** implementation defect. The spec is clear and the code does not match it. The requirement is otherwise met (coach/admin scoping, receipt confirmation, not-confirmed list), so `docs/traceability.md` marks REQ-13 as *Partially satisfied*.
- **Goal(s) affected:** G-33, G-36.
- **What needs to change:** either an implementation correction (add "sent"), or, as proposed, a spec change: in a simulation every message is sent and delivered at the same instant, so drop "sent" from REQ-13 and state that assumption (fits in CR-4). **Decided 2026-11-16: fix the code (CR-7).** The simulated delivery timing is added to the spec as an assumption.
- **Same as an existing team observation?** New.

### Also confirmed: OBS-1

The code review also confirmed OBS-1. `sendHeadsUp()` does not check for a current FINAL notice. A heads-up sent after a FINAL notice stays `active` and is never shown as superseded, because only `publishChange()` supersedes heads-ups. `docs/traceability.md` marks REQ-05 as *Partially satisfied* for this reason.
