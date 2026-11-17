# Game Change Notice — Youth Soccer League Prototype

17-626 Requirements for Information Systems, HW4 (team project).

When a youth soccer game is **cancelled or moved**, the league administrator verifies the change
and publishes **one official status**. The **right families, and only them**, are notified, and
coaches can see **who has confirmed receipt**.

This is a requirements-validation prototype built with Spec Kit. It uses **mock data only**:
no real messages are sent and no external services are called.

## Stakeholders

| Persona | Role | What they do in the prototype |
|---------|------|-------------------------------|
| **Brenda** | League administrator | Verifies a change with the City or Parks Department and publishes the FINAL status |
| **Ray** | Coach (U10 Blue) | Sends an UNCONFIRMED heads-up and sees which families have not confirmed |
| **Mike** | Parent who works shifts, two children | Sees both children's games in one view and confirms receipt |

## Live demo

The tagged release `v1` is deployed as a static site on Netlify:

| Page | URL |
|------|-----|
| App | <https://youth-league-v1.netlify.app/> |
| Unit tests | <https://youth-league-v1.netlify.app/tests/> (expect `72 / 72 tests passed`) |

This deployment is a fixed snapshot of tag `v1` (commit `0f11290`). It is not connected to the
repository, so later commits on `main` do not change it. To deploy it again, export the tagged
`app/` folder and drag the folder into the site's **Deploys** page on Netlify:

```bash
mkdir -p deploy-v1 && git archive v1:app | tar -x -C deploy-v1
```

## Run locally

Requirements: `python3` (preinstalled on macOS) and a modern browser. There is nothing to install
and no build step.

From the repository root:

```bash
python3 -m http.server 8000 --directory app
```

| Page | URL |
|------|-----|
| App | <http://localhost:8000/> |
| Unit tests | <http://localhost:8000/tests/> (expect `72 / 72 tests passed`) |

Stop the server with `Ctrl+C`. If port 8000 is busy, use another port:

```bash
python3 -m http.server 8001 --directory app
```

In the Claude desktop app, the preview pane can start the same server from
[`.claude/launch.json`](.claude/launch.json) (configuration `game-change-notice`).

## Using the demo

The bar at the top of the page controls the demo:

- **Viewing as**: switch persona: the administrator, a coach, or a parent.
- **Demo clock**: starts at **Sat 08:30** and runs in real time. Use **+1 min** / **+5 min** to
  fast-forward through escalations.
- **Reset demo**: restore the seed data. Press it before each walkthrough.

A two-minute walkthrough:

1. As **Brenda**, open *U10 Blue vs U10 Red*, choose *Moved to another field*, enter *Field 7*,
   set **Verified with** = *Parks Department* and **Confirmed at** = *08:20*, then click
   **Publish FINAL notice**. Without the verification fields, publishing is blocked.
2. Switch to **Mike Moreno**. The FINAL alert is pinned at the top. Click **Confirm receipt**.
3. Switch to **Ray (Coach U10 Blue)** and open the game. You see the per-family status, e.g.
   "1 of 10 confirmed receipt", and who to call.
4. Press **+1 min** twice, then open Brenda's **Delivery log**. The kickoff is within 2 hours, so
   every recipient was texted at once. Parents who still have not confirmed get a simulated call
   after 2 minutes.
5. Switch to **Xavier Bell**. He has a court-order restriction for his only child, so he sees no
   games and no messages.

The full scripted walkthroughs (A–H) and expected results are in
[`specs/001-game-change-notice/quickstart.md`](specs/001-game-change-notice/quickstart.md).

### Seed data highlights (all fictional)

| Fixture | Demonstrates |
|---------|--------------|
| U10 Blue has exactly 10 families | "8 of 10 confirmed receipt" (REQ-13) |
| Family B: Xavier restricted for Bea; Yolanda not | Restricted parent excluded (REQ-08) |
| Family E: Wes restricted for Eli but not for Emma | Notice names only the eligible child (REQ-08) |
| Family D: two children on U10 Blue | One notice naming both (REQ-17) |
| Mike: Max on U10 Blue, Mia on U12 Red | Combined parent view (REQ-15) |
| Family F has no email; Family G has no phone | Failed channels in the delivery log (REQ-13) |
| U10 game today 10:00; U12 game tomorrow; one game at 07:00 | Urgent vs non-urgent escalation; a game that has started cannot be changed |

## What the prototype covers

| User story | Priority | Requirements |
|------------|----------|--------------|
| US1 Administrator publishes a verified change | P1 | REQ-01–04, 06, 16 |
| US2 Affected families are notified and confirm receipt | P1 | REQ-07–09, 12, 17 |
| US3 Coach sees who has not confirmed | P1 | REQ-13, 14, 18 |
| US4 Coach sends an UNCONFIRMED heads-up | P2 | REQ-05 |
| US5 Parent sees all children's games in one view | P2 | REQ-15 |
| US6 Text and call escalation | P3 | REQ-10, 11 |

Key decisions, from the spec's conflict table and clarifications:

- **Heads-ups (CF-1):** allowed, but always labelled UNCONFIRMED. They never change the official
  status, and the FINAL notice supersedes them.
- **Publishing (CF-2):** only the administrator can publish. Coaches cannot edit games.
- **Texts (CF-3):** a text is a fallback after **5 min** without confirmation, or is sent at once
  when kickoff is within **2 h**.
- **Calls:** for urgent changes, a call goes out if there is still no confirmation after 2 min.
- **Family rule:** a family counts as confirmed when any notified parent confirms.

**Out of scope:** rides and pickups, coach records (attendance and playing time), master-schedule
upkeep, background checks, and the phone relay for families without smartphones.

## Repository layout

```text
.
├── app/                         # The prototype (static HTML/CSS/JS, no dependencies)
│   ├── index.html               # Shell: demo bar + view
│   ├── styles.css
│   ├── src/
│   │   ├── main.js              # Boot, persona routing, real-time clock
│   │   ├── data/seed.js         # Mock league fixtures
│   │   ├── domain/              # All rules; DOM-free, unit-tested
│   │   │   ├── store.js clock.js log.js permissions.js recipients.js
│   │   │   └── notices.js delivery.js confirmations.js queries.js
│   │   └── ui/                  # Admin, coach and parent views, demo bar, shared components
│   └── tests/                   # Browser test runner + *.test.js (named by REQ ID)
├── docs/                        # Unified goal model (G-xx, D-x, O-x, CF-x) and diagrams
│   └── goal-model.md
├── specs/001-game-change-notice/
│   ├── spec.md                  # Requirements REQ-01–REQ-19, scenarios, conflicts, open questions
│   ├── plan.md                  # Technical plan + constitution check
│   ├── research.md data-model.md quickstart.md
│   ├── contracts/               # Domain API and UI view contracts
│   ├── checklists/requirements.md
│   └── tasks.md                 # 64 tasks, all done
├── .specify/memory/constitution.md   # Project principles (v1.0.0)
└── .claude/                     # Spec Kit skills and the preview launch config
```

Every source file names the requirement IDs it implements (`// REQ-xx`). Each requirement in
`spec.md` cites its goal IDs in [`docs/goal-model.md`](docs/goal-model.md) and its interview
evidence (e.g. `YH:B63`).

## Project principles

The full text is in [`.specify/memory/constitution.md`](.specify/memory/constitution.md). In short:

- **Spec first:** no behavior that is not in `spec.md`. Gaps found in evaluation are fixed in the
  spec first, then in the plan and tasks, then in code.
- **Traceability:** every requirement has an ID, goal links and interview evidence (or is marked
  as an assumption).
- **Testable requirements:** every requirement has a Given/When/Then scenario a person can check
  in the prototype.
- **Scope discipline:** only the sprint requirements are built.
- **Mock, never real:** all messages are simulated and shown in a visible delivery log.
- **Privacy by default:** restricted parents never receive or appear in anything about the
  restricted child. Children are shown as first name + last initial, and no addresses are stored.
- **Simplicity:** a single front-end app with in-memory state and no backend.

## Common commands

Run the app:

```bash
python3 -m http.server 8000 --directory app
```

Run the unit tests: start the server, then open <http://localhost:8000/tests/>.

Check that every requirement is referenced in the code:

```bash
for i in $(seq -w 1 19); do printf "REQ-%s:%s " $i $(grep -rl "REQ-$i" app/src | wc -l | tr -d ' '); done; echo
```

Check that there are no network calls or out-of-scope features (expect no output):

```bash
grep -rnE "fetch\(|XMLHttpRequest|https?://|carpool|\bride\b|attendance|playing.?time" app/src
```

Tag a version, as the constitution asks for each version (V1, V2):

```bash
git tag v1
```

Regenerate the goal-model diagrams: see "Regenerate the diagrams" in
[`docs/goal-model.md`](docs/goal-model.md). That needs the course `goalmodeling` package and Mermaid CLI.

### Spec Kit workflow (in Claude Code)

The artifacts in `specs/` were produced with these commands, in order:

| Command | Produces |
|---------|----------|
| `/speckit-constitution` | `.specify/memory/constitution.md` |
| `/speckit-specify` | `spec.md`, `checklists/requirements.md` |
| `/speckit-clarify` | Clarifications section in `spec.md` |
| `/speckit-plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| `/speckit-tasks` | `tasks.md` |
| `/speckit-implement` | Code in `app/` |

For a V2 iteration, revise `spec.md` first (for example with `/speckit-specify` or
`/speckit-clarify`), then re-run `/speckit-plan`, `/speckit-tasks` and `/speckit-implement`.

## Troubleshooting

- **Changes don't show up after editing code.** The simple Python server lets the browser cache
  old JavaScript modules. Do a hard reload (`Cmd+Shift+R`) or disable the cache in DevTools.
- **"Address already in use".** Another server is on port 8000. Stop it, or use `8001` as shown above.
- **The page looks empty or broken when opened as a file.** ES modules do not load from
  `file://`. Always go through the local server.

## Status (V1)

- All 64 tasks are done. 72/72 unit tests pass, and walkthroughs A–H pass (see "Last validated"
  in `quickstart.md`).
- **Not yet validated:** SC-001, SC-003 and SC-004 need timed sessions with real test users.
- **Known spec gap for V2:** an example in spec User Story 1 places the U12 game on Saturday, while
  the seed data has it on Sunday.
