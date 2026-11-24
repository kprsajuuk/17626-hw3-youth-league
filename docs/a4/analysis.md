# Change request analysis (Steps 1 and 2)

Packet **C15**, four requests (A4-CR-1 … A4-CR-4). Baseline is Prototype V2 (tag `v2`, commit `8f6aa67`;
`app/` on `main` is byte-identical to `v2`). Spec citations refer to
`specs/001-game-change-notice/spec.md` at `v2`. Goal IDs refer to `docs/goal-model.md`. The
reproductions behind each likelihood rating are listed in the [appendix](#appendix-reproductions-on-prototype-v2)
so that any team member can repeat them.

**Citation format** (as in `docs/traceability.md`): `YH:` / `LN:` / `YG:` = transcript set of Member 1 / 2 / 3;
`B` / `M` / `R` = Brenda / Mike / Ray, followed by the turn number.

**Rating scales** (from the assignment): Likelihood **High** = reproducible in V2 during normal use;
**Medium** = only under specific conditions that interview evidence shows occur; **Low** = unusual
conditions, no interview evidence. Criticality **Major** = the stakeholder cannot achieve the goal;
**Minor** = the goal is achieved at extra time or effort.

## Step 1: Analysis of each request

### A4-CR-1

> Brenda: "The coach's list of families who haven't confirmed shows which parent was told about which child. Anyone who looks closely can work out which families have a court order, and that is private. Keep the coach able to reach every family, just without the list giving that away."

| Item | Answer |
| --- | --- |
| Quality and softgoal | **Privacy (confidentiality by inference).** Softgoal **G-62 Maintain[ChildSafetyAndPrivacy]**, refined here by **G-64 Avoid[UnnecessaryPersonalInfoShown]** and **G-23 Avoid[RestrictedParentGetsChildInfo]** (D-4). It pulls against **G-37 NonAcknowledgerContacted** (the coach must still reach every family). G-62 and G-64 were out of the A3 sprint; this request brings G-64 into scope. No new softgoal is needed, but the goal model needs a new obstacle (below) and a note on G-36 / G-37. |
| Obstacle | **O-3 CustodyRestrictionInferableFromAckList** obstructs G-64 / G-62: the coach's status view lists, per family, each notified parent together with the children that parent was told about. When one parent of a family is listed with fewer children than the other parent (or a known second parent is missing), a viewer can infer that a court-order restriction exists and for which child. |
| Likelihood | **High.** Reproduced in V2 with the seed data (appendix R1). Ray's not-confirmed list reads `Family E: Wes Evans (for Emma E.); Erin Evans (for Eli E., Emma E.)`, which shows that Wes was not told about Eli. The same split appears in the status table's *Children* column (`Family E \| Wes Evans \| Emma E.`) and in the coach's delivery log (message text `For: Emma E.`). Family B shows only `Yolanda Bell (for Bea B.)`; a coach who knows the Bells have two parents can infer that Xavier is restricted. This is the normal coach view after every publish; no special condition is needed. |
| Criticality | **Major.** When the obstacle occurs, the goal G-64/G-62 ("no unnecessary personal information shown", "the child's privacy is kept") is not achieved at all: the custody matter is exposed to the coach and to anyone who can see the coach's screen (stated reason; Brenda YG:B66 "two families with court orders on file, so certain parents must not receive information about a child"; YG:B68 "a convenience feature can create a serious problem if the wrong person sees information"; YG:B73 "show only the minimum information needed"). Constitution VII states that court-order restrictions are "a safety issue, not a preference". |
| Classification | **Change of intent.** V2 does exactly what its spec asks; the spec itself requires the per-parent, per-child listing that leaks the restriction. REQ-13 (V2, CR-8): *"A family stays on that list until all of its children on the affected team(s) are confirmed; the list names only the parents notified about the unconfirmed children (REQ-08)."* REQ-08 only forbids the restricted parent appearing *"in recipient lists, delivery logs or acknowledgment lists about the restricted child"*, which V2 meets (Wes is never listed next to Eli; test `confirmations.test.js` "W is listed only with Emma, never next to Eli"). The spec says nothing about information that can be *inferred* from the list, so the new intended behavior ("the list must not let a viewer infer a restriction") is not in V2's spec. It also answers open question **OQ-8** (*"should the coach treat them as a separate contact for 'call before departure'?"*), whose interim decision produced this leak. Not a defect: the code keeps the spec's promise. |
| Affected artifacts | **Requirements/spec:** REQ-13 (list content), REQ-08 (extend "must not appear" to "must not be inferable"), US3 acceptance scenarios 1, 3, 4 and US6 #8 (`spec.md` l.163–193, l.296), SC-002 (add an inference check), OQ-8, conflict row CR-8 (l.531), Assumptions on per-child confirmation (l.498–503). **Goal model:** new O-3 on G-64; note on G-36/G-37 and D-4. **Code:** `domain/confirmations.js` `noticeStatus()` (`rows[].children`, `notConfirmed[].parents`); `ui/components.js` `noticeStatusTable()` (not-confirmed list and *Children* column); `domain/queries.js` `deliveryLog()` and `domain/delivery.js` `renderNoticeContent()` (coach sees per-parent message text `For: …`); `ui/coachView.js`. **Tests:** `confirmations.test.js` (REQ-08 list test l.71, US6 #8 l.114, l.131, l.140, "8 of 10" l.52), `wording.test.js` (coach view text). **Traceability:** rows REQ-08, REQ-13. |
| Side effect | **S1-a Coach calls a restricted parent about the restricted child.** If the list stops saying which parent is cleared for which child, Ray may phone Wes about Eli, which is exactly the disclosure G-23/G-25 forbids. Likelihood **Medium** (two-parent families with a restriction exist, YG:B66; Ray calls non-confirmers before departure, YG:R41 "I know who needs a call"). Criticality **Major** (G-23 fails). Any design must therefore still tell the coach *whom* to call, without showing *why*. **S1-b Fewer contacts per family.** If only "safe" contacts are shown, a family whose only cleared parent is unreachable has no listed alternative (G-37 weakened). Likelihood **Low**, criticality **Minor** (the coach can ask Brenda, who keeps the full view, REQ-13 admin). **S1-c Admin/coach views diverge**, so US3 #4 ("she sees the same … status as the coach") must change. Likelihood High (by design), criticality Minor. |
| Feasible in the prototype | **Yes.** The seed already contains both restriction patterns (Family B: restricted parent's only child; Family E: one of two children). The change is limited to the status query, the coach view and the coach's delivery log, and can be checked with unit tests and a walkthrough of Ray's view. |
| Assumptions | A1-1 "The coach's list" covers every coach-visible surface that pairs parents with children: the not-confirmed list, the status table and the coach's delivery log (not only the red list). A1-2 "Anyone who looks closely" includes the coach and a parent looking over the coach's shoulder (stated reason), so the leak counts even if the coach is trusted. A1-3 "Reach every family" means the coach can still see each unconfirmed family, its unconfirmed children, and at least one parent who may be called about all of them; it does not require listing every parent. A1-4 The administrator's view keeps full detail, because Brenda reviews restrictions herself (YG:B73). A1-5 Showing that a family has a single listed contact is acceptable if single-parent families look the same (no "1 of 2 parents" signal). |

### A4-CR-2

> Mike: "When I'm stuck at work and miss a cancellation, the app stops reminding me as soon as game time passes and quietly drops the alert. By then the sitter may already have taken my kids to an empty field, so that is exactly when I need the reminder most."

| Item | Answer |
| --- | --- |
| Quality and softgoal | **Safety** (and reliability of notification). Root softgoal **G-01 Improve[SafeAndWellCoordinatedGameDay]**, through **G-21 FamiliesKnowOfficialStatus** and **G-35 Maintain[ChangeAlertVisible If Not Acknowledged]**; the existing obstacle **O-1 AlertMissedWhileOnShift** (obstructs G-26, resolved by G-30/G-31) is the one this request says is not fully resolved. Pulls against **G-82 Minimize[NotificationNoise] / G-85 Avoid[DuplicateAndTrivialNotifications]** (CF-3). |
| Obstacle | **O-1a AlertDroppedAtKickoffWhileUnconfirmed** (refines O-1): when a parent has not confirmed a FINAL change by the game's kickoff, V2 stops every text and call and moves the alert out of "Needs your confirmation". After kickoff nothing in the system keeps telling the family that the game is cancelled or moved, at the time an adult may already be on the way to the old field. |
| Likelihood | **High.** Reproduced in V2 (appendix R2): urgent cancellation at 08:30 for the 10:00 game, Mike never confirms. Mike gets in-app + email + text at 08:30 and one call at 08:32, then nothing more; at 10:05 his alert is `unconfirmed: false, started: true` (tagged "Game started – no confirmation needed") while Ray's list still shows 10 unconfirmed families. Interview evidence that the condition occurs: YG:M25 "one game moved fields while I was on shift, and I didn't see the message until I was already heading to the other field"; LN:M26/M57 "I missed a schedule-change notification once or twice and found out too late"; YG:M35 "I may be on shift and can't answer a call". |
| Criticality | **Major.** When it occurs the family does not know the official status (G-21 fails) and, per the stated reason, a child can be left at an empty or wrong field with no adult (G-01). Ray confirms the consequence at the team level: LN:R15 "I'm the guy explaining to fifteen kids why we're at the wrong field." |
| Classification | **Change of intent.** V2's spec explicitly promises the opposite of the request. REQ-20: *"Unconfirmed FINAL alerts for a started game MUST move out of 'Needs your confirmation' and MUST NOT trigger further texts or calls."* REQ-10: *"No text or call is sent once the game has started (REQ-20)."* REQ-12: the alert stays prominent *"unless the game has started (REQ-20)"*. REQ-20 is marked *"Evidence: none — assumption from V1 evaluation (OBS-8; OQ-7)"*, and OQ-7 asked Brenda / Ray whether anything matters after kickoff. Mike's request is the stakeholder answer to OQ-7 and reverses the team's assumption, so the intended behavior must change. Not a defect: the code does what REQ-20 says (tests `queries.test.js` l.65, l.81). |
| Affected artifacts | **Requirements/spec:** REQ-20, REQ-10, REQ-11, REQ-12, REQ-15 (started-game handling), US5 #4, US6 (`spec.md` l.236–300), SC-005, CF-3 row and OQ-6/OQ-7 (l.529, l.571–576), edge cases on "Started". **Goal model:** O-1 note (V2 says "resolved by G-30 and G-31"), G-35, G-11 note (CR-6), CF-3. **Code:** `domain/delivery.js` `processDueEscalations()` (`e.dueAt >= kickoff` cancel rule) and `dispatchFinalNotice()` (single fixed text/call); `domain/queries.js` `alertsFor()` (moves started alerts out of "Needs your confirmation"); `domain/store.js` `gameStarted()` (a *cancelled* game is also tagged "Started" at its old kickoff); `ui/components.js` `alertCard()` ("Game started – no confirmation needed"); `ui/parentView.js`. **Tests:** `queries.test.js` l.65, l.81; `wording.test.js` l.94; `delivery.test.js` escalation tests l.69–l.153. **Traceability:** rows REQ-10, REQ-11, REQ-12, REQ-20. |
| Side effect | **S2-a More notification noise (G-82/G-85, CF-3).** Repeating texts or calls after kickoff adds messages to parents who already know (but did not tap "confirm"), and to a game that is irrelevant once everyone is home. Likelihood **High** (most parents never confirm promptly; V2 baseline shows 10 of 10 U10 Blue families unconfirmed at kickoff in R2). Criticality **Minor** (annoyance; Mike himself warned "too many duplicate messages would be annoying", YG:M77). **S2-b Reminders that never end.** Without a stop condition the system could call a family all evening; a stop rule (e.g. a time window after kickoff) is a new assumption. Likelihood Medium, criticality Minor. **S2-c Stale reminder risk grows** (links to A4-CR-3): reminders sent later and over a longer period make it more important that each one carries only the current notice. Likelihood Low (V2 already cancels superseded escalations, R3), criticality Major if it happened. |
| Feasible in the prototype | **Yes.** The demo clock (REQ-19) can move past kickoff, and the delivery log already shows each simulated text and call with its time, so post-kickoff reminders and the alert's state can be demonstrated and unit-tested. Whether a real sitter reads the reminder in time cannot be shown (mock delivery, Constitution VI). |
| Assumptions | A2-1 "Stops reminding" covers both texts/calls (REQ-10/REQ-11) and the in-app alert's prominence (REQ-12/REQ-20). A2-2 Applies to **cancellations and moves** alike (Mike says "a cancellation", the stated reason says "cancelled or moved field"). A2-3 Reminders after kickoff go only to parents who have **not confirmed** (per-child rule, REQ-10 CR-8), never to confirmed parents. A2-4 Reminders must stop at some bounded point (number of repeats or time after kickoff); the request gives no number, so the bound is a team assumption to be set in Step 3. A2-5 The request concerns FINAL notices only; heads-ups still never escalate (O-1 accepted risk, OQ-6). A2-6 "Game time" = the game's current kickoff (for a cancellation, the original kickoff). |

### A4-CR-3

> Ray: "Brenda moved our game and then moved it again, and I still got a reminder text about the old move, and so did some of my parents. Now families are asking me which field is right."

| Item | Answer |
| --- | --- |
| Quality and softgoal | **Consistency / integrity of status (reliability).** Softgoal **G-02 Maintain[OfficialStatusClearAndCurrent]**, through **G-10** (notice marked FINAL, replaces earlier notices) and **G-85 Avoid[DuplicateAndTrivialNotifications]**. Supports G-01. |
| Obstacle | **O-4 StaleReminderAfterSupersede**: after a FINAL notice is replaced by a newer FINAL notice, a reminder (text or call) about the replaced notice still reaches recipients, so families hold two conflicting "official" messages. |
| Likelihood | **Low.** The team **could not reproduce** the obstacle in V2 (appendix R3). Urgent case: first move at 08:30, second move at 08:31, clock +10 min: 0 texts or calls for the first notice after the second publish; all 15 pending escalations of the first notice are `cancelled`. Non-urgent case (game tomorrow), second move 3 min later: 0 texts for the first notice, 10 texts for the second; Mike's view shows the old notice as "Superseded". A stale reminder would need conditions the prototype does not model (a real SMS gateway delivering late or out of order, or a reminder sent *before* the second move but read after it). Interview evidence shows that changes and conflicting versions happen (YG:B41 "it gets confusing when information changes and different people are working from different lists or versions"; LN:B61 "forwarded copies sometimes create confusion about which version is official"), but no interview shows a reminder for a superseded notice arriving after the new one. |
| Criticality | **Minor.** The goal is still achieved, at extra effort: every recipient also gets the newer FINAL notice (in-app + email, plus text when urgent), and every view shows the newer notice as current with the older one struck through as "Superseded" (REQ-04, REQ-05). Families can resolve the conflict by opening the app or calling Ray, which is the extra effort Ray describes ("families are asking me which field is right"). It would become Major only if a family acted on the stale text without checking, which needs the unmodeled conditions above. |
| Classification | **No defect, works as specified.** V2's spec already promises the behavior Ray asks for. Edge case (`spec.md` l.309–312): *"Two changes to the same game before families confirm the first: only the latest change is current; earlier notices are marked superseded. … pending escalations for the superseded notice are cancelled and the escalation clock restarts for the new notice."* REQ-04: the notice *"MUST replace any earlier heads-up or earlier notice for that game as the current status."* The code keeps the promise: `publishChange()` calls `cancelEscalations(store, previous.id)` (`notices.js` l.121), and `processDueEscalations()` cancels any escalation whose notice is not `current` (`delivery.js`). Test `delivery.test.js` l.138 "a second publish cancels the first notice's pending escalations and schedules new ones" passes, and R3 confirms it end to end. **Finding recorded for Step 2 (not a defect):** the second notice's text reads `FINAL – Moved: Field 7 → Field 9 … originally Sat 10:00 at Field 7`; "originally" names the *first move's* field, not the original schedule (Field 3). REQ-03 says "old → new" without defining "old" for a second change. This may add to "which field is right" confusion and is a possible requirements issue (ambiguous wording), not a defect. |
| Affected artifacts | **If no change is made:** none; add the R3 scenario as a regression test (`delivery.test.js`) and a traceability note on REQ-04/REQ-10. **If the team later clarifies the wording issue:** REQ-03 / REQ-04 wording ("old" for a repeated change), `domain/delivery.js` `renderNoticeContent()`, `domain/notices.js` `noticeLabel()`, `notices.test.js`, `wording.test.js`. **If the real cause is gateway delay (out of scope for a mock):** a new requirement that a superseding notice explicitly says it replaces the earlier one ("Ignore the earlier message about Field 7"), affecting REQ-04, REQ-17 and `renderNoticeContent()`. |
| Side effect | **None found** for "no change". If the team added an explicit "this replaces the earlier message" line (option above), side effect **S3-a longer messages** (G-82 noise / readability on a phone): Likelihood High, Criticality Minor. |
| Feasible in the prototype | **Partly.** The prototype can demonstrate and test that no reminder for a superseded notice is sent (already true). It cannot reproduce real-world late or out-of-order SMS delivery, which is the most likely real cause, because delivery is simulated (Constitution VI). |
| Assumptions | A3-1 "A reminder text about the old move" means a text or call (REQ-10/REQ-11), not the delivery-report record ("delivered") that the delivery log adds for messages already sent. A3-2 Ray's report comes from the field pilot, where the reminder may have been sent *before* the second move and read after it; V2 treats that text as correct at the time it was sent. A3-3 "Moved and then moved again" are two FINAL notices; a coach heads-up is not involved (heads-ups never send texts, REQ-05/REQ-17). A3-4 "Some of my parents" means the parents who had not confirmed the first move (only they had pending reminders). |

### A4-CR-4

> Ray: "When I pull up who has confirmed on my phone at the field, I honestly can't tell the families who are fine from the ones I still need to call. The little status marks all look alike, especially out in the sun."

| Item | Answer |
| --- | --- |
| Quality and softgoal | **Usability and accessibility (perceivability on a small screen in bright light).** Softgoal **G-77 Increase[AdoptionByBusyParentsAndVolunteers]** through **G-78 KeyActionsWithin3Taps** (mobile use), serving **G-36 Maintain[AckStatusShownPerRecipient]** and **G-37 NonAcknowledgerContacted**. The goal model has no softgoal for readability; **add softgoal G-86 Improve[StatusReadableAtAGlanceOnPhone]** under G-77, contributing to G-36/G-37. |
| Obstacle | **O-5 AckStatusMisreadOnPhone**: on a phone-width screen the coach's status view does not let the coach tell confirmed from unconfirmed families at a glance, so a family that has not confirmed is not called before departure. |
| Likelihood | **High.** Reproduced in V2 at 375 × 812 px (appendix R4): the status table is 708 px wide inside a 313 px container, so the **Receipt** column (the only column that says "Confirmed" / "Not yet confirmed") is off-screen unless the coach scrolls sideways. The visible columns are channel badges, and "delivered" uses the **same** green badge style (`badge-ok`) as "Confirmed", while channel "failed" uses the same red style (`badge-failed`) as "Not yet confirmed". Badges are 12 px text. Text contrast passes WCAG AA (green on light green 5.43:1, white on red 6.57:1), but the light-green badge background against the white card is 1.13:1, below the 3:1 non-text contrast of WCAG 1.4.11, so "Confirmed" and "delivered" badges read as plain green text. Phone use at the field is normal: YG:M105 "quick and straightforward on my phone"; LN:R15 Ray checks updates on game days; G-78 (mobile). No interview evidence mentions sunlight specifically; sunlight only makes the low non-text contrast worse. |
| Criticality | **Minor.** The coach can still achieve G-37: above the table, V2 shows a red-bordered text list "Not yet confirmed (n) — call before departure" naming every unconfirmed family and parent, which wraps correctly at phone width (R4). The cost is extra time and effort (scrolling, reading the table twice), which is what SC-004 ("under 30 seconds") is meant to bound. It would be Major only if the coach relied on the table and skipped the list; the stated reason describes that risk. |
| Classification | **Change of approach.** The intent already exists in V2's spec: REQ-13 requires *"a list of families who have not confirmed receipt"*, and SC-004 requires *"A coach identifies every family that has not confirmed receipt in under 30 seconds of opening the status view."* The spec does not change what the coach should be able to do; the request asks for a different presentation that achieves the same intent on a phone outdoors. The spec is silent about device, screen width and light conditions (no mention of mobile, contrast or WCAG in `spec.md` or the constitution), and SC-004 is listed as "Not yet verified" in `docs/traceability.md`. If the team times SC-004 on a phone and it fails, the request becomes a **defect** against SC-004; the Step 3 baseline will settle this. |
| Affected artifacts | **Requirements/spec:** SC-004 (add device and conditions), REQ-13 (presentation of receipt status), US3 #1 and #4. **Goal model:** new softgoal G-86 and obstacle O-5 under G-77/G-36. **Code:** `ui/components.js` `noticeStatusTable()`, `channelCell()`, `statusBadge()`; `styles.css` (`.badge-ok`, `.badge-failed`, `.badge-sent`, `.table-wrap`, `.not-confirmed`, no mobile media query); `ui/coachView.js`; `ui/adminView.js` (shares the table). **Tests:** `wording.test.js` (labels), a new automated audit (e.g. Lighthouse / axe contrast at mobile width) and a manual timed check of SC-004. **Traceability:** REQ-13 row; SC-004 "Not yet verified" note. |
| Side effect | **S4-a Privacy leak becomes easier to see** (links to A4-CR-1): a clearer per-parent layout makes the "which parent for which child" pattern more prominent. Likelihood High if the per-parent layout is kept, Criticality Major (G-64). **S4-b Less detail for the administrator**: simplifying the shared table on small screens could hide per-channel "failed" status Brenda uses on desktop (REQ-13). Likelihood Medium, Criticality Minor. |
| Feasible in the prototype | **Partly.** Layout, labels, contrast and phone width can be built and measured (browser device emulation, automated contrast audit, timed walkthrough). Real outdoor sunlight on a real phone cannot be reproduced reliably; the team can only approximate it (contrast thresholds, a reduced-brightness or grayscale check). |
| Assumptions | A4-1 "On my phone" = a phone-width viewport of about 360–400 CSS px, portrait. A4-2 "Status marks" = the badges in the status table and list (Receipt, In-app, Email, Text, Call). A4-3 "Families who are fine" = families whose every affected child is confirmed (REQ-13, CR-8), not families whose messages were "delivered". A4-4 "Out in the sun" is treated as a contrast and size requirement (non-text contrast ≥ 3:1, no reliance on colour alone, readable text size), since sunlight itself cannot be tested in the prototype. A4-5 Ray uses the coach view, not the administrator view. |

## Step 1: Comparison of requests

| Pair | Relationship | Reason |
| --- | --- | --- |
| A4-CR-1 and A4-CR-2 | Independent | CR-1 changes what the coach's status view shows; CR-2 changes when the system stops reminding parents. They touch different requirements (REQ-13/REQ-08 vs. REQ-10/REQ-20) and different code (`noticeStatus()` vs. `processDueEscalations()`), and post-kickoff reminders already exclude restricted parents through `recipient.childIds` (REQ-08). |
| A4-CR-1 and A4-CR-3 | Independent | CR-3 concerns reminders for superseded notices, which V2 already cancels; it does not touch the coach's list or what the list reveals. |
| A4-CR-1 and A4-CR-4 | Conflict | Both change the same view (`noticeStatusTable()`): CR-4 asks the coach to see each family's status more clearly at a glance, which pushes toward more per-contact detail, while CR-1 asks the list to reveal less about which parent was told about which child; a clearer per-parent layout would make the custody pattern easier to read (S4-a). The conflict can be eased by a family-level design, but it must be marked in the goal model (G-86 vs. G-64) and one request given priority. |
| A4-CR-2 and A4-CR-3 | Dependency (CR-2 depends on CR-3) | Extending reminders past kickoff is only safe if every reminder carries only the current notice; that is exactly the guarantee CR-3 questions. V2 already provides it (R3), so CR-2 can rely on it, but CR-2's change must not break it (S2-c), and the R3 scenario should become a regression test before CR-2 is built. |
| A4-CR-2 and A4-CR-4 | Reinforcement | Both aim at the same outcome: an unconfirmed family is reached before an adult leaves for the wrong field. CR-2 keeps reminding the family; CR-4 helps the coach find and call the same family. Each reduces the chance that the other's failure leaves a child at an empty field. |
| A4-CR-3 and A4-CR-4 | Independent | CR-3 is about delivery of superseded notices; CR-4 is about the coach's view of receipt status. They share no requirement or code. Both affect trust in the status, but a fix to one does not help or hinder the other. |

## Step 2: Ranking and selection

**How we ranked.** First by the obstacle's rating (likelihood × criticality from Step 1). Ties
were broken by weighing, in this order: (1) the side effects the change itself would create, (2)
conflicts and dependencies with the other requests, (3) how many artifacts would have to change and
how settled the intent is (open questions still needing a stakeholder answer). Only a change of
intent can be selected (A4-CR-1 or A4-CR-2).

| | A4-CR-1 | A4-CR-2 | A4-CR-3 | A4-CR-4 |
| --- | --- | --- | --- | --- |
| Classification | Change of intent | Change of intent | No defect | Change of approach |
| Likelihood / criticality | High / Major | High / Major | Low / Minor | High / Minor |
| Worst side effect of the change | **S1-a Medium / Major** (coach calls a restricted parent) | S2-a High / Minor (noise); S2-c Low / Major (stale reminder, already guarded) | none (no change) | S4-a High / Major (only if per-parent layout kept) |
| Conflicts / dependencies | Conflicts with CR-4 | Depends on CR-3 (already met in V2); reinforces CR-4 | — | Conflicts with CR-1; reinforces CR-2 |
| Intent settled? | No: how a coach should reach a separated parent is OQ-8, still open with Brenda | Yes: Mike states the need directly and it answers OQ-7, whose interim REQ-20 had no evidence | — | Mostly (SC-004 already states it) |
| Eligible to select | Yes | Yes | No | No |

| Rank | Request | Reason for the rank |
| --- | --- | --- |
| 1 | A4-CR-2 | High / Major: reproduced in normal use (R2), and the interviews show the condition happens (YG:M25, LN:M57). Its side effects are Minor (noise, S2-a; a bounded stop rule, S2-b) except S2-c, which V2 already guards against (R3). It conflicts with no other request and reinforces CR-4. Its intent is settled by stakeholder evidence that replaces an evidence-free team assumption (REQ-20). |
| 2 | A4-CR-1 | Also High / Major, and a child-safety matter (Constitution VII). Ranked below CR-2 because any fix we can design today risks a Major side effect (S1-a: the coach no longer knows whom it is safe to call), the right design depends on an answer from Brenda we do not have (OQ-8), and it conflicts with CR-4 on the same view. Implementing it now on assumptions could trade one disclosure for another. |
| 3 | A4-CR-4 | High likelihood but Minor criticality: the readable "Not yet confirmed (n) — call before departure" list at the top of the view still lets Ray reach every family (R4). A change of approach, so it cannot be selected. It may become a defect against SC-004 once Step 3 times it on a phone. Its redesign should wait for CR-1, because both change `noticeStatusTable()`. |
| 4 | A4-CR-3 | Low / Minor and no defect: V2 already cancels reminders for a superseded notice (spec edge case l.309–312, R3). No change is needed beyond a regression test; the "originally …" wording finding is logged for a later clarification. |

**Selected request:** **A4-CR-2** — keep reminding a family that has not confirmed a FINAL
cancellation or move after the game's kickoff, instead of stopping texts and calls and dropping the
alert (reverses REQ-20's "no further texts or calls" rule and the related parts of REQ-10, REQ-11 and
REQ-12). Quality: safety. Analysis method for Step 3: a fault tree with the top event "a child is
taken to a cancelled or moved field because the family never saw the change".

**Why the team chose the selected request over each of the other requests:**

- **Over A4-CR-1.** Both obstacles are High / Major, so the rating alone does not decide. We chose
  CR-2 because (a) its change does not itself create a Major hazard, while hiding who was told about
  which child can lead the coach to phone a restricted parent about the restricted child (S1-a),
  the exact disclosure G-23 / G-25 forbid; (b) CR-2's intent is stated by the stakeholder who lives
  with the problem, while CR-1's safe design depends on OQ-8 (whether a restricted parent lives in a
  separate household and how the coach should contact them), which only Brenda can answer; and (c)
  CR-2 has no conflict with another request, while CR-1 shares a view with CR-4 and pulls against
  it. CR-1 is not dropped: it is the first candidate for the next sprint, and we will put OQ-8 to
  Brenda now so that its design is not built on our assumption. Until then, the risk stays as in V2
  (the restricted parent is never listed next to the restricted child, REQ-08).
- **Over A4-CR-4.** CR-4 is a change of approach, so it is not eligible, and its criticality is
  Minor because the text list already names every unconfirmed family. CR-2 also helps the outcome CR-4
  is about (an unconfirmed family reached before departure) from the parent side.
- **Over A4-CR-3.** There is nothing to change: V2 keeps the spec's promise (no defect, works as
  specified). Because CR-2 depends on CR-3's guarantee, the R3 scenario is carried into CR-2's
  acceptance criteria as a boundary: extended reminders must never carry a superseded notice.

**Conflicts between requests, and which request takes priority:**

Both requests in each conflict stay in the goal model; the conflict is marked and the priority is
recorded, as in A3 (Constitution III).

| ID | Conflict | Requests | Priority and reason |
| --- | --- | --- | --- |
| **CF-9** (new) | G-86 Improve[StatusReadableAtAGlanceOnPhone] ⚡ G-64 Avoid[UnnecessaryPersonalInfoShown] | A4-CR-4 vs. A4-CR-1 | **A4-CR-1 (G-64) takes priority.** Constitution VII: "where a privacy rule and another requirement conflict, the privacy rule wins", and CR-1's obstacle is Major while CR-4's is Minor. Any future readability redesign must not make the per-parent / per-child pattern easier to read. Neither request is implemented this sprint, so the conflict stays open; a family-level layout (one row per family, one "call" contact) may satisfy both and should be checked with Brenda and Ray. |
| **CF-3** (extended) | G-30 / G-31 reminders until confirmed ⚡ G-85 Avoid[DuplicateAndTrivialNotifications] | A4-CR-2 vs. the existing noise goal (not a packet request) | **A4-CR-2 takes priority after kickoff** for families that have not confirmed: a child at an empty field outweighs extra messages (S2-a is Minor). G-85 keeps ground in three ways that Step 3 must turn into boundaries: reminders go only to unconfirmed parents (per-child rule, CR-8), they stop once confirmed, and they stop at a bounded point after kickoff (S2-b). Mike's own wish to avoid duplicates (YG:M77) is the reason for the bound. |

Dependency recorded: **A4-CR-2 depends on A4-CR-3** (each reminder must reflect only the current
notice). V2 already satisfies it (R3, `delivery.test.js` l.138); the CR-2 work must keep that test
passing.

**Disagreement that remained:** *To be filled in by the team after all three members have reviewed
this ranking.* (Draft prepared before the team meeting; record here any member who would have ranked
A4-CR-1 first, and why.)

---

## Appendix: reproductions on Prototype V2

All runs use `app/` at tag `v2` with the seed data, served with
`python3 -m http.server 8000 --directory app`. Scenarios R1–R3 were run in the browser console by
importing the domain modules on a fresh store (`createStore()`), so they do not depend on clicks;
R4 used the running app. Demo clock starts Sat 08:30; game `g-u10` (U10 Blue vs U10 Red) kicks off
Sat 10:00 at Field 3.

**R1 (A4-CR-1).** Brenda publishes a verified move of `g-u10` to Field 7. `noticeStatus(store, notice, 'coach-u10-blue')`:
- not-confirmed list contains `Family B: Yolanda Bell (for Bea B.)` and
  `Family E: Wes Evans (for Emma E.); Erin Evans (for Eli E., Emma E.)`;
- status rows: `Family E | Wes Evans | Emma E.`, `Family E | Erin Evans | Eli E., Emma E.`.

**R2 (A4-CR-2).** Brenda publishes an urgent cancellation of `g-u10` at 08:30. Clock +60 min, then +35 min (10:05). Mike never confirms.
- Mike's messages: 08:30 in-app, email, text (urgent); 08:32 call. Nothing after.
- Mike's alert at 09:30: `unconfirmed: true`; at 10:05: `unconfirmed: false, started: true`.
- Ray's not-confirmed list at 10:05: 10 families. A further publish at 10:05 is rejected `game-started`.

**R3 (A4-CR-3).** (a) Urgent: move `g-u10` to Field 7 at 08:30, move again to Field 9 at 08:31, clock +10 min.
First notice: 0 delivery records after 08:31, escalations `{cancelled: 15}`. Second notice text to Mike:
`FINAL – Moved: Field 7 → Field 9. U10 Blue vs U10 Red, originally Sat 10:00 at Field 7. New field: Field 9 (time unchanged). …`
(b) Non-urgent: same on `g-u12` (tomorrow), second move 3 min later, clock +10 min. Texts: first notice 0,
second notice 10. Mike's alerts: `Field 7 → Field 9` current and unconfirmed; `Field 5 → Field 7` superseded.

**R4 (A4-CR-4).** Viewport 375 × 812 (mobile emulation). Brenda moves `g-u10`; Ana, Carl, Hana and Erin confirm; clock +2 min; persona Ray; open the game.
- Not-confirmed list (wraps, readable): 6 families named.
- Status table: container 313 px, table 708 px; Receipt column off-screen; visible channel badges show "delivered" in the same style as "Confirmed".
- Contrast (WCAG formula, from `styles.css`): `#1f6f43` on `#e7f4ec` 5.43:1; `#fff` on `#b42318` 6.57:1; `#e7f4ec` badge vs `#fff` card 1.13:1; `#c8ccd2` "sent" border vs `#fff` 1.61:1.
