// US5 parent combined view: REQ-15 (all children's games in one view), REQ-08 (restricted
// children never listed), REQ-05 (UNCONFIRMED label when only a heads-up exists).

import { test, assertEqual, assertTrue, assertDeepEqual } from './harness.js';
import { parentGames } from '../src/domain/queries.js';
import { publishChange, sendHeadsUp } from '../src/domain/notices.js';
import { freshStore, publishField7, verifiedInput, at, ADMIN, RAY, MIKE, X, W } from './fixtures.js';

test('REQ-15 Mike sees g-u10 (Max) and g-u12 (Mia), not the past game, "As scheduled" before changes', () => {
  const s = freshStore();
  const games = parentGames(s, MIKE);
  assertDeepEqual(games.map((g) => g.gameId), ['g-u10', 'g-u12']);
  assertDeepEqual(games.map((g) => g.children), [['Max M.'], ['Mia M.']]);
  assertTrue(games.every((g) => g.labelKind === 'scheduled' && g.status.label === 'As scheduled'));
});

test('REQ-15 after both games change, both show FINAL with their own labels', () => {
  const s = freshStore();
  publishField7(s);
  const res = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u12', changeType: 'time', newField: undefined, newKickoff: at('2026-11-22T13:00'),
    instruction: 'Arrive for the new kickoff at Sun 13:00.',
  }));
  assertTrue(res.ok, res.error);
  const games = parentGames(s, MIKE);
  assertDeepEqual(games.map((g) => g.labelKind), ['final', 'final']);
  assertEqual(games[0].status.label, 'FINAL – Moved: Field 3 → Field 7');
  assertEqual(games[1].status.label, 'FINAL – Time changed: Sun 10:00 → Sun 13:00');
  assertEqual(games[0].unconfirmedAlerts.length + games[1].unconfirmedAlerts.length, 2);
});

test('REQ-15 / REQ-05 a game with only an active heads-up is labelled unconfirmed', () => {
  const s = freshStore();
  sendHeadsUp(s, RAY, { gameId: 'g-u10', message: 'Field 3 may close due to rain' });
  const g = parentGames(s, MIKE).find((x) => x.gameId === 'g-u10');
  assertEqual(g.labelKind, 'unconfirmed');
  assertEqual(g.status.label, 'As scheduled', 'official status unchanged');
  assertEqual(g.headsUps.length, 1);
});

test('REQ-08 X (restricted for Bea, his only child) has no games', () => {
  assertEqual(parentGames(freshStore(), X).length, 0);
});

test('REQ-08 W lists g-u10 for Emma only', () => {
  const g = parentGames(freshStore(), W);
  assertEqual(g.length, 1);
  assertDeepEqual(g[0].children, ['Emma E.']);
});
