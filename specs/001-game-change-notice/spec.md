# Feature Specification: Game Change Notice

**Feature Branch**: `001-game-change-notice` (spec directory; V1 = tag `v1`, V2 work on branch `v2`)

**Created**: 2026-11-16

**Status**: Draft (V2)

**Revised**: 2026-11-17 (V2), from the V1 evaluation (`docs/evaluation/v1/team-summary.md`,
OBS-1…OBS-11) as specified in `docs/v2-change-request.md` (CR-1…CR-9). Every new or changed item
is marked **(V2)**.

**Input**: User description: "Game Change Notice — when a youth soccer game is cancelled or moved,
the league administrator verifies and publishes one official status, the right families (and only
them) are notified, and coaches can see who has acknowledged it." (Full description, including the
requirement table, conflict decisions and open questions, was supplied with `/speckit-specify`.)

**Goal chain**: official status is clear (G-02) → the right families know it (G-21), from the
unified goal model in `docs/goal-model.md`.

**Stakeholders**: Brenda (league administrator), Ray (coach), Mike (parent who works shifts, two
children in the league).

**Citation format**: `YH:B63` = Yunhan's Brenda transcript, turn 63. Prefixes: `YH` Yunhan,
`LN` Lynn, `YG` Ying. Speakers: `B` Brenda, `M` Mike, `R` Ray.

## Clarifications

### Session 2026-11-16

- Q: For urgent changes, when should the simulated phone call to a parent be placed? (OQ-2) → A:
  Text immediately; call only if receipt is not confirmed within 2 minutes (the 2-minute delay is a
  team assumption, not stakeholder-stated).
- Q: What delay before the fallback text and what urgency window should the prototype use? (OQ-1)
  → A: 5-minute text delay; urgent = original or new kickoff within 2 hours of publishing. Both are
  fixed values (not administrator-configurable) in V1.
- Q: Who should receive a coach's UNCONFIRMED heads-up? (OQ-3) → A: Every eligible family on the
  coach's own team (not the opposing team), with the same privacy rules as a final notice; the
  coach does not pick individual families.
- Q: When a family has two notified parents and only one confirms receipt, does the other parent
  still get escalation texts and calls? → A: No. The family counts as confirmed once any notified
  parent confirms, and pending escalation stops for the whole family. *(Superseded in V2 by the
  per-child rule below, because it ignored court-order restrictions, OBS-10.)*

### Session 2026-11-17 (V2, from the V1 evaluation)

- Q: How is receipt confirmation counted when a parent is restricted for one of the family's
  children? (OBS-10) → A: **Per child.** A child is confirmed for a notice once any parent who was
  notified **about that child** confirms. A parent's alert counts as confirmed once every child named
  in that parent's notice is confirmed. A family is confirmed once all of its children on the
  affected team(s) are confirmed. For two unrestricted parents this gives the same result as V1.
  *(V2, CR-8; team assumption, OQ-8)*
- Q: Do coaches receive the fallback / urgent text? (OBS-11) → A: Yes. REQ-10 applies to every
  recipient, parent or coach; calls stay parents-only (REQ-11). *(V2, CR-9; confirm with Ray, OQ-9)*
- Q: Which changes can follow an official cancellation? (OBS-2) → A: None. A cancellation is final
  (D-7). *(V2, CR-2 option B; confirm with Brenda, OQ-5)*
- Q: Can one notice move both the field and the time? (OBS-7) → A: Yes; "moved" may change the
  field, the time, or both. *(V2, CR-5)*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrator publishes a verified change (Priority: P1)

The league administrator learns from the city or parks department that a game is cancelled, moved
to another field, or moved to another time. She records who confirmed it and when, then publishes
it as the official status of that one game. Everyone then sees one trustworthy version.
(G-03, G-04, G-10, G-11)

**Why this priority**: Without one verified official status, every other part of the feature
(notification, acknowledgment) spreads uncertain information. This is the root of the goal chain.

**Independent Test**: Switch to the administrator persona, publish a field move for one game with
a verification record, and confirm the game shows the FINAL status, its details and the audit log
entry. Switch to coach and parent personas and confirm they cannot publish.

**Acceptance Scenarios**:

1. **[REQ-01]** **Given** the administrator has started a change for the U10 Blue game but has not
   entered a verification source and time, **When** she tries to publish, **Then** publishing is
   blocked, a message explains that a verification record is required, and the game's official
   status is unchanged.
2. **[REQ-01]** **Given** the administrator enters "Parks Department, 2:40 p.m. today" as the
   verification record, **When** she publishes, **Then** the published notice shows that
   verification source and time.
3. **[REQ-02]** **Given** the coach persona is active, **When** the coach views the U10 Blue game,
   **Then** no control to cancel, move or otherwise change the official status is available, and
   the official status is unchanged.
4. **[REQ-02]** **Given** the parent persona is active, **When** the parent views any game,
   **Then** no control to change the official status is available.
5. **[REQ-03, REQ-04]** **Given** the U10 Blue game is scheduled on Field 3, **When** the
   administrator publishes a verified move to Field 7, **Then** the game shows
   "FINAL – Moved: Field 3 → Field 7", the name of the person who posted it, the time it was
   posted, and the instruction for families (for example "Go to Field 7 at the original time").
6. **[REQ-03]** **Given** the U12 Red game is scheduled Sunday 10:00, **When** the administrator
   publishes a verified time move to Sunday 13:00, **Then** the game shows
   "FINAL – Time changed: Sun 10:00 → Sun 13:00" with the instruction for families.
   *(V2: Saturday → Sunday to match the mock data, OBS-5)*
7. **[REQ-03]** **Given** a game is scheduled, **When** the administrator publishes a verified
   cancellation, **Then** the game shows "FINAL – Cancelled" with the instruction for families
   (for example "No game today; do not travel").
8. **[REQ-06]** **Given** the administrator has published a change, **When** she opens the activity
   log, **Then** the log shows an entry with author, time and full content of the publish, and no
   user (in any persona) can edit or delete it.
9. **[REQ-16]** **Given** a change is published, **When** the delivery log is viewed, **Then** every
   initial in-app alert and email for that change is timestamped within 1 minute of the publish
   time.
10. **[REQ-03]** *(V2, CR-2)* **Given** U10 Blue vs U10 Red is officially cancelled, **When** the
    administrator opens it, **Then** no publish control is offered, and a publish attempt through
    the domain is rejected with "This game is cancelled. A cancellation is final."; Mike's view
    still shows "FINAL – Cancelled".
11. **[REQ-03]** *(V2, CR-5)* **Given** U10 Blue vs U10 Red is at Field 3, Sat 10:00, **When** the
    administrator publishes a verified move to Field 7 at 13:00, **Then** one FINAL notice is sent
    per recipient per channel, labelled "FINAL – Moved: Field 3, 10:00 → Field 7, 13:00".
12. **[REQ-03, REQ-01]** *(V2, CR-4)* **Given** the administrator is publishing a change, **When**
    the move does not change any detail (e.g. Field 3 → Field 3), the new kickoff is not in the
    future, or the verification time is later than the current time, **Then** publishing is
    blocked with an explanation and the official status is unchanged.
13. **[REQ-20]** *(V2, CR-6)* **Given** the demo clock is past the kickoff of U10 Blue vs U10 Red,
    **When** the administrator or the coach opens the game list, **Then** the game is tagged
    "Started" and no publish or heads-up control is shown.

---

### User Story 2 - Affected families are notified and acknowledge (Priority: P1)

A parent gets an alert only for games their children play in. The alert clearly says FINAL, shows
what changed (old → new), when it takes effect and what to do. The parent taps to confirm receipt.
(G-21, G-22, G-26, G-34)

**Why this priority**: Publishing has no value unless the right families learn of it, and wrong or
leaked notices cause confusion and privacy harm.

**Independent Test**: Publish a change for U10 Blue and check, in the delivery log and each parent
persona, exactly who received it; then acknowledge as one parent and confirm the alert stops being
prominent for that parent.

**Acceptance Scenarios**:

1. **[REQ-07, REQ-08]** **Given** families A, B and C are on U10 Blue, family B's parent X has a
   court-order restriction for child B1, and family B's other parent Y has none, **When** a
   U10 Blue change is published, **Then** A, C, parent Y and the U10 Blue coach are notified,
   parent X is not notified, and no U12 family or coach is notified.
2. **[REQ-08]** **Given** the setup above, **When** the coach or administrator views the delivery
   log or acknowledgment list for that change, **Then** parent X does not appear anywhere in it.
3. **[REQ-08]** **Given** parent X is restricted for child B1 but also has an unrestricted child X2
   on U10 Blue, **When** a U10 Blue change is published, **Then** X receives a notice that names
   only X2 and contains no mention of B1.
4. **[REQ-09]** **Given** a change is published, **When** the delivery log is viewed, **Then** each
   recipient has one in-app alert entry and one simulated email entry for that change.
5. **[REQ-12]** **Given** a parent has an unacknowledged FINAL notice, **When** the parent opens
   their view, **Then** the alert is shown prominently at the top and remains there until the
   parent acknowledges it.
6. **[REQ-12]** **Given** the alert is shown, **When** the parent taps "Confirm receipt", **Then**
   the alert is marked as receipt confirmed, it is no longer shown prominently, and the coach's list
   shows that family as confirmed.
7. **[REQ-17]** **Given** Mike has two children on U10 Blue, **When** a U10 Blue change is
   published, **Then** Mike receives exactly one notice per channel for that change, and the notice
   names both children.

---

### User Story 3 - Coach sees who has not acknowledged (Priority: P1)

For each family on the team, the coach sees whether the notice was delivered on each channel and
whether receipt was confirmed, so the coach knows whom to call before departure. (G-36, G-37)

**Why this priority**: The core problem is that nobody knows who missed an update. This closes that
loop.

**Independent Test**: Publish a change, confirm receipt as some parents, and check the coach's
status view and not-confirmed list.

**Acceptance Scenarios**:

1. **[REQ-13, REQ-14]** **Given** 10 families on U10 Blue received a notice and 8 have confirmed
   receipt, **When** the coach opens the notice status view, **Then** a list shows the 2 families
   who have not confirmed, and the summary reads "8 of 10 confirmed receipt".
2. **[REQ-14]** **Given** any acknowledgment summary or label, **When** it is displayed anywhere in
   the prototype, **Then** it never uses the words "read", "seen" or "everyone has seen it".
3. **[REQ-13]** **Given** a family has no email address on file, **When** a change is published,
   **Then** that family's email channel shows "failed", other channels show their own status, and
   the family is on the not-confirmed list until someone in it confirms receipt.
4. **[REQ-13]** **Given** the administrator persona is active, **When** she opens the status view
   for a published change, **Then** she sees the same per-recipient, per-channel delivery status and
   acknowledgment status as the coach, for every affected team.
5. **[REQ-18]** **Given** the coach's status view or any shared roster, **When** it lists children,
   **Then** each child is shown by first name and last initial only, and no home address appears.
6. **[REQ-13]** *(V2, CR-7)* **Given** a change was just published, **When** the administrator
   opens the notice status, **Then** the email and in-app channels show "sent"; **When** the demo
   clock advances by 1 minute, **Then** they show "delivered" (or "failed" with a reason).

---

### User Story 4 - Coach sends an unconfirmed heads-up (Priority: P2)

When a coach hears a change is likely but not official yet, the coach can send a heads-up that is
unmistakably UNCONFIRMED. It does not change the official status, and the final notice replaces it.
(G-07, G-08; CF-1)

**Why this priority**: It meets the coach's need for speed (CF-1, CF-2) without weakening the
single official status. The core chain works without it.

**Independent Test**: As a coach, send a heads-up; verify its label and that the game's official
status is unchanged; then publish a final change as administrator and verify the heads-up is shown
as superseded.

**Acceptance Scenarios**:

1. **[REQ-05]** **Given** the coach persona is active for U10 Blue, **When** the coach sends a
   heads-up "Field 3 may close due to rain", **Then** families see it labelled UNCONFIRMED in a
   style clearly different from a FINAL notice, and the game's official status is unchanged.
2. **[REQ-05, REQ-04]** **Given** an UNCONFIRMED heads-up exists for U10 Blue, **When** the
   administrator publishes the final status, **Then** the heads-up is shown as "Superseded" and the
   game shows only the FINAL status as current.
3. **[REQ-05]** **Given** a heads-up was sent and no final decision follows, **When** any persona
   views the game, **Then** the heads-up is still labelled UNCONFIRMED and the official status is
   the original schedule.
4. **[REQ-05]** **Given** the coach of U10 Blue, **When** the coach tries to send a heads-up for a
   U12 Red game, **Then** the action is unavailable.
5. **[REQ-05, REQ-08]** **Given** U10 Blue plays U10 Red and parent X is restricted for child B1
   on U10 Blue, **When** the U10 Blue coach sends a heads-up for that game, **Then** every
   U10 Blue family except parent X receives it, no U10 Red family receives it, and the coach is
   not offered a way to choose individual families.
6. **[REQ-06]** **Given** a heads-up was sent, **When** the activity log is opened, **Then** it
   shows the heads-up with author, time and content.
7. **[REQ-17]** **Given** a family already received a heads-up for a game, **When** the final notice
   is published, **Then** the family's view shows one current notice (the FINAL one) with the
   heads-up marked superseded, not two separate current alerts.
8. **[REQ-05]** *(V2, CR-1)* **Given** a FINAL notice exists for U10 Blue vs U10 Red, **When** the
   U10 Blue coach opens that game, **Then** no heads-up control is offered, and an attempt through
   the domain is rejected with "an official decision has already been published".

---

### User Story 5 - Parent sees all children's games in one view (Priority: P2)

A parent with children on different teams sees all upcoming games and their current official status
in one place. *(V2)* Games that started earlier the same day stay listed, tagged "Started". (G-39)

**Why this priority**: Mike has two children and works shifts; one combined view prevents missing
one child's change. It builds on Stories 1–2.

**Independent Test**: As Mike's persona, open the parent view and confirm both children's games
appear with correct status labels after changes are published.

**Acceptance Scenarios**:

1. **[REQ-15]** **Given** Mike has one child on U10 Blue and one on U12 Red and both games change,
   **When** Mike opens his view, **Then** both games are listed with their current official status,
   FINAL/UNCONFIRMED labels and any unconfirmed alerts.
2. **[REQ-15]** **Given** one of Mike's games has no change, **When** he opens his view, **Then**
   that game shows its original schedule as the current status.
3. **[REQ-15, REQ-08]** **Given** parent X is restricted for child B1, **When** X opens the parent
   view, **Then** no game, schedule or detail for B1 appears.
4. **[REQ-20, REQ-15]** *(V2, CR-6)* **Given** the demo clock is past the kickoff of U10 Blue vs
   U10 Red and Mike has not confirmed its FINAL notice, **When** Mike opens his view, **Then** the
   game is still listed, tagged "Started"; the alert is no longer under "Needs your confirmation";
   and no further text or call is sent.

---

### User Story 6 - Delivery escalation for parents who miss alerts (Priority: P3)

A parent on shift may not open the app. If they have not confirmed receipt within 5 minutes, they
get a text. *(V2)* Coaches get the same text; only parents get calls. If the change is urgent (kickoff within 2 hours), they get a text immediately and a
phone call if they still have not confirmed receipt 2 minutes later. (G-28, G-30, G-31; CF-3; obstacle O-1)

**Why this priority**: It covers the obstacle of unseen in-app alerts, but the feature is useful
without it.

**Independent Test**: Publish one non-urgent and one urgent change; use the demo time control to
pass 5 minutes; check which texts and calls appear in the delivery log.

**Acceptance Scenarios**:

1. **[REQ-10]** **Given** kickoff is 90 minutes away, **When** the change is published,
   **Then** the delivery log shows, at once, an in-app alert, email and text for each recipient
   parent.
2. **[REQ-11]** **Given** kickoff is 90 minutes away and parent P has not confirmed receipt,
   **When** 2 minutes pass after publishing, **Then** the delivery log shows a phone call to
   parent P, and no call to any parent who confirmed receipt within those 2 minutes.
3. **[REQ-10]** **Given** kickoff is tomorrow and parent P has not confirmed receipt, **When**
   5 minutes pass after publishing, **Then** the delivery log shows a text sent to parent P, and no
   text to any recipient who already confirmed receipt.
4. **[REQ-10]** **Given** kickoff is tomorrow and a parent confirms receipt after 3 minutes,
   **When** 5 minutes pass, **Then** no text is sent to that parent.
5. **[REQ-11]** **Given** kickoff is tomorrow, **When** a change is published and any amount of
   time passes, **Then** no phone call appears in the delivery log.
6. **[REQ-10, REQ-13]** **Given** family B has two notified parents, Y and Z, and kickoff is
   tomorrow, **When** Y confirms receipt after 2 minutes and 5 minutes pass, **Then** no text is
   sent to Y or Z, and the coach's list shows family B as confirmed.
7. **[REQ-19]** **Given** the demo time control, **When** the presenter advances time by 5 minutes,
   **Then** pending escalations are evaluated as if 5 minutes had passed, and log timestamps reflect
   the advanced time.
8. **[REQ-10, REQ-13, REQ-08]** *(V2, CR-8)* **Given** Family E, where Wes is restricted for Eli
   but not for Emma and Erin is notified about both, and an urgent change to U10 Blue vs U10 Red,
   **When** only Wes confirms receipt and 2 minutes pass, **Then** Wes gets no text or call; Erin's
   alert is still under "Needs your confirmation" and she receives the simulated call; the coach's
   list still shows Family E as not confirmed, naming Erin (for Eli E.) and never naming Wes next
   to Eli.
9. **[REQ-10]** *(V2, CR-9)* **Given** a non-urgent change to U12 Red vs U12 Gold, **When** 5 minutes
   pass and neither coach has confirmed receipt, **Then** both coaches receive the simulated text
   and neither receives a call.

---

### Edge Cases

- **Two changes to the same game before families confirm the first**: only the latest change is
  current; earlier notices are marked superseded. Confirmations of an earlier notice do not count
  for the latest; pending escalations for the superseded notice are cancelled and the escalation
  clock restarts for the new notice. (REQ-04, REQ-10, REQ-17)
- **Heads-up with no final decision**: the heads-up stays UNCONFIRMED and the official status is
  unchanged. Withdrawing a published change is out of scope (G-13 is tacit). (REQ-05)
- **(V2) Heads-up after a FINAL notice**: not allowed; once a FINAL notice exists the change is no
  longer pending (D-6). (REQ-05, OBS-1)
- **(V2) Change after a cancellation**: not allowed; a cancellation is final (D-7). A move
  published before a cancellation is still replaced by the cancellation. (REQ-03, OBS-2)
- **(V2) Field and time change together**: one "moved" notice with both new values. (REQ-03, OBS-7)
- **(V2) Restricted parent confirms for a family**: counts only for the children named in their own
  notice. (REQ-10, REQ-13, REQ-08, OBS-10)
- **Recipient with no email or phone on file**: the channel is shown as failed in the delivery log
  and the family stays on the not-confirmed list. (REQ-13)
- **Restriction covers one child, parent has another unrestricted child on the same team**: the
  parent is notified only in terms of the unrestricted child. (REQ-08)
- **City decision arrives later than the usual ~3 p.m.** (D-1): the system imposes no fixed decision
  time; the administrator can publish whenever the verification arrives. (REQ-01)
- **Game between two league teams**: both teams are affected; both teams' coaches and families are
  notified, and each coach sees status for their own team's families. (REQ-07, REQ-13)
- **Time move that brings kickoff within 2 hours**: urgency is judged on whichever of the original
  or new kickoff is sooner. (REQ-10, REQ-11)
- **Game whose kickoff has already passed**: no change or heads-up can be published for it.
  *(V2)* Every view tags it "Started"; parents still see it until the end of that day; its
  unconfirmed alerts stop asking for confirmation and stop escalating. (REQ-20, OBS-8)

## Requirements *(mandatory)*

Requirement IDs follow the constitution (Principle II). Each row lists the goals it realizes and
the interview evidence. `D-x` entries are domain properties from the goal model.

### Functional Requirements

- **REQ-01**: Before publishing, the administrator MUST record that the change was verified: the
  source (city or parks department) and the time of confirmation. Publishing without a verification
  record MUST be blocked with an explanation. *(V2, CR-4)* The verification time MUST NOT be later
  than the current time. The system MUST NOT assume a fixed decision time.
  *Goals*: G-03, D-1. *Evidence*: YH:B40, LN:B34, YG:B111; V1 evaluation OBS-6.
- **REQ-02**: Only the league administrator MAY publish or change a game's official status. Coaches
  and parents MUST NOT be able to, and the system MUST reject such attempts. *Goals*: G-04, G-05
  (CF-2). *Evidence*: YH:B55, LN:B68, YG:B113.
- **REQ-03** *(revised in V2: CR-2, CR-4, CR-5)*: A published change MUST be one of: **cancelled**,
  or **moved** (a new field, a new kickoff time, or both). A move MUST change at least one detail,
  and a new kickoff MUST be in the future. Once a game's current official status is *Cancelled*,
  the cancellation is final: no further change MAY be published for that game. The publish control
  MUST NOT be offered for a cancelled game, and the system MUST reject an attempt with the reason
  "This game is cancelled. A cancellation is final." The game entry MUST then show the current
  official status with the old and new details and an instruction for families. *Goals*: G-11,
  G-12, G-14, D-2, D-7. *Evidence*: YG:R39, YG:M73, YH:M76; V1 evaluation OBS-2, OBS-6, OBS-7.
  *Assumption*: D-7 (a cancellation is final; confirm with Brenda, OQ-5).
- **REQ-04**: Every official notice MUST be marked FINAL and show who posted it and when. It MUST
  replace any earlier heads-up or earlier notice for that game as the current status. *Goals*:
  G-10. *Evidence*: YH:R63, YH:B63.
- **REQ-05** *(revised in V2: CR-1)*: A coach MAY send a heads-up for a game of their own team
  **only while that game has no current FINAL notice** (a change is pending only until a FINAL
  notice is published, D-6). Once a FINAL notice exists, the heads-up control MUST NOT be offered,
  and the system MUST reject a heads-up for that game with the reason "an official decision has
  already been published". The heads-up MUST go to every eligible family of the coach's own team
  only (no per-family selection, no opposing team), subject to REQ-08. It MUST always be labelled
  UNCONFIRMED, be visually distinct from a final notice, never change the official status, and be
  shown as superseded once a final notice is published. *Goals*: G-07, G-08, D-6 (CF-1).
  *Evidence*: YH:R52, YH:R54, YH:B59, YG:R47; V1 evaluation OBS-1.
- **REQ-06**: Every publish, heads-up and notice MUST be logged with author, time and content. No
  user MAY edit or delete log entries. The administrator MUST be able to view the log. *Goals*:
  G-06. *Evidence*: YH:B63, LN:B48, YG:M73.
- **REQ-07**: Final notices MUST go only to the coach(es) and families of the affected team(s);
  heads-ups only to the sending coach's team (REQ-05). Neither MAY reach unaffected teams. *Goals*: G-22. *Evidence*: YH:B46, YG:B111, YG:R20.
- **REQ-08**: A parent with a court-order restriction on file for a child MUST be excluded from that
  child's notices and heads-ups. The child's schedule and details MUST NOT appear in any message or
  view shown to that parent, and that parent MUST NOT appear in recipient lists, delivery logs or
  acknowledgment lists about the restricted child. *Goals*: G-23, G-24, G-25, D-4. *Evidence*:
  YH:B32, YG:B66.
- **REQ-09**: On publish, every recipient MUST get an in-app alert and a simulated email. *Goals*:
  G-26, G-27. *Evidence*: YH:B49, YG:M73, YG:B20.
- **REQ-10** *(revised in V2: CR-8, CR-9)*: If a recipient (parent or coach) has not confirmed
  receipt within 5 minutes of a final notice, a simulated text MUST be sent to them. For a parent,
  pending texts and calls stop once every child named in that parent's notice is confirmed (by them
  or by another parent notified about the same child). A confirmation by a parent who is
  restricted for a child (REQ-08) never counts for that child. If the change is urgent (original or
  new kickoff within 2 hours of publishing), the text MUST be sent immediately. No text or call is
  sent once the game has started (REQ-20). *Goals*: G-28, G-30 (CF-3), G-33, D-4. *Evidence*:
  YG:M73, YH:M23; V1 evaluation OBS-10, OBS-11. *Assumption*: the per-child rule (OQ-8) and texts to
  coaches (OQ-9) are team decisions.
- **REQ-11**: For urgent changes, a simulated phone call MUST be placed to each recipient parent
  who has not confirmed receipt within 2 minutes of publishing. Non-urgent changes MUST NOT trigger
  a call. *Goals*: G-31, G-85. *Evidence*: YH:M23, YH:M67. *Assumption*: the 2-minute delay is a
  team decision (Clarifications 2026-11-16), not stakeholder-stated.
- **REQ-12**: A recipient MUST be able to confirm receipt of a notice. Until they do, the alert MUST
  stay prominently visible in their view *(V2)* unless the game has started (REQ-20). *Goals*:
  G-34, G-35. *Evidence*: YG:M73, LN:M11.
- **REQ-13**: The coach (for their team) and the administrator (for all affected teams) MUST see
  per-recipient delivery status (sent / delivered / failed, per channel) and receipt-confirmation
  status, plus a list of families who have not confirmed receipt. *(V2, CR-8)* A family stays on
  that list until all of its children on the affected team(s) are confirmed; the list names only the
  parents notified about the unconfirmed children (REQ-08). *(V2, CR-7)* Channel status starts as
  "sent" and becomes "delivered" or "failed" (see Assumptions, simulated delivery). *Goals*: G-33,
  G-36, G-37. *Evidence*: YH:R31, LN:R23, YG:R41; V1 evaluation OBS-9, OBS-10.
- **REQ-14**: Acknowledgment wording MUST only claim "receipt confirmed", never "read", "seen" or
  "everyone has seen it". *Goals*: G-38. *Evidence*: YG:B100, YG:B111.
- **REQ-15**: A parent's view MUST list all of their (non-restricted) children's upcoming games
  *(V2, CR-6)* and games that started earlier the same day (tagged "Started", REQ-20), with
  current official status, FINAL/UNCONFIRMED labels and any unconfirmed alerts. *Goals*: G-39.
  *Evidence*: YH:M65, LN:M9, YG:M42.
- **REQ-16**: Initial alerts (in-app and email) MUST be dispatched within 1 minute of publishing.
  *Goals*: G-80. *Evidence*: YG:R47.
- **REQ-17**: Only final game-change notices MAY be treated as urgent (heads-ups never trigger
  urgent escalation). A parent MUST receive one notice per change per channel, even if several of
  their children are on the affected team(s), and that notice names each affected child. A final
  notice MUST replace the heads-up in the parent's view instead of adding a second current alert.
  *Goals*: G-82, G-83, G-85. *Evidence*: YG:M77, YG:M84, YG:M116.
- **REQ-18** *(Assumption — no direct interview evidence; derived from Constitution Principle VII)*:
  Shared views (coach status view, rosters, delivery log, broadcast notices) MUST show children by
  first name and last initial only and MUST NOT show home addresses. *Goals*: G-23 (supports).
- **REQ-19** *(Assumption — demo support, no stakeholder evidence)*: The prototype MUST let the
  presenter switch between administrator, coach and parent personas, and advance simulated time so
  that the 5-minute escalation can be shown. Role permissions (REQ-02, REQ-05) MUST still be
  enforced for the active persona. *Goals*: none (enables evaluation of REQ-02, REQ-10).
- **REQ-20** *(new in V2, CR-6; assumption from V1 evaluation)*: Once a game's current kickoff time
  has passed, every view that lists the game MUST tag it "Started", and its publish and heads-up
  controls MUST NOT be offered. A parent's view MUST keep showing a started game, tagged "Started",
  until the end of that day. Unconfirmed FINAL alerts for a started game MUST move out of "Needs
  your confirmation" and MUST NOT trigger further texts or calls. *Goals*: G-11, G-02, G-39, G-85.
  *Evidence*: none — assumption from V1 evaluation (OBS-8; OQ-7).

### Key Entities

- **Team**: a league team (e.g., U10 Blue). Has a coach and a roster of children.
- **Child**: a player on a team. Shown in shared views by first name and last initial.
- **Parent (Guardian)**: a contact linked to one or more children, with optional email and phone.
- **Family**: the group of parents linked to the same children; the unit counted in
  "X of Y confirmed receipt". *(V2)* A family is confirmed once all of its affected children are
  confirmed (per-child rule, REQ-10).
- **Court-Order Restriction**: a flag that a specific parent must not receive information about a
  specific child.
- **Game**: a scheduled match with date, time, field and one or two league teams. Has a current
  official status (as scheduled, cancelled, moved: field, time or both *(V2)*). *(V2)* Tagged
  "Started" once its current kickoff has passed (REQ-20).
- **Verification Record**: source (city or parks department) and time of confirmation, attached to
  a published change.
- **Change Notice (FINAL)**: an official change to a game: type, old and new details, instruction
  for families, author, publish time, verification record; may be superseded by a later notice.
- **Heads-up (UNCONFIRMED)**: a coach's message about a possible change; never official; may be
  superseded.
- **Delivery Record**: one simulated delivery of a notice or heads-up to one recipient on one
  channel (in-app, email, text, call), with status (sent, delivered, failed *(V2)*) and timestamp.
- **Receipt Confirmation**: a recipient's confirmation that they received a specific notice, with
  time.
- **Activity Log Entry**: an uneditable record of a publish, heads-up or notice with author, time
  and content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a walkthrough, the administrator publishes a verified change for a game in under
  2 minutes from opening the game.
- **SC-002**: Across all seeded test scenarios, 100% of eligible recipients of the affected teams
  receive the notice, and 0 unaffected-team members and 0 court-order-restricted parents receive it
  or are named in it.
- **SC-003**: Shown a parent's view, a test user correctly says whether each game's status is FINAL
  or UNCONFIRMED, what changed and what to do, within 15 seconds per game.
- **SC-004**: A coach identifies every family that has not confirmed receipt in under 30 seconds of
  opening the status view.
- **SC-005**: 100% of initial alerts are timestamped within 1 minute of publish; 100% of urgent
  changes show a text entry for every recipient parent at publish time and a call entry for every
  recipient parent still unconfirmed 2 minutes later.
- **SC-006**: 0 duplicate notices per parent per change per channel in all test scenarios.
- **SC-007**: No acknowledgment text anywhere in the prototype claims a notice was "read" or "seen".

## Assumptions

- Teams, rosters, families, contact details and court-order flags are mock data and assumed correct
  (team-list maintenance, G-18, is out of scope).
- Email, text and phone calls are simulated and recorded in a visible delivery log; nothing is
  really sent.
- **Simulated delivery (V2, CR-7)**: When a message is dispatched on a channel, it is recorded as
  **sent**. One simulated minute later, a delivery report is recorded: **delivered**, or **failed**
  with a reason. A channel with no contact on file is recorded as **failed** at once. The delivery
  log is append-only (REQ-06), so a report is a new record; status views show the latest record per
  channel. REQ-16 still holds, because dispatch ("sent") happens at publish time.
- There is no real authentication; presenters switch personas (REQ-19), and role permissions are
  enforced for the active persona.
- "Urgent" means the original or new kickoff is within 2 hours of publishing; the escalation delay
  is 5 minutes. Both are fixed in V1 and are the team's interpretation of Mike's "urgent" and
  "quickly" (OQ-1, resolved).
- *(V2, CR-8)* Receipt confirmation is counted **per child** (Clarifications 2026-11-17): a child is
  confirmed once a parent notified about that child confirms; a parent's escalation stops once all
  children named in their notice are confirmed; a family is confirmed once all of its affected
  children are. For a child they are restricted for, a parent never counts toward or appears in
  that child's status. There is no interview evidence on how confirmation and custody interact;
  this is a team assumption (OQ-8).
- Heads-ups are delivered as an in-app alert and email to the families of the sending coach's own
  team (with the same privacy rules), do not require confirmation and never escalate to text or
  call. *(V2, CR-3)* This is an accepted risk against obstacle O-1 (a parent on shift may miss the
  early warning, OBS-4); confirm with Mike (OQ-6).
- Receipt confirmation applies to the current FINAL notice; confirming a superseded notice does not
  count for a newer one.
- The administrator enters the instruction for families; the prototype may pre-fill a suggested
  instruction per change type that she can edit.
- Changes and heads-ups cannot be published for a game whose kickoff has already passed.
  *(V2)* "Started" is the only post-kickoff state; the mock data has no game duration, so there is
  no "Finished" state (REQ-20).
- *(V2, CR-2)* An official cancellation is final (D-7). Option A, a "Reinstated" notice, was
  considered and not chosen because G-13 has no interview evidence; the risk that the city
  reverses a decision (D-1) is accepted (OQ-5).
- *(V2, CR-9)* Coaches receive the in-app alert and email for their team's changes and, like
  parents, the text under REQ-10 (fallback after 5 minutes, or immediately when urgent) until they
  confirm receipt. Phone calls go only to parents (REQ-11). The extra message to coaches is an
  accepted cost against G-85 (OQ-9).

## Conflict Decisions

| ID | Conflict | Decision | Rejected alternative | Resolution in spec |
|----|----------|----------|----------------------|--------------------|
| CF-1 | Speed (G-08) vs. verification (G-04) | Compromise | Coach messages treated as official | Heads-ups allowed but always UNCONFIRMED, never official (REQ-05) |
| CF-2 | Coach edits game directly (G-09) vs. only admin makes it official (G-05) | Prioritize G-05 (authority, liability) | G-09: coach edits the game directly | Only admin publishes (REQ-02); coach speed met by REQ-05 |
| CF-3 | Text with every notice (G-29) vs. avoid duplicate notifications (G-85) | Compromise | G-29: text with every notice | Text as fallback after 5 min, or immediate when urgent (REQ-10, REQ-17). *(V2)* **Urgent case unresolved:** for urgent changes every channel still fires at once, plus a call (OBS-3); kept as is until Mike answers OQ-6. |
| *(V2)* CR-2 | Reinstating a cancelled game (G-13, D-1) vs. an unambiguous "cancelled" for families (G-21) | Cancellation is final (D-7) | Option A: a "Reinstated – the game is ON" notice | REQ-03; G-13 stays tacit and out of scope; revisit if Brenda confirms reinstatement happens (OQ-5) |
| *(V2)* CR-8 | Family-level confirmation (Clarification 2026-11-16) vs. court-order restriction (REQ-08, D-4) | Confirmation counted per child | A restricted parent's confirmation never counts (ignores a valid confirmation for an unrestricted child) | REQ-10, REQ-13 (OQ-8) |
| CF-4…CF-8 | Belong to deferred areas (rides, liability, other privacy, records) | Unresolved | — | Remain open in `docs/goal-model.md`; not addressed by this feature |

## Out of Scope

Deferred in `docs/goal-model.md` and not built, even partially (Constitution Principle V):

- Ride coordination and pickup confirmation (G-40…G-57)
- League-liability rules for rides (G-58…G-61)
- Other privacy features such as background checks and message visibility (G-62…G-70)
- Attendance and playing-time records (G-71…G-76)
- Master-schedule upkeep, including team-list maintenance (G-15…G-20)
- Phone relay for families without smartphones (G-32)
- Withdrawing a published change (G-13, tacit); *(V2)* a cancellation is final instead (D-7)
- *(V2)* Informational follow-up messages from coaches after a decision (OQ-4)

## Open Questions

Recorded per Constitution Principle III. OQ-1…OQ-3 were resolved by team decision on 2026-11-16;
the decisions are interpretations and should be checked with stakeholders during evaluation.
*(V2)* OQ-4…OQ-9 come from the V1 evaluation; V2 implements the team's interim decision for each.

- **OQ-1** *(resolved 2026-11-16)*: Is 5 minutes the right escalation delay, and is "within
  2 hours" the right urgency threshold? *Decision*: 5 minutes and 2 hours, fixed in V1.
  *Rejected alternatives*: longer delay/window (10 min / 3–4 h); administrator-configurable values
  (adds a settings feature no stakeholder asked for). Validate with Mike during evaluation.
- **OQ-2** *(resolved 2026-11-16)*: For urgent changes, should the phone call go out immediately,
  or only if the text is not confirmed? *Decision*: call only if receipt is not confirmed within
  2 minutes. *Rejected alternative*: immediate call with the text (more duplicate contact, G-85).
- **OQ-3** *(resolved 2026-11-16)*: Should a heads-up reach the whole affected team, or only
  families the coach chooses? *Decision*: every eligible family of the coach's own team, same
  privacy rules (REQ-05, REQ-08). *Rejected alternatives*: coach-selected families (a second
  recipient path where privacy could slip); including the opposing team (a coach would message
  families they do not coach).
- **OQ-4** *(V2, open)*: After a decision, does Ray need to send *informational* follow-ups (e.g.
  "Field 7 is muddy, bring boots")? If so, that is a new goal (an informational message, not a
  heads-up) and needs its own requirement. **Not built in V2.** (OBS-1)
- **OQ-5** *(V2, open)*: Brenda — does a cancelled game ever get reinstated in practice, and who
  decides? *Interim decision*: a cancellation is final (D-7, REQ-03). If yes, a later version adds a
  "Reinstated" notice. (OBS-2)
- **OQ-6** *(V2, open)*: Mike — during a shift, which single channel do you trust for urgent
  changes? Is a call needed if you already got the text? Should heads-ups ever escalate?
  *Interim decision*: unchanged from V1 (CF-3 urgent case and O-1 kept as documented trade-offs).
  (OBS-3, OBS-4)
- **OQ-7** *(V2, open)*: Brenda / Ray — after kickoff, does anyone need to see the game's change
  history in the app, or is it no longer relevant? *Interim decision*: REQ-20. (OBS-8)
- **OQ-8** *(V2, open)*: Brenda — when a parent has a court-order restriction, do they usually live
  in a separate household, and should the coach treat them as a separate contact for "call before
  departure"? *Interim decision*: per-child confirmation (REQ-10, REQ-13). (OBS-10)
- **OQ-9** *(V2, open)*: Ray — for your own team's changes, do you want the text as well, or are the
  in-app alert and email enough? *Interim decision*: coaches are texted (REQ-10). (OBS-11)
