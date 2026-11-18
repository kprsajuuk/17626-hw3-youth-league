# Unified Goal Model (HW3, Steps 1–2; revised for V2 in Step 5)

This document merges the three HW2 goal models of our team into one model, records how
overlapping and conflicting goals were reconciled, and defines the sprint scope used for
the Spec Kit specification.

**Version 2.** After evaluating Prototype V1, the model was revised: two domain properties
were added (D-6, D-7) and ten goals, properties, conflicts or obstacles got a note tagged
"V2:". Nothing was removed. See **§6 V2 changes**. The V1 model is preserved at tag `v1`.

| File | Purpose |
|---|---|
| `goal_model_unified.py` | Single source of truth, written with the course `goalmodeling` package (v0.1.6). `python goal_model_unified.py` prints the full model; `python goal_model_unified.py sprint` prints only the sprint branches. Every run also checks that each member goal is mapped. |
| `export_tables.py` | Regenerates Appendix A and B and the §6 V2 table from the `.py` (`unified`, `reverse`, `v2`). |
| `goal_model_full.png/.svg`, `goal_model_sprint.png/.svg` | **Official diagrams**: standard `goalmodeling` 0.1.6 output (bottom-up), rendered with Mermaid CLI. The only change is that the conflict glyph is replaced with ⚡ so it shows in all fonts. Sprint membership is listed in §5 and Appendix A. |
| `mermaid_full.txt`, `mermaid_sprint.txt` | mermaid.live links to the official graphs. |
| `preview_full.png`, `preview_sprint.png` | Draft views drawn with a stand-in renderer, root on the left. **Green** = in sprint, **yellow** = tacit, **grey dashed** = rejected alternative. Kept as easier-to-read companions. **V1 snapshot:** not regenerated for V2, so D-6 and D-7 are missing; the official diagrams above are current. |

**Regenerate the diagrams**

```bash
python3 -m venv .venv && source .venv/bin/activate
curl -LO https://github.com/cmu-relab/goalmodeling/releases/download/v0.1.6/goalmodeling-0.1.6-py3-none-any.whl
pip install --no-index goalmodeling-0.1.6-py3-none-any.whl
python goal_model_unified.py sprint > sprint.txt          # last line = mermaid.live link
sed '$d' sprint.txt > sprint.mmd && npx -p @mermaid-js/mermaid-cli mmdc -i sprint.mmd -o goal_model_sprint.png -s 2 -b white
```

## 1. Sources and conventions

All three of us interviewed the same Clarity personas: **Brenda** (league administrator), **Mike** (parent who works shifts) and **Ray** (coach). Each of us ran our own interviews, so there are **three transcript sets**, and each member model uses its own goal IDs. For example, "G-7" means something different in each model.

| Prefix | Member | Member model | Transcripts | Citation example |
|---|---|---|---|---|
| **YH** | Yunhan | `HW2/model-v2/goal_model_combined.py` (+ individual models, G-1..G-42) | `HW1/Report-1..3` | `YH:B63` = Brenda, turn [63] |
| **LN** | Lynn | `HW2-lynn/goal_model_*.py` (G-1..G-56) | `HW2-lynn/transcript - 1..3.pdf` | `LN:M35` = Mike, turn [35] |
| **YG** | Ying | `HW2-ying/goal_model_combined.py` (G-1..G-84, D-1..D-5) | `HW2-ying/{brenda,mike,ray}.csv` | `YG:R112` = Ray, turn 112 |

The unified model is renumbered **G-01..G-85, D-1..D-7, O-1..O-2, CF-1..CF-8** (D-6 and D-7 were added in V2 and come from the V1 evaluation, not from a member model). Every unified goal lists the member goals it absorbs. All 182 member goals (42 + 56 + 84) and 5 domain properties are mapped; see Appendix B. `check_coverage()` fails if any of them is missing. Only two unified goals are tacit (G-13, G-69). Both come from Ying's model.

## 2. What each member model contributed

All three models agree on the same core chain: an official change has to be **verified and published by the administrator**, then **reach the affected families**, and families then **act on it** (rides). Beyond that core, each model is detailed in a different area, and the unified model keeps the most detailed version of each:

| Area | Most detail from | What it adds |
|---|---|---|
| Final vs. pending status, heads-up labelled unconfirmed | **YH** | G-07, G-08, G-10 |
| Urgent change → phone call; re-confirming a ride after a change | **YH** | G-31, G-50 / G-52 |
| Schedule revision cases (field conflicts, parks determinations) | **LN** | G-15 … G-17 |
| Alert stays visible until acknowledged; ack status shown to coach | **LN** | G-35, G-36 |
| Coach updates the game directly (Ray's request) | **LN** | G-09 (rejected alternative) |
| Delivery escalation (push → SMS after 5 min); no read guarantee | **YG** | G-30, G-38 |
| Old *and* new field/time on the game entry | **YG** | G-14 |
| Court orders, background checks, minimum personal data | **YG** | G-23 … G-25, G-62 … G-70 |
| Adoption and notification-noise NFRs | **YG** | G-77 … G-85 |
| Attendance and playing-time records (Ray) | **LN + YG** | G-71 … G-76 |

## 3. Unified structure

```
G-01 Improve[SafeAndWellCoordinatedGameDay]            (H12: abstracted from YH G-24, LN G-56, YG G-1)
├─ A STATUS    G-02 Maintain[OfficialStatusClearAndCurrent]   P1 milestones
│     G-03 ChangeVerified · G-04 OfficialStatusPublished · G-05 Avoid[non-admin official] · G-06 audit log
│     G-07 FamiliesWarnedEarly (OR: G-08 heads-up + D-6 pending ends at FINAL ✔ | G-09 coach edits game ✖)
│     G-10 NoticeMarkedFinal · G-11 GameEntryShowsCurrentStatus (P2: cancel/move, old+new, D-7 cancel is final)
│     G-15 MasterScheduleCurrent (field availability, team lists)            — out of sprint
├─ B REACH     G-21 FamiliesKnowOfficialStatus If StatusPublished   P7 (system can't force reading)
│     G-22 targeted to affected teams · G-23 Avoid[restricted parent gets child info]
│     G-26 NoticeDelivered (in-app+email, text OR-alternatives, urgent call, phone relay)
│     G-33 ReceiptConfirmed (ack, alert sticky until ack, ack list, coach calls non-ackers)
│     G-38 Avoid[ReadGuaranteeImplied] · G-39 each child's games in one view
├─ C ACT       G-40 ChildRideConfirmed If GameScheduled                — out of sprint
│     G-42 RideSecured (OR: parent board ✔ | system suggests nearby parent ? | coach matches ✖)
│     G-50 RideReconfirmed If GameChanged · G-53 PickupKnownToParent
├─ D LIABILITY G-58 Avoid[LeagueLiableForRidesOrCustody]             — out of sprint
├─ E PRIVACY   G-62 Maintain[ChildSafetyAndPrivacy]                    — out of sprint (except G-23 in B)
├─ F RECORDS   G-71 Improve[PlayingTimeFairness]                       — out of sprint
└─ G ADOPTION  G-77 Increase[Adoption…]   (G-80 alert ≤1 min, G-82 noise: G-83, G-85 in sprint)
```

**Structural decisions made while merging**

- **One root instead of three.** YH used Mike's outcome as the root ("kids are where the official status says"), LN used a tacit "safe and well-coordinated season", and YG used a tacit "game-day coordination". YH's root does not cover Ray's playing-time goals, which LN and YG kept, so the unified root is the broader **G-01**. The three original roots are absorbed into it, together with YH G-1/G-14 and LN G-37.
- **Liability is its own branch (D).** In LN's model, Brenda's root was *Minimize[LeagueLiability]*. YH and YG treated it as an Avoid constraint on rides. Because it constrains both rides (G-59…G-61) and custody, it is now a top-level Avoid goal and is not hidden under the ride branch.
- **The custody restriction sits under REACH (G-23), not PRIVACY.** That restriction is what decides who receives a notice, so it is part of the sprint chain. The other privacy goals stay in E.
- **Ying's channel model replaces the "send everything" model (see CF-3).** All three member models had a channels goal, but each proposed a different approach.

## 4. Relationships: overlaps, dependencies, conflicts

### 4.1 Overlaps that were combined
| Unified | Overlap | Decision |
|---|---|---|
| G-04 / G-05 | All three models: only the administrator makes a change official (YH G-4/G-5, LN G-10/G-16, YG G-6/G-7). | Combined into one Achieve goal and one Avoid goal. |
| G-22 | All three: notify only the affected teams (YH G-7, YG G-19/G-25, LN G-11). | Combined. |
| G-36 | All three: the sender sees who acknowledged (YH G-10, LN G-45, YG G-28). | Combined. G-34, G-35 and G-37 stay separate because each is done by a different agent (H11). |
| G-39 | All three Mike interviews: both kids in one view (YH G-27, LN G-23, YG G-31). | Combined. The ride-status part is deferred together with branch C. |
| G-43 | All three: parents post ride needs or offers and arrange rides directly. | Combined. This is the preferred ride alternative. |
| G-54 / G-56 | All three: the driver confirms pickup, with an alert if it isn't confirmed. | Combined. |

### 4.2 Dependencies
- G-04 → G-03 (publish only after verifying). G-21 → G-04 (nothing reaches families until something is published).
- G-22 **depends on correct team lists** (G-18/G-19), which are out of scope. The sprint therefore **assumes the roster data is correct** (mock data).
- G-30 (text fallback) depends on G-34 (ack), because the fallback fires only if no ack arrives.
- C → B: G-50 *RideReconfirmed If GameChanged* is triggered by the change notice. Rides therefore can't be built properly before REACH works, which is one reason C is in a later sprint.

### 4.3 Conflicts (kept as ⚡ links; none removed)
| ID | Goals | Who vs. who (evidence) | Decision |
|---|---|---|---|
| **CF-1** | G-08 heads-up while pending ⚡ G-04 publish only when verified | Ray/Mike want speed (YH:R54, YH:M73, YG:R47) vs. Brenda wants accuracy (YH:B59, YG:B111); YG C-6 is the same tension | **Compromise.** The heads-up is allowed but always labelled *UNCONFIRMED*. It never changes the official status, and the final notice replaces it. **In sprint** because it is highly uncertain whether families will actually tell the two apart. |
| **CF-2** | G-09 coach updates the game ⚡ G-05 only the admin makes it official | Lynn's Ray (LN:R19, R21) vs. Brenda in all three sets (YH:B55, LN:B68, YG:B113) | **Prioritize G-05** (authority and liability). G-09 is kept as a rejected alternative. Ray's real need, speed, is met by G-08. |
| **CF-3** | G-29 text with every notice ⚡ G-85 avoid duplicate notifications | YH Mike wants text always (YH:M23, M73) vs. YG Mike: "too many duplicate messages would be annoying" (YG:M77) and push with SMS *fallback* (YG:M73) | **Compromise G-30:** text is sent if there is no ack within 5 min, or right away if the change is urgent (kickoff within 2 h); G-31 also places a call. The 5-min and 2-h thresholds are assumptions to check in V1. **In sprint.** **V2:** V1 showed that the compromise covers only non-urgent changes; for urgent changes every channel still fires at once, plus a call (OBS-3). The urgent case stays **unresolved** (ask Mike, OQ-6). Texts to coaches (CR-9) are an accepted cost against G-85. |
| **CF-4** | G-46 system suggests a nearby trusted parent ⚡ G-59 system must not match or approve rides | Mike (LN:M61, YG:M25) vs. Brenda (LN:B54, YG:B83, B100) | **Unresolved.** Does *suggesting* count as *matching*? We need to ask Brenda. Deferred. |
| **CF-5** | G-47 coach matches families / finds a backup driver ⚡ G-58 league not liable | Mike (YH:M38), Lynn's Ray (LN:R44), Ying's Ray (YG:R59) vs. Brenda (YH:B34, LN:B54) and **Yunhan's Ray, who refuses** (YH:R8) | **Prioritize G-58.** We also record that the three Ray interviews contradict each other: two say they informally connect families, one refuses to coordinate. Needs clarification. |
| **CF-6** | G-56 missed-pickup alert ⚡ G-60 ride must not look league-guaranteed | Mike (YH:M18, YG:M42) vs. Brenda (YG:B80, B83); YG C-1 | **Unresolved.** A candidate fix is to word the alert as parent-to-parent status and show it with the G-61 disclaimer. Deferred. |
| **CF-7** | G-44 parent's own trust (met / vouched for) ⚡ G-65 background check on file | Mike (YG:M96) vs. the insurer rule (D-5, YG:B66); YG C-3 | **The domain constraint wins.** Both goals stay: a parent's trust is extra on top of a required check, not a replacement for it. Deferred. |
| **CF-8** | G-68 parent can view the child's messages ⚡ G-25 restricted parent excluded | Mike (YG:M121) vs. Brenda (YG:B66); YG C-5 | **Resolved by guard G-69** (check custody before showing messages). Deferred. |

**Not a conflict (an AND constraint):** parents arranging rides directly (G-43) and keeping restricted information out of ride discussions (G-45). Both can hold at once, as YH already found.

## 5. Sprint scope (Step 1)

**Sprint feature: "Game change → official notice → the right families see it and acknowledge it."**
These goals are shown in `goal_model_sprint.png`; they are the green goals in `preview_sprint.png`:

| Branch | Goals in sprint |
|---|---|
| A STATUS | G-02, G-03 (+D-1), G-04, G-05, G-06, G-07 → G-08 (+D-6, V2) (G-09 shown as rejected), G-10, G-11 → G-12, G-14 (+D-2, +D-7, V2) |
| B REACH | G-21, G-22, G-23 → G-24, G-25 (+D-4), G-26 → G-27, G-28 → G-30 (G-29 rejected), G-31, G-33 → G-34, G-35, G-36, G-37, G-38, G-39 (game status only) |
| G ADOPTION | G-80 (alert ≤ 1 min, used as an acceptance criterion), G-82 → G-83, G-85 |

**Why this subset (priority criteria)**
- **Core.** This is the only chain that appears in **all three member models**, with evidence from Brenda, Ray and Mike in every transcript set (see the G-21 citations). Every other branch depends on it: rides need the change notice (G-50), and liability and privacy constrain what the notice may contain.
- **User-facing.** Each stakeholder has a screen: Brenda verifies and publishes, Ray sends a heads-up and checks the ack list, Mike sees the family view and acknowledges.
- **High uncertainty.** It contains CF-1 (can families tell an unconfirmed heads-up from the final notice?) and CF-3 (are 5 min / 2 h the right escalation thresholds?). It also includes G-38: what may an "acknowledged" status claim? These questions are best answered with a prototype.

**Deferred, and why**
| Branch | Reason |
|---|---|
| C ACT (rides), D LIABILITY | High value for Mike, but 4 of the 8 conflicts sit here, two are unresolved (CF-4, CF-6), and the Ray interviews contradict each other (CF-5). Building rides before Brenda clarifies risks building exactly what she prohibits. The branch also depends on B (G-50). |
| E PRIVACY (except G-23) | Background checks, message visibility and the personal-data rules matter mostly once rides and messaging exist. |
| F RECORDS | Ray's attendance and playing-time goals are separate from the change chain, and YH's HW1 scope already excluded on-field processes. |
| A: G-15 master schedule, G-13 withdrawn notice | This is administrative upkeep, so the sprint assumes a correct schedule (mock data). G-13 is tacit and is a candidate edge case for V2. **V2:** still out of scope; V1 showed a cancelled game could be silently "moved" (OBS-2), so V2 treats a cancellation as final (D-7) instead of building reinstatement. |
| B: G-32 phone relay for families without smartphones | An edge case handled outside the system (the coach calls). |

**Sprint assumptions (to state in the spec)**
1. Teams, rosters, families and court-order flags are **mock data** and assumed correct (G-18 is out of scope).
2. Email, SMS and calls are **simulated** with a delivery log. No real messages are sent.
3. "Urgent" means kickoff within 2 hours (from YH UC-01). The SMS fallback fires after 5 minutes without an ack (YG:M73 "quickly", interpreted by Ying).
4. An acknowledgment means "the family confirmed receipt", never "the family has read and understood" (G-38).

## 6. V2 changes (Step 5)

Evaluating Prototype V1 (`docs/evaluation/v1/team-summary.md`) changed our understanding of
several goal relationships. The changes below follow `docs/v2-change-request.md` (CR-1…CR-9).
Each one is recorded in `goal_model_unified.py` with a note tagged "V2:", so the table at the
end of this section is generated from the model (`python export_tables.py v2`).

**What changed in our understanding**

| CR | Observation | What we learned about the goal model | Model change |
|---|---|---|---|
| CR-1 | OBS-1: a heads-up could be sent after a FINAL notice | G-07's condition *If ChangePending* was lost on the way to the spec, because "pending" was never defined. | New **D-6** in G-07's heads-up alternative; note on G-07 |
| CR-2 | OBS-2: a cancelled game could be silently "moved" | G-13 (withdrawing a cancellation) was tacit and out of scope, yet the prototype could do it without the wording families need. We chose to treat a cancellation as final rather than build G-13 on an assumption. | New **D-7** in G-11's refinement; note on G-13 (kept tacit, out of sprint). The D-1 → G-13 relation is kept: D-1 is why G-13 may be needed later (OQ-5). |
| CR-3 | OBS-3, OBS-4: urgent changes fire every channel; heads-ups never escalate | CF-3's compromise only covers non-urgent changes; O-1 is not resolved for heads-ups. | Note on CF-3 (urgent case **unresolved**); accepted risk on O-1. Both kept, not removed. |
| CR-5 | OBS-7: field and time need two FINAL notices | D-2 treated a change as exactly one of three kinds, which produced duplicate notices (G-85). | Notes on D-2 and G-14 |
| CR-6 | OBS-8: no "Started" state | G-11's "current status" had no post-kickoff state. | Note on G-11 (no interview evidence; OQ-7) |
| CR-8 | OBS-10: a restricted parent's confirmation counted for the whole family | G-33 (receipt confirmed) and D-4 (court orders) were never considered together; confirmation must be per child. | Notes on G-33 and D-4 (OQ-8) |
| CR-9 | OBS-11: coaches texted, spec inconsistent | G-30 did not say which agents it applies to. | Note on G-30: applies to coaches too (OQ-9) |

CR-4 (spec hygiene) and CR-7 (missing "sent" status, an implementation defect) do not change
the goal model.

**Unresolved and assumed (preserved, not removed)**

- CF-3 urgent case (OQ-6), O-1 for heads-ups (OQ-6), D-7 cancellation is final (OQ-5),
  per-child confirmation (OQ-8), texts to coaches (OQ-9), started-game history (OQ-7).
- D-6 and D-7 have no interview evidence; they are team decisions based on the V1 evaluation.

**V2 notes in the model** (generated)

| Element | V2 change (from the model) |
|---|---|
| G-07 FamiliesWarnedEarly | condition made explicit after V1 evaluation (CR-1, OBS-1, D-6) |
| G-11 GameEntryShowsCurrentStatus | started state made explicit (CR-6, OBS-8); no direct interview evidence |
| G-13 CancelMarkCleared | reversal blocked; cancellation treated as final (CR-2 option B, D-7). Revisit if Brenda confirms reinstatement happens (OQ-5); D-1 is why it may be needed later |
| G-14 OldAndNewDetailsAndActionShown | one notice may change both field and time (CR-5, OBS-7) |
| G-30 TextSent | applies to coaches as well as parents; calls stay parents-only (CR-9, OBS-11; ask Ray, OQ-9) |
| G-33 ReceiptConfirmed | receipt confirmation counted per child, not per family (CR-8, OBS-10); assumption, ask Brenda (OQ-8) |
| D-2 A game change is a cancellation, a field move or a time move | a move may change the field, the time, or both (CR-5, OBS-7) |
| D-4 Some families have court orders on file | also constrains confirmation; a restricted parent's confirmation never covers the restricted child (CR-8, OBS-10) |
| D-6 A change is pending only until a FINAL notice for that game is published | added after V1 evaluation (CR-1, OBS-1); team definition, no interview evidence |
| D-7 An official cancellation is final (team assumption; confirm with Brenda, OQ-5) | added after V1 evaluation (CR-2 option B, OBS-2); no interview evidence; risk against D-1 accepted |
| CF-3 G-29 vs. G-85 (text on every notice vs. avoid duplicate notifications) | urgent case unresolved (CR-3, OBS-3; ask Mike, OQ-6) |
| O-1 AlertMissedWhileOnShift | heads-ups (G-08) never escalate to text or call; accepted risk (CR-3, OBS-4; ask Mike, OQ-6) |

## Appendix A — Unified goals (generated by `export_tables.py`)

| ID | Type | Goal | Agent | Cat. | Sprint | Merged from (member goal) | Interview evidence |
|---|---|---|---|---|---|---|---|
| G-01 | Soft | Improve[SafeAndWellCoordinatedGameDay] | — | F | ✅ | YH G-24, YH G-1, YH G-14, LN G-56, LN G-37, YG G-1 | YH:M20, YH:M34, YH:M82, YH:B10, YH:B26, YH:R59, LN:R7, LN:R36 |
| G-02 | Maintain | OfficialStatusClearAndCurrent | — | F | ✅ | YH G-2, LN G-2, LN G-3, LN G-14, YG G-2 | YH:B8, YH:B14, YH:B63, YH:R44, YH:R61, LN:B7, LN:B23, LN:B56, YG:B24, YG:B89, YG:M84, YG:R51 |
| G-03 | Achieve | ChangeVerifiedWithCityOrParks **If** GameChanged | LeagueAdministrator | F | ✅ | YH G-3, LN G-9, LN G-7, YG G-5, YG G-4 | YH:B20, YH:B40, YH:B59, YH:R38, YH:R40, LN:B30, LN:B34, LN:B36, YG:B111, YG:B17 |
| G-04 | Achieve | OfficialStatusPublished **If** ChangeVerified | LeagueAdministrator | F | ✅ | YH G-4, YH G-19, LN G-10, YG G-6, YG G-3 | YH:B14, YH:B16, YH:B55, YH:B59, YH:R25, LN:B34, LN:B59, YG:B111, YG:B113 |
| G-05 | Avoid | StatusShownAsOfficial **If** Not PublishedByAdministrator | AccessControl | NFR | ✅ | YH G-5, LN G-16, YG G-7 | YH:B16, YH:B55, YH:B57, LN:B30, LN:B38, LN:B52, LN:B68, YG:B113 |
| G-06 | Maintain | ChangesNoticesAndSharesLoggedWithAuthorAndTime | AuditLog | NFR | ✅ | YH G-5, LN G-17, YG G-9, YG G-58 | YH:B52, YH:B63, YH:R59, LN:B45, LN:B48, LN:B70, YG:B55, YG:M73, YG:B73 |
| G-07 | Achieve | FamiliesWarnedEarly **If** ChangePending | — | F | ✅ | YH G-16 | YH:R25, YH:R52, YH:R54, YH:B26, YH:B59 |
| G-08 | Achieve | HeadsUpSentMarkedUnconfirmed **If** ChangePending | Coach | F | ✅ | YH G-18, YH G-40, YG G-24 | YH:R52, YH:R54, YH:R63, YH:M73, YH:B59, YG:B20, YG:R47 |
| G-09 | Achieve | GameUpdatedDirectlyByCoach **If** LastMinuteChange | Coach | F | ✖ rejected | LN G-39 | LN:R19, LN:R21 |
| G-10 | Achieve | NoticeMarkedFinalWithAuthor **If** ChangeVerified | NotificationService | F | ✅ | YH G-15, LN G-15 | YH:R46, YH:R59, YH:R63, YH:B63, YH:M76, LN:B28, LN:B30, LN:B50, YG:B89 |
| G-11 | Achieve | GameEntryShowsCurrentStatus **If** GameChanged | — | F | ✅ | YG G-10 | YG:B29, YG:B89 |
| G-12 | Achieve | GameMarkedCancelledOrMoved **If** OfficialStatusPublished | ScheduleService | F | ✅ | YG G-11, YG G-12, LN G-6, LN G-8 | YG:B55, YG:B89, LN:B36, LN:B38 |
| G-13 | Achieve | CancelMarkCleared **If** NoticeWithdrawn *(tacit)* | ScheduleService | F |  | YG G-13 | — (not in transcript) |
| G-14 | Achieve | OldAndNewDetailsAndActionShown **If** FieldOrTimeChanged | ScheduleService | F | ✅ | YG G-14, YH G-26, LN G-12, LN G-25 | YG:R39, YG:M73, YH:M76, LN:B45, LN:M11 |
| G-15 | Maintain | MasterScheduleCurrent | — | F |  | — | YG:B66, LN:B9 |
| G-16 | Achieve | ConflictShownAgainstFieldAvailability **If** FieldOrTeamChangeReported | ScheduleService | F |  | LN G-5 | LN:B11, LN:B16, LN:B21 |
| G-17 | Achieve | FieldAssignmentUpdated **If** ParksAvailabilityChanges | LeagueAdministrator | F |  | YG G-8, LN G-4 | YG:B66, YG:B102, LN:B9, LN:B16 |
| G-18 | Achieve | ScheduleSentToCorrectTeams | — | F |  | YG G-15 | YG:B47, YG:B49 |
| G-19 | Achieve | TeamListMismatchFlagged **If** TeamMatrixDiffersFromMasterRoster | RosterService | F |  | YG G-16, YG G-80 | YG:B47, YG:B55 |
| G-20 | Achieve | DiscrepancyResolved **If** MismatchFlagged | LeagueAdministrator | F |  | YG G-17 | YG:B52 |
| G-21 | Achieve | FamiliesKnowOfficialStatus **If** StatusPublished | — | F | ✅ | YH G-6, YH G-25, LN G-11, LN G-38, LN G-40, YG G-18 | YH:B46, YH:B59, YH:R46, YH:M26, YH:M63, LN:B21, LN:M9, LN:R7, LN:R21, YG:M39, YG:R92, YG:B10 |
| G-22 | Achieve | NoticeTargetedToAffectedTeamsOnly **If** StatusPublished | NotificationService | F | ✅ | YH G-7, YH G-17, YG G-19, YG G-25 | YH:B30, YH:B42, YH:B46, YH:R42, YH:R44, YG:B111, YG:B24, YG:R20, LN:B21 |
| G-23 | Avoid | RestrictedParentGetsChildInfo **If** CourtOrderOnFile | — | NFR | ✅ | YG G-53 | YG:B66, YH:B30, YH:B32 |
| G-24 | Achieve | CustodyRestrictionReviewed **If** CourtOrderOnFile | LeagueAdministrator | NFR | ✅ | YG G-54 | YG:B70, YG:B73 |
| G-25 | Maintain | RestrictedParentExcludedFromMessages | AccessControl | NFR | ✅ | YG G-55 | YG:B66, YH:B32 |
| G-26 | Achieve | NoticeDelivered **If** StatusPublished | — | F | ✅ | YG G-20 | YH:B49, LN:R21, YG:B111, YG:M73 |
| G-27 | Achieve | InAppAlertAndEmailSent **If** StatusPublished | NotificationService | F | ✅ | YH G-9, YH G-28, YH G-38, LN G-24, LN G-41, LN G-42, YG G-21, YG G-23 | YH:B49, YH:B52, YH:M23, LN:R21, LN:M9, YG:M73, YG:B20 |
| G-28 | Achieve | TextAlertDelivered **If** StatusPublished | — | F | ✅ | — | YH:M23, YH:M73, YG:M73 |
| G-29 | Achieve | TextSentWithEveryNotice **If** StatusPublished | NotificationService | F | ✖ rejected | YH G-39, LN G-43 | YH:M23, YH:M73, YH:B49 |
| G-30 | Achieve | TextSent **If** NotAckedWithin5Min Or ChangeUrgent | NotificationService | F | ✅ | YG G-22 | YG:M73, YH:M23, YH:M73 |
| G-31 | Achieve | CallPlaced **If** ChangeUrgent | NotificationService | NFR | ✅ | YH G-29 | YH:M23, YH:M60, YH:M67, YH:M69 |
| G-32 | Achieve | DetailsRelayedByPhone **If** ParentHasNoSmartphone | Coach | F |  | LN G-44 | LN:R44, YH:R27 |
| G-33 | Achieve | ReceiptConfirmed **If** NoticeSent | — | F | ✅ | YH G-20, YG G-26 | YH:R15, YH:R31, YH:B36, YG:R39, YG:R92, YG:B59 |
| G-34 | Achieve | RecipientAcknowledges **If** AlertReceived | Parent | F | ✅ | YG G-27, LN G-13 | YG:M73, YG:R41, LN:B45, LN:B48, LN:B61 |
| G-35 | Maintain | ChangeAlertVisible **If** Not Acknowledged | FamilyView | F | ✅ | LN G-26 | LN:M11, LN:M59 |
| G-36 | Maintain | AckStatusShownPerRecipient | NotificationService | F | ✅ | YH G-10, YH G-21, LN G-45, YG G-28 | YH:B36, YH:R15, YH:R31, YH:M30, LN:R23, LN:R25, LN:R51, YG:R41, YG:B55, YG:B59 |
| G-37 | Achieve | NonAcknowledgerContacted **If** NoAckBeforeDeparture | Coach | F | ✅ | YH G-22, YG G-29 | YH:R31, YH:R33, YH:M30, YG:R41 |
| G-38 | Avoid | ReadGuaranteeImplied | NotificationService | NFR | ✅ | YG G-30 | YG:B24, YG:B100, YG:B111 |
| G-39 | Maintain | EachChildGameStatusInOneView | FamilyView | F | ✅ | YH G-27, LN G-15, LN G-22, LN G-23, YG G-31 | YH:M12, YH:M14, YH:M65, LN:M5, LN:M9, LN:B28, YG:M42, YG:M84, YG:M105 |
| G-40 | Achieve | ChildRideConfirmed **If** GameScheduled | — | F |  | YH G-30, LN G-27, YG G-32 | YH:M14, YH:M20, YH:M36, YH:M82, LN:M14, LN:M24, LN:M43, YG:M42, YG:M128, YG:R59 |
| G-41 | Achieve | ParentDrivesChild **If** ParentAvailable | Parent | F |  | LN G-28 | LN:M43 |
| G-42 | Achieve | RideSecured **If** ParentUnavailable | — | F |  | YH G-31, YH G-41, LN G-29, LN G-21 | YH:M6, YH:M14, YH:M36, YH:R31, LN:M14, LN:M35, LN:M53, YG:B55, YG:R56 |
| G-43 | Achieve | RideNeedOrOfferPostedByParent **If** NeedOrSpareSeat | Parent | F |  | YH G-12, YH G-23, YH G-32, LN G-31, LN G-52, YG G-39, YG G-40 | YH:B14, YH:B34, YH:R27, YH:R31, YH:M12, LN:R9, LN:R23, LN:M61, YG:R62, YG:R47, YG:B83 |
| G-44 | Achieve | DriverTrustedByParent **If** MetInPersonOrVouchedByCoach | Parent | F |  | LN G-32, YG G-46, YG G-47, YG G-48 | LN:M53, YG:M96 |
| G-45 | Avoid | RestrictedInfoInRideDiscussion | RideBoard | NFR |  | YH G-8 | YH:B30, YH:B32, YH:B63 |
| G-46 | Achieve | NearbyTrustedParentSuggested **If** RideRequested | RideBoard | F |  | LN G-30, YG G-41 | LN:M14, LN:M43, LN:M59, LN:M61, YG:M25 |
| G-47 | Achieve | FamiliesMatchedOrBackupFoundByCoach **If** RideNeededOrFallsThrough | Coach | F | ✖ rejected | YH G-33, YH G-42, LN G-53, YG G-42 | YH:M38, YH:M52, LN:R44, YG:R59 |
| G-48 | Achieve | RideDetailsAndDriverContactInOneMessage **If** RideAgreed | RideBoard | F |  | YG G-43, YG G-45 | YG:M67, YG:M100 |
| G-49 | Maintain | CoachSeesWhetherPlayersCovered | RideBoard | F |  | YG G-44, LN G-51 | YG:R59, LN:R9, LN:R36, LN:R44 |
| G-50 | Achieve | RideReconfirmed **If** GameChanged | — | F |  | — | YH:M46, YG:M73 |
| G-51 | Achieve | AffectedRideFlagged **If** ScheduleChangeAffectsRide | NotificationService | F |  | YG G-37 | YG:M73 |
| G-52 | Achieve | RideReconfirmedByDriver **If** RideFlagged | DrivingParent | F |  | YH G-34 | YH:M36, YH:M46, YH:M48, YH:M63, YH:R56, YH:R59 |
| G-53 | Maintain | PickupKnownToParent **If** RideByAnotherDriver | — | F |  | YH G-35, LN G-33, YG G-33 | YH:M14, YH:M18, YH:M82, LN:M35, LN:M46, YG:M58, YG:M84 |
| G-54 | Achieve | PickupConfirmedByDriver **If** ChildPickedUp | DrivingParent | F |  | YH G-36, LN G-34, YG G-34 | YH:M14, YH:M16, YH:M18, YH:M82, LN:M35, LN:M46, LN:M51, YG:M32 |
| G-55 | Achieve | PickupStatusShownToParent **If** DriverConfirms | RideBoard | F |  | YG G-35, LN G-35 | YG:M45, LN:M35, LN:M37 |
| G-56 | Achieve | MissedPickupAlertSent **If** Not ConfirmedByPickupTime | NotificationService | NFR |  | YH G-37, YG G-38, YG G-36 | YH:M18, YG:M42 |
| G-57 | Achieve | BackupRideRequested **If** DriverDelayedOrCancels | Parent | F |  | LN G-36 | LN:M37 |
| G-58 | Avoid | LeagueLiableForRidesOrCustody | — | NFR |  | YH G-11, LN G-18, LN G-1, YG G-63 | YH:B10, YH:B14, YH:B34, YH:B61, YH:R8, LN:B50, LN:B54, LN:B63, LN:B68, YG:B10, YG:B68 |
| G-59 | Avoid | SystemAssignsDriversOrApprovesRides | RideBoard | F |  | LN G-19, YG G-64 | LN:B54, LN:B70, YG:B83, YG:B100 |
| G-60 | Avoid | RideShownAsLeagueGuaranteed | RideBoard | F |  | YG G-65 | YG:B80, YG:B83 |
| G-61 | Achieve | FamilyResponsibilityNoticeShown **If** RideBoardOpened | RideBoard | F |  | YH G-13, YG G-66 | YH:B24, YH:B32, YH:B34 |
| G-62 | Maintain | ChildSafetyAndPrivacy | — | NFR |  | YG G-49 | YG:B66, YG:B68 |
| G-63 | Maintain | FamilyInfoVisibleOnlyToAuthorizedRoles | AccessControl | NFR |  | LN G-20 | LN:B50, LN:B70, LN:B74 |
| G-64 | Avoid | UnnecessaryPersonalInfoShown | AccessControl | NFR |  | YG G-50, YG G-51, YG G-52 | YG:B66, YG:B70, YG:B73, YG:M96, LN:M14 |
| G-65 | Maintain | BackgroundCheckOnFile **If** DriverCarriesNonFamilyChild | — | NFR |  | YG G-56 | YG:B66 |
| G-66 | Achieve | ApprovedDriverRecordReviewed **If** DriverStatusRelevant | LeagueAdministrator | NFR |  | YG G-57 | YG:B66, YG:B70, YG:B73 |
| G-67 | Achieve | SharedInfoCorrected **If** RestrictionChanges | LeagueAdministrator | NFR |  | YG G-59 | YG:B73 |
| G-68 | Maintain | ParentCanViewChildMessages | — | F |  | YG G-60 | YG:M121, YG:M123 |
| G-69 | Achieve | CustodyGuardChecked **If** ParentRequestsView *(tacit)* | AccessControl | NFR |  | YG G-61 | — (not in transcript) |
| G-70 | Achieve | ChildMessagesShownToParent **If** GuardPassed | TeamChannel | F |  | YG G-62 | YG:M125 |
| G-71 | Soft | Improve[PlayingTimeFairness] | — | F |  | LN G-46, YG G-67 | LN:R7, LN:R27, LN:R40, YG:R92, YG:R95 |
| G-72 | Achieve | PlayerAvailabilityKnown **If** GameUpcoming | — | F |  | LN G-48, YG G-68 | LN:R9, LN:R17, YG:R11 |
| G-73 | Achieve | PlayerMarkedInOrOut **If** AvailabilityRequested | Parent | F |  | LN G-49, YG G-69 | LN:R17, LN:R19, YG:R20, YG:R30 |
| G-74 | Achieve | AttendanceListShownToCoach | TeamRecords | F |  | LN G-50, YG G-70 | LN:R19, YG:R88 |
| G-75 | Maintain | SamePlayingTimeRecordForBothCoaches | TeamRecords | F |  | YG G-71, YG G-72, YG G-73 | YG:R71, YG:R85, YG:R88, YG:R109 |
| G-76 | Maintain | EachPlayerPlaysAtLeastHalfGame | Coach | F |  | YG G-74, LN G-47 | YG:R71, LN:R27, LN:R40 |
| G-77 | Soft | Increase[AdoptionByBusyParentsAndVolunteers] | — | NFR |  | YG G-75, LN G-54 | YG:R112, YG:R47, YG:M105, LN:R54 |
| G-78 | Achieve | KeyActionsWithin3Taps | MobileApp | NFR |  | YG G-76, LN G-55 | YG:R112, YG:M105, LN:R54 |
| G-79 | Maintain | ServiceUpDuringGameDayRush | LeaguePlatform | NFR |  | YG G-77 | YG:R112, YG:M128 |
| G-80 | Achieve | AlertSentWithin1MinOfPublish | NotificationService | NFR | ✅ | YG G-78 | YG:R47 |
| G-81 | Soft | Reduce[ManualCommunicationWork] | — | NFR |  | YG G-79 | YG:B89, YG:B20 |
| G-82 | Soft | Minimize[NotificationNoise] | — | NFR | ✅ | YG G-81 | YG:M77, YG:R20 |
| G-83 | Achieve | AlertMarkedUrgent **If** GameChangeOrPickupAtRisk | NotificationService | NFR | ✅ | YG G-82 | YG:M84, YG:M116, YG:R39 |
| G-84 | Maintain | TeamAnnouncementsSeparateFromParentChat | TeamChannel | NFR |  | YG G-83 | YG:R32, YG:R47 |
| G-85 | Avoid | DuplicateAndTrivialNotifications | NotificationService | NFR | ✅ | YG G-84 | YG:M77, YG:B55 |
| D-1 | Domain | City usually decides rainouts by ~3 p.m.; timing not guaranteed | — | - | ✅ | YG D-1 | YH:B20, YH:B40, YG:B102, YG:B105 |
| D-2 | Domain | A game change is a cancellation, a field move or a time move | — | - | ✅ | YG D-3 | YG:B10, YG:R17 |
| D-3 | Domain | Parks dept supplies field availability; it can change weekly | — | - |  | YG D-2 | YG:B102 |
| D-4 | Domain | Some families have court orders on file | — | - | ✅ | YG D-4 | YG:B66, YH:B32 |
| D-5 | Domain | Insurer requires background checks for drivers of non-family children | — | - |  | YG D-5 | YG:B66 |
| D-6 | Domain | A change is pending only until a FINAL notice for that game is published | — | - | ✅ | — | — (not in transcript) |
| D-7 | Domain | An official cancellation is final (team assumption; confirm with Brenda, OQ-5) | — | - | ✅ | — | — (not in transcript) |

**Obstacles:** O-1 AlertMissedWhileOnShift obstructs G-26 and is resolved by G-30 and G-31 (YH:M23, YG:M25, YG:B20). *V2:* heads-ups (G-08) never escalate, so O-1 stays unresolved for heads-ups; accepted risk (CR-3, OBS-4, OQ-6). O-2 DriverDelayedOrNoShow obstructs G-53 and is resolved by G-56 and G-57 (LN:M35, LN:M37, YG:M58).

## Appendix B — Member goal → unified goal

**Yunhan (YH)**

| Member goal | → Unified |
|---|---|
| YH G-1 | G-01 |
| YH G-2 | G-02 |
| YH G-3 | G-03 |
| YH G-4 | G-04 |
| YH G-5 | G-05, G-06 |
| YH G-6 | G-21 |
| YH G-7 | G-22 |
| YH G-8 | G-45 |
| YH G-9 | G-27 |
| YH G-10 | G-36 |
| YH G-11 | G-58 |
| YH G-12 | G-43 |
| YH G-13 | G-61 |
| YH G-14 | G-01 |
| YH G-15 | G-10 |
| YH G-16 | G-07 |
| YH G-17 | G-22 |
| YH G-18 | G-08 |
| YH G-19 | G-04 |
| YH G-20 | G-33 |
| YH G-21 | G-36 |
| YH G-22 | G-37 |
| YH G-23 | G-43 |
| YH G-24 | G-01 |
| YH G-25 | G-21 |
| YH G-26 | G-14 |
| YH G-27 | G-39 |
| YH G-28 | G-27 |
| YH G-29 | G-31 |
| YH G-30 | G-40 |
| YH G-31 | G-42 |
| YH G-32 | G-43 |
| YH G-33 | G-47 |
| YH G-34 | G-52 |
| YH G-35 | G-53 |
| YH G-36 | G-54 |
| YH G-37 | G-56 |
| YH G-38 | G-27 |
| YH G-39 | G-29 |
| YH G-40 | G-08 |
| YH G-41 | G-42 |
| YH G-42 | G-47 |

**Lynn (LN)**

| Member goal | → Unified |
|---|---|
| LN G-1 | G-58 |
| LN G-2 | G-02 |
| LN G-3 | G-02 |
| LN G-4 | G-17 |
| LN G-5 | G-16 |
| LN G-6 | G-12 |
| LN G-7 | G-03 |
| LN G-8 | G-12 |
| LN G-9 | G-03 |
| LN G-10 | G-04 |
| LN G-11 | G-21 |
| LN G-12 | G-14 |
| LN G-13 | G-34 |
| LN G-14 | G-02 |
| LN G-15 | G-10, G-39 |
| LN G-16 | G-05 |
| LN G-17 | G-06 |
| LN G-18 | G-58 |
| LN G-19 | G-59 |
| LN G-20 | G-63 |
| LN G-21 | G-42 |
| LN G-22 | G-39 |
| LN G-23 | G-39 |
| LN G-24 | G-27 |
| LN G-25 | G-14 |
| LN G-26 | G-35 |
| LN G-27 | G-40 |
| LN G-28 | G-41 |
| LN G-29 | G-42 |
| LN G-30 | G-46 |
| LN G-31 | G-43 |
| LN G-32 | G-44 |
| LN G-33 | G-53 |
| LN G-34 | G-54 |
| LN G-35 | G-55 |
| LN G-36 | G-57 |
| LN G-37 | G-01 |
| LN G-38 | G-21 |
| LN G-39 | G-09 |
| LN G-40 | G-21 |
| LN G-41 | G-27 |
| LN G-42 | G-27 |
| LN G-43 | G-29 |
| LN G-44 | G-32 |
| LN G-45 | G-36 |
| LN G-46 | G-71 |
| LN G-47 | G-76 |
| LN G-48 | G-72 |
| LN G-49 | G-73 |
| LN G-50 | G-74 |
| LN G-51 | G-49 |
| LN G-52 | G-43 |
| LN G-53 | G-47 |
| LN G-54 | G-77 |
| LN G-55 | G-78 |
| LN G-56 | G-01 |

**Ying (YG)**

| Member goal | → Unified |
|---|---|
| YG G-1 | G-01 |
| YG G-2 | G-02 |
| YG G-3 | G-04 |
| YG G-4 | G-03 |
| YG G-5 | G-03 |
| YG G-6 | G-04 |
| YG G-7 | G-05 |
| YG G-8 | G-17 |
| YG G-9 | G-06 |
| YG G-10 | G-11 |
| YG G-11 | G-12 |
| YG G-12 | G-12 |
| YG G-13 | G-13 |
| YG G-14 | G-14 |
| YG G-15 | G-18 |
| YG G-16 | G-19 |
| YG G-17 | G-20 |
| YG G-18 | G-21 |
| YG G-19 | G-22 |
| YG G-20 | G-26 |
| YG G-21 | G-27 |
| YG G-22 | G-30 |
| YG G-23 | G-27 |
| YG G-24 | G-08 |
| YG G-25 | G-22 |
| YG G-26 | G-33 |
| YG G-27 | G-34 |
| YG G-28 | G-36 |
| YG G-29 | G-37 |
| YG G-30 | G-38 |
| YG G-31 | G-39 |
| YG G-32 | G-40 |
| YG G-33 | G-53 |
| YG G-34 | G-54 |
| YG G-35 | G-55 |
| YG G-36 | G-56 |
| YG G-37 | G-51 |
| YG G-38 | G-56 |
| YG G-39 | G-43 |
| YG G-40 | G-43 |
| YG G-41 | G-46 |
| YG G-42 | G-47 |
| YG G-43 | G-48 |
| YG G-44 | G-49 |
| YG G-45 | G-48 |
| YG G-46 | G-44 |
| YG G-47 | G-44 |
| YG G-48 | G-44 |
| YG G-49 | G-62 |
| YG G-50 | G-64 |
| YG G-51 | G-64 |
| YG G-52 | G-64 |
| YG G-53 | G-23 |
| YG G-54 | G-24 |
| YG G-55 | G-25 |
| YG G-56 | G-65 |
| YG G-57 | G-66 |
| YG G-58 | G-06 |
| YG G-59 | G-67 |
| YG G-60 | G-68 |
| YG G-61 | G-69 |
| YG G-62 | G-70 |
| YG G-63 | G-58 |
| YG G-64 | G-59 |
| YG G-65 | G-60 |
| YG G-66 | G-61 |
| YG G-67 | G-71 |
| YG G-68 | G-72 |
| YG G-69 | G-73 |
| YG G-70 | G-74 |
| YG G-71 | G-75 |
| YG G-72 | G-75 |
| YG G-73 | G-75 |
| YG G-74 | G-76 |
| YG G-75 | G-77 |
| YG G-76 | G-78 |
| YG G-77 | G-79 |
| YG G-78 | G-80 |
| YG G-79 | G-81 |
| YG G-80 | G-19 |
| YG G-81 | G-82 |
| YG G-82 | G-83 |
| YG G-83 | G-84 |
| YG G-84 | G-85 |
| YG D-1 | D-1 |
| YG D-2 | D-3 |
| YG D-3 | D-2 |
| YG D-4 | D-4 |
| YG D-5 | D-5 |
