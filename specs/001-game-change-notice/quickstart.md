# Quickstart: Game Change Notice

How to run the prototype and check that it meets [spec.md](spec.md). Screens are described in
[contracts/ui-views.md](contracts/ui-views.md); seed fixtures in [research.md](research.md) R-9.

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
  after its REQ)

The demo starts at **Sat 08:30**. Press **Reset demo** between walkthroughs.

After editing source files, do a hard reload (Cmd+Shift+R) or disable the browser cache: the
simple Python server lets the browser keep old JavaScript modules, so a plain reload can run
stale code.

## Walkthrough checks

Each check maps to spec scenarios. Expected results must match exactly.

### A. Publish rules (User Story 1)
1. Persona **Coach – U10 Blue** → open *U10 Blue vs U10 Red, 10:00, Field 3*. Expect: no publish
   form. (REQ-02)
2. Persona **Brenda** → same game → choose *Field*, new field *Field 7*, leave verification empty
   → Publish. Expect: blocked, message says a verification record is required; status still
   "As scheduled". (REQ-01)
3. Set verification *Parks Department, 08:20* → Publish. Expect: "FINAL – Moved: Field 3 →
   Field 7", author Brenda, time 08:30, instruction, verification shown. (REQ-03, REQ-04)
4. Activity log: one rejected attempt and one publish, no edit/delete controls. (REQ-06)
5. Past game (*07:00*) offers no publish form. (Edge case)

### B. Recipients and privacy (User Story 2) — continue from A
1. Delivery log: in-app + email for every U10 Blue and U10 Red recipient at 08:30; nothing for
   any U12 family. (REQ-07, REQ-09, REQ-16)
2. Parent **X (Family B)** does not appear in the log; persona X shows no U10 Blue game. (REQ-08)
3. Persona **W (Family E)**: the notice names only E2. (REQ-08)
4. Persona **Family D parent**: one alert naming both children; the log has one entry per
   channel for that parent. (REQ-17)
5. Children appear as first name + last initial everywhere. (REQ-18)

### C. Urgent escalation (User Story 6) — continue from A (kickoff 10:00 is 90 min away)
1. Log shows a text for every recipient at 08:30 and no calls yet. (REQ-10)
2. As **Mike**, Confirm receipt. Press **+1 min**, then **+1 min**. Expect: calls at 08:32 to
   every recipient parent whose family has not confirmed; none to Mike's family. (REQ-11,
   Clarifications)
3. The family with no phone shows text and call as *failed*. (REQ-13)

### D. Non-urgent escalation — Reset demo
1. Brenda publishes a verified time move for *U12 Red vs U12 Gold* (tomorrow 10:00 → 13:00).
   Expect: in-app + email only, no text, no call. (REQ-10, REQ-11)
2. As one U12 Red parent, confirm receipt. Press **+5 min**. Expect: texts to every unconfirmed
   recipient, none to the confirmed family, no calls. (REQ-10)

### E. Coach status (User Story 3) — Reset demo
1. Brenda publishes a verified cancellation for the U10 Blue game.
2. Confirm receipt as 8 of the 10 U10 Blue families (one parent each; for Family B use Y).
3. Persona **Coach – U10 Blue** → notice status. Expect: "8 of 10 confirmed receipt" and the
   2 remaining families listed; no "read"/"seen" wording. (REQ-13, REQ-14)

### F. Heads-up (User Story 4) — Reset demo
1. Persona **Coach – U10 Blue** sends "Field 3 may close due to rain". Expect: U10 Blue families
   (except X) get it labelled UNCONFIRMED; U10 Red families get nothing; official status
   unchanged. (REQ-05, REQ-07, REQ-08)
2. Coach – U10 Blue has no heads-up control on U12 games. (REQ-05)
3. Brenda publishes a verified field move for the same game. Expect: heads-up marked
   Superseded; parents see one current FINAL alert. (REQ-04, REQ-05, REQ-17)

### G. Parent combined view (User Story 5) — continue from F or Reset
1. Brenda also publishes a change to *U12 Red vs U12 Gold*. Persona **Mike**: both games appear
   with their FINAL labels; any unchanged game says "As scheduled". (REQ-15)

### H. Two changes before confirmation (Edge case) — Reset demo
1. Brenda publishes a field move, then a cancellation for the same game. Expect: the first notice
   is Superseded; only "FINAL – Cancelled" is current; escalations for the first notice are
   cancelled. (REQ-04, REQ-10)

## Last validated

**2026-11-16** (V1 build, all tasks T001–T064):

- Unit tests: **72 / 72 passed** at <http://localhost:8000/tests/> (every REQ-01…REQ-19 has at least one named test).
- Walkthroughs A1–A5, B1–B5, C1–C3, D1–D2, E3, F1–F3, G1, H1: **all passed**. They were run against the live app (UI controls plus domain calls in the browser console).
- Privacy audit: all 27 personas, every tab and every opened game, after a scenario with heads-ups, two FINAL notices, confirmations and escalations. No child full names, no addresses, the restricted parent X is absent from every other view and log, and W never sees Eli.
- Scope audit: no network calls, CDN links or out-of-scope features in `app/src`.
- Not yet validated (they need real test users and timing): SC-001 (publish in under 2 min), SC-003 (status understood in 15 s) and SC-004 (coach finds non-confirmers in 30 s).
- Observed spec gap (for the next spec revision): spec User Story 1 scenario 6 uses "U12 Red game on Saturday 10:00", but the seed schedules the U12 game on **Sunday** 10:00, so the label reads "Sun 10:00 → Sun 13:00".

## Success-criteria checks

| SC | How to check |
|----|--------------|
| SC-001 | Time step A3 from opening the game: under 2 minutes |
| SC-002 | Steps B1–B3 and F1 |
| SC-003 | Show a test user Mike's view after G1; they name status, change and action in ≤ 15 s per game |
| SC-004 | Step E3: coach names the 2 families in ≤ 30 s |
| SC-005 | Steps B1 and C1–C2 timestamps |
| SC-006 | Step B4 and F3 |
| SC-007 | Unit test "REQ-14 wording" plus a visual scan |
