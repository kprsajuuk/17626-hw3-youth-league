# Prototype V1 Evaluation — Team Summary

Each team member evaluated Prototype V1 (tag `v1`) independently. This file merges the three evaluations into one list of observations. That list drives the V2 change request (`docs/v2-change-request.md`) and the traceability matrix (`docs/traceability.md`).

| Member | Evaluation | Status |
|---|---|---|
| Member 1 | [`member-1/evaluation.md`](member-1/evaluation.md) | Done |
| Member 2 | [`member-2/evaluation.md`](member-2/evaluation.md) | Done (OBS-7…OBS-9, with screenshots; the full A1–H1 walkthrough table is in Member 1's evaluation) |
| Member 3 | [`member-3/evaluation.md`](member-3/evaluation.md) | Done (OBS-10, OBS-11; team decisions made 2026-11-17) |

## How to merge

1. Every observation gets **one row** below. Members number their observations with team IDs directly: take the next free OBS number and mark the finder in the ID, e.g. `OBS-7 (M2)`. Gaps in the numbering are fine (e.g. if a number is reserved but not used).
2. If two members found the same problem, add both names to **Found by** and keep one row.
3. If members disagree about the classification (implementation defect vs. requirements issue), write both views in **Notes** and record the team's decision.
4. **Decision** is one of: *V2 change* (with a CR-x in `docs/v2-change-request.md`), *documented only* (an unresolved conflict or accepted trade-off), or *rejected* (with the reason).

## Consolidated observations

| ID | Observation | Found by | Classification | Goal(s) | Decision | Notes |
|---|---|---|---|---|---|---|
| OBS-1 (M1) | A heads-up can still be sent after a FINAL notice | Member 1 | Requirements issue | G-07, G-02 | V2 change (CR-1) | Confirmed by Member 2's code review: `sendHeadsUp()` has no FINAL-notice check (REQ-05 partially satisfied in `traceability.md`). **Classification discussed (2026-11-16):** one view is that REQ-05's words "for a pending change" were already clear, so the code failed to check them (implementation defect). Team decision: *requirements issue*, because "pending" was never defined and the fix starts with the spec (D-6). |
| OBS-2 (M1) | A cancelled game can be "moved", which silently reinstates it | Member 1 | Requirements issue | G-13, G-21, D-1 | V2 change (CR-2, **option B**: a cancellation is final) | Decided 2026-11-16. Option A ("Reinstated") kept as the alternative; risk against D-1 accepted. Ask Brenda (OQ-5) |
| OBS-3 (M1) | An urgent change sends in-app, email and text at once, plus a call | Member 1 | Requirements issue (needs clarification) | G-85, G-27, G-30, G-31 | Documented only (CR-3) | Ask Mike (OQ-6) |
| OBS-4 (M1) | Heads-ups never escalate, so a parent on shift may miss them | Member 1 | Requirements issue (accepted trade-off) | G-08, O-1 | Documented only (CR-3) | |
| OBS-5 (M1) | A spec scenario says Saturday; the data says Sunday | Member 1 | Requirements issue (minor) | — | V2 change (CR-4) | |
| OBS-6 (M1) | Validation rules invented by the agent are not in the spec | Member 1 | Requirements issue | — | V2 change (CR-4) | |
| OBS-7 (M2) | A game's field and time cannot be changed in one notice; it takes two FINAL notices, so families get two alerts and escalation restarts | Member 2 | Requirements issue | G-14, G-85, G-02 | V2 change (CR-5, decided 2026-11-16) | REQ-03 allows only one change type per notice. The code follows the spec. |
| OBS-8 (M2) | Games whose kickoff has passed have no visible "Started" tag; unconfirmed alerts for them stay under "Needs your confirmation" | Member 2 | Requirements issue (missing information) | G-11, G-02, G-39, G-85 | V2 change (CR-6, decided 2026-11-16) | Full version; parents still see a started game until the end of that day. No interview evidence, so the new REQ-20 is an assumption. Ask Brenda / Ray (OQ-7) |
| OBS-9 (M2) | Delivery status has no "sent" state; only "delivered" and "failed" exist | Member 2 (code review) | Implementation defect | G-33, G-36 | V2 change (CR-7, decided 2026-11-16): fix the code | REQ-13 clearly lists sent / delivered / failed. Changing the spec to drop "sent" was considered and not chosen. The simulated delivery timing (sent → delivered after 1 simulated minute) is added to the spec as an assumption. |
| OBS-10 (M3) | A restricted parent's confirmation marks the whole family as confirmed, so the custodial parent gets no call and the coach sees the restricted child's family as done | Member 3 | Requirements issue | G-33, G-36, G-37, G-31, G-23, D-4 | V2 change (CR-8, decided 2026-11-17): confirmation counted **per child** | The "any parent confirms" clarification and REQ-08 were never considered together. The code follows the spec. The simpler alternative (a restricted parent's confirmation never counts) was considered and not chosen, because it ignores Wes's legitimate confirmation for Emma. The per-child rule is an assumption; ask Brenda how court-order households should be treated (OQ-8). |
| OBS-11 (M3) | The spec contradicts itself on whether coaches receive texts; V1 texts them | Member 3 | Requirements issue (inconsistent spec) | G-85, G-30 | V2 change (CR-9, decided 2026-11-17): **coaches do receive texts**; spec only, no code change | REQ-10 ("recipient") vs. the Assumptions bullet (coaches get in-app + email). The team keeps REQ-10's reading, which V1 already implements, and rewrites the Assumptions bullet to match. The extra message to coaches is an accepted cost against G-85. Confirm with Ray (OQ-9). |
