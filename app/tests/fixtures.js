// Shared test helpers built on the real seed (research R-9).

import { createStore, parseTime } from '../src/domain/store.js';
import { publishChange } from '../src/domain/notices.js';

export const ADMIN = 'brenda';
export const RAY = 'coach-u10-blue';
export const U10_RED_COACH = 'coach-u10-red';
export const U12_RED_COACH = 'coach-u12-red';
export const X = 'xavier-bell';
export const Y = 'yolanda-bell';
export const W = 'wes-evans';
export const ERIN = 'erin-evans';
export const MIKE = 'mike-moreno';
export const DANA = 'dana-diaz';
export const FAY = 'fay-fox'; // no email
export const GUS = 'gus-gray'; // no phone

// One parent per U10 Blue family (Family B → Y, Family E → Erin).
export const U10_BLUE_PARENTS = [
  'ana-adams', Y, 'carl-chen', DANA, ERIN, FAY, GUS, 'hana-hill', 'ivan-iqbal', MIKE,
];

export function freshStore() {
  return createStore();
}

export const at = (s) => parseTime(s);

export function verifiedInput(overrides = {}) {
  return {
    gameId: 'g-u10',
    changeType: 'moved',
    newField: 'Field 7',
    instruction: 'Go to Field 7 at the original time.',
    verification: { source: 'Parks Department', confirmedAt: at('2026-11-21T08:20') },
    ...overrides,
  };
}

export function publishField7(store, overrides = {}) {
  const res = publishChange(store, ADMIN, verifiedInput(overrides));
  if (!res.ok) throw new Error(`fixture publish failed: ${res.error}`);
  return store.state.notices[res.noticeId];
}

// V2: a verified cancellation of the U10 game (REQ-03, CR-2).
export function canceledInput(overrides = {}) {
  return verifiedInput({ changeType: 'cancelled', newField: undefined, instruction: 'No game today; do not travel.', ...overrides });
}
