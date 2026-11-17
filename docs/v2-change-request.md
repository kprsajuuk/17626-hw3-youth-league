# V2 Change Request — from Prototype V1 Evaluation to Prototype V2

**Inputs:** `docs/evaluation/v1/team-summary.md` (consolidated observations; OBS-1…OBS-6 first reported in `docs/evaluation/v1/member-1/evaluation.md`) and `docs/traceability.md` (V1 matrix).
**Baseline:** V1 = tag `v1` (commit `0f11290` plus the evaluation docs).
**Status:** ready for V2. Covers all V1 observations, OBS-1…OBS-11 (Members 1, 2 and 3). Team decisions on CR-2, CR-5, CR-6, CR-7 and the OBS-1 classification were made on 2026-11-16; decisions on CR-8 and CR-9 (Member 3's findings) were made on 2026-11-17 (see §1).
**Owner of V2:** _<name>_. The owner supervises the SE agent; the team reviews the spec before any code is changed.

This document tells the V2 owner **what** to change, **why** (stakeholder goal and evidence), and **in which order**. It follows Step 5 of the assignment:

> Revise the specification before changing the intended implementation behavior … update the goal model where your understanding has changed … preserve unresolved stakeholder conflicts … at least one meaningful requirements-level improvement informed by evaluating Prototype V1.

---

## 1. Summary of changes

| ID | From | Type | Change | Required? |
|---|---|---|---|---|
| **CR-1** | OBS-1 | Requirements change (spec + goal model + code) | A heads-up is allowed only while the change is still pending, i.e. no current FINAL notice exists. | **Yes**. This is the main requirements-level improvement. |
| **CR-2** | OBS-2 | Requirements change (spec + goal model + code) | A cancellation is **final**: once a game is officially cancelled, no further change can be published for it. It can no longer be silently "moved". | **Yes**. **Decided 2026-11-16: option B** (see §3). |
| **CR-3** | OBS-3, OBS-4 | Documentation only (spec + goal model) | Record two unresolved trade-offs (urgent duplicates; heads-ups don't escalate) as open questions for Mike. No code change. | Yes (documentation) |
| **CR-4** | OBS-5, OBS-6 | Spec hygiene | Write the validation rules the agent invented into the spec; fix the Saturday/Sunday scenario. | Yes (small) |
| **CR-5** | OBS-7 | Requirements change (spec + goal model + code) | One "Moved" notice can change the field, the time, or both. Today that takes two FINAL notices. | **Yes**. Decided 2026-11-16 (see §6). |
| **CR-6** | OBS-8 | Requirements change (spec + goal model + code) | Games whose kickoff has passed get a clear "Started" tag (parents still see them until the end of that day). Unconfirmed alerts for started games stop asking for confirmation and stop escalating. | **Yes**. Decided 2026-11-16 (see §7). |
| **CR-7** | OBS-9 | Implementation correction (code + small spec assumption) | Add the missing "sent" delivery status required by REQ-13. | **Yes**. Decided 2026-11-16 (see §8). |
| **CR-8** | OBS-10 | Requirements change (spec + goal model + code) | Receipt confirmation is counted **per child**. A restricted parent's confirmation covers only the children named in their own notice, so the other parent is still escalated and the family stays on the not-confirmed list. | **Yes**. Decided 2026-11-17 (see §8a). |
| **CR-9** | OBS-11 | Spec consistency (spec + goal model; no code change) | Coaches **do** receive texts under REQ-10, like parents (calls stay parents-only). The contradicting Assumptions bullet is rewritten. | **Yes**. Decided 2026-11-17 (see §8b). |

**Decision on OBS-1's classification (2026-11-16):** *requirements issue*. The spec never defined when a change stops being "pending", and the fix starts with the spec (D-6). The other view, that REQ-05's words "for a pending change" were already enough and the code failed to check them, is recorded in the OBS-1 notes in `team-summary.md`.

**Out of scope for V2:** everything that was deferred in `docs/goal-model.md` §5 (rides, liability, other privacy features, coach records). Do not add features beyond CR-1…CR-9.

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

## 3. CR-2 — A cancellation is final

**Observation (OBS-2).** Brenda cancelled the game ("No game today; do not travel") and then published a field move. Mike's new alert said only "FINAL – Moved: Field 3 → Field 7". It never said that the cancellation was withdrawn or that the game is ON again. Screenshot: `docs/evaluation/v1/member-1/screenshots/X5_mike_cancel_then_move.png`.

**Why this matters (goal model).**
- G-21 *FamiliesKnowOfficialStatus* requires that families who already acted on "do not travel" are never left with an ambiguous status. Mike works shifts and needs short, unambiguous alerts (YH:M23).
- "FINAL" in V1 means *official*, not *irreversible*: REQ-04 lets a later FINAL notice replace an earlier one. The spec never said whether a cancellation is a special case.
- In Step 1 we left G-13 (*CancelMarkCleared If NoticeWithdrawn*, tacit) **out of scope**. V1 shows that the prototype could reverse a cancellation anyway, without the wording families need.

**Options considered:**

| Option | Behavior | Pros | Cons |
|---|---|---|---|
| A (not chosen) | On a cancelled game the only allowed change is **"Reinstated"**. The notice reads "FINAL – Reinstated: the cancellation is withdrawn — the game is ON". | Covers a reversed city decision (D-1) | New change type and REQ, built on an assumption with no interview evidence (G-13 is tacit) |
| **B (chosen)** | A cancellation is final. Once a game is officially cancelled, no further change can be published for it. | Simplest; matches how families read "cancelled"; no new behavior built on a tacit goal | If the city ever reverses a cancellation, Brenda must handle it outside the system (risk against D-1 / G-02) |

**Decision (2026-11-16): option B.** The team treats an official cancellation as final. There is no interview evidence that a cancelled game is ever reinstated (G-13 is tacit), so we do not build a reinstatement feature on an assumption. The remaining risk (D-1: the city's decision can change) is kept and documented, not removed: it is an open question for Brenda (OQ-5), and option A stays recorded here as the alternative if she says reinstatement happens.

**Goal model update (option B):**
- Add a domain property **D-7** "An official cancellation is final (team assumption; confirm with Brenda, OQ-5)". Put it next to D-2 in the refinement of G-12.
- Keep **G-13** out of the sprint and `tacit=True`. Add `note="V2: reversal blocked; cancellation treated as final (CR-2 option B, D-7). Revisit if Brenda confirms reinstatement happens (OQ-5)"`.
- Keep the relation between D-1 and G-13 visible: D-1 (timing not guaranteed) is the reason G-13 might be needed later.

**Spec update (option B).** Extend REQ-03 (the full revised text is in §6, together with CR-5):

> Once a game's current official status is *Cancelled*, the cancellation is final: no further change MAY be published for that game. The publish control MUST NOT be offered for a cancelled game, and the system MUST reject an attempt with the reason "This game is cancelled. A cancellation is final." *Assumption*: D-7 (confirm with Brenda, OQ-5).

Add an acceptance scenario to User Story 1:

> **[REQ-03]** **Given** U10 Blue vs U10 Red is officially cancelled, **When** the administrator opens it, **Then** no publish control is offered, and a publish attempt through the domain is rejected with "This game is cancelled. A cancellation is final."; Mike's view still shows "FINAL – Cancelled".

Add to Conflict Decisions / Assumptions: "A cancellation is final (D-7). Option A (Reinstated) was considered and not chosen because G-13 has no interview evidence; risk against D-1 accepted (OBS-2)."

Add an open question:

> **OQ-5**: Brenda — does a cancelled game ever get reinstated in practice, and who decides? If yes, a later version adds option A (a "Reinstated" notice).

**Code impact (for `/speckit-converge`):** `can(…, 'publish')` in `domain/permissions.js` returns false for a cancelled game; `publishChange()` in `domain/notices.js` rejects any change on a cancelled game with a new error `game-cancelled` (V1 only rejected cancel-after-cancel); the error message in `ui/adminView.js`. Because a cancelled game already has a FINAL notice, CR-1 also blocks heads-ups for it.

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

## 6. CR-5 — Move field and time in one notice

**Observation (OBS-7).** The publish form offers one change type at a time: cancelled, moved field or moved time. A real change can move both, e.g. "Field 3 at 10:00 → Field 7 at 13:00". The only way to do that today is to publish two FINAL notices in a row. The second notice supersedes the first. Families get two notices, and the 5-minute text and 2-minute call timers start over.

**Where this comes from.**
- The spec, not the code. REQ-03 says a change "MUST be one of: cancelled, moved to another field, moved to another time". `domain/notices.js` (`CHANGE_TYPES`, `publishChange()`) and the radio group in `ui/adminView.js` do exactly that. **Classification:** requirements issue.

**Why this matters (goal model).**
- G-85 *DuplicateAndTrivialNotifications*: two notices for one real-world change are a duplicate (YG:M77).
- G-02 *OfficialStatusClearAndCurrent* and G-14 *OldAndNewDetailsAndActionShown*: families should see the full old → new picture in one message.

**Decision (2026-11-16): adopted.**

**Goal model update:**
- D-2 "A game change is a cancellation, a field move or a time move": add `note="V2: a move may change the field, the time, or both (CR-5)"`.
- G-14 already covers "field or time changed"; add `note="V2: one notice may change both (CR-5)"`.

**Spec update.** Revise REQ-03 (this text also includes CR-2 and the CR-4 validation rule):

> **REQ-03 (revised in V2)**: A published change MUST be one of: **cancelled**, or **moved** (a new field, a new kickoff time, or both). A move MUST change at least one detail, and a new kickoff MUST be in the future. Once a game's current official status is *Cancelled*, the cancellation is final: no further change MAY be published for that game (CR-2, D-7). The game entry MUST then show the current official status with the old and new details and an instruction for families.

Add an acceptance scenario to User Story 1:

> **[REQ-03]** **Given** U10 Blue vs U10 Red is at Field 3, Sat 10:00, **When** the administrator publishes a verified move to Field 7 at 13:00, **Then** one FINAL notice is sent per recipient per channel, labelled "FINAL – Moved: Field 3, 10:00 → Field 7, 13:00".

**Code impact (for `/speckit-converge`):** `CHANGE_TYPES`, `publishChange()`, `noticeLabel()`, `renderNoticeContent()`, the default instruction in `ui/adminView.js`, and the publish form (show both inputs for "Moved").

**Open question:** none for stakeholders. This is a team decision; record it in the spec's Conflict Decisions / Assumptions.

---

## 7. CR-6 — Clear status for games that have started

**Observation (OBS-8).** Once kickoff has passed, the game can no longer be changed: publish and heads-up are blocked (`gameStarted()` in `domain/store.js`, `can()` in `domain/permissions.js`). But no view shows that the game has started. Brenda or Ray only finds out from the error message "This game has already started…". Related:
- `domain/queries.js` `parentGames()` hides games whose kickoff has passed, so the game simply disappears for parents.
- `alertsFor()` ignores time. An unconfirmed FINAL alert stays under "Needs your confirmation" even after the game is over.

**Where this comes from.** The spec. No requirement says how a started game is shown or what happens to its unconfirmed alerts. **Classification:** requirements issue (missing information).

**Why this matters (goal model).**
- G-11 *GameEntryShowsCurrentStatus* and G-02 *OfficialStatusClearAndCurrent*: "started" is part of the current status.
- G-39 *EachChildGameStatusInOneView*: a parent should understand why a game is no longer listed.
- G-85: asking for confirmation of an alert about a finished game is a trivial notification.

**Decision (2026-11-16): adopted, full version.** Parents keep seeing a started game, tagged "Started", until the end of that day.

**Goal model update:** add `note="V2: started state made explicit (CR-6); no direct interview evidence"` to G-11.

**Spec update.** Add a new requirement (REQ-20 is free, because CR-2 option B adds no new requirement):

> **REQ-20 (new in V2, assumption from V1 evaluation)**: Once a game's current kickoff time has passed, every view that lists the game MUST tag it "Started", and its publish and heads-up controls MUST NOT be offered. A parent's view MUST keep showing a started game, tagged "Started", until the end of that day. Unconfirmed FINAL alerts for a started game MUST move out of "Needs your confirmation" and MUST NOT trigger further texts or calls. *Goals*: G-11, G-02, G-39, G-85. *Evidence*: none — assumption from V1 evaluation (OBS-8).

Extend REQ-15: "upcoming games" → "upcoming games, and games that started earlier the same day (tagged "Started", REQ-20)".

Add acceptance scenarios to User Story 1 and User Story 5:

> **[REQ-20]** **Given** the demo clock is past the kickoff of U10 Blue vs U10 Red, **When** the administrator or the coach opens the game list, **Then** the game is tagged "Started" and no publish or heads-up control is shown.
>
> **[REQ-20, REQ-15]** **Given** the same started game and Mike has not confirmed its FINAL notice, **When** Mike opens his view, **Then** the game is still listed, tagged "Started"; the alert is no longer under "Needs your confirmation"; and no further text or call is sent.

**Assumption:** "Started" is the only post-kickoff state. The mock data has no game duration, so there is no "Finished" state in V2.

**Code impact (for `/speckit-converge`):** game cards and details in `ui/components.js`; `parentGames()` (keep same-day started games) and `alertsFor()` (`unconfirmed` false once started) in `domain/queries.js`; `processDueEscalations()` in `domain/delivery.js` (cancel escalations for started games); `ui/parentView.js`.

**Open question for stakeholders (OQ-7):** Brenda / Ray — after kickoff, does anyone need to see the game's change history in the app, or is it no longer relevant?

---

## 8. CR-7 — Add the missing "sent" delivery status

**Observation (OBS-9).** REQ-13 requires per-channel delivery status "sent / delivered / failed". `domain/log.js` only allows `delivered` and `failed`, so "sent" never appears. REQ-13 is *Partially satisfied* in `docs/traceability.md`.

**Classification:** implementation defect. The spec is clear and the code does not match it.

**Decision (2026-11-16): fix the code** to match REQ-13 (instead of removing "sent" from the spec).

**Goal model update:** none.

**Spec update.** The simulated delivery needs a timing rule, and Constitution Principle I says no behavior may exist unless it is in `spec.md`. Add to the Assumptions:

> **Simulated delivery (V2)**: When a message is dispatched on a channel, it is recorded as **sent**. One simulated minute later, a delivery report is recorded: **delivered**, or **failed** with a reason. A channel with no contact on file is recorded as **failed** at once. The delivery log is append-only (REQ-06), so a report is a new record; status views show the latest record per channel.

Add an acceptance scenario to User Story 3:

> **[REQ-13]** **Given** a change was just published, **When** the administrator opens the notice status, **Then** the email and in-app channels show "sent"; **When** the demo clock advances by 1 minute, **Then** they show "delivered" (or "failed" with a reason).

**Code impact (for `/speckit-converge`):** `STATUSES` (and a new trigger for delivery reports) in `domain/log.js`; `deliver()` and the clock-driven processing in `domain/delivery.js`; status tables in `ui/components.js`; tests that expect `delivered` immediately (`app/tests/delivery.test.js`, `app/tests/confirmations.test.js`).

**Check:** REQ-16 (initial alerts dispatched within 1 minute) still holds, because dispatch ("sent") happens at publish time.

---

## 8a. CR-8 — Receipt confirmation counted per child

**Observation (OBS-10).** In Family E, Wes is restricted for Eli (court order) but not for Emma; Erin is notified about both. For an urgent change, Wes confirmed receipt of his notice, which names only Emma. V1 then treated the whole family as confirmed: Erin's alert showed "Receipt confirmed" although she never saw it, her 2-minute call was cancelled, and Ray's status view listed Family E as confirmed. Nobody responsible for Eli had confirmed. Screenshots: `docs/evaluation/v1/member-3/screenshots/OBS-10_erin_shown_confirmed.png`, `OBS-10_ray_family_E_confirmed_no_call.png`.

**Where this comes from.** The spec, not the code. The Clarification of 2026-11-16, REQ-10 and the Assumptions say a family counts as confirmed once *any* notified parent confirms. That rule assumes every parent in a family is told about the same children. REQ-08 (court-order restrictions, D-4) is exactly the case where that is false, and the two rules were never considered together. `isConfirmedFor()` and `confirmReceipt()` in `domain/confirmations.js` implement the spec as written. **Classification:** requirements issue.

**Why this matters (goal model).**
- G-33 *ReceiptConfirmed If NoticeSent* and G-36 *AckStatusShownPerRecipient*: the status shown to Ray and Brenda is wrong for Eli.
- G-37 *NonAcknowledgerContacted If NoAckBeforeDeparture*: Ray's "call before departure" list leaves out the family that most needs a call.
- G-30 / G-31: the text and call that should reach Erin are suppressed.
- G-23 / D-4: the restricted parent's action stands in for the household they are restricted from.

**Options considered:**

| Option | Behavior | Pros | Cons |
|---|---|---|---|
| **A (chosen)** | Confirmation counts **per child**: a child is confirmed when a parent notified about that child confirms. | Respects both REQ-08 and Wes's legitimate confirmation for Emma; same result as V1 for ordinary two-parent families | Slightly more complex status logic |
| B (not chosen) | A restricted parent's confirmation never counts for the family. | Simple | Ignores Wes's valid confirmation for Emma; Erin would be escalated even for Emma alone |

**Decision (2026-11-17): option A, confirmation counted per child.** There is no interview evidence on how confirmation and custody interact, so the rule is a team assumption (OQ-8).

**Goal model update:**
- Add to G-33: `note="V2: receipt confirmation counted per child, not per family (CR-8, OBS-10)"`.
- Add to D-4: `note="V2: also constrains confirmation; a restricted parent's confirmation never covers the restricted child (CR-8)"`.

**Spec update.**

Replace the Clarification "the family counts as confirmed once any notified parent confirms" with:

> *(V2, 2026-11-17)* Receipt confirmation is counted **per child**. A child is confirmed for a notice once any parent who was notified **about that child** confirms. A parent's alert counts as confirmed once every child named in that parent's notice is confirmed. A family is confirmed once all of its children on the affected team(s) are confirmed.

Revise REQ-10 (second sentence):

> For a parent, pending texts and calls stop once every child named in that parent's notice is confirmed (by them or by another parent notified about the same child). A confirmation by a parent who is restricted for a child (REQ-08) never counts for that child.

Revise REQ-13 (last part):

> … plus a list of families who have not confirmed receipt. A family stays on that list until all of its children on the affected team(s) are confirmed; the list names only the parents notified about the unconfirmed children (REQ-08).

Replace the Assumptions bullet "A family counts as 'confirmed receipt' once any notified parent in that family confirms … A restricted parent never counts toward or appears in that family's status." with the per-child rule above, keeping "for a child they are restricted for, a parent never counts toward or appears in that child's status".

Add an acceptance scenario to User Story 3:

> **[REQ-10, REQ-13, REQ-08]** **Given** Family E, where Wes is restricted for Eli but not for Emma and Erin is notified about both, and an urgent change to U10 Blue vs U10 Red, **When** only Wes confirms receipt and 2 minutes pass, **Then** Wes gets no text or call; Erin's alert is still under "Needs your confirmation" and she receives the simulated call; the coach's list still shows Family E as not confirmed, naming Erin (for Eli E.) and never naming Wes next to Eli.

Existing User Story 3 scenario 6 (two unrestricted parents Y and Z; Y confirms, no text to either) must still pass unchanged.

Add an open question:

> **OQ-8**: Brenda — when a parent has a court-order restriction, do they usually live in a separate household, and should the coach treat them as a separate contact for "call before departure"? The per-child rule (CR-8) is our assumption until she answers.

**Code impact (for `/speckit-converge`):** `isConfirmedFor()`, `confirmReceipt()` (cancel escalations only for parents whose named children are now all confirmed) and `noticeStatus()` (`familyConfirmed`, `notConfirmed`) in `domain/confirmations.js`; `processDueEscalations()` in `domain/delivery.js` and `alertsFor()` in `domain/queries.js` use the new rule through `isConfirmedFor()`; the Receipt column in `ui/components.js` `noticeStatusTable()`; new tests in `app/tests/confirmations.test.js` for Family E.

---

## 8b. CR-9 — Coaches receive texts (spec made consistent)

**Observation (OBS-11).** After a non-urgent change, both coaches received the 5-minute fallback text, exactly like parents; for an urgent change, they were texted at once. Screenshot: `docs/evaluation/v1/member-3/screenshots/OBS-11_coach_fallback_texts.png`.

**Where this comes from.** The spec contradicts itself. REQ-10 says a text goes to every *recipient* who has not confirmed, and coaches are recipients (REQ-07). The Assumptions say "Coaches receive the in-app alert and email for their team's changes; phone calls go only to parents", which can be read as "coaches get only in-app and email". The agent followed REQ-10. **Classification:** requirements issue (inconsistent spec).

**Why this matters (goal model).** G-30 *TextSent If NotAckedWithin5Min Or ChangeUrgent* did not say which agents it applies to. G-85 *Avoid duplicate notifications* argues for fewer messages to a coach who is already watching for the change; G-37 argues that the coach, who has to call families before departure, must not miss a change.

**Decision (2026-11-17): coaches receive texts.** REQ-10's reading is kept, so V1's behavior is already correct and **no code change** is needed. The extra message to coaches is an accepted cost against G-85. To be confirmed with Ray (OQ-9).

**Goal model update:** add to G-30: `note="V2: applies to coaches as well as parents; calls stay parents-only (CR-9, OBS-11)"`. In `goal-model.md`, record "texts to coaches" as an accepted cost against G-85, next to the CF-3 entry.

**Spec update.**
- REQ-10: replace "a recipient" with "a recipient (parent or coach)".
- Replace the Assumptions bullet "Coaches receive the in-app alert and email for their team's changes; phone calls go only to parents (REQ-11)" with:

> Coaches receive the in-app alert and email for their team's changes and, like parents, the text under REQ-10 (fallback after 5 minutes, or immediately when urgent) until they confirm receipt. Phone calls go only to parents (REQ-11). *(V2, CR-9)*

Add an acceptance scenario to User Story 3:

> **[REQ-10]** **Given** a non-urgent change to U12 Red vs U12 Gold, **When** 5 minutes pass and neither coach has confirmed receipt, **Then** both coaches receive the simulated text and neither receives a call.

Add an open question:

> **OQ-9**: Ray — for your own team's changes, do you want the text as well, or are the in-app alert and email enough because you are already watching for the change?

**Code impact:** none. `/speckit-converge` should report no missing work for CR-9.

---

## 9. Procedure for the V2 owner

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

1. **Goal model first.** Edit `docs/goal_model_unified.py` (D-6 and G-07 note; D-7 and G-13 note; CF-3 note; D-2 and G-14 notes; G-11 note; G-33 and D-4 notes; G-30 note). Run it to check coverage, regenerate the diagrams, and add a short "V2 changes" section to `docs/goal-model.md`. Commit.
2. **Spec second (before any code).** In Claude Code (or Cursor), give the agent the prompt in Appendix A. Do **not** use `/speckit-specify` for this, because it would create a new feature folder (`specs/002-…`) instead of revising ours. Review the diff of `spec.md` as a team. Commit.
3. **Optional:** run `/speckit-clarify` on the revised spec.
4. Run `/speckit-plan` to update the plan for the changed requirements.
5. Run `/speckit-converge`. It compares the code with the revised spec and appends only the missing work as new tasks in `tasks.md`. Check that the new tasks cover CR-1, CR-2, CR-4, CR-5, CR-6, CR-7 and CR-8 and nothing else (CR-3 and CR-9 have no code change).
6. Run `/speckit-analyze` (consistency report). Fix the spec or the tasks if it reports gaps.
7. Run `/speckit-implement`. The agent must also update or add unit tests for REQ-05 (CR-1), REQ-03 (CR-2, CR-5), REQ-20 (CR-6), REQ-13 (CR-7) and REQ-10 / REQ-13 per-child confirmation (CR-8).
8. **Verify** (§10), update `docs/traceability.md` (§11), commit, then `git tag v2 && git push origin v2`.
9. Update `README.md` on `main`: links to v1 / v2, a "What changed in V2" table (CR-1…CR-9 → REQ → goal), and the Roles and Responsibilities section.

---

## 10. Acceptance checks for V2

| Check | Expected in V2 |
|---|---|
| Unit tests | All pass, including new or updated tests for REQ-05 (rejected after FINAL), REQ-03 (cancelled is final; combined move), REQ-20 (started games), REQ-13 (sent → delivered) and REQ-10 / REQ-13 (per-child confirmation, Family E) |
| Walkthrough A–H (regression) | Same results as V1, except that channel status first shows "sent" and becomes "delivered" after 1 simulated minute (CR-7) |
| X1 (heads-up after FINAL) | No heads-up control after FINAL; a domain call is rejected |
| X5 (move after cancel) | No publish control on the cancelled game; a domain publish call is rejected with `game-cancelled`; Mike still sees "FINAL – Cancelled" |
| H1 (move, then cancel) | Still allowed; only the cancellation is current |
| X2–X4 validation messages | Unchanged; now traced to REQ-01 / REQ-03 |
| CR-5: move field + time | One FINAL notice per recipient per channel; label shows both old → new values |
| CR-6: game after kickoff | Tagged "Started" in every list; parents still see it until the end of the day; no publish or heads-up control; its unconfirmed alerts leave "Needs your confirmation" and get no texts or calls |
| CR-7: delivery status | A new notice shows "sent"; after +1 min it shows "delivered" (or "failed" with a reason); missing contacts are "failed" at once |
| CR-8: Family E, only Wes confirms (urgent) | Wes is not escalated; Erin still sees "Needs your confirmation" and gets the call after 2 min; Ray's list shows Family E as not confirmed, naming Erin (for Eli E.) only |
| CR-8: regression, two unrestricted parents | User Story 3 scenario 6 unchanged: one parent confirms, neither is texted, the family shows as confirmed |
| CR-9: coach texts | Same as V1: coaches get the fallback / urgent text, never a call |

---

## 11. Traceability updates for V2

In `docs/traceability.md`, add a **V2 status** column (or a "V2" section). Update these rows:

- **REQ-05**: new code location (heads-up guard); status in V2; reference CR-1 / OBS-1.
- **REQ-01**: verification-time rule now specified.
- **REQ-03**: "moved" now covers field, time or both (CR-5); a cancellation is final (CR-2, D-7); validation rules now specified (CR-4).
- **REQ-13**: "sent" status added (CR-7, OBS-9); status in V2.
- **REQ-15**: same-day started games stay in the parent view (CR-6).
- **REQ-10**: confirmation counted per child (CR-8, OBS-10); "recipient" includes coaches (CR-9, OBS-11).
- **REQ-08**: note that a restricted parent's confirmation no longer covers the restricted child (CR-8).
- **REQ-20 (new, CR-6)**: evidence "none — assumption from V1 evaluation (OBS-8)"; goals G-11, G-02, G-39, G-85; code; tests; status.

---

## Appendix A — Prompt for revising the spec (paste into Claude Code / Cursor)

```
Revise the existing feature spec specs/001-game-change-notice/spec.md for Version 2.
Do NOT create a new feature directory and do NOT change any code yet.
Apply exactly the spec changes in docs/v2-change-request.md sections 2–8b (CR-1, CR-2 option B,
CR-3, CR-4, CR-5, CR-6, CR-7, CR-8, CR-9):
- replace REQ-05 with the revised text; replace REQ-03 with the revised text in section 6;
  extend REQ-01 and REQ-15; add REQ-20 (started games); revise REQ-10 and REQ-13 and the
  confirmation Clarification for per-child confirmation (CR-8); make REQ-10 say "parent or coach" (CR-9);
- add the new acceptance scenarios to User Stories 1, 3, 4 and 5;
- add OQ-4 … OQ-9 to Open Questions; rewrite the two Assumptions bullets on family confirmation
  (CR-8) and on coaches' channels (CR-9); add to Assumptions: the O-1 accepted risk,
  D-7 (a cancellation is final), "Started" as the only post-kickoff state, and the simulated
  delivery timing (sent -> delivered after 1 simulated minute);
- fix User Story 1 scenario 6 (Saturday -> Sunday);
- in Conflict Decisions, record the CR-2 decision (option B, option A kept as the alternative)
  and that the urgent case of CF-3 is unresolved.
Keep all existing REQ IDs, goal IDs and interview citations unchanged. Mark every new or changed
item with "(V2)". Set the spec status to "Draft (V2)". Follow the constitution.
Then show me a summary of the changes.
```

## Appendix B — Not part of this request

- The **learning log** (`docs/learning-log.md`) must be written by the team **without AI assistance**. This change request, the evaluations in `docs/evaluation/v1/` and `traceability.md` are evidence the team can draw on. They are not the learning log.
- **Deployment** of V1 and V2 is decided separately.
