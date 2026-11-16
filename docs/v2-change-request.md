# V2 Change Request — from Prototype V1 Evaluation to Prototype V2

**Inputs:** `docs/evaluation/v1/team-summary.md` (consolidated observations; OBS-1…OBS-6 first reported in `docs/evaluation/v1/member-1/evaluation.md`) and `docs/traceability.md` (V1 matrix).
**Baseline:** V1 = tag `v1` (commit `0f11290` plus the evaluation docs).
**Status:** draft, based on member-1's evaluation. Update it once the other members' findings are merged into `team-summary.md`: add a CR for any new finding that the team decides to change in V2.
**Owner of V2:** _<name>_. The owner supervises the SE agent; the team reviews the spec before any code is changed.

This document tells the V2 owner **what** to change, **why** (stakeholder goal and evidence), and **in which order**. It follows Step 5 of the assignment:

> Revise the specification before changing the intended implementation behavior … update the goal model where your understanding has changed … preserve unresolved stakeholder conflicts … at least one meaningful requirements-level improvement informed by evaluating Prototype V1.

---

## 1. Summary of changes

| ID | From | Type | Change | Required? |
|---|---|---|---|---|
| **CR-1** | OBS-1 | Requirements change (spec + goal model + code) | A heads-up is allowed only while the change is still pending, i.e. no current FINAL notice exists. | **Yes**. This is the main requirements-level improvement. |
| **CR-2** | OBS-2 | Requirements change (spec + goal model + code) | A cancelled game can only be changed through an explicit **"Reinstated – game is ON"** notice. It can no longer be silently "moved". | **Yes**, recommended. **Team decision needed** (see §3). |
| **CR-3** | OBS-3, OBS-4 | Documentation only (spec + goal model) | Record two unresolved trade-offs (urgent duplicates; heads-ups don't escalate) as open questions for Mike. No code change. | Yes (documentation) |
| **CR-4** | OBS-5, OBS-6 | Spec hygiene | Write the validation rules the agent invented into the spec; fix the Saturday/Sunday scenario. | Yes (small) |

**Out of scope for V2:** everything that was deferred in `docs/goal-model.md` §5 (rides, liability, other privacy features, coach records). Do not add features beyond CR-1…CR-4.

---

## 2. CR-1 — Heads-up only while the change is pending

**Observation (OBS-1).** After Brenda published a FINAL notice, Ray could still send an UNCONFIRMED heads-up. Mike then saw "FINAL" and "UNCONFIRMED" side by side for the same game. Screenshot: `docs/evaluation/v1/member-1/screenshots/X1_headsup_after_final.png`.

**Why this matters (goal model).**
- G-07 is *FamiliesWarnedEarly **If ChangePending***: a heads-up exists to cover the time *before* an official decision.
- V1 did not define when a change stops being "pending", so the condition was lost on the way from the goal model to the spec.
- The result undermines G-02 *OfficialStatusClear*, which comes from Ray's wish for one clearly marked official message (YH:R46, YH:R59, YH:R63) and Brenda's wish that families know which update is current (YH:B63).

**Goal model update** (`docs/goal_model_unified.py`, then regenerate the diagrams):
- Add a domain property **D-6** "A change is pending only until a FINAL notice for that game is published". Put it in the refinement of G-07, next to G-08.
- Add `note="V2: condition made explicit after V1 evaluation (OBS-1)"` to G-07.

**Spec update** (`specs/001-game-change-notice/spec.md`).

Replace REQ-05 with:

> **REQ-05 (revised in V2)**: A coach MAY send a heads-up for a game of their own team **only while that game has no current FINAL notice**. Once a FINAL notice exists, the heads-up control MUST NOT be offered, and the system MUST reject a heads-up for that game with the reason "an official decision has already been published". The heads-up goes to every eligible family of the coach's own team (subject to REQ-08). It is always labelled UNCONFIRMED, visually distinct, never changes the official status, and is shown as superseded once a FINAL notice is published. *Goals*: G-07, G-08, D-6 (CF-1). *Evidence*: YH:R52, YH:R54, YH:B59, YG:R47; V1 evaluation OBS-1.

Add an acceptance scenario to User Story 4:

> **[REQ-05]** **Given** a FINAL notice exists for U10 Blue vs U10 Red, **When** the U10 Blue coach opens that game, **Then** no heads-up control is offered, and an attempt through the domain is rejected with "an official decision has already been published".

Add an open question:

> **OQ-4**: After a decision, does Ray need to send *informational* follow-ups (e.g. "Field 7 is muddy, bring boots")? If so, that is a new goal (an informational message, not a heads-up) and needs its own requirement. **Not built in V2.**

---

## 3. CR-2 — Reinstating a cancelled game explicitly

**Observation (OBS-2).** Brenda cancelled the game ("No game today; do not travel") and then published a field move. Mike's new alert said only "FINAL – Moved: Field 3 → Field 7". It never said that the cancellation was withdrawn or that the game is ON again. Screenshot: `docs/evaluation/v1/member-1/screenshots/X5_mike_cancel_then_move.png`.

**Why this matters (goal model).**
- G-21 *FamiliesKnowOfficialStatus* requires that families who already acted on "do not travel" understand the reversal. Mike works shifts and needs short, unambiguous alerts (YH:M23).
- D-1 says the city's decision timing is not guaranteed, so a reversed call is realistic.
- In Step 1 we left G-13 (*CancelMarkCleared If NoticeWithdrawn*, tacit) **out of scope**. V1 shows that the situation happens anyway, so it must be specified.

**Team decision (write the choice and the reason into the spec's Conflict Decisions / Assumptions):**

| Option | Behavior | Pros | Cons |
|---|---|---|---|
| **A (recommended)** | On a cancelled game the only allowed change is **"Reinstated"** (optionally with a new field and/or time). The notice reads "FINAL – Reinstated: the cancellation is withdrawn — the game is ON", followed by when and where. | Matches reality (D-1); the wording removes the ambiguity | One more change type |
| B | Block every change after a cancellation; Brenda must handle it outside the system | Simplest | Brenda loses the official channel at the worst moment; contradicts G-02 |

**Goal model update (option A):**
- Bring **G-13** into the sprint and rename it **"CancellationWithdrawnAnnounced If CancellationReversed"**.
- Set `sprint=True`. Keep `tacit=True`, because there is still no direct interview evidence.
- Add `note="V2: brought into scope from V1 evaluation (OBS-2); evidence D-1 + evaluation; confirm with Brenda"`.

**Spec update (option A).**

Add a new requirement:

> **REQ-20 (new in V2)**: When a game's current official status is *Cancelled*, the only change the administrator MAY publish is **Reinstated**, with the original details or a new field and/or time. It still needs a verification record (REQ-01). The notice MUST be marked FINAL and MUST state explicitly that the cancellation is withdrawn and the game will take place, with the date, time and field. It replaces the cancellation notice (REQ-04) and follows the same recipient, privacy, delivery and escalation rules (REQ-07…REQ-11). Field or time moves on a cancelled game MUST be rejected with the reason "use Reinstate for a cancelled game". *Goals*: G-13, G-21, D-1. *Evidence*: none in transcripts (assumption, tacit); V1 evaluation OBS-2.

Extend REQ-03 so that the list of change types includes "reinstated (only after a cancellation; REQ-20)".

Add acceptance scenarios to User Story 1:

> **[REQ-20]** **Given** U10 Blue vs U10 Red is officially cancelled, **When** the administrator opens it, **Then** the only change type offered is "Reinstated", and a field or time move is rejected.
>
> **[REQ-20]** **Given** the game was cancelled and Mike received "No game today; do not travel", **When** Brenda publishes a verified reinstatement at Field 7, **Then** Mike sees "FINAL – Reinstated: the cancellation is withdrawn — the game is ON, Sat 10:00 at Field 7", and the cancellation is shown as superseded.

Add an open question:

> **OQ-5**: Brenda — does a cancelled game ever get reinstated in practice, and who decides? (Our assumption is the city/parks department, verified by Brenda.)

---

## 4. CR-3 — Record unresolved trade-offs (no code change)

**OBS-3: urgent changes send several messages at once.** For a game less than 2 hours away, each recipient gets the in-app alert, the email and the text in the same minute, followed by a call. That is 51 delivery records for 17 recipients. All of this is correct according to REQ-09…REQ-11, but it works against G-85 (*Avoid duplicate notifications*, YG:M77). The CF-3 compromise only covered non-urgent changes.

**OBS-4: heads-ups never escalate.** A parent on shift (obstacle O-1) may miss the early warning.

**Updates:**
- **Goal model:** extend the CF-3 entry in `CONFLICTS` with the note "urgent case unresolved (OBS-3)". In `goal-model.md` §4.3, add a sentence saying the urgent case of CF-3 is still open. Record "heads-up does not escalate" as an accepted risk against O-1.
- **Spec:** add **OQ-6** (Mike: during a shift, which single channel do you trust for urgent changes? Is a call needed if you already got the text?). Add to the Assumptions: "Heads-ups do not escalate; accepted risk against O-1 (OBS-4)".
- **No code change.** Unresolved conflicts must be **kept and documented**, not removed (Step 5).

---

## 5. CR-4 — Spec hygiene

- **REQ-01:** add "the verification time cannot be later than the current time". The V1 code already does this (OBS-6).
- **REQ-03:** add "a published change must differ from the game's current details, and a new kickoff must be in the future". The V1 code already does this (OBS-6).
- **User Story 1, scenario 6:** "U12 Red game on Saturday 10:00" → **Sunday** 10:00, to match the mock data (OBS-5).

---

## 6. Procedure for the V2 owner

```bash
# 0. Freeze V1 (once)
git add docs && git commit -m "V1 evaluation: traceability matrix and observations"
git tag v1 && git push origin main v1

# 1. Work on a v2 branch that builds on v1
git checkout -b v2

# 2. Fresh clone only: tell Spec Kit which feature we are working on.
#    .specify/feature.json is git-ignored (machine-local), so a clone does not have it.
#    Without it, /speckit-plan, /speckit-converge, etc. fail with "Feature directory not found".
echo '{"feature_directory": "specs/001-game-change-notice"}' > .specify/feature.json
```

**Tools needed on the V2 owner's machine:** Claude Code (desktop app → **Code** tab, Local, repository folder; or the CLI) **or** Cursor, plus `python3` to run the prototype. The Spec Kit commands (`.claude/skills/speckit-*`) and scripts (`.specify/`) are already in the repository, so `specify init` must **not** be run again. The `specify` CLI is only needed to add Cursor support (`specify integration install cursor-agent`).

1. **Goal model first.** Edit `docs/goal_model_unified.py` (D-6, G-07 note, G-13 into scope, CF-3 note). Run it to check coverage, regenerate the diagrams, and add a short "V2 changes" section to `docs/goal-model.md`. Commit.
2. **Spec second (before any code).** In Claude Code (or Cursor), give the agent the prompt in Appendix A. Do **not** use `/speckit-specify` for this, because it would create a new feature folder (`specs/002-…`) instead of revising ours. Review the diff of `spec.md` as a team. Commit.
3. **Optional:** run `/speckit-clarify` on the revised spec.
4. Run `/speckit-plan` to update the plan for the changed requirements.
5. Run `/speckit-converge`. It compares the code with the revised spec and appends only the missing work as new tasks in `tasks.md`. Check that the new tasks cover CR-1, CR-2 and CR-4 and nothing else.
6. Run `/speckit-analyze` (consistency report). Fix the spec or the tasks if it reports gaps.
7. Run `/speckit-implement`. The agent must also update or add unit tests for REQ-05 and REQ-20.
8. **Verify** (§7), update `docs/traceability.md` (§8), commit, then `git tag v2 && git push origin v2`.
9. Update `README.md` on `main`: links to v1 / v2, a "What changed in V2" table (CR-1…CR-4 → REQ → goal), and the Roles and Responsibilities section.

---

## 7. Acceptance checks for V2

| Check | Expected in V2 |
|---|---|
| Unit tests | All pass, including new tests for REQ-05 (rejected after FINAL) and REQ-20 |
| Walkthrough A–H (regression) | Same results as V1 |
| X1 (heads-up after FINAL) | No heads-up control after FINAL; a domain call is rejected |
| X5 (move after cancel) | Only "Reinstated" is offered; a move is rejected; Mike sees "Reinstated … the game is ON …" and the cancellation as superseded |
| H1 (move, then cancel) | Still allowed; only the cancellation is current |
| X2–X4 validation messages | Unchanged; now traced to REQ-01 / REQ-03 |

---

## 8. Traceability updates for V2

In `docs/traceability.md`, add a **V2 status** column (or a "V2" section). Update these rows:

- **REQ-05**: new code location (heads-up guard); status in V2; reference CR-1 / OBS-1.
- **REQ-03**: change types now include "reinstated"; validation rules now specified.
- **REQ-01**: verification-time rule now specified.
- **REQ-20 (new)**: evidence "none — assumption from V1 evaluation (OBS-2), D-1"; goals G-13, G-21; code; tests; status.

---

## Appendix A — Prompt for revising the spec (paste into Claude Code / Cursor)

```
Revise the existing feature spec specs/001-game-change-notice/spec.md for Version 2.
Do NOT create a new feature directory and do NOT change any code yet.
Apply exactly the spec changes in docs/v2-change-request.md sections 2–5 (CR-1, CR-2 option A,
CR-3, CR-4):
- replace REQ-05 with the revised text; add REQ-20; extend REQ-03 and REQ-01;
- add the new acceptance scenarios to User Stories 1 and 4;
- add OQ-4, OQ-5, OQ-6 to Open Questions and the O-1 accepted risk to Assumptions;
- fix User Story 1 scenario 6 (Saturday -> Sunday);
- in Conflict Decisions, record the CR-2 decision (option A) and that the urgent case of CF-3 is
  unresolved.
Keep all existing REQ IDs, goal IDs and interview citations unchanged. Mark every new or changed
item with "(V2)". Set the spec status to "Draft (V2)". Follow the constitution.
Then show me a summary of the changes.
```

## Appendix B — Not part of this request

- The **learning log** (`docs/learning-log.md`) must be written by the team **without AI assistance**. This change request, the evaluations in `docs/evaluation/v1/` and `traceability.md` are evidence the team can draw on. They are not the learning log.
- **Deployment** of V1 and V2 is decided separately.
