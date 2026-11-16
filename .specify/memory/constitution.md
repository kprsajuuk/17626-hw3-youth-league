<!--
Sync Impact Report
- Version change: (unversioned template) → 1.0.0
- Modified principles: none (initial adoption); template placeholders replaced by:
  I. Specification Before Implementation
  II. Stakeholder Traceability (NON-NEGOTIABLE)
  III. Preserve Conflicts and Decisions
  IV. Testable Requirements
  V. Prototype Scope Discipline
  VI. Mock, Never Real
  VII. Privacy by Default
  VIII. Simplicity
- Added sections: Prototype Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates requiring updates: none modified by this command (templates read the
  constitution at runtime)
- Follow-up TODOs:
  - docs/goal-model.md does not exist yet; Principle II depends on its G-xx IDs.
  - Remove this report before committing the constitution.
-->

# Game Change Notice Prototype Constitution

Youth soccer league coordination system, 17-626 HW4 team project.

## Core Principles

### I. Specification Before Implementation

- Code MUST NOT implement any behavior that does not appear in `spec.md`.
- When evaluation reveals a gap or defect, changes MUST flow in this order: revise `spec.md` first,
  then `plan.md` and `tasks.md`, then the code.
- A code change with no matching spec entry is a defect, even if the behavior looks useful.

**Rationale**: The deliverable is a requirements artifact. The prototype exists to validate the
spec, so the spec must always be the source of truth.

### II. Stakeholder Traceability (NON-NEGOTIABLE)

- Every functional requirement MUST carry:
  - a requirement ID (`REQ-xx`);
  - the unified goal ID(s) it realizes (`G-xx`, as defined in `docs/goal-model.md`);
  - at least one interview citation in the form `<Interviewee>:<Line>`, e.g. `YH:B63`,
    `LN:M35`, `YG:R112`.
- A requirement with no stakeholder evidence MUST be explicitly labeled **Assumption** and give the
  reason it was included.
- Every code component that implements a requirement MUST reference its `REQ-xx` ID in a comment.

**Rationale**: Graders and teammates must be able to trace any behavior back through the goal
model to what a stakeholder actually said.

### III. Preserve Conflicts and Decisions

- Stakeholder conflicts (`CF-xx`) MUST NOT be silently removed or merged away.
- For each conflict the spec MUST record the decision taken (**prioritize**, **compromise**, or
  **unresolved**) and the rejected alternative, with the reason.
- Unresolved conflicts MUST remain listed as open questions until a later spec version resolves them.

**Rationale**: How conflicts were handled is itself a requirements outcome. Hiding a conflict
loses information that the evaluation depends on.

### IV. Testable Requirements

- Every requirement MUST have at least one Given/When/Then acceptance scenario.
- Each scenario MUST be checkable by a person using the prototype UI, with no code inspection
  needed.
- A requirement that cannot be written as such a scenario MUST be rewritten or moved to open
  questions.

**Rationale**: Acceptance scenarios are how the team and stakeholders evaluate whether the
prototype satisfies the spec.

### V. Prototype Scope Discipline

- The prototype MUST demonstrate only the requirements selected for the current sprint.
- Out-of-scope goals MUST NOT be built, even partially or as stubs. Out of scope: rides and
  carpooling, coach records, and master schedule upkeep.
- Moving a goal into scope requires a spec amendment under Principle I.

**Rationale**: A focused prototype gives clear evaluation results. Partial features add noise
and suggest commitments the spec never made.

### VI. Mock, Never Real

- All data (teams, families, contacts, court-order flags) MUST be fictional mock data.
- Email, SMS, and phone notifications MUST be simulated and recorded in a delivery log that
  users can see in the UI.
- The prototype MUST NOT send real messages, store real personal data, or call external
  services or APIs.

**Rationale**: The prototype handles sensitive child and family information. Simulation removes
any risk of harm and makes delivery behavior visible for evaluation.

### VII. Privacy by Default

- A family flagged with a court-order restriction MUST NOT receive, and MUST NOT be named or
  listed in, any message about the restricted child. This includes recipient lists shown in
  the delivery log.
- Children's full names and home addresses MUST NOT appear in any shared view (team rosters,
  broadcast notices, shared logs).
- Where a privacy rule and another requirement conflict, the privacy rule wins unless the spec
  records an explicit decision under Principle III.

**Rationale**: Court-order restrictions are a safety issue, not a preference. Leaking a child's
location or schedule to a restricted party can put the child in danger.

### VIII. Simplicity

- The design MUST be the simplest one that satisfies the spec: a single front-end application
  with in-memory or mock state.
- A backend, database, or extra service MUST NOT be added unless a requirement in `spec.md`
  needs it, and `plan.md` must record why.

**Rationale**: The prototype is for evaluating requirements, not for production. Extra
infrastructure costs team time and does not improve what we learn.

## Prototype Constraints

- **Data**: Mock data lives in the repository as plain fixtures. Seed data MUST include at least
  one court-order-flagged family so that Principle VII can be demonstrated.
- **Delivery log**: Every simulated email, SMS, or call MUST appear in the log with channel,
  recipient (subject to Principle VII), timestamp, and message content.
- **Identifier formats**: `REQ-xx` (requirements), `G-xx` (goals), `CF-xx` (conflicts), and
  interview citations `<Interviewee>:<Line>` MUST be used consistently in the spec, plan, tasks,
  and code comments.

## Development Workflow & Quality Gates

- **Spec gate**: Before planning, `spec.md` MUST pass a check that every requirement has an
  ID, goal link(s), a citation or an Assumption label, and at least one Given/When/Then scenario.
- **Plan gate**: `plan.md` MUST include a Constitution Check confirming Principles V, VI, VII, and
  VIII, and MUST justify any added complexity.
- **Implementation gate**: Each task MUST name the `REQ-xx` it implements. Code review MUST
  confirm the REQ comments are present and that no out-of-scope behavior was added.
- **Evaluation loop**: Findings from stakeholder or team evaluation go back into `spec.md` first
  (Principle I), producing the next spec version.

## Governance

- This constitution overrides other project practices. If a conflict appears, the constitution
  wins until it is amended.
- **Amendments** require agreement from the whole team, a written rationale, and a version bump.
- **Versioning policy** (semantic versioning for this document):
  - MAJOR: a principle is removed or redefined in a backward-incompatible way.
  - MINOR: a principle or section is added, or guidance is materially expanded.
  - PATCH: clarifications and wording fixes.
- **Artifact versions**: Each version of the spec, goal model, and code (V1, V2, ...) MUST be
  preserved in git, as a tag or a clearly labeled commit. Earlier versions MUST NOT be
  overwritten in a way that loses them from history.
- **Compliance review**: Every spec revision, plan, and code review MUST check compliance with
  these principles. Violations are fixed or recorded as justified exceptions in `plan.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
