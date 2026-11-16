// REQ-18 (child names, no addresses) and REQ-14 / SC-007 (no "read"/"seen" wording).

import { test, assertEqual, assertTrue } from './harness.js';
import { childDisplayName } from '../src/domain/recipients.js';
import { freshStore } from './fixtures.js';

test('REQ-18 childDisplayName shows first name and last initial', () => {
  assertEqual(childDisplayName({ firstName: 'Bea', lastName: 'Bell' }), 'Bea B.');
});

test('REQ-18 no person, child or family in the seed has an address field', () => {
  const s = freshStore();
  const all = [...Object.values(s.state.people), ...Object.values(s.state.children), ...Object.values(s.state.families)];
  for (const obj of all) {
    for (const key of Object.keys(obj)) {
      assertTrue(!/address|street|zip/i.test(key), `unexpected field ${key} on ${obj.id}`);
    }
  }
});

// ---- US3 part 2: REQ-14 / SC-007 — render every persona view and scan the visible text ----

import * as adminView from '../src/ui/adminView.js';
import * as coachView from '../src/ui/coachView.js';
import * as parentView from '../src/ui/parentView.js';
import { confirmReceipt, noticeStatus } from '../src/domain/confirmations.js';
import { noticeStatusTable, deliveryLogTable } from '../src/ui/components.js';
import { sendHeadsUp } from '../src/domain/notices.js';
import { publishField7, ADMIN, RAY, MIKE, Y, X } from './fixtures.js';

const FORBIDDEN = [/\bread\b/i, /\bseen\b/i, /everyone has seen it/i];

function renderText(view, store, personaId, prepare) {
  const root = document.createElement('div');
  view.resetUi && view.resetUi();
  if (prepare) prepare();
  view.render(store, personaId, root);
  return root.textContent;
}

test('REQ-14 no persona view uses "read", "seen" or "everyone has seen it"', () => {
  const s = freshStore();
  const n = publishField7(s);
  confirmReceipt(s, MIKE, n.id);
  const texts = [
    renderText(adminView, s, ADMIN),
    renderText(coachView, s, RAY),
    renderText(parentView, s, MIKE),
    renderText(parentView, s, Y),
    noticeStatusTable(noticeStatus(s, n.id, RAY)).textContent,
    deliveryLogTable(s, s.state.deliveries).textContent,
  ];
  for (const t of texts) {
    for (const re of FORBIDDEN) assertTrue(!re.test(t), `forbidden wording ${re} found`);
  }
});

test('Views never show stray "null", "undefined" or "[object" text (with heads-ups present)', () => {
  const s = freshStore();
  sendHeadsUp(s, RAY, { gameId: 'g-u10', message: 'Field 3 may close due to rain' });
  for (const [view, id] of [[adminView, ADMIN], [coachView, RAY], [parentView, MIKE], [parentView, 'jo-james'], [parentView, X]]) {
    const t = renderText(view, s, id);
    assertTrue(!/\bnull\b|\bundefined\b|\[object/.test(t), `stray text in view for ${id}`);
  }
  publishField7(s);
  for (const [view, id] of [[adminView, ADMIN], [coachView, RAY], [parentView, MIKE]]) {
    const t = renderText(view, s, id);
    assertTrue(!/\bnull\b|\bundefined\b|\[object/.test(t), `stray text after publish for ${id}`);
  }
});

test('REQ-08 restricted parent X sees no game and no message about Bea', () => {
  const s = freshStore();
  publishField7(s);
  const t = renderText(parentView, s, X);
  assertTrue(!t.includes('Bea'), 'Bea never shown to X');
  assertTrue(t.includes('No upcoming games.'), 'no games for X');
});

test('REQ-18 parent view shows child names as first name + initial only', () => {
  const s = freshStore();
  publishField7(s);
  const t = renderText(parentView, s, MIKE);
  assertTrue(t.includes('Max M.') && t.includes('Mia M.'), 'both children shown');
  assertTrue(!t.includes('Max Moreno') && !t.includes('Mia Moreno'), 'no child full names');
});
