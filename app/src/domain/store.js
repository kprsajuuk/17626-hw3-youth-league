// In-memory state container (research R-2). REQ-19 (reset demo), Constitution VI/VIII (mock,
// in-memory only). Also holds small lookup helpers shared by the domain modules.

import { seed, DEMO_START } from '../data/seed.js';
import { processDueEscalations, processDeliveryReports } from './delivery.js';

export function parseTime(value) {
  if (typeof value === 'number') return value;
  return new Date(value).getTime();
}

function load(store) {
  store.counter = 0;
  store.state = {
    now: parseTime(DEMO_START),
    ...seed(),
    notices: {},
    headsUps: {},
    deliveries: [],
    confirmations: [],
    escalations: [],
    activity: [],
  };
}

export function createStore() {
  // REQ-10 / REQ-11: pending escalations are checked every time the demo clock moves.
  // REQ-13 (V2, CR-7): delivery reports run after escalations, so a text or call sent during a
  // clock jump also gets its report in the same jump once its minute has passed.
  const store = { listeners: new Set(), tickHandlers: [processDueEscalations, processDeliveryReports], counter: 0, state: null };
  load(store);
  return store;
}

// REQ-19: restore seed data and the demo start time.
export function resetDemo(store) {
  load(store);
  notify(store, 'reset');
}

export function subscribe(store, fn) {
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}

// reason: 'data' (state changed), 'clock' (manual time jump), 'tick' (real-time second), 'reset'
export function notify(store, reason = 'data') {
  for (const fn of store.listeners) fn(reason);
}

export function nextId(store, prefix) {
  store.counter += 1;
  return `${prefix}-${store.counter}`;
}

// ---- lookups ----

export function teamOfCoach(store, coachId) {
  return Object.values(store.state.teams).find((t) => t.coachId === coachId) || null;
}

export function gameName(store, game) {
  return game.teamIds.map((id) => store.state.teams[id].name).join(' vs ');
}

// Current kickoff/field of a game after its current FINAL notice (data-model "Derived").
export function currentDetails(store, game) {
  const notice = game.currentNoticeId ? store.state.notices[game.currentNoticeId] : null;
  if (!notice) return { ...game.scheduled, cancelled: false };
  return {
    kickoff: notice.new.kickoff ?? notice.old.kickoff,
    field: notice.new.field ?? notice.old.field,
    cancelled: notice.changeType === 'cancelled',
  };
}

// REQ-20 (V2, CR-6): a game has started once its current kickoff has passed. Derived, never stored.
export function gameStarted(store, game) {
  return currentDetails(store, game).kickoff <= store.state.now;
}

// REQ-03, D-7 (V2, CR-2): the current official status is a cancellation, which is final.
export function isCancelled(store, game) {
  return currentDetails(store, game).cancelled;
}
