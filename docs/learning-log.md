NOTE: To prevent any confusion, here are the names used as examples in this report and clarification of who they are in our project.
- Brenda (stakeholder): President
- Ray (stakeholder): Coach of U10 Blue
- Mike (stakeholder): Parent who works busy shifts, with 2 children
- Wes (mock parent): Emma and Eli's parent in Family E, with a court-order restriction for Eli
- Erin (mock parent): Emma and Eli's parent in Family E, who receives notices about both children
- Emma (mock child): Child in Family E whose notices go to both Wes and Erin
- Eli (mock child): Child in Family E whose notices go to Erin

## 1. Sprint Planning and Requirements Selection

### Requirements:

1. Brenda verifies a game change before publishing it as FINAL. Ray can send an UNCONFIRMED heads-up to his team while a change is pending (REQ-01 through REQ-06).
2. The app notifies affected families and respects court-order restrictions by sending a simulated text or call if a final notice needs follow-up (REQ-07 through REQ-11).
3. Parents can confirm receipt and see their children's games in one place, while Brenda and Ray can check delivery and see which families still need follow-up (REQ-12 through REQ-17).
4. Shared views show only a child's first name and last initial and leave out home addresses for privacy purposes (REQ-18 and REQ-19).

### Goals:

1. Keep the official game status clear and current by having only the administrator publish changes after verifying them (G-02 through G-05).
2. Give families an early warning while a change is pending by letting the coach send a heads-up labelled UNCONFIRMED (G-07, G-08).
3. Make sure affected families get the update, while protecting information about children covered by court orders (G-21, G-22, G-23).
4. Help the coach see who confirmed and who still needs a call, while avoiding duplicate alerts for parents (G-33, G-36, G-37, G-85).
5. Give parents one place to check the current game status for each of their children (G-39).

We prioritized these requirements and goals because the same basic workflow came up in all three interview sets and goal models. For example, one of the common themes was that a family needs to know whether the game is still on before they can decide when to leave or whether they need to rearrange a ride. This workflow also gave each stakeholder something to do in the prototype. It let us try out the parts we were less sure about, like how to show a heads-up alongside an official status and when a missed alert should trigger a text. We left rides for later because they depend on knowing the official status first, and we still had questions about how much responsibility the league should take for arranging them.

### Overlapping, dependent, or conflicting requirements considered:

1. All three models said to notify only the affected teams, so we combined that overlap into G-22. For that to work, we used mock rosters to represent team rosters in the prototype.
2. Ray and Mike wanted families to get an early warning, while Brenda wanted them to act on verified information. We gave Ray a heads-up he could send and left official publishing with Brenda. The heads-up was labelled UNCONFIRMED so families could tell which message was officially checked.
3. Mike wanted to hear about urgent changes during a shift, but he also found duplicate alerts annoying. For a non-urgent change, we used a text as a fallback if the parent had yet to confirm. We still had to work out what would be useful for an urgent change.

The combined goal model helped us see how the requirements fit together across different stakeholders. Yunhan implemented the heads-up and FINAL notices as separate actions when building V1 with Spec Kit. When we saw that Ray could still send a heads-up after Brenda had published, Lynn updated the goal model and spec to clarify when a change stops being pending, then used that rule in V2.

## 2. Prototype Evaluation

### Significant observations from Prototype V1:

- A coach could send a heads-up after a FINAL notice (OBS-1): Mike could see both messages for the same game.
    - This as a requirements issue because the spec said a change had to be pending but left the end of that period undefined.
- One parent's confirmation covered the whole family (OBS-10): Wes's notice named Emma only. When he confirmed, V1 stopped Erin's follow-up call and removed Family E from Ray's list even though nobody had confirmed for Eli.
    - This was a requirements issue because it wasn't specified how two parents from the same family should receive/confirm information.
- The delivery status skipped `sent` (OBS-9): Lynn found that V1 recorded only `delivered` and `failed`.
    - This was an implementation issue because REQ-13 already listed all three statuses, resulting in Brenda and Ray missing information that the spec said they should have.

## 3. Revisions and Learning

### Significant changes between V1 and V2:

1. Count receipt confirmation per child：
   - What we initially intended: We just assumed both parents would receive the same information, one confirmation was supposed to save the other parent from an unnecessary call or text.
   - What we discovered through evaluation: Wes's confirmation was valid for Emma, but it also stopped follow-up for Eli.
   - What we changed and why: The goal was to know whether someone had confirmed receipt for each child affected by a change. We updated the goal model to show how court-order restrictions affect whose confirmation counts. We revised the relevant requirements so a parent's confirmation covers the children named in their notice.
   - How the revised implementation better addresses the requirement or stakeholder goal: The V2 walkthrough shows Erin still getting a simulated call after Wes confirms, then Ray's list identifies Erin as the person to follow up with for Eli.

2. End heads-ups when a FINAL notice is published:
   - What we initially intended: We had just expected the UNCONFIRMED label and the replacement of old heads-ups by the FINAL notice to make it clear which message families should act on.
   - What we discovered through evaluation: The old heads-up was replaced, but Ray could still send a new one after the official decision.
   - What we changed and why: The goal was to warn families early while a change was still pending. We updated the goal model and clarified the heads-up requirement so that publishing a FINAL notice ends the pending period.
   - How the revised implementation better addresses the requirement or stakeholder goal: The app removes the heads-up functionality after a FINAL notice and rejects the action if it is attempted, since there's no need for a heads-up anymore.

3. Add the missing delivery status:
   - What we initially intended: We thought that each stage and status of delivery is shown properly to Brenda and Ray.
   - What we discovered through evaluation: V1 skipped the `sent` status even though REQ-13 required it.
   - What we changed and why: We corrected the code to show the required status.
   - How the revised implementation better addresses the requirement or stakeholder goal: Brenda and Ray can see when a notice has been sent and when its delivery report comes in, and any missing information like phone number or email address shows as failed immediately.

## Reflection

### Which decisions required your judgment rather than relying solely on AI:

Picking the requirements and goals initially, deciding what to include V1, and then figuring out what to change after playing around with it all needed our judgment. For example, drawing upon Family E again, we could have made it so Wes's confirmation never counted, but he had actually received a notice about Emma. Keeping that confirmation and still following up for Eli made more sense in terms of communiction between humans. We also had to decide which examples to include in this report so someone could see how our reasoning changed.

### How did prototyping change your understanding of stakeholder needs:

Prototyping made the descriptions in our goal models and spec more concrete. It also made iterating more fun because we had something we could actually play around with. In Family E, switching between Wes, Erin, and Ray showed that a single click changed what all three people saw and who would get a call.

### How did spec-driven development help maintain consistency between the requirements and implementation?:

The specification acted like the ground truth when deciding what made sense to implement. When Lynn found the missing `sent` status, we could point to the exact rule the code missed. For Family E, we had to change the rule itself. Updating the model and spec before implementing V2 gave us a specific scenario to put in the plan, tasks, and implement cycle during development.

### What evidence from your work would you present to management to demonstrate the value you contributed beyond AI-generated specifications and code?:

Our team would start with the Family E issue. We would show Ray's follow-up list in V1 and V2 after Wes confirms the same notice. We would explain why we chose to count confirmation per child. We would also show the sprint scope in the goal model as it records why we focused on getting the official game status to families and deferred ride coordination. It also shows where we still needed stakeholder input, such as which alert channel Mike would rely on during a shift. We would use those examples to explain how we decided what was worth building and what still needed a conversation with the stakeholders.