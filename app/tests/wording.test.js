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
  assertTrue(t.includes('No games today or later.'), 'no games for X');
});

test('REQ-18 parent view shows child names as first name + initial only', () => {
  const s = freshStore();
  publishField7(s);
  const t = renderText(parentView, s, MIKE);
  assertTrue(t.includes('Max M.') && t.includes('Mia M.'), 'both children shown');
  assertTrue(!t.includes('Max Moreno') && !t.includes('Mia Moreno'), 'no child full names');
});

// ---- V2: REQ-20 "Started" shown in every view (CR-6), REQ-03 / REQ-05 notes (CR-1, CR-2) ----

import { advanceClock } from '../src/domain/clock.js';
import { publishChange } from '../src/domain/notices.js';
import { verifiedInput, at, canceledInput } from './fixtures.js';

test('REQ-20 (CR-6, US1 #13, US5 #4) admin, coach and parent views show "Started"; Mike’s alert needs no confirmation', () => {
  const s = freshStore();
  publishChange(s, ADMIN, verifiedInput({ newField: undefined, newKickoff: at('2026-11-21T08:40'), instruction: 'Arrive for 08:40.' }));
  advanceClock(s, 10);
  adminView.resetUi(); coachView.resetUi();
  for (const [view, id] of [[adminView, ADMIN], [coachView, RAY], [parentView, MIKE]]) {
    assertTrue(renderText(view, s, id).includes('Started'), `Started tag for ${id}`);
  }
  const mike = renderText(parentView, s, MIKE);
  assertTrue(mike.includes('Needs your confirmation (0)'), 'nothing to confirm');
  assertTrue(mike.includes('Game started – no confirmation needed'));
});

test('REQ-03 / REQ-05 (CR-1, CR-2) views explain why publish or heads-up is not offered', () => {
  const s = freshStore();
  publishChange(s, ADMIN, canceledInput());
  const root = document.createElement('div');
  adminView.resetUi();
  adminView.render(s, ADMIN, root);
  // Open the U10 game through its "Open" button (the first card whose title is the U10 game).
  // Standard DOM only (tagName, childNodes, click), so this runs on the browser test page.
  const find = (n, pred) => (pred(n) ? n : [...(n.childNodes || [])].map((c) => find(c, pred)).find(Boolean));
  const openBtn = (r, title) => {
    const card = find(r, (n) => typeof n.className === 'string' && n.className.startsWith('card') && n.textContent.startsWith(title));
    return find(card, (n) => n.tagName === 'BUTTON' && n.textContent === 'Open');
  };
  openBtn(root, 'U10 Blue vs U10 Red').click();
  assertTrue(root.textContent.includes('This game is cancelled. A cancellation is final.'));
  assertTrue(!root.textContent.includes('Publish FINAL notice'), 'no publish control');
  const croot = document.createElement('div');
  coachView.resetUi();
  coachView.render(s, RAY, croot);
  openBtn(croot, 'U10 Blue vs U10 Red').click();
  assertTrue(croot.textContent.includes('An official decision has already been published.'));
  assertTrue(!croot.textContent.includes('Send UNCONFIRMED heads-up'), 'no heads-up control');
});
