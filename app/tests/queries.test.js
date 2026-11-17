// US5 parent combined view: REQ-15 (all children's games in one view), REQ-08 (restricted
// children never listed), REQ-05 (UNCONFIRMED label when only a heads-up exists).

import { test, assertEqual, assertTrue, assertDeepEqual } from './harness.js';
import { parentGames } from '../src/domain/queries.js';
import { publishChange, sendHeadsUp } from '../src/domain/notices.js';
import { freshStore, publishField7, verifiedInput, at, ADMIN, RAY, MIKE, X, W } from './fixtures.js';

test('REQ-15 / REQ-20 (CR-6) Mike sees today’s started 07:00 game (Mia), g-u10 (Max) and g-u12 (Mia), "As scheduled" before changes', () => {
  const s = freshStore();
  const games = parentGames(s, MIKE);
  assertDeepEqual(games.map((g) => g.gameId), ['g-past', 'g-u10', 'g-u12']);
  assertDeepEqual(games.map((g) => g.children), [['Mia M.'], ['Max M.'], ['Mia M.']]);
  assertDeepEqual(games.map((g) => g.started), [true, false, false]);
  assertTrue(games.every((g) => g.labelKind === 'scheduled' && g.status.label === 'As scheduled'));
});

test('REQ-15 after both games change, both show FINAL with their own labels', () => {
  const s = freshStore();
  publishField7(s);
  const res = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u12', changeType: 'moved', newField: undefined, newKickoff: at('2026-11-22T13:00'),
    instruction: 'Arrive for the new kickoff at Sun 13:00.',
  }));
  assertTrue(res.ok, res.error);
  const games = parentGames(s, MIKE).filter((g) => g.gameId !== 'g-past');
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

// ---- V2: REQ-20, REQ-15, REQ-12, REQ-10 started games (CR-6, OBS-8) ----

import { advanceClock } from '../src/domain/clock.js';
import { alertsFor } from '../src/domain/queries.js';
import { gameStatus } from '../src/domain/notices.js';

// Move the U10 game to 08:40 (urgent), as in quickstart walkthrough L.
function moveU10To0840(s) {
  const res = publishChange(s, ADMIN, verifiedInput({ newField: undefined, newKickoff: at('2026-11-21T08:40'), instruction: 'Arrive for 08:40.' }));
  if (!res.ok) throw new Error(res.error);
  return s.state.notices[res.noticeId];
}

test('REQ-20 / REQ-15 (CR-6, US5 #4) after kickoff Mike still sees the game, tagged started; its alert no longer needs confirmation', () => {
  const s = freshStore();
  const n = moveU10To0840(s);
  assertEqual(alertsFor(s, MIKE).find((a) => a.id === n.id).unconfirmed, true, 'before kickoff');
  advanceClock(s, 10); // 08:40
  assertEqual(gameStatus(s, 'g-u10').started, true);
  const g = parentGames(s, MIKE).find((x) => x.gameId === 'g-u10');
  assertTrue(!!g, 'still listed');
  assertEqual(g.started, true);
  assertEqual(g.unconfirmedAlerts.length, 0);
  const alert = alertsFor(s, MIKE).find((a) => a.id === n.id);
  assertEqual(alert.started, true);
  assertEqual(alert.unconfirmed, false);
  assertEqual(alert.confirmed, false, 'not claimed as confirmed');
});

test('REQ-10 / REQ-11 / REQ-20 (CR-6) calls due before kickoff are sent; nothing is sent at or after kickoff', () => {
  const s = freshStore();
  const n = moveU10To0840(s); // calls due 08:32 < 08:40
  advanceClock(s, 60);
  const calls = s.state.deliveries.filter((d) => d.messageId === n.id && d.channel === 'call' && d.trigger !== 'delivery-report');
  assertTrue(calls.length > 0 && calls.every((d) => d.at === at('2026-11-21T08:32')), 'calls at 08:32 only');

  const s2 = freshStore();
  const res = publishChange(s2, ADMIN, verifiedInput({ newField: undefined, newKickoff: at('2026-11-21T08:31'), instruction: 'Arrive for 08:31.' }));
  assertTrue(res.ok, res.error);
  advanceClock(s2, 30); // calls would be due 08:32, after the 08:31 kickoff
  assertEqual(s2.state.deliveries.filter((d) => d.messageId === res.noticeId && d.channel === 'call').length, 0, 'no call after kickoff');
  assertTrue(s2.state.escalations.filter((e) => e.noticeId === res.noticeId).every((e) => e.state === 'cancelled'));
});

test('REQ-20 (CR-6) a started game is listed only until the end of that day', () => {
  const s = freshStore();
  s.state.now = at('2026-11-22T08:00'); // next morning
  const ids = parentGames(s, MIKE).map((g) => g.gameId);
  assertTrue(!ids.includes('g-past') && !ids.includes('g-u10'), 'yesterday’s games are gone');
  assertTrue(ids.includes('g-u12'));
});
