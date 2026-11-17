# Prototype V1 Evaluation — Member 3

**Evaluator:** Member 3. The probes were run with a Claude-assisted browser (Playwright, Chromium) against tag `v1`; the findings have been reviewed by Member 3.
**Version evaluated:** tag `v1`. Run it with `python3 -m http.server 8000 --directory app` and open <http://localhost:8000/>.
**Team summary:** [`../team-summary.md`](../team-summary.md). The OBS IDs below are team IDs.

> Write this evaluation from your own use of the prototype. Put screenshots in [`screenshots/`](screenshots/). Number your observations with team IDs (OBS-n): take the next free number in the team summary and add your row there as `OBS-n (M3)`. Gaps in the numbering are fine.

## How I evaluated

- Walkthrough steps followed (see `specs/001-game-change-notice/quickstart.md`): Member 1 already ran A1–H1 in full, so I did not repeat the whole script. I used A3 (publish a verified field move), C1–C2 (urgent escalation: text at once, call after 2 min) and D1 (non-urgent: text after 5 min) as the setup for the probes below. All three behaved as the quickstart describes.
- Extra situations I tried (things a stakeholder might plausibly do that the spec may not cover):
  - In a family where one parent has a court-order restriction for one of two children (Family E: Wes is restricted for Eli but not for Emma), only the restricted parent confirms receipt of an urgent change (OBS-10).
  - Who gets the fallback text: after a non-urgent change, advance the clock 5 minutes and check whether coaches are texted like parents (OBS-11).
- I checked each finding against `specs/001-game-change-notice/spec.md` and the code in `app/src/domain/` to decide between "implementation defect" and "requirements issue".

## Observations

### OBS-10 — A restricted parent's confirmation marks the whole family as confirmed, so the custodial parent is never escalated

- **What I did:** As Brenda, published "FINAL – Moved: Field 3 → Field 7" for U10 Blue vs U10 Red (kickoff 10:00, so the change is urgent). Switched to **Wes Evans** (restricted for Eli, not for Emma). His notice names only Emma E. He clicked **Confirm receipt**. Advanced the clock 2 minutes, then looked at **Erin Evans** (Eli's and Emma's unrestricted parent) and at Ray's notice status.
- **What I saw:**
  - Erin never confirmed anything, yet her view shows "Needs your confirmation (0)" and her alert is labelled **Receipt confirmed**. (screenshot: `screenshots/OBS-10_erin_shown_confirmed.png`)
  - After 2 minutes, every unconfirmed parent got a simulated call, but Erin did not (Call = "—").
  - Ray's status view reads "1 of 10 confirmed receipt" and shows **both** Family E rows, including "Erin Evans — Eli E., Emma E.", as **Confirmed**. Family E is not on the "call before departure" list. (screenshot: `screenshots/OBS-10_ray_family_E_confirmed_no_call.png`)
  - So the only person who confirmed is the one who, by court order, was *not* told about Eli. Nobody responsible for Eli has confirmed, but the system reports Eli's family as done and stops escalating.
- **Classification:** requirements issue. The code does exactly what the spec says: the Clarification of 2026-11-16 and REQ-10 say "the family counts as confirmed once any notified parent confirms, and pending escalation stops for the whole family" (`isConfirmedFor()` and `confirmReceipt()` → `cancelEscalations()` in `domain/confirmations.js`). That rule assumes all parents in a "family" are told about the same children and share a household. A court-order restriction (REQ-08, D-4) is exactly the case where that is false, and the spec never considered the two rules together. REQ-08 is not literally broken (Wes is listed only with Emma), but its intent is: Wes's action stands in for Eli's household.
- **Goal(s) affected:** G-33 *ReceiptConfirmed If NoticeSent*, G-36 *AckStatusShownPerRecipient*, G-37 *NonAcknowledgerContacted If NoAckBeforeDeparture* (Ray calls the wrong set of families), G-31 *CallPlaced If ChangeUrgent* and G-30 (escalation suppressed), G-23 / D-4 (court orders on file).
- **What needs to change:** spec change, plus stakeholder clarification.
  - Proposed spec change: confirmation counts **per child**. A child is confirmed when a parent who was notified *about that child* confirms. A family is confirmed only when all of its children on the affected team(s) are. Escalation stops for a parent only when every child named in that parent's notice is confirmed. In Family E: Wes's confirmation covers Emma; Eli stays unconfirmed, so Erin is still called and Family E stays on Ray's list. Update the Clarification, REQ-10, REQ-13 and the "Assumptions" bullet on family confirmation; add an acceptance scenario for Family E.
  - Alternative (simpler): a restricted parent's confirmation never counts for the family. Weaker, because it ignores Wes's legitimate confirmation for Emma.
  - Ask Brenda (YG:B66, YH:B32): does a parent with a court order usually live in a separate household, and should the coach treat them as a separate contact? There is no interview evidence on how confirmation and custody interact, so the per-child rule is an assumption.
- **Same as an existing team observation?** New. Related to OBS-4 (escalation gaps), but a different cause.

### OBS-11 — The spec contradicts itself on whether coaches receive texts; the prototype texts them

- **What I did:** As Brenda, published a non-urgent field move for U12 Red vs U12 Gold (Sunday 10:00 → Field 8). Advanced the clock 5 minutes and opened the delivery log. Also checked the urgent U10 change from OBS-10.
- **What I saw:** Both coaches (Coach Patel, Coach Gomez) received the 5-minute fallback **text** ("No confirmation after 5 min"), exactly like the parents. (screenshot: `screenshots/OBS-11_coach_fallback_texts.png`) In the urgent case, Ray and Coach Rivera were texted at once. A coach only avoids the text by opening the "My alerts" tab and confirming receipt, which the coach view does not point out.
- **Classification:** requirements issue (inconsistent spec). REQ-10 says a text goes to every "recipient" who has not confirmed, and coaches are recipients (REQ-07). But the Assumptions section says "Coaches receive the in-app alert and email for their team's changes; phone calls go only to parents", which suggests coaches get **only** in-app and email. The agent followed REQ-10 (`dispatchFinalNotice()` and `processDueEscalations()` in `domain/delivery.js` treat coaches like parents, except for calls). Both readings are defensible, so this is not an implementation defect.
- **Goal(s) affected:** G-85 *Avoid[DuplicateAndTrivialNotifications]* (a coach on the touchline gets three messages for one change), G-30 *TextSent If NotAckedWithin5Min Or ChangeUrgent* (which agent the goal applies to is unclear).
- **What needs to change:** spec change (pick one reading and write it in both places), plus stakeholder clarification. Ask Ray whether he wants a text for his own team's changes, or whether in-app and email are enough because he is already watching for the change. If coaches should not be texted, the code change is small: skip coach recipients when scheduling texts.
- **Same as an existing team observation?** New. It is related to OBS-3 (urgent changes send every channel at once), which is about parents. OBS-11 is about which *roles* the escalation applies to.

### Also confirmed: OBS-3

During the OBS-10 probe, every U10 parent received in-app, email and text at 08:30 and a call at 08:32 for one change. That matches Member 1's OBS-3.
