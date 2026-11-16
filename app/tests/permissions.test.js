// REQ-02, REQ-05, REQ-06, REQ-13: can() per action and role.

import { test, assertTrue, assertEqual } from './harness.js';
import { can } from '../src/domain/permissions.js';
import { freshStore, ADMIN, RAY, U12_RED_COACH, MIKE, publishField7 } from './fixtures.js';

test('REQ-02 administrator can publish an upcoming game', () => {
  assertTrue(can(freshStore(), ADMIN, 'publish', 'g-u10'));
});

test('REQ-02 Ray (coach) cannot publish', () => {
  assertEqual(can(freshStore(), RAY, 'publish', 'g-u10'), false);
});

test('REQ-02 parent cannot publish', () => {
  assertEqual(can(freshStore(), MIKE, 'publish', 'g-u10'), false);
});

test('Edge case: nobody can publish for a game whose kickoff has passed (g-past)', () => {
  assertEqual(can(freshStore(), ADMIN, 'publish', 'g-past'), false);
});

test('REQ-05 Ray can send a heads-up for his own team game', () => {
  assertTrue(can(freshStore(), RAY, 'heads-up', 'g-u10'));
});

test('REQ-05 U10 Blue coach cannot heads-up a U12 game', () => {
  assertEqual(can(freshStore(), RAY, 'heads-up', 'g-u12'), false);
});

test('REQ-05 administrator and parents cannot send a heads-up', () => {
  const s = freshStore();
  assertEqual(can(s, ADMIN, 'heads-up', 'g-u10'), false);
  assertEqual(can(s, MIKE, 'heads-up', 'g-u10'), false);
});

test('REQ-13 view-status: admin and the coaches of the game; not other coaches or parents', () => {
  const s = freshStore();
  const n = publishField7(s);
  assertTrue(can(s, ADMIN, 'view-status', n.id));
  assertTrue(can(s, RAY, 'view-status', n.id));
  assertEqual(can(s, U12_RED_COACH, 'view-status', n.id), false);
  assertEqual(can(s, MIKE, 'view-status', n.id), false);
});

test('REQ-06 only the administrator can view the activity log', () => {
  const s = freshStore();
  assertTrue(can(s, ADMIN, 'view-activity-log'));
  assertEqual(can(s, RAY, 'view-activity-log'), false);
});

// ---- REQ-19 demo support: simulated clock and reset ----

import { advanceClock } from '../src/domain/clock.js';
import { resetDemo } from '../src/domain/store.js';
import { at } from './fixtures.js';

test('REQ-19 demo clock starts at Sat 08:30, advances by minutes, and Reset demo restores the seed', () => {
  const s = freshStore();
  assertEqual(s.state.now, at('2026-11-21T08:30'));
  advanceClock(s, 5);
  assertEqual(s.state.now, at('2026-11-21T08:35'));
  publishField7(s);
  resetDemo(s);
  assertEqual(s.state.now, at('2026-11-21T08:30'));
  assertEqual(Object.keys(s.state.notices).length, 0);
  assertEqual(s.state.deliveries.length, 0);
  assertEqual(s.state.games['g-u10'].currentNoticeId, null);
});

test('REQ-19 permissions follow the active persona: a parent persona is rejected by the domain, not just hidden', () => {
  const s = freshStore();
  assertEqual(can(s, MIKE, 'publish', 'g-u10'), false);
  assertEqual(can(s, ADMIN, 'publish', 'g-u10'), true);
});
