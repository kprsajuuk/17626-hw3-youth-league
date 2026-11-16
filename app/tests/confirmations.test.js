// US2 confirmReceipt (REQ-12) and US3 noticeStatus (REQ-13, REQ-14).

import { test, assertEqual, assertTrue, assertDeepEqual } from './harness.js';
import { confirmReceipt, noticeStatus } from '../src/domain/confirmations.js';
import { publishChange } from '../src/domain/notices.js';
import { alertsFor } from '../src/domain/queries.js';
import {
  freshStore, publishField7, verifiedInput, ADMIN, RAY, X, Y, ERIN, MIKE, FAY, U10_BLUE_PARENTS,
} from './fixtures.js';

// ---- US2 part 1: REQ-12 ----

test('REQ-12 a recipient can confirm receipt; the alert is then no longer unconfirmed', () => {
  const s = freshStore();
  const n = publishField7(s);
  assertEqual(alertsFor(s, MIKE).filter((a) => a.unconfirmed).length, 1, 'unconfirmed before');
  assertTrue(confirmReceipt(s, MIKE, n.id).ok);
  assertEqual(alertsFor(s, MIKE).filter((a) => a.unconfirmed).length, 0, 'none after');
});

test('REQ-12 confirming twice keeps a single confirmation', () => {
  const s = freshStore();
  const n = publishField7(s);
  confirmReceipt(s, MIKE, n.id);
  confirmReceipt(s, MIKE, n.id);
  assertEqual(s.state.confirmations.filter((c) => c.personId === MIKE).length, 1);
});

test('REQ-12 / REQ-08 non-recipients cannot confirm (X, a U12 parent)', () => {
  const s = freshStore();
  const n = publishField7(s);
  assertEqual(confirmReceipt(s, X, n.id).error, 'not-recipient');
  assertEqual(confirmReceipt(s, 'omar-ortiz', n.id).error, 'not-recipient');
});

test('REQ-12 a superseded notice cannot be confirmed', () => {
  const s = freshStore();
  const n = publishField7(s);
  publishChange(s, ADMIN, verifiedInput({ newField: 'Field 8', instruction: 'Go to Field 8.' }));
  assertEqual(confirmReceipt(s, MIKE, n.id).error, 'superseded');
});

test('REQ-12 / Clarifications: one parent confirming confirms the family for the other parent', () => {
  const s = freshStore();
  const n = publishField7(s);
  confirmReceipt(s, ERIN, n.id);
  assertEqual(alertsFor(s, 'wes-evans').filter((a) => a.unconfirmed).length, 0);
});

// ---- US3: REQ-13, REQ-14 ----

test('REQ-13 / REQ-14 "8 of 10 confirmed receipt" and the 2 remaining families listed', () => {
  const s = freshStore();
  const n = publishField7(s);
  for (const pid of U10_BLUE_PARENTS.slice(0, 8)) assertTrue(confirmReceipt(s, pid, n.id).ok, pid);
  const st = noticeStatus(s, n.id, RAY);
  assertEqual(st.summary, '8 of 10 confirmed receipt');
  assertDeepEqual(st.notConfirmed.map((f) => f.label), ['Family I', 'Family M']);
});

test('REQ-13 Family E counts as confirmed when Erin confirms; X appears in no row', () => {
  const s = freshStore();
  const n = publishField7(s);
  confirmReceipt(s, ERIN, n.id);
  const st = noticeStatus(s, n.id, RAY);
  assertTrue(!st.notConfirmed.some((f) => f.label === 'Family E'));
  assertTrue(!st.rows.some((r) => r.personId === X), 'X absent');
  assertTrue(st.rows.some((r) => r.personId === Y), 'Y present');
});

test('REQ-08 in the not-confirmed list, W is listed only with Emma, never next to Eli', () => {
  const s = freshStore();
  const n = publishField7(s);
  const famE = noticeStatus(s, n.id, RAY).notConfirmed.find((f) => f.label === 'Family E');
  const wes = famE.parents.find((p) => p.name === 'Wes Evans');
  assertDeepEqual(wes.children, ['Emma E.']);
});

test('REQ-13 failed email channel shown for Family F', () => {
  const s = freshStore();
  const n = publishField7(s);
  const row = noticeStatus(s, n.id, RAY).rows.find((r) => r.personId === FAY);
  assertEqual(row.channels.email, 'failed');
  assertEqual(row.channels['in-app'], 'delivered');
  assertEqual(row.channels.text, 'delivered', 'urgent change: text sent at once (REQ-10)');
  assertEqual(row.channels.call, '—', 'no call until 2 min pass (REQ-11)');
});

test('REQ-13 Ray sees only U10 Blue families; admin sees both teams', () => {
  const s = freshStore();
  const n = publishField7(s);
  const ray = noticeStatus(s, n.id, RAY);
  const admin = noticeStatus(s, n.id, ADMIN);
  assertEqual(ray.totalFamilies, 10);
  assertTrue(!ray.rows.some((r) => r.personId === 'jo-james'), 'no U10 Red parent for Ray');
  assertEqual(admin.totalFamilies, 14);
  assertTrue(admin.rows.some((r) => r.personId === 'jo-james'), 'admin sees U10 Red');
});

test('REQ-13 a coach of another team and parents cannot view the status', () => {
  const s = freshStore();
  const n = publishField7(s);
  assertEqual(noticeStatus(s, n.id, 'coach-u12-red'), null);
  assertEqual(noticeStatus(s, n.id, MIKE), null);
});
