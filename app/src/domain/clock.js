// Demo clock (research R-3). REQ-19: presenter can advance simulated time; tick handlers let
// later stories evaluate scheduled actions whenever time moves.

import { notify } from './store.js';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;

export function now(store) {
  return store.state.now;
}

export function onTick(store, handler) {
  store.tickHandlers.push(handler);
}

// Moves time forward only. reason 'tick' = real-time second (views keep their inputs),
// 'clock' = manual jump (views re-render).
export function tick(store, newNow, reason = 'clock') {
  if (newNow <= store.state.now) return;
  store.state.now = newNow;
  for (const handler of store.tickHandlers) handler(store);
  notify(store, reason);
}

// REQ-19
export function advanceClock(store, minutes) {
  tick(store, store.state.now + minutes * MINUTE, 'clock');
}
