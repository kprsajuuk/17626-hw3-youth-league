// US1 publish rules: REQ-01, REQ-02, REQ-03, REQ-04, REQ-06.

import { test, assertEqual, assertTrue } from './harness.js';
import { publishChange, gameStatus } from '../src/domain/notices.js';
import { freshStore, verifiedInput, publishField7, at, ADMIN, RAY, MIKE } from './fixtures.js';

function rejects(store, actor, input, error) {
  const before = { notices: Object.keys(store.state.notices).length, deliveries: store.state.deliveries.length };
  const res = publishChange(store, actor, input);
  assertEqual(res.ok, false, 'should reject');
  assertEqual(res.error, error, 'error code');
  assertEqual(Object.keys(store.state.notices).length, before.notices, 'no notice created');
  assertEqual(store.state.deliveries.length, before.deliveries, 'no delivery created');
  assertEqual(gameStatus(store, input.gameId).label, 'As scheduled', 'status unchanged');
}

test('REQ-01 publish without verification source is blocked', () => {
  const s = freshStore();
  rejects(s, ADMIN, verifiedInput({ verification: { source: '', confirmedAt: at('2026-11-21T08:20') } }), 'verification-required');
});

test('REQ-01 publish without verification time is blocked', () => {
  const s = freshStore();
  rejects(s, ADMIN, verifiedInput({ verification: { source: 'City' } }), 'verification-required');
});

test('REQ-01 verification time later than now is blocked', () => {
  const s = freshStore();
  rejects(s, ADMIN, verifiedInput({ verification: { source: 'City', confirmedAt: at('2026-11-21T09:00') } }), 'verification-in-future');
});

test('REQ-01 verification record is shown on the published notice', () => {
  const s = freshStore();
  publishField7(s);
  const st = gameStatus(s, 'g-u10');
  assertEqual(st.verification.source, 'Parks Department');
  assertEqual(st.verification.confirmedAt, at('2026-11-21T08:20'));
});

test('REQ-02 coach cannot publish (not-authorized)', () => {
  rejects(freshStore(), RAY, verifiedInput(), 'not-authorized');
});

test('REQ-02 parent cannot publish (not-authorized)', () => {
  rejects(freshStore(), MIKE, verifiedInput(), 'not-authorized');
});

test('REQ-03 field move label "FINAL – Moved: Field 3 → Field 7" with author, time, instruction', () => {
  const s = freshStore();
  publishField7(s);
  const st = gameStatus(s, 'g-u10');
  assertEqual(st.label, 'FINAL – Moved: Field 3 → Field 7');
  assertEqual(st.kind, 'final');
  assertEqual(st.author, 'Brenda (League Admin)');
  assertEqual(st.publishedAt, at('2026-11-21T08:30'));
  assertEqual(st.instruction, 'Go to Field 7 at the original time.');
});

test('REQ-03 time move label "FINAL – Time changed: Sun 10:00 → Sun 13:00"', () => {
  const s = freshStore();
  const res = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u12', changeType: 'time', newField: undefined, newKickoff: at('2026-11-22T13:00'),
    instruction: 'Arrive for the new kickoff at Sun 13:00.',
  }));
  assertTrue(res.ok, res.error);
  assertEqual(gameStatus(s, 'g-u12').label, 'FINAL – Time changed: Sun 10:00 → Sun 13:00');
});

test('REQ-03 cancellation label "FINAL – Cancelled"', () => {
  const s = freshStore();
  const res = publishChange(s, ADMIN, verifiedInput({ changeType: 'cancelled', newField: undefined, instruction: 'No game today; do not travel.' }));
  assertTrue(res.ok, res.error);
  assertEqual(gameStatus(s, 'g-u10').label, 'FINAL – Cancelled');
});

test('REQ-03 unchanged or missing new field/time is rejected (invalid-change)', () => {
  const s = freshStore();
  rejects(s, ADMIN, verifiedInput({ newField: 'Field 3' }), 'invalid-change');
  rejects(s, ADMIN, verifiedInput({ newField: '' }), 'invalid-change');
  rejects(s, ADMIN, verifiedInput({ changeType: 'time', newField: undefined }), 'invalid-change');
  rejects(s, ADMIN, verifiedInput({ changeType: 'time', newField: undefined, newKickoff: at('2026-11-21T08:00') }), 'invalid-change');
});

test('REQ-03 empty instruction is rejected (instruction-required)', () => {
  rejects(freshStore(), ADMIN, verifiedInput({ instruction: '   ' }), 'instruction-required');
});

test('Edge case: a game whose kickoff has passed cannot be changed (game-started)', () => {
  rejects(freshStore(), ADMIN, verifiedInput({ gameId: 'g-past', newField: 'Field 9' }), 'game-started');
});

test('REQ-04 a second publish supersedes the first; only the latest is current', () => {
  const s = freshStore();
  const first = publishField7(s);
  const res = publishChange(s, ADMIN, verifiedInput({ changeType: 'cancelled', newField: undefined, instruction: 'No game today; do not travel.' }));
  assertTrue(res.ok, res.error);
  assertEqual(first.state, 'superseded');
  assertEqual(first.supersededBy, res.noticeId);
  assertEqual(s.state.notices[res.noticeId].state, 'current');
  assertEqual(s.state.games['g-u10'].currentNoticeId, res.noticeId);
  assertEqual(gameStatus(s, 'g-u10').label, 'FINAL – Cancelled');
});

test('REQ-06 rejections and publishes each append one frozen activity entry with author and time', () => {
  const s = freshStore();
  publishChange(s, RAY, verifiedInput());
  publishChange(s, ADMIN, verifiedInput({ verification: {} }));
  publishField7(s);
  const types = s.state.activity.map((e) => e.type);
  assertEqual(types.join(','), 'publish-rejected,publish-rejected,publish');
  for (const e of s.state.activity) {
    assertTrue(Object.isFrozen(e), 'entry frozen');
    assertTrue(e.authorId && e.at && e.content, 'author, time, content present');
  }
  assertTrue(s.state.activity[2].content.includes('FINAL – Moved: Field 3 → Field 7'));
});

// ---- US4 heads-up: REQ-05, REQ-06, REQ-07, REQ-08, REQ-17 ----

import { sendHeadsUp } from '../src/domain/notices.js';
import { alertsFor } from '../src/domain/queries.js';
import { U12_RED_COACH, X } from './fixtures.js';

const RAIN = { gameId: 'g-u10', message: 'Field 3 may close due to rain' };

test('REQ-05 / REQ-07 / REQ-08 Ray’s heads-up reaches U10 Blue only (no U10 Red, no X), in-app + email', () => {
  const s = freshStore();
  const res = sendHeadsUp(s, RAY, RAIN);
  assertTrue(res.ok, res.error);
  const h = s.state.headsUps[res.headsUpId];
  const people = new Set(h.recipients.map((r) => r.personId));
  assertTrue(people.has('ana-adams') && people.has(RAY), 'U10 Blue parent and Ray');
  assertTrue(!people.has('jo-james') && !people.has('coach-u10-red'), 'no U10 Red');
  assertTrue(!people.has(X), 'X excluded');
  const recs = s.state.deliveries.filter((d) => d.messageId === h.id);
  assertEqual(recs.length, h.recipients.length * 2, 'in-app + email per recipient');
  assertTrue(recs.every((d) => ['in-app', 'email'].includes(d.channel)), 'no text or call');
  assertTrue(recs.every((d) => d.content.startsWith('UNCONFIRMED – not official yet')), 'labelled UNCONFIRMED');
});

test('REQ-05 a heads-up never changes the official status and schedules no escalation', () => {
  const s = freshStore();
  sendHeadsUp(s, RAY, RAIN);
  const st = gameStatus(s, 'g-u10');
  assertEqual(st.label, 'As scheduled');
  assertEqual(st.headsUps.length, 1);
  assertEqual(st.headsUps[0].state, 'active');
  assertEqual(s.state.escalations.length, 0);
});

test('REQ-05 rejections: other team’s coach, admin, empty message, started game', () => {
  const s = freshStore();
  assertEqual(sendHeadsUp(s, U12_RED_COACH, RAIN).error, 'not-authorized');
  assertEqual(sendHeadsUp(s, ADMIN, RAIN).error, 'not-authorized');
  assertEqual(sendHeadsUp(s, RAY, { gameId: 'g-u10', message: '  ' }).error, 'message-required');
  assertEqual(sendHeadsUp(s, 'coach-u12-red', { gameId: 'g-past', message: 'x' }).error, 'game-started');
  assertEqual(Object.keys(s.state.headsUps).length, 0);
  assertEqual(s.state.activity.filter((e) => e.type === 'heads-up-rejected').length, 4);
});

test('REQ-06 a heads-up is logged with author, time and content', () => {
  const s = freshStore();
  sendHeadsUp(s, RAY, RAIN);
  const e = s.state.activity.find((x) => x.type === 'heads-up');
  assertEqual(e.authorId, RAY);
  assertTrue(e.content.includes('Field 3 may close due to rain'));
});

test('REQ-04 / REQ-05 / REQ-17 publishing FINAL supersedes the heads-up; parents see one current alert', () => {
  const s = freshStore();
  const h = s.state.headsUps[sendHeadsUp(s, RAY, RAIN).headsUpId];
  const n = publishField7(s);
  assertEqual(h.state, 'superseded');
  assertEqual(h.supersededBy, n.id);
  assertEqual(gameStatus(s, 'g-u10').headsUps[0].state, 'superseded');
  const current = alertsFor(s, MIKE).filter((a) => !a.superseded && a.gameId === 'g-u10');
  assertEqual(current.length, 1, 'one current alert');
  assertEqual(current[0].kind, 'final');
  const hu = alertsFor(s, MIKE).find((a) => a.kind === 'heads-up');
  assertTrue(hu.superseded && !hu.unconfirmed, 'heads-up superseded and never needs confirmation');
  assertTrue(hu.content.includes('Field 3') && !hu.content.includes('Field 7'), 'heads-up text stays as sent');
});
