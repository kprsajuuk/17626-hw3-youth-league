// US2 recipients: REQ-07 (affected teams only), REQ-08 (court-order exclusion), REQ-17 (one per parent).

import { test, assertEqual, assertTrue, assertDeepEqual } from './harness.js';
import { resolveRecipients } from '../src/domain/recipients.js';
import { freshStore, X, Y, W, ERIN, MIKE, DANA, RAY, U10_RED_COACH } from './fixtures.js';

const byPerson = (list, id) => list.filter((r) => r.personId === id);

test('REQ-07 final notice for g-u10 reaches U10 Blue and U10 Red parents and both coaches, no U12 person', () => {
  const s = freshStore();
  const list = resolveRecipients(s, 'g-u10', { kind: 'final' });
  assertEqual(byPerson(list, RAY).length, 1, 'Ray');
  assertEqual(byPerson(list, U10_RED_COACH).length, 1, 'U10 Red coach');
  assertEqual(byPerson(list, 'jo-james').length, 1, 'U10 Red parent');
  for (const r of list) {
    const p = s.state.people[r.personId];
    if (p.role === 'coach') continue;
    for (const cid of r.childIds) {
      assertTrue(['u10-blue', 'u10-red'].includes(s.state.children[cid].teamId), `child ${cid} on affected team`);
    }
  }
  assertEqual(byPerson(list, 'omar-ortiz').length, 0, 'U12-only parent excluded');
  assertEqual(byPerson(list, 'coach-u12-red').length, 0, 'U12 coach excluded');
});

test('REQ-08 restricted parent X is not a recipient; Y (same family) is, naming Bea', () => {
  const s = freshStore();
  const list = resolveRecipients(s, 'g-u10', { kind: 'final' });
  assertEqual(byPerson(list, X).length, 0);
  assertDeepEqual(byPerson(list, Y)[0].childIds, ['bea-bell']);
});

test('REQ-08 W (restricted for Eli only) is notified about Emma only; Erin about both', () => {
  const s = freshStore();
  const list = resolveRecipients(s, 'g-u10', { kind: 'final' });
  assertDeepEqual(byPerson(list, W)[0].childIds, ['emma-evans']);
  assertDeepEqual(byPerson(list, ERIN)[0].childIds, ['eli-evans', 'emma-evans']);
});

test('REQ-17 Dana (two children on U10 Blue) appears once naming both', () => {
  const s = freshStore();
  const list = resolveRecipients(s, 'g-u10', { kind: 'final' });
  assertEqual(byPerson(list, DANA).length, 1);
  assertDeepEqual(byPerson(list, DANA)[0].childIds, ['dev-diaz', 'dia-diaz']);
});

test('REQ-17 Mike appears once for g-u10 naming only Max (Mia is on U12 Red)', () => {
  const s = freshStore();
  const list = resolveRecipients(s, 'g-u10', { kind: 'final' });
  assertEqual(byPerson(list, MIKE).length, 1);
  assertDeepEqual(byPerson(list, MIKE)[0].childIds, ['max-moreno']);
});

test('REQ-07 heads-up audience is only the given team', () => {
  const s = freshStore();
  const list = resolveRecipients(s, 'g-u10', { kind: 'heads-up', teamId: 'u10-blue' });
  assertEqual(byPerson(list, 'jo-james').length, 0, 'no U10 Red parent');
  assertEqual(byPerson(list, U10_RED_COACH).length, 0, 'no U10 Red coach');
  assertEqual(byPerson(list, RAY).length, 1);
  assertEqual(byPerson(list, X).length, 0, 'X still excluded');
});
