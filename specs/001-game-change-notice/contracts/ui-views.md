# Contract: UI Views

What each persona can see and do. Controls not listed for a persona do not exist in that
persona's view. Every action calls the [domain API](domain-api.md). **(V2)** marks changes.

## Always visible: demo bar (REQ-19)

- Persona selector: Brenda (Administrator), each team's coach, each seeded parent.
- Demo clock (e.g. "Sat 08:30") with **+1 min**, **+5 min** and **Reset demo** (unchanged in V2).
- Banner: "Demo prototype — mock data, no real messages are sent."

## Administrator (Brenda)

| Area | Content | Actions | REQ |
|------|---------|---------|-----|
| Games list | All games: teams, kickoff, field, official status label; *(V2)* "Started" tag once kickoff has passed | Open game | 03, 04, 20 |
| Publish change form | *(V2)* Change type **Cancelled / Moved**; for Moved: new field **and** new kickoff, both pre-filled with current values, change either or both; instruction (pre-filled per type, editable); verification source (City / Parks Department); verification time | **Publish FINAL notice** (shows rejection reasons inline) | 01, 02, 03 |
| *(V2)* Publish form replaced by a note | Cancelled game: "This game is cancelled. A cancellation is final." Started game: "This game has already started." | — | 03, 20 |
| Game detail | FINAL status text, old → new, instruction, author, time, verification; heads-ups with UNCONFIRMED or Superseded label; *(V2)* "Started" tag | — | 03, 04, 05, 20 |
| Notice status | Per-recipient rows with channel statuses *(V2: sent → delivered, or failed with reason)* and receipt; not-confirmed families *(V2: per child, naming only parents notified about the unconfirmed children)*; "N of M confirmed receipt" | — | 13, 14, 08 |
| Delivery log | All DeliveryRecords: time, recipient, channel, status, trigger, content; *(V2)* report records shown as "delivery report" | — (read-only) | 06, 09–11, 13, 16 |
| Activity log | Publishes, heads-ups, rejected attempts (with error) | — (read-only) | 06 |

## Coach

| Area | Content | Actions | REQ |
|------|---------|---------|-----|
| Team games | Own team's games with official status; *(V2)* "Started" tag | Open game | 03, 20 |
| Game detail | As admin view, but no publish form | — | 02 |
| Heads-up form | Message field; note "Goes to all families of <team>. Labelled UNCONFIRMED." *(V2)* Shown only while the game has no FINAL notice and has not started; otherwise a note "An official decision has already been published." / "This game has already started." | **Send UNCONFIRMED heads-up** | 05, 20 |
| Notice status | Own team's families only, same columns as admin | — | 13, 14 |
| Alerts | Own notices with **Confirm receipt** (*(V2)* not offered once the game has started) | Confirm receipt | 12, 20 |

## Parent

| Area | Content | Actions | REQ |
|------|---------|---------|-----|
| Needs your confirmation (top, prominent) | Each current FINAL notice not yet confirmed *(V2: per-child rule)* for a game that has not started: change, old → new, effect time, instruction, children named | **Confirm receipt** | 12, 17, 10 |
| Possible changes — not official yet | Active coach heads-ups (UNCONFIRMED style, no confirm button); shown only while one exists | — | 05 |
| My children's games | *(V2)* Games of eligible children today (including started ones, tagged "Started") and later: status label FINAL / UNCONFIRMED / As scheduled, details | — | 15, 20 |
| Earlier messages | Superseded notices and heads-ups, labelled Superseded; *(V2)* unconfirmed alerts of started games, labelled "Game started – no confirmation needed" | — | 04, 05, 20 |

Restricted children never appear in a restricted parent's view (REQ-08).

## Visual distinctions (REQ-05, REQ-20)

- FINAL: solid dark-green badge, bold text "FINAL".
- UNCONFIRMED: dashed amber outline, striped background, text "UNCONFIRMED – not official yet".
- Superseded: greyed, struck-through badge, "Superseded by FINAL notice".
- *(V2)* Started: neutral grey pill with the text "Started", shown next to (not instead of) the
  official status label.
- Labels use text as well as color, so they are distinguishable without color.
