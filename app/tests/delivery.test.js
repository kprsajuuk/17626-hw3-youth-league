// US2 delivery part 1: REQ-09 (in-app + email), REQ-16 (at publish time), REQ-13 (failed channel),
// REQ-08 (no record for the restricted parent).

import { test, assertEqual, assertTrue } from './harness.js';
import { freshStore, publishField7, X, FAY, DANA } from './fixtures.js';

test('REQ-09 / REQ-16 every recipient gets exactly one in-app and one email record at publish time', () => {
  const s = freshStore();
  const n = publishField7(s);
  assertTrue(n.recipients.length > 0, 'has recipients');
  for (const r of n.recipients) {
    const recs = s.state.deliveries.filter((d) => d.messageId === n.id && d.personId === r.personId);
    assertEqual(recs.filter((d) => d.channel === 'in-app').length, 1, `in-app for ${r.personId}`);
    assertEqual(recs.filter((d) => d.channel === 'email').length, 1, `email for ${r.personId}`);
    for (const d of recs.filter((x) => x.channel === 'in-app' || x.channel === 'email')) {
      assertEqual(d.at, n.publishedAt, 'dispatched at publish time');
      assertEqual(d.trigger, 'publish');
      assertTrue(Object.isFrozen(d), 'record frozen');
    }
  }
});

test('REQ-13 Family F has no email on file: email is failed with a reason, in-app delivered', () => {
  const s = freshStore();
  const n = publishField7(s);
  const recs = s.state.deliveries.filter((d) => d.messageId === n.id && d.personId === FAY);
  assertEqual(recs.find((d) => d.channel === 'email').status, 'failed');
  assertEqual(recs.find((d) => d.channel === 'email').reason, 'No email on file');
  assertEqual(recs.find((d) => d.channel === 'in-app').status, 'delivered');
});

test('REQ-08 no delivery record exists for restricted parent X', () => {
  const s = freshStore();
  publishField7(s);
  assertEqual(s.state.deliveries.filter((d) => d.personId === X).length, 0);
});

test('REQ-08 / REQ-18 message content names eligible children by first name + initial only', () => {
  const s = freshStore();
  const n = publishField7(s);
  const wes = s.state.deliveries.find((d) => d.messageId === n.id && d.personId === 'wes-evans');
  assertTrue(wes.content.includes('Emma E.'), 'names Emma');
  assertTrue(!wes.content.includes('Eli'), 'never mentions Eli');
  const dana = s.state.deliveries.find((d) => d.messageId === n.id && d.personId === DANA);
  assertTrue(dana.content.includes('Dev D.') && dana.content.includes('Dia D.'), 'names both children');
  assertTrue(!/Diaz/.test(dana.content.replace('Dana Diaz', '')), 'no child surname');
});

// ---- US6 escalation: REQ-10, REQ-11, Clarifications 2026-11-16 (OQ-1, OQ-2, family rule) ----

import { advanceClock } from '../src/domain/clock.js';
import { confirmReceipt } from '../src/domain/confirmations.js';
import { publishChange } from '../src/domain/notices.js';
import { verifiedInput, at, ADMIN, RAY, MIKE, ERIN, W, GUS } from './fixtures.js';

const recs = (s, noticeId, channel) => s.state.deliveries.filter((d) => d.messageId === noticeId && d.channel === channel);
const isParent = (s, id) => s.state.people[id].role === 'parent';

function publishTimeMoveU12(s) {
  const res = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u12', changeType: 'time', newField: undefined, newKickoff: at('2026-11-22T13:00'),
    instruction: 'Arrive for the new kickoff at Sun 13:00.',
  }));
  if (!res.ok) throw new Error(res.error);
  return s.state.notices[res.noticeId];
}

test('REQ-10 urgent (kickoff in 90 min): a text to every recipient at publish, no call yet', () => {
  const s = freshStore();
  const n = publishField7(s);
  assertTrue(n.urgent, 'urgent');
  const texts = recs(s, n.id, 'text');
  assertEqual(texts.length, n.recipients.length, 'one text per recipient');
  assertTrue(texts.every((d) => d.trigger === 'urgent' && d.at === n.publishedAt), 'sent at once');
  assertEqual(recs(s, n.id, 'call').length, 0, 'no call at publish');
});

test('REQ-11 urgent: after 2 min a call to every unconfirmed parent only — never coaches, not Mike (confirmed)', () => {
  const s = freshStore();
  const n = publishField7(s);
  confirmReceipt(s, MIKE, n.id);
  advanceClock(s, 2);
  const calls = recs(s, n.id, 'call');
  const parents = n.recipients.filter((r) => isParent(s, r.personId) && r.personId !== MIKE);
  assertEqual(calls.length, parents.length, 'one call per unconfirmed parent');
  assertTrue(calls.every((d) => d.trigger === 'no-confirmation-2min' && d.at === n.publishedAt + 2 * 60000));
  assertTrue(!calls.some((d) => d.personId === MIKE), 'no call to Mike');
  assertTrue(!calls.some((d) => !isParent(s, d.personId)), 'no call to coaches');
});

test('REQ-10 non-urgent (kickoff tomorrow): no text at publish; texts at +5 min to unconfirmed only; never a call', () => {
  const s = freshStore();
  const n = publishTimeMoveU12(s);
  assertEqual(n.urgent, false);
  assertEqual(recs(s, n.id, 'text').length, 0, 'no text at publish');
  confirmReceipt(s, MIKE, n.id);
  advanceClock(s, 4);
  assertEqual(recs(s, n.id, 'text').length, 0, 'still none at +4');
  advanceClock(s, 1);
  const texts = recs(s, n.id, 'text');
  assertEqual(texts.length, n.recipients.length - 1, 'everyone but Mike');
  assertTrue(texts.every((d) => d.trigger === 'no-confirmation-5min' && d.at === n.publishedAt + 5 * 60000));
  advanceClock(s, 30);
  assertEqual(recs(s, n.id, 'call').length, 0, 'no call ever');
});

test('REQ-10 a jump of +5 at once still sends texts stamped with their own due time', () => {
  const s = freshStore();
  const n = publishTimeMoveU12(s);
  advanceClock(s, 7);
  assertTrue(recs(s, n.id, 'text').every((d) => d.at === n.publishedAt + 5 * 60000));
});

test('REQ-10 a time move away from a kickoff within 2 h is still urgent (original kickoff counts)', () => {
  const s = freshStore();
  const res = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u10', changeType: 'time', newField: undefined, newKickoff: at('2026-11-21T16:00'),
    instruction: 'Arrive for the new kickoff at Sat 16:00.',
  }));
  assertTrue(res.ok, res.error);
  assertEqual(s.state.notices[res.noticeId].urgent, true);
});

test('Clarifications: Erin confirms at +2, so neither Erin nor Wes (Family E) gets a text at +5', () => {
  const s = freshStore();
  s.state.now = at('2026-11-21T06:00'); // 4 h before the U10 kickoff → not urgent
  const n = publishField7(s, { verification: { source: 'City', confirmedAt: at('2026-11-21T05:50') } });
  assertEqual(n.urgent, false);
  advanceClock(s, 2);
  confirmReceipt(s, ERIN, n.id);
  advanceClock(s, 3);
  const famE = recs(s, n.id, 'text').filter((d) => d.personId === ERIN || d.personId === W);
  assertEqual(famE.length, 0, 'no text to Family E');
  assertTrue(recs(s, n.id, 'text').some((d) => d.personId === 'ana-adams'), 'others still texted');
});

test('REQ-04 / REQ-10 a second publish cancels the first notice’s pending escalations and schedules new ones', () => {
  const s = freshStore();
  const first = publishTimeMoveU12(s);
  advanceClock(s, 3);
  const second = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u12', changeType: 'field', newField: 'Field 9', instruction: 'Go to Field 9 at the new time.',
  }));
  assertTrue(second.ok, second.error);
  advanceClock(s, 2); // first notice's +5 would fall here
  assertEqual(recs(s, first.id, 'text').length, 0, 'no text for the superseded notice');
  assertTrue(s.state.escalations.filter((e) => e.noticeId === first.id).every((e) => e.state === 'cancelled'));
  advanceClock(s, 3); // second notice's +5
  assertTrue(recs(s, second.noticeId, 'text').length > 0, 'texts for the new notice');
});

test('REQ-10 a time move from tomorrow to within 2 h is urgent (sooner kickoff counts)', () => {
  const s = freshStore();
  const res = publishChange(s, ADMIN, verifiedInput({
    gameId: 'g-u12', changeType: 'time', newField: undefined, newKickoff: at('2026-11-21T10:00'),
    instruction: 'Arrive for the new kickoff at Sat 10:00.',
  }));
  assertTrue(res.ok, res.error);
  assertEqual(s.state.notices[res.noticeId].urgent, true);
});

test('REQ-13 Family G has no phone: urgent text and call are recorded as failed with a reason', () => {
  const s = freshStore();
  const n = publishField7(s);
  advanceClock(s, 2);
  for (const ch of ['text', 'call']) {
    const d = recs(s, n.id, ch).find((x) => x.personId === GUS);
    assertEqual(d.status, 'failed', ch);
    assertEqual(d.reason, 'No phone on file', ch);
  }
});

test('REQ-10 a coach who confirms is not texted; the other coach is', () => {
  const s = freshStore();
  s.state.now = at('2026-11-21T06:00');
  const n = publishField7(s, { verification: { source: 'City', confirmedAt: at('2026-11-21T05:50') } });
  confirmReceipt(s, RAY, n.id);
  advanceClock(s, 5);
  const texts = recs(s, n.id, 'text');
  assertTrue(!texts.some((d) => d.personId === RAY), 'Ray confirmed');
  assertTrue(texts.some((d) => d.personId === 'coach-u10-red'), 'U10 Red coach texted');
});
