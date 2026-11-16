# Prototype V1 Evaluation — Team Summary

Each team member evaluated Prototype V1 (tag `v1`) independently. This file merges the three evaluations into one list of observations. That list drives the V2 change request (`docs/v2-change-request.md`) and the traceability matrix (`docs/traceability.md`).

| Member | Evaluation | Status |
|---|---|---|
| Member 1 | [`member-1/evaluation.md`](member-1/evaluation.md) | Done |
| Member 2 | [`member-2/evaluation.md`](member-2/evaluation.md) | _to do_ |
| Member 3 | [`member-3/evaluation.md`](member-3/evaluation.md) | _to do_ |

## How to merge

1. Every observation that any member reports gets **one row** below, using a team ID (OBS-n).
2. If two members found the same problem, add both names to **Found by** and keep one row.
3. If members disagree about the classification (implementation defect vs. requirements issue), write both views in **Notes** and record the team's decision.
4. **Decision** is one of: *V2 change* (with a CR-x in `docs/v2-change-request.md`), *documented only* (an unresolved conflict or accepted trade-off), or *rejected* (with the reason).

## Consolidated observations

| ID | Observation | Found by | Classification | Goal(s) | Decision | Notes |
|---|---|---|---|---|---|---|
| OBS-1 | A heads-up can still be sent after a FINAL notice | Member 1 | Requirements issue | G-07, G-02 | V2 change (CR-1) | |
| OBS-2 | A cancelled game can be "moved", which silently reinstates it | Member 1 | Requirements issue | G-13, G-21, D-1 | V2 change (CR-2, option A pending team decision) | Ask Brenda (OQ-5) |
| OBS-3 | An urgent change sends in-app, email and text at once, plus a call | Member 1 | Requirements issue (needs clarification) | G-85, G-27, G-30, G-31 | Documented only (CR-3) | Ask Mike (OQ-6) |
| OBS-4 | Heads-ups never escalate, so a parent on shift may miss them | Member 1 | Requirements issue (accepted trade-off) | G-08, O-1 | Documented only (CR-3) | |
| OBS-5 | A spec scenario says Saturday; the data says Sunday | Member 1 | Requirements issue (minor) | — | V2 change (CR-4) | |
| OBS-6 | Validation rules invented by the agent are not in the spec | Member 1 | Requirements issue | — | V2 change (CR-4) | |
| OBS-7 | _(next finding from Member 2 / Member 3)_ | | | | | |
