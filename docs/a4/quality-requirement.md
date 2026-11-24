# Quality requirement (Step 3)

> **DRAFT for team review.** The numbers marked *(proposed)* in section 5 are team assumptions that
> all three members must confirm or change before this file is committed. When they are confirmed,
> delete this note and the *(proposed)* marks. Sections 1–3 are pasted, as they are, as the first
> message of each member's Claude Code session in Step 4, so they must not change after that.

## 1. Selected change request

**A4-CR-2**, from **Mike, parent who works shifts with two children in the league**:

> "When I'm stuck at work and miss a cancellation, the app stops reminding me as soon as game time
> passes and quietly drops the alert. By then the sitter may already have taken my kids to an empty
> field, so that is exactly when I need the reminder most."

**Stated reason:** A child left at a cancelled or moved field with no adult present is in real
danger, and the family that never confirmed is the family most likely to make that mistake.

**Quality:** safety. **Classification:** change of intent. Today the prototype deliberately stops
every text and call once a game's kickoff time has passed, and moves an unconfirmed alert out of
"Needs your confirmation" (shown as "Game started – no confirmation needed"). That rule must change.

## 2. Requirement

Refinement of Mike's wording, step by step:

1. "The app stops reminding me as soon as game time passes" →
2. A parent who has not confirmed a cancellation or move keeps being reminded around game time,
   when the children may already be at the wrong field →
3. **Refined requirement (REQ-21):**

> WHEN a FINAL notice cancels or moves a game, AND a parent named in that notice still has an
> unconfirmed child when the game's **risk time** is reached,
> THE SYSTEM SHALL send that parent a simulated text reminder at the risk time and every 15 minutes
> after it, until the parent's children in that notice are confirmed or 60 minutes have passed since
> the risk time, whichever comes first,
> AND SHALL keep that parent's alert under "Needs your confirmation", with its "Confirm receipt"
> button, until the children are confirmed.

Definitions used in this requirement and the criteria below:

- **Risk time (T):** the sooner of the game's kickoff before this notice and its kickoff after this
  notice. For a cancellation, the kickoff before the notice. (This is the same "sooner kickoff"
  that the prototype already uses to decide whether a change is urgent.)
- **Reminder window:** from T up to, but not including, T + 60 minutes. Reminders fall due at T,
  T + 15, T + 30 and T + 45, so at most **4** reminders per parent per notice.
- **Unconfirmed / confirmed:** as today, per child. A child is confirmed once any parent notified
  about that child confirms; a parent is confirmed once every child named in that parent's notice
  is confirmed. A restricted parent never counts for, and is never reminded about, the restricted
  child.
- **Post-kickoff reminder:** a text delivery record with its own trigger, for example
  "Reminder after kickoff", stamped with its due time (like the existing 5-minute text), whose
  content is the current notice for that parent, prefixed with "Reminder:".
- Scope: **parents only**, **FINAL notices only** (heads-ups never escalate), **texts only** (no
  extra calls). Everything else about notification, confirmation and the "Started" tag stays as it is.

## 3. Acceptance criteria

All criteria use the prototype's seed data and demo clock (Saturday 08:30 at start; "Reset demo"
restores it). Scenarios, each starting from a reset:

| Scenario | Published by Brenda at Sat 08:30, verified with "Parks Department" at 08:20 | Risk time T |
|---|---|---|
| **S1** urgent cancellation | Cancel U10 Blue vs U10 Red (Sat 10:00, Field 3); instruction "No game today; do not travel." Nobody confirms. 15 parents notified. | Sat 10:00 |
| **S2** non-urgent move | Move U12 Red vs U12 Gold (Sun 10:00, Field 5) to Field 7. Nobody confirms. 8 parents notified. | Sun 10:00 |
| **S3** time move to later | Move U10 Blue vs U10 Red kickoff from Sat 10:00 to Sat 13:00 (field unchanged). Nobody confirms. | Sat 10:00 (sooner kickoff) |
| **S4** confirmations | As S1, then Erin Evans confirms at 09:00 (before T) and Dana Diaz confirms at 10:20 (inside the window). | Sat 10:00 |
| **S5** changed twice | Move U10 Blue vs U10 Red to Field 7 at 08:30, then to Field 9 at 09:40. Nobody confirms. | Sat 10:00 (both notices) |

Each scenario is run twice: **automated** as unit tests on the tests page (`/tests/`) that drive the
domain functions and the demo clock, and **manually** in the app, by advancing the demo clock with
"+5 min" and reading the administrator's delivery log and the parent view.

### AC-1 First reminder at the risk time

- **What is measured:** the post-kickoff reminder texts in the delivery log, for every parent who
  is unconfirmed at T, in S1, S2 and S3 (all parents of the affected teams; standard seed data, no
  network, simulated delivery).
- **How the criterion is measured:** run each scenario, advance the demo clock to T + 5 min, and
  count the parents unconfirmed at T who have a post-kickoff reminder record stamped at T.
  Automated (unit test per scenario) and manual (delivery log, filtered by time).
- **Target:** 100% of parents unconfirmed at T have a reminder stamped exactly at T (S1: 15 of 15,
  S2: 8 of 8, S3: 15 of 15). A parent with no phone on file gets a "failed" text record instead of
  "sent", as for every other text.
- **Minimum acceptable:** 100% of those parents have a reminder stamped no later than T + 5 min.
- **Boundary:** no reminder to a parent confirmed before T, to a coach, to unaffected teams, or to a
  restricted parent about the restricted child. The texts and calls that the prototype already
  sends before T (text at +5 min, or at once and a call at +2 min when urgent) are unchanged.
  Publishing and heads-ups for a game past its kickoff stay refused, and the "Started" tag still
  appears.

### AC-2 Repeat, then stop at the end of the window

- **What is measured:** the number and times of post-kickoff reminders per unconfirmed parent in
  S1 and S2, when nobody ever confirms.
- **How the criterion is measured:** run the scenario, advance the demo clock to T + 90 min, list
  every post-kickoff reminder per parent with its time. Automated (unit test) and manual (delivery
  log). Repeat once with a single large clock jump (T − 1 min to T + 90 min) to check that the times
  are still the due times.
- **Target:** every unconfirmed parent has exactly 4 reminders, at T, T + 15, T + 30 and T + 45, and
  none at or after T + 60.
- **Minimum acceptable:** every unconfirmed parent has at least 2 reminders inside the window (the
  first by T + 5 min), at most 4, the gaps between reminders are at least 10 minutes, and none at or
  after T + 60.
- **Boundary:** notification noise must not grow outside the window: before T, each parent still
  gets at most one text (and, when urgent, one call) per notice; after T + 60, nothing.

### AC-3 Reminders stop as soon as the children are confirmed

- **What is measured:** reminders to parents who confirm before or during the window, in S4,
  including the per-child rule for a family with two parents (Family E: Erin and the restricted
  parent Wes).
- **How the criterion is measured:** run S4 to T + 90 min. Count reminders for Erin and Wes (Erin's
  confirmation at 09:00 covers both Eli and Emma, so Wes is confirmed too), and for Dana before and
  after her confirmation at 10:20. Automated (unit test) and manual (confirm as Dana in the parent
  view at 10:20, then read the delivery log).
- **Target:** Erin and Wes: 0 reminders. Dana: exactly 2 reminders (T, T + 15) and 0 after 10:20.
  Dana's confirmation after kickoff is accepted and counted.
- **Minimum acceptable:** the same; no reminder may follow a confirmation.
- **Boundary:** confirmation remains per child, and a restricted parent's confirmation never counts
  for the restricted child. The coach's and the administrator's "Not yet confirmed" list updates
  when Dana confirms, as it does before kickoff.

### AC-4 The alert stays actionable after kickoff

- **What is measured:** the parent view of an unconfirmed parent after T, in S1 (Mike, child Max)
  and S2 (Mike, child Mia).
- **How the criterion is measured:** run the scenario, advance the demo clock to T + 20 min and to
  T + 70 min, switch to Mike, and read the view. Manual walkthrough, plus an automated test on the
  parent's alert list.
- **Target:** at both times the alert is under "Needs your confirmation" with a "Confirm receipt"
  button; the text "no confirmation needed" does not appear for it; one tap on "Confirm receipt"
  confirms it and moves it out of "Needs your confirmation".
- **Minimum acceptable:** the same at T + 20 min; at T + 70 min the alert may leave the prominent
  area only if a "Confirm receipt" button is still reachable in the view.
- **Boundary:** the game stays listed and tagged "Started" until the end of that day, as today. A
  confirmed alert, or an alert for a superseded notice, never shows a "Confirm receipt" button.
  Wording still only claims "receipt confirmed", never "read" or "seen".

### AC-5 Reminders carry only the current notice, and only what the parent may see

- **What is measured:** the content and the notice of every post-kickoff reminder in S5 (changed
  twice) and in S1 for Family B and Family E (court-order restrictions in the seed data).
- **How the criterion is measured:** run S5 to T + 90 min and group the reminders by notice; run S1
  to T + 90 min and read the reminders sent to Wes Evans, Yolanda Bell and Xavier Bell. Automated
  (unit test) and manual (delivery log).
- **Target:** S5: every reminder belongs to the second notice and names Field 9; 0 reminders for
  the first (superseded) notice. S1: every reminder to Wes names only Emma E.; Xavier receives none;
  each reminder starts with "Reminder:" and contains the current status ("The game will not take
  place." in S1).
- **Minimum acceptable:** the same (privacy and currency allow no tolerance).
- **Boundary:** the restricted-parent rule, first-name-plus-initial names and the "never read/seen"
  wording are unchanged; a newer notice still cancels every pending reminder of the earlier one.

**Regression boundary for all criteria.** Every requirement that V2 fully satisfies stays
satisfied. All 95 existing unit tests still pass, except the tests that assert the rule this change
replaces, which must be rewritten to the new rule (not deleted): "REQ-20 / REQ-15 (CR-6, US5 #4)
after kickoff Mike still sees the game, tagged started; its alert no longer needs confirmation",
"REQ-10 / REQ-11 / REQ-20 (CR-6) calls due before kickoff are sent; nothing is sent at or after
kickoff", and "REQ-20 (CR-6, US1 #13, US5 #4) admin, coach and parent views show "Started"; Mike’s
alert needs no confirmation". Outside the reminder window, the rule "one notice per change per
channel per parent" still holds.

## 4. Supporting analysis

**Method: fault tree** (safety). The lecture assigns fault trees to performance and availability;
we use it here because the request is about a hazardous outcome with several contributing failures,
and a fault tree shows which combination of failures the change has to break. The obstacle is
O-1a AlertDroppedAtKickoffWhileUnconfirmed, a refinement of O-1 AlertMissedWhileOnShift, obstructing
G-35 ChangeAlertVisible If Not Acknowledged (`docs/goal-model.md` §7).

```
TOP  Child taken to a cancelled or moved field and left without an adult        (G-01 violated)
 └─ AND
    ├─ E1  The family acts on the old schedule (sitter leaves for the old field/time)
    │   └─ OR
    │      ├─ E1.1  Notice never reaches the parent: no contact on file, channel failed (REQ-13 "failed")
    │      ├─ E1.2  Parent on shift misses in-app, email, the one text and the call     [O-1]
    │      │        evidence: YG:M25 "didn't see the message until I was already heading to the other field",
    │      │        YG:M35 "on shift and can't answer a call", LN:M57 "missed ... once or twice"
    │      └─ E1.3  Parent knows but does not pass it on to the sitter                  (outside the system)
    └─ E2  Nobody corrects the family before or soon after arrival
        └─ AND
           ├─ E2.1  System sends nothing more once kickoff passes and drops the alert   [O-1a, V2 REQ-20]
           ├─ E2.2  Coach does not reach the family by phone (busy with the team at the field;
           │        the call list helps only if the coach finds time, LN:R15, YG:R41)
           └─ E2.3  Parent does not open the app on their own while on shift (YG:M105)
```

**Minimal cut sets:** {E1.1, E2.1, E2.2, E2.3}, {E1.2, E2.1, E2.2, E2.3} and {E1.3, E2.1, E2.2, E2.3}.
E2.1 is the only basic event that is in every cut set **and** under the system's control: E1.x
depend on the parent's work and the sitter, E2.2 on the coach, E2.3 on the parent. Removing E2.1
(REQ-21) breaks every cut set that runs through the system. Mike's wording points at the same event
("stops reminding me as soon as game time passes").

**How the tree sets the criteria.**

- *When to remind (risk time):* the hazard materializes when the sitter arrives for the kickoff the
  family still believes in. For a move to a later time that is the **old** kickoff, so T is the
  sooner of the old and new kickoff (S3). AC-1.
- *How often and how long:* a text persists on the phone, unlike a call, and Mike reads texts on
  shift (YG:M35). Repetition gives several chances to catch a break at work; the window covers the
  period in which a child would still be waiting at the field. AC-2.
- *When to stop:* a reminder after confirmation does not reduce the hazard and only adds noise
  (G-85). AC-3.
- *Alert in the app:* E2.3 is weakened if the alert is still prominent and confirmable when the
  parent does open the app. AC-4.
- *New hazards introduced by the change* (side effects from `docs/a4/analysis.md`): a stale
  reminder sending the family to a superseded field (S2-c, O-4) and a reminder leaking a restricted
  child (G-23). AC-5.

**Alternatives considered and not chosen.**

| Alternative | Why not in this change |
|---|---|
| Extra phone calls after kickoff | Mike cannot answer calls on shift (YG:M35); calls also add the most noise (CF-3, OBS-3). |
| A pre-departure reminder (e.g. 30 min before kickoff) | Would cut E1 earlier, but Mike asked about the time after game time, and it adds a message for every unconfirmed parent of every changed game. Recorded as a candidate for a later change. |
| Reminders until confirmed, with no end | Unbounded noise (G-85, S2-b) for a game that is over; a confirmation tap is cheap but not guaranteed. |
| Reminding the coach | The coach's "Not yet confirmed" list already serves E2.2 (G-37); A4-CR-4 covers its readability. |

## 5. Assumptions

| Assumption | Reason | Evidence that would overturn the assumption |
| --- | --- | --- |
| Reminder window of **60 minutes** after T *(proposed)* | Long enough to cover a U10/U12 game slot and a child waiting at the field; short enough to end the same afternoon. No stakeholder gave a number. | Mike or Brenda saying children are usually picked up later than an hour after kickoff, or that the field is left empty sooner. |
| Reminder interval of **15 minutes**, at most **4** reminders *(proposed)* | Mike checks his phone in breaks on shift; four chances within an hour. Keeps the added noise bounded (G-85, YG:M77). | Mike saying 15 minutes is too frequent to tolerate, or that he can only check once an hour (then the window would need to be longer). |
| Risk time = **sooner** of old and new kickoff *(proposed)* | The family that missed the change acts on the old time; the prototype already uses the sooner kickoff for urgency. | Evidence that sitters leave at the new time even without seeing the change (not plausible), or Brenda preferring the new kickoff. |
| For a game changed twice, T comes from the **latest** notice only *(proposed)* | Keeps one rule; reminders of a superseded notice are cancelled anyway. Known gap: a family that missed both changes is not reminded at a kickoff that only the first notice named. | A field report of a family arriving at the time of an earlier superseded notice. |
| **Texts only**, no extra calls | YG:M35 (cannot answer a call on shift); texts persist. | Mike answering OQ-6 that a call is what reaches him on shift. |
| **Parents only**, not coaches | The coach is at the field and already sees the "Not yet confirmed" list. | Ray asking to be reminded about unconfirmed families after kickoff. |
| Reminders apply to **cancellations and moves**, urgent or not | Mike says "a cancellation"; the stated reason says "cancelled or moved field". | — |
| Confirmation after kickoff is accepted and stops reminders | Confirming is the parent's way to stop the reminders; the prototype already accepts it in the domain layer. | — |
| The reminder content is the current notice prefixed with "Reminder:" | Families must see the current status, not a generic nag; reuses the wording the team already validated (REQ-03, REQ-14). | A walkthrough in which a test user cannot tell the reminder from a new change. |

## 6. Trade-off

**What gave ground: notification noise (G-82 Minimize[NotificationNoise] / G-85
Avoid[DuplicateAndTrivialNotifications], CF-3) and the V2 rule "one notice per change per channel".**
A parent who has not confirmed by the risk time can now receive up to 4 more texts about the same
change in the hour after kickoff. This also gives up V2's assumption REQ-20 that a change no longer
matters once the game has started, which had no interview evidence (OQ-7).

**Why the stakeholders can accept the loss.**

- *Mike* asked for exactly this, and his own concern about duplicates (YG:M77) is respected by the
  bound (60 minutes, 4 texts) and by the stop rule: one tap on "Confirm receipt" ends the reminders.
- *Parents who already confirmed* see no change at all (AC-3), so the extra noise falls only on the
  families the fault tree identifies as at risk.
- *Brenda* gains: more families end up knowing the official status (G-21), and nothing changes in
  publishing, verification or privacy (AC-5).
- *Ray* gains: fewer families to call after arriving at the field; his view does not change.

The cost is accepted only inside the reminder window. Outside it, the noise boundary of AC-2 keeps
V2's behavior.

## 7. Baseline on Prototype V2

Measured on tag `v2` (commit `8f6aa67`), seed data, by driving the domain functions and the demo
clock in the browser console on a fresh store (same procedure as the criteria), plus a manual check
of Mike's view for AC-4.

| Criterion | Result on V2 | Passes? | Evidence |
| --- | --- | --- | --- |
| AC-1 First reminder at T | S1: 0 of 15 unconfirmed parents reminded at or after T. S2: 0 of 8. S3: 0 of 15. | No | V2 cancels every escalation due at or after kickoff and has no post-kickoff reminder (`delivery.js` `processDueEscalations()`, REQ-20). In S1 Mike's last message is the call at 08:32. |
| AC-2 Repeat, stop at T + 60 | S1 and S2: 0 reminders per parent in the window (target 4, minimum 2). | No | Same runs, clock advanced to T + 90 min. |
| AC-3 Stop on confirmation | S4: Erin/Wes 0 (as required); Dana 0 before her 10:20 confirmation (target 2), 0 after. Dana's confirmation after kickoff is accepted. | No | Only the "nothing after confirmation" part holds, because nothing is sent at all. |
| AC-4 Alert actionable after kickoff | S1 at 10:20: "Needs your confirmation (0) — No unconfirmed alerts"; the alert is under "Earlier messages" with "Game started – no confirmation needed"; 0 "Confirm receipt" buttons. S2 at Sun 10:20: alert `unconfirmed: false, started: true`. | No | `queries.js` `alertsFor()` sets `unconfirmed` to false once the game has started; parent view read in the browser. |
| AC-5 Current notice and privacy | S5 and S1: 0 post-kickoff reminders of any kind, so there is no reminder naming Field 9 or "Reminder:". | No | The privacy and superseded parts hold trivially (nothing is sent); the criterion fails on the required reminders. |

V2 fails every criterion, so none of them is already met by the current prototype. Side
observation (not part of this change): in S1 the cancelled game is tagged "Started" at its old
kickoff, next to "FINAL – Cancelled".
