# Prototype V1 Evaluation — Member 1

**Evaluator:** Member 1. The scripted walkthrough and probes were run with a Claude-assisted headless browser (Playwright); the findings were reviewed by Member 1.
**Team summary:** [`../team-summary.md`](../team-summary.md) merges this evaluation with the other members'. The OBS-1…OBS-6 IDs below were adopted as team IDs.

Evaluated 2026-11-16 against `specs/001-game-change-notice/spec.md`, V1 commit `0f11290`. The traceability matrix is in `docs/traceability.md`. Screenshots are in [`screenshots/`](screenshots/).

> This file is the **evaluation evidence**: what we ran and what we observed. The *learning log* (`docs/learning-log.md`) must be written by the team without AI assistance (course rule). Use these observations as raw material, and write your own reasoning and examples there.

## How we evaluated

1. **Unit tests** (`app/tests/`): 72 / 72 passed.
2. **Scripted walkthrough** of quickstart steps A1–H1 in a real browser (Playwright, Chromium). Every step passed.
3. **Exploratory probes** (X1–X6). These are situations the spec does not mention, chosen by asking "what would Brenda, Ray or Mike plausibly do next?"

Each observation below is classified as one of:

- **Implementation defect**: the spec was clear, but the prototype does not do what it says.
- **Requirements issue**: the spec is missing information, or is ambiguous, wrong or insufficient for the stakeholder goal.

**Result: no implementation defects, six requirements issues.**

---

## OBS-1 — A coach can send an UNCONFIRMED heads-up after the FINAL notice

- **What we did:** Brenda published "FINAL – Moved: Field 3 → Field 7". Then, as Ray, we opened the same game. The heads-up form was still there, and we sent "Field 7 might be muddy".
- **What we saw:** Mike's view now shows a new UNCONFIRMED heads-up next to the FINAL notice (`X1_headsup_after_final.png`).
- **Classification: requirements issue.** REQ-05 only says that a FINAL notice *supersedes* earlier heads-ups. It says nothing about heads-ups sent *after* a FINAL notice. The code does exactly what the spec says.
- **Why it matters (goal model):** G-07 is *FamiliesWarnedEarly **If ChangePending***, so a heads-up is meant for the period *before* a decision. After a FINAL notice the change is no longer pending. An "unconfirmed" message next to a "final" one undermines G-02 (*OfficialStatusClear*), which is exactly the confusion Ray (YH:R46, R59) and Brenda (YH:B63) wanted to remove.
- **What needs to change:** a spec change (REQ-05: a heads-up only while no current FINAL notice exists, or else it must be labelled as relating to the FINAL notice). Then update the goal model: make G-07's condition explicit. **Stakeholder clarification is also needed:** Ray may have a real need to send follow-up information after a decision (for example "Field 7 is muddy, bring boots"). That would be a different goal (*Informational message*), not a heads-up.

## OBS-2 — A cancelled game can be "moved", which silently reinstates it

- **What we did:** Brenda published "FINAL – Cancelled", then published a field move for the same game.
- **What we saw:** the system accepted it. Mike's new alert reads "FINAL – Moved: Field 3 → Field 7 … originally Sat 10:00 at Field 3". It never says that the cancellation was withdrawn or that the game is back on. The earlier "No game today; do not travel" notice is merely shown as "Superseded" (`X5_mike_cancel_then_move.png`).
- **Classification: requirements issue.** The spec does not define which changes are allowed after a cancellation, or how a reinstated game should be worded. Withdrawing a change (G-13) was put out of scope in Step 1 because it was tacit. Evaluation shows that the prototype can *effectively* do it anyway, but without the wording families need.
- **Why it matters:** a parent who has already acted on "do not travel" (Mike works shifts, YH:M23) may not notice that a "move" means the game is on again. This threatens G-21 (*FamiliesKnowOfficialStatus*). D-1 says the city's decision timing is not guaranteed, so a call being reversed is realistic.
- **What needs to change:** a spec change. Either (a) block changes after a cancellation, or (b) add an explicit "Reinstated" change type whose wording says "The cancellation is withdrawn — the game is ON". Update the goal model: G-13 moves from tacit/out of scope into the sprint, with evidence from this evaluation. **Brenda should be asked** whether reinstating a cancelled game ever happens.

## OBS-3 — An urgent change sends three identical messages at once, plus a call

- **What we did:** published a change for a game 90 minutes away.
- **What we saw:** every recipient got the in-app alert, the email and the text **in the same minute**, with the same content. Two minutes later, every parent who had not confirmed got a call. One change produced 51 delivery records for 17 recipients (15 parents + 2 coaches), and then 14 calls (`B1_delivery_log.png`, `C2_calls.png`).
- **Classification: requirements issue** (needs stakeholder clarification). REQ-09, REQ-10 and REQ-11 are all met as written. The tension is between them: the CF-3 compromise only addressed *non-urgent* changes. For urgent changes the spec still sends every channel at once, which works against G-85 (*Avoid DuplicateAndTrivialNotifications*, YG:M77 "too many duplicate messages would be annoying").
- **What needs to change:** revisit CF-3 for urgent changes, for example in-app and text at once with email as a record only, or a call only if the text is not confirmed. **Clarify with Mike** which single channel he trusts during a shift.

## OBS-4 — Heads-ups never escalate, so a parent on shift can miss the early warning

- **What we did:** Ray sent a heads-up, then we advanced the demo clock by 10 minutes.
- **What we saw:** only the in-app alert and the email were sent. No text, no call.
- **Classification: requirements issue** (a deliberate trade-off that should be confirmed). The spec says heads-ups never escalate, to limit noise (REQ-17). But obstacle O-1 (*AlertMissedWhileOnShift*) is exactly why texts exist. Mike, the stakeholder most affected by short-notice changes, gets the early warning only if he opens the app or his email.
- **What needs to change:** probably nothing in V2. Record it as an accepted trade-off between G-08 and O-1, and confirm it with Mike.

## OBS-5 — A spec scenario contradicts the mock data

- **What we saw:** spec User Story 1, scenario 6 talks about a "U12 Red game on Saturday 10:00", but the seed data (and therefore the prototype) schedules it on **Sunday** 10:00. The implementation agent reported this itself in `quickstart.md`.
- **Classification: requirements issue** (minor; the spec is internally inconsistent).
- **What needs to change:** correct the scenario in the spec.

## OBS-6 — The implementation added validation rules that are not in the spec

- **What we saw:** the prototype rejects (a) a "change" that does not change anything, e.g. Field 3 → Field 3; (b) a verification time later than the current time; (c) an empty instruction. The messages are sensible (`X2`/`X3`/`X4` probes), but rules (a) and (b) are not written anywhere in the spec.
- **Classification: requirements issue.** The rules are reasonable, but they violate Constitution Principle I ("no behavior unless it appears in spec.md"). The agent had to invent them because the spec was silent.
- **What needs to change:** add these rules to REQ-01 and REQ-03 in V2, so that the spec describes the behavior that actually exists.

---

## Walkthrough results (V1)

| Step | Checks | Result |
|---|---|---|
| A1–A5 | Coach has no publish form; publishing is blocked without verification; FINAL shows author and verification; activity log; past game | Pass |
| B1–B5 | Only affected teams; restricted parent X absent; W sees only Emma; Family D gets one alert naming both children; first name + initial | Pass |
| C1–C3 | Urgent: text at once, calls at 08:32 except Mike's family, failed channel shown | Pass |
| D1–D2 | Non-urgent: in-app + email only; texts after 5 minutes, none to the confirmed family | Pass |
| E3 | Coach sees "8 of 10 confirmed receipt" and the 2 missing families | Pass |
| F1–F3 | Heads-up UNCONFIRMED, official status unchanged, U10 Red gets nothing; superseded by FINAL | Pass |
| G1 | Mike sees both children's games with FINAL labels | Pass |
| H1 | Two changes in a row: only the latest is current | Pass |
| X1–X6 | Exploratory probes | OBS-1, OBS-2, OBS-3, OBS-4, OBS-6 |

## Candidates for V2 (at least one requirements-level change is required)

| Priority | Change | Observation | Spec | Goal model |
|---|---|---|---|---|
| 1 | Restrict heads-ups to pending changes, or label post-decision messages differently | OBS-1 | REQ-05 | G-07 condition made explicit |
| 2 | Define what happens after a cancellation (block, or an explicit "Reinstated – game is ON") | OBS-2 | REQ-03, new REQ | G-13 brought into scope |
| 3 | Reduce duplicate delivery for urgent changes | OBS-3 | REQ-09/10/11 | CF-3 extended to urgent changes |
| 4 | Write the implicit validation rules into the spec; fix the scenario date | OBS-5, OBS-6 | REQ-01, REQ-03, US1 | — |
