# How the Unified Goal Model Was Derived from the Three Member Models

This document explains, branch by branch, how `goal_model_unified.py` (G-01…G-85) was built from the three HW2 combined goal models:

- **YH** = Yunhan (G-1…G-42)
- **LN** = Lynn (G-1…G-56)
- **YG** = Ying (G-1…G-84, D-1…D-5)

The full one-to-one mapping is in `goal-model.md` Appendix B. This file explains *why* each block looks the way it does.

## Merge operations used

| Code | Operation | When we used it |
|---|---|---|
| **DUP** | Combine duplicates | Two or three members modelled the same goal with different wording. We kept one goal, rewrote it to cover all versions, and kept every member's citations. |
| **DETAIL** | Take the most detailed version | One member refined an area much further than the others. We adopted that member's sub-tree and folded the others' coarser goals into it. |
| **ASSEMBLE** | Assemble a chain from pieces | Each member captured a *different part* of the same relationship. We joined the parts into one complete refinement. |
| **SINGLE** | Keep a single-source goal | Only one member captured it, and it is supported by that member's transcript. |
| **ALT** | Turn competing approaches into OR alternatives | Members proposed different ways to satisfy the same parent. We kept them as OR alternatives, chose one, and kept the rest as rejected alternatives with a conflict link. |
| **SPLIT** | Split a goal | A member goal mixed two concerns with different agents. We split it so that each leaf has one agent (H11). |

## Starting point

| | YH | LN | YG |
|---|---|---|---|
| Root | Maximize[KidsWhereOfficialStatusSays] | Improve[SafeAndWellCoordinatedSeason] (tacit) | Improve[GameDayCoordination] (tacit) |
| Shape | One chain (status → reach → act), 25 goals | Three stakeholder sub-trees joined at the root | Eight topical branches, very detailed |
| Strongest areas | Final vs. pending status, urgent call, re-confirming rides | Schedule revisions, sticky alerts, Ray's coaching goals | Privacy and custody, delivery escalation, NFRs |
| Deliberately excluded | Coaching records, schedule upkeep | — | — |

All three agree on the core chain: **verify → publish → notify the affected families → families act**. The unified model uses YH's chain as its spine because it states that core most directly. It hangs LN's and YG's extra areas off the root as further branches.

## Root — G-01 (abstraction, H12)

The YH root covers only the change chain, so it cannot contain Ray's playing-time goals, which LN and YG both modelled. We therefore abstracted a broader root, **G-01 Improve[SafeAndWellCoordinatedGameDay]**, which absorbs the three roots plus the individual-stakeholder roots YH G-1 (Brenda), YH G-14 (Ray) and LN G-37 (Ray). LN's Brenda root *Minimize[LeagueLiability]* (LN G-1) did not become the root; it became the liability branch G-58 (see D).

## A — STATUS (G-02)

| Unified | From | Operation | Explanation |
|---|---|---|---|
| G-02 | YH G-2, LN G-2/G-3/G-14, YG G-2 | DUP | "One official, current schedule" in all three, worded differently. |
| G-03 + D-1 | YH G-3, LN G-9 + G-7, YG G-5 + G-4, YG D-1 | DUP + ASSEMBLE | All three have "verify before publishing". LN added *recording the parks department's determination*. YG added *the city issues the notice* and the domain fact *the city decides at about 3 p.m., not guaranteed*. Together they give a complete verification step. |
| G-04 | YH G-4 + G-19, LN G-10, YG G-6 + G-3 | DUP | "Publish only after verification". YH's Avoid[UnconfirmedCancellationSent] is the same goal stated negatively. |
| G-05, G-06 | YH G-5 → split; LN G-16 / G-17; YG G-7 / G-9 + G-58 | SPLIT + DUP | YH had one goal, *PostAuthorizedAndLogged*. LN and YG separated authorization from logging, which are done by different agents (AccessControl vs. AuditLog). We split YH's goal and merged each half with its LN and YG counterparts. |
| G-07 → G-08 / G-09 | YH G-16, G-18, G-40; YG G-24; LN G-39 | ALT | All three Ray interviews want changes to reach families faster than the official process allows, but each member modelled it differently: YH as a **heads-up labelled unconfirmed**, YG as the **coach relaying in a group text**, LN as the **coach updating the game himself**. These are alternatives for one parent goal, *FamiliesWarnedEarly If ChangePending*. G-08 (YH + YG) is chosen; G-09 (LN) is kept as a rejected alternative (CF-2). |
| G-10 | YH G-15 + G-26, LN G-15 | DUP | "The notice is clearly marked final / official". |
| G-11 → G-12, G-13, G-14, D-2 | YG G-10…G-14, D-3; LN G-6, G-8, G-12, G-25; YH G-26 | DETAIL | YG refined the game entry into change cases (cancel / move) with old *and* new details. We adopted that sub-tree and folded in LN's "fixture cancelled when the parks department closes the field" and the "what changed and when" content goals from YH and LN. |
| G-15 → G-16…G-20, D-3 | LN G-4, G-5; YG G-8, G-15…G-17, G-80, D-2 | ASSEMBLE | Keeping the master schedule current. LN captured schedule revisions and field conflicts; YG captured field assignment and checking team lists against the roster. YH excluded this area in HW2. Together they make a complete upkeep sub-tree (out of the sprint). |

## B — REACH (G-21)

| Unified | From | Operation | Explanation |
|---|---|---|---|
| G-21 | YH G-6 + G-25; LN G-11, G-2, G-22, G-38, G-40; YG G-18 | DUP | "Affected families know the official status", in every model. |
| G-22 | YH G-7 + G-17; YG G-19 + G-25; LN G-11 | DUP | "Notify only the affected teams". YG also added the Avoid side (unaffected families are not alerted). |
| G-23 → G-24, G-25, D-4 | YG G-53…G-55, D-4; YH G-7 (custody part) | DETAIL | YH had the custody restriction inside its targeting goal. YG modelled it fully: the domain fact, the administrator's review and the exclusion. We used YG's sub-tree and kept YH's citation (YH:B32). |
| G-26 → G-27, G-28 (G-29 / G-30), G-31, G-32; O-1 | YH G-9, G-28, G-29, G-38, G-39; LN G-41…G-44; YG G-20…G-23, O-1 | ASSEMBLE + ALT | **The three models disagree most here.** YH: email + app + text always, plus a call when urgent. LN: push *or* text depending on whether the parent has a smartphone, with a phone relay otherwise. YG: push first, an SMS fallback after 5 minutes without an ack, plus email. The part they share (in-app + email) became **G-27**. The text channel became an OR: **G-30** (YG's fallback, chosen) vs. **G-29** (YH's "always", rejected because it conflicts with YG's no-duplicate-notifications goal, CF-3). The single-source pieces were kept: **G-31** urgent call (YH only) and **G-32** phone relay (LN only). YH's and YG's "parent on shift misses the alert" obstacles were combined into **O-1**. |
| G-33 → G-34, G-35, G-36, G-37 | YG G-27 + LN G-13; LN G-26; YH G-10 / G-21 + LN G-45 + YG G-28; YH G-22 + YG G-29 | ASSEMBLE | **The clearest example of assembling.** Each member captured a different link of the acknowledgment chain: who acknowledges (YG, LN); the alert stays visible until acknowledged (LN only); the sender sees the ack status (all three); the coach calls those who have not acknowledged (YH, YG). Together they form one complete chain: *acknowledge → stays visible → visible to the sender → follow-up call*. |
| G-38 | YG G-30 | SINGLE | Only YG captured Brenda's warning not to imply that everyone has read the notice. |
| G-39 | YH G-27; LN G-15, G-23; YG G-31 | DUP | All three Mike interviews: both children in one view. |

## C — ACT / rides (G-40)

| Unified | From | Operation | Explanation |
|---|---|---|---|
| G-40 → G-41 / rest | YH G-30; LN G-27, G-21, G-28; YG G-32 | DUP + SINGLE | The ride must be confirmed. LN alone split the case where the parent drives (G-41). |
| G-42 → G-43 + G-44 + G-45 / G-46 / G-47 | YH G-12, G-23, G-31, G-32, G-33, G-41, G-42, G-8; LN G-29…G-32, G-52, G-53; YG G-39…G-42, G-46…G-48 | ALT + ASSEMBLE | Three ways to secure a ride, taken from the three models: (1) parents post needs and offers and arrange directly (all three; chosen), joined with the trust rule (LN, YG) and YH's privacy constraint in ride discussions; (2) the system suggests a nearby trusted parent (LN, YG; CF-4); (3) the coach matches families or finds a backup driver (YH, LN, YG; rejected, CF-5). |
| G-50 → G-51, G-52 | YG G-37; YH G-34 | ASSEMBLE | YG had the system *flagging* rides affected by a change; YH had the driver *re-confirming* the ride. They are two halves of one step (trigger → action). |
| G-53 → G-54, G-55, G-56; G-57; O-2 | YH G-35…G-37; LN G-33…G-36 + obstacle; YG G-33…G-38, O-2 | DUP + SINGLE | Pickup confirmation and the missed-pickup alert appear in all three. "Request a backup ride" (G-57) came only from LN. The two "driver doesn't show" obstacles were merged into O-2. |
| G-48, G-49 | YG G-43, G-45; YG G-44 + LN G-51 | DETAIL | Ride details in one message, and the coach seeing whether players are covered. |

## D — LIABILITY (G-58)

YH (G-11 + G-13), LN (Brenda's root G-1, plus G-18 and G-19) and YG (G-63…G-66) all model "the league must not arrange or approve rides". **DETAIL:** YG's three-part refinement (no assigning, no appearance of a guarantee, a disclaimer notice) was adopted. YH's family-responsibility notice merged into the disclaimer (G-61). LN's root became the branch head, because liability constrains rides *and* custody.

## E — PRIVACY (G-62)

This branch is mostly **DETAIL** from YG (G-49…G-62, D-5): minimum personal data, background checks, correcting shared information, and a guard on parents viewing their child's messages. LN G-20 (family information visible only to authorized roles) was added as G-63. LN's "without exact address" wording (from LN G-30) was folded into G-64.

## F — RECORDS (G-71)

This branch was **ASSEMBLED** from LN (G-46…G-50: fairness, availability, attendance list, rotation) and YG (G-67…G-74: shared playing-time record, half-game rule). Availability and attendance were duplicates (DUP); the shared record and the half-game rule came only from YG. YH had deliberately excluded on-field processes.

## G — ADOPTION (G-77)

This branch is **DETAIL** from YG (G-75…G-84: 3 taps, uptime, alert within 1 minute, noise reduction). LN's *Maximize[ResponseSpeedForBusyParents]* (G-54) and "attendance or cancellation reached in one step" (G-55) were merged into G-77 and G-78.

## Conflicts: where they came from

| Unified | Member conflicts merged | Notes |
|---|---|---|
| CF-1 | YH G-18 ⚡ G-4; YG C-6 | Same speed vs. verification tension, found independently. |
| CF-2 | LN G-39 ⚡ G-16; YG C-4 | The coach acting on official status himself. |
| **CF-3** | **none (new)** | **Only became visible when we merged:** YH's "text always" and YG's "avoid duplicate notifications" each made sense alone. |
| CF-4 | LN G-30 ⚡ G-19; YG C-2 | System suggestions vs. no matching. |
| CF-5 | YH G-33 ⚡ G-11; LN G-53 ⚡ G-18 | **Merging also showed that the Ray interviews are inconsistent**: in YH's transcript Ray refuses to coordinate rides (YH:R8); in LN's and YG's he informally connects families (LN:R44, YG:R59). |
| CF-6, CF-7, CF-8 | YG C-1, C-3, C-5 | Single source (YG). |

## Result

| | YH | LN | YG | Unified |
|---|---|---|---|---|
| Goals | 42 | 56 | 84 | 85 (+5 domain properties, 2 obstacles) |
| Conflicts | 2 | 3 | 6 | 8 |
| Tacit goals | 0 | 4 | 5 | 2 |

Most member tacit goals now have transcript evidence, because they merged with a goal another member had grounded in an interview (e.g. YG G-66 disclaimer + YH G-13 → G-61; the tacit roots → G-01). Only G-13 and G-69 remain tacit. All 182 member goals and 5 domain properties are absorbed; `check_coverage()` in the `.py` verifies this mechanically.
