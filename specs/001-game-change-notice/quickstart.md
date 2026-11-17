# Quickstart: Game Change Notice

How to run the prototype and check that it meets [spec.md](spec.md). Screens are described in
[contracts/ui-views.md](contracts/ui-views.md); seed fixtures in [research.md](research.md) R-9.
**(V2)** marks steps changed or added for V2 (CR-1…CR-9).

## Prerequisites

- A modern browser (Chrome, Firefox, Safari).
- `python3` (preinstalled on macOS) to serve static files. No Node, no install step.

## Run

From the repository root:

```bash
python3 -m http.server 8000 --directory app
```

- App: <http://localhost:8000/>
- Unit tests: <http://localhost:8000/tests/> (every line should be green; each test is named
  after its REQ, and V2 tests also name their CR)

The demo starts at **Sat 08:30**. Press **Reset demo** between walkthroughs.

After editing source files, do a hard reload (Cmd+Shift+R) or disable the browser cache: the
simple Python server lets the browser keep old JavaScript modules, so a plain reload can run
stale code.

## Walkthrough checks

Each check maps to spec scenarios. Expected results must match exactly.

*(V2, CR-7)* Everywhere below, a channel that "receives" a message first shows **sent**; after
**+1 min** it shows **delivered**. Missing contacts show **failed** at once. Steps that only say
"in-app + email" accept either sent or delivered.

### A. Publish rules (User Story 1)
1. Persona **Coach – U10 Blue** → open *U10 Blue vs U10 Red, 10:00, Field 3*. Expect: no publish
   form. (REQ-02)
2. Persona **Brenda** → same game → choose *Moved*, new field *Field 7* (kickoff unchanged), leave
   verification empty → Publish. Expect: blocked, message says a verification record is
   required; status still "As scheduled". (REQ-01)
3. Set verification *Parks Department, 08:20* → Publish. Expect: "FINAL – Moved: Field 3 →
   Field 7", author Brenda, time 08:30, instruction, verification shown. (REQ-03, REQ-04)
4. Activity log: one rejected attempt and one publish, no edit/delete controls. (REQ-06)
5. Past game (*07:00*) offers no publish form *(V2: tagged "Started", note "This game has
   already started.")*. (REQ-20)

### B. Recipients and privacy (User Story 2) — continue from A
1. Delivery log: in-app + email for every U10 Blue and U10 Red recipient at 08:30; nothing for
   any U12 family. (REQ-07, REQ-09, REQ-16)
2. Parent **Xavier (Family B)** does not appear in the log; persona Xavier shows no U10 Blue game.
   (REQ-08)
3. Persona **Wes (Family E)**: the notice names only Emma E. (REQ-08)
4. Persona **Dana (Family D)**: one alert naming both children; the log has one entry per channel
   for that parent *(V2: plus one delivery-report entry per channel after +1 min)*. (REQ-17)
5. Children appear as first name + last initial everywhere. (REQ-18)

### C. Urgent escalation (User Story 6) — continue from A (kickoff 10:00 is 90 min away)
1. Log shows a text for every recipient (parents and both coaches) at 08:30 and no calls yet.
   (REQ-10)
2. As **Mike**, Confirm receipt. Press **+1 min**, then **+1 min**. Expect: calls at 08:32 to
   every recipient parent whose named children are not all confirmed; none to Mike; none to any
   coach. (REQ-11, CR-8, CR-9)
3. The family with no phone shows text and call as *failed*. (REQ-13)

### D. Non-urgent escalation — Reset demo
1. Brenda publishes a verified move of *U12 Red vs U12 Gold* to 13:00 (field unchanged; tomorrow
   10:00 → 13:00). Expect: label "FINAL – Time changed: Sun 10:00 → Sun 13:00"; in-app + email
   only, no text, no call. (REQ-03, REQ-10, REQ-11)
2. As one U12 Red parent, confirm receipt. Press **+5 min**. Expect: texts to every unconfirmed
   recipient, including both coaches *(V2, US6 #9)*; none to the confirmed parent; no calls.
   (REQ-10)

### E. Coach status (User Story 3) — Reset demo
1. Brenda publishes a verified cancellation for the U10 Blue game.
2. Confirm receipt as 8 of the 10 U10 Blue families (one parent each; for Family B use Yolanda,
   for Family E use Erin).
3. Persona **Coach – U10 Blue** → notice status. Expect: "8 of 10 confirmed receipt" and the
   2 remaining families listed; no "read"/"seen" wording. (REQ-13, REQ-14)

### F. Heads-up (User Story 4) — Reset demo
1. Persona **Coach – U10 Blue** sends "Field 3 may close due to rain". Expect: U10 Blue families
   (except Xavier) get it labelled UNCONFIRMED; U10 Red families get nothing; official status
   unchanged. (REQ-05, REQ-07, REQ-08)
2. Coach – U10 Blue has no heads-up control on U12 games. (REQ-05)
3. Brenda publishes a verified field move for the same game. Expect: heads-up marked
   Superseded; parents see one current FINAL alert. (REQ-04, REQ-05, REQ-17)

### G. Parent combined view (User Story 5) — continue from F or Reset
1. Brenda also publishes a change to *U12 Red vs U12 Gold*. Persona **Mike**: both games appear
   with their FINAL labels; any unchanged game says "As scheduled". *(V2)* The 07:00 game of
   Mike's U12 Red child is also listed, tagged "Started". (REQ-15, REQ-20)

### H. Two changes before confirmation (Edge case) — Reset demo
1. Brenda publishes a field move, then a cancellation for the same game. Expect: the first notice
   is Superseded; only "FINAL – Cancelled" is current; escalations for the first notice are
   cancelled. (REQ-04, REQ-10) *(V2: still allowed; only the reverse order is blocked.)*

### I. (V2, CR-1) No heads-up after FINAL — continue from A
1. Persona **Coach – U10 Blue** → open the U10 game. Expect: no heads-up form; note "An official
   decision has already been published." (US4 #8)
2. Browser console (domain call) as the coach: `sendHeadsUp(…, { gameId: 'g-u10', message: 'x' })`
   → `{ ok: false, error: 'official-decision-published' }`; activity log shows a
   `heads-up-rejected` entry. (REQ-05, REQ-06)

### J. (V2, CR-2) A cancellation is final — Reset demo
1. Brenda publishes a verified cancellation for the U10 game. Then reopens it. Expect: no publish
   form; note "This game is cancelled. A cancellation is final." (US1 #10)
2. Console publish of a move for `g-u10` → `{ ok: false, error: 'game-cancelled' }`. Persona
   **Mike** still shows "FINAL – Cancelled". (REQ-03)

### K. (V2, CR-4, CR-5) Validation and combined move — Reset demo
1. Brenda → U10 game → *Moved*, field *Field 3*, kickoff unchanged → Publish. Expect: blocked,
   explains nothing changed. Kickoff 08:00 → blocked, kickoff must be in the future.
   Verification time 09:00 (later than now) → blocked. Status unchanged each time. (US1 #12)
2. *Moved*, field *Field 7*, kickoff *13:00*, valid verification → Publish. Expect: one notice
   labelled "FINAL – Moved: Field 3, 10:00 → Field 7, 13:00"; the delivery log has exactly one
   `publish` record per recipient per channel. The change is urgent (urgency uses the sooner of
   the old and new kickoff, 10:00), so texts also appear at 08:30. (US1 #11, REQ-10)

### L. (V2, CR-6) Started games — Reset demo
1. Brenda publishes a verified time move of the U10 game to **08:40** (Field 3). Do not confirm
   as Mike.
2. Press **+5 min** twice (clock 08:40). Expect for Brenda and Coach – U10 Blue: the game is
   tagged "Started"; no publish or heads-up control. (US1 #13)
3. Persona **Mike**: the game is still listed, tagged "Started"; its alert is not under "Needs
   your confirmation" but under Earlier messages with "Game started – no confirmation needed".
   (US5 #4)
4. Delivery log: calls due at 08:32 were sent (before kickoff); after 08:40 no further text or
   call appears for this notice, however far the clock is advanced. (REQ-10, REQ-20)

### M. (V2, CR-7) Sent → delivered — Reset demo
1. Brenda publishes any verified change to the U12 game. Open its notice status at once. Expect:
   in-app and email show **sent** (Family F's email shows **failed (No email on file)**).
2. Press **+1 min**. Expect: in-app and email show **delivered**; the delivery log has new
   "delivery report" records at publish + 1 min; the original `sent` records are unchanged.
   (US3 #6, REQ-06)

### N. (V2, CR-8) Per-child confirmation — Reset demo
1. Brenda publishes a verified field move of the U10 game (urgent).
2. Persona **Wes** → Confirm receipt (his notice names only Emma E.). Press **+1 min** twice.
3. Expect: no call to Wes; persona **Erin** still has the alert under "Needs your confirmation"
   and the log shows a call to Erin at 08:32. Coach – U10 Blue status: Family E is not
   confirmed, listed as "Erin Evans — Eli E."; Wes is never shown next to Eli. (US6 #8)
4. Regression (US6 #6, two unrestricted parents) — Reset demo. Brenda publishes a verified
   (non-urgent) change to the U12 game. Press **+1 min** twice; as **Olga (Family O)** Confirm
   receipt. Press **+5 min**. Expect: no text to Olga or Omar; Omar's alert shows receipt
   confirmed; Coach – U12 Red lists Family O as confirmed. (REQ-10, REQ-13)

## Last validated

**2026-11-16** (V1 build, all tasks T001–T064):

- Unit tests: **72 / 72 passed** at <http://localhost:8000/tests/> (every REQ-01…REQ-19 has at least one named test).
- Walkthroughs A1–A5, B1–B5, C1–C3, D1–D2, E3, F1–F3, G1, H1: **all passed**. They were run against the live app (UI controls plus domain calls in the browser console).
- Privacy audit: all 27 personas, every tab and every opened game, after a scenario with heads-ups, two FINAL notices, confirmations and escalations. No child full names, no addresses, the restricted parent X is absent from every other view and log, and W never sees Eli.
- Scope audit: no network calls, CDN links or out-of-scope features in `app/src`.
- Not yet validated (they need real test users and timing): SC-001 (publish in under 2 min), SC-003 (status understood in 15 s) and SC-004 (coach finds non-confirmers in 30 s).
- Observed spec gap (fixed in spec V2, CR-4): spec User Story 1 scenario 6 used Saturday; the seed schedules the U12 game on Sunday.

**2026-11-17** (V2 build, Phase 10 tasks T065–T074):

- Unit tests: **95 / 95 passed** at <http://localhost:8000/tests/>, in headless Chrome and under
  Node with a DOM stub. REQ-01…REQ-20 each have at least one named test; V2 tests also name
  their CR. Rerunning the new US6 #8 test against the V1 confirmation code fails it (OBS-10
  reproduced).
- Walkthroughs A–N: **all passed** as scripted checks (domain calls plus rendered views, the
  same method as V1), 825 checks including the privacy audit. A hands-on click-through by a
  team member is still recommended before the V2 evaluation.
- Privacy audit: all 28 personas (Olga Ortiz added), every tab and every opened game, after a
  scenario with a heads-up, a combined move, a cancellation, per-child confirmations, escalations
  and delivery reports. No child full names, no addresses, Xavier absent from every other view,
  Wes never sees Eli and is never listed next to Eli, no "read"/"seen" wording.
- Scope audit: no network calls, CDN links or out-of-scope features in `app/`.
- Still not validated (they need real test users and timing): SC-001, SC-003, SC-004.
- Observed spec gap (for the next spec revision, Constitution I): REQ-20 tags *every* game past
  its kickoff as "Started", including a cancelled game, which then shows "FINAL – Cancelled" next
  to "Started". The code follows the spec as written.

## Success-criteria checks

| SC | How to check |
|----|--------------|
| SC-001 | Time step A3 (and *(V2)* K2) from opening the game: under 2 minutes |
| SC-002 | Steps B1–B3, F1 and *(V2)* N3 |
| SC-003 | Show a test user Mike's view after G1 *(V2: and after L3)*; they name status, change and action in ≤ 15 s per game |
| SC-004 | Step E3 *(V2: and N3)*: coach names the unconfirmed families in ≤ 30 s |
| SC-005 | Steps B1 and C1–C2 timestamps (initial records are `sent` at publish time) |
| SC-006 | Steps B4, F3 and *(V2)* K2 |
| SC-007 | Unit test "REQ-14 wording" plus a visual scan |
