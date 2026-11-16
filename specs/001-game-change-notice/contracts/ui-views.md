# Contract: UI Views

What each persona can see and do. Controls not listed for a persona do not exist in that
persona's view. Every action calls the [domain API](domain-api.md).

## Always visible: demo bar (REQ-19)

- Persona selector: Brenda (Administrator), each team's coach, each seeded parent.
- Demo clock (e.g. "Sat 08:30") with **+1 min**, **+5 min** and **Reset demo**.
- Banner: "Demo prototype — mock data, no real messages are sent."

## Administrator (Brenda)

| Area | Content | Actions | REQ |
|------|---------|---------|-----|
| Games list | All games: teams, kickoff, field, official status label | Open game | 03, 04 |
| Publish change form | Change type (Cancelled / Field / Time); new field or time; instruction (pre-filled, editable); verification source (City / Parks Department); verification time | **Publish FINAL notice** (shows rejection reasons inline) | 01, 02, 03 |
| Game detail | FINAL status text, old → new, instruction, author, time, verification; heads-ups with UNCONFIRMED or Superseded label | — | 03, 04, 05 |
| Notice status | Per-recipient rows with channel statuses and confirmation; not-confirmed families; "N of M confirmed receipt" | — | 13, 14 |
| Delivery log | All DeliveryRecords: time, recipient, channel, status, trigger, content | — (read-only) | 06, 09–11, 16 |
| Activity log | Publishes, heads-ups, rejected attempts | — (read-only) | 06 |

## Coach

| Area | Content | Actions | REQ |
|------|---------|---------|-----|
| Team games | Own team's games with official status | Open game | 03 |
| Game detail | As admin view, but no publish form | — | 02 |
| Heads-up form | Message field; note "Goes to all families of <team>. Labelled UNCONFIRMED." | **Send UNCONFIRMED heads-up** | 05 |
| Notice status | Own team's families only, same columns as admin | — | 13, 14 |
| Alerts | Own notices with **Confirm receipt** | Confirm receipt | 12 |

## Parent

| Area | Content | Actions | REQ |
|------|---------|---------|-----|
| Unconfirmed alerts (top, prominent) | Each current FINAL notice not yet confirmed: change, old → new, effect time, instruction, children named | **Confirm receipt** | 12, 17 |
| Possible changes — not official yet | Active coach heads-ups (UNCONFIRMED style, no confirm button); shown only while one exists | — | 05 |
| My children's games | All upcoming games of eligible children: status label FINAL / UNCONFIRMED / As scheduled, details | — | 15 |
| Earlier messages | Superseded notices and heads-ups, labelled Superseded | — | 04, 05 |

Restricted children never appear in a restricted parent's view (REQ-08).

## Visual distinctions (REQ-05)

- FINAL: solid dark-green badge, bold text "FINAL".
- UNCONFIRMED: dashed amber outline, striped background, text "UNCONFIRMED – not official yet".
- Superseded: greyed, struck-through badge, "Superseded by FINAL notice".
- Labels use text as well as color, so they are distinguishable without color.
