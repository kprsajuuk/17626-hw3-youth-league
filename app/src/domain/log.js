// Append-only logs (research R-6). REQ-06: every publish, heads-up and notice is logged with
// author, time and content, and no user can edit the log — entries are frozen and this module
// exports no update or delete function.

import { nextId } from './store.js';

const ACTIVITY_TYPES = ['publish', 'heads-up', 'publish-rejected', 'heads-up-rejected'];
const CHANNELS = ['in-app', 'email', 'text', 'call'];
// REQ-13 (V2, CR-7): dispatch records "sent"; a later delivery report records "delivered".
const STATUSES = ['sent', 'delivered', 'failed'];
const TRIGGERS = ['publish', 'urgent', 'no-confirmation-5min', 'no-confirmation-2min', 'delivery-report'];

// REQ-06
export function appendActivity(store, { type, authorId, content }) {
  if (!ACTIVITY_TYPES.includes(type)) throw new Error(`unknown activity type ${type}`);
  const entry = Object.freeze({ id: nextId(store, 'act'), type, authorId, at: store.state.now, content });
  store.state.activity.push(entry);
  return entry;
}

// REQ-06, REQ-09, REQ-13 — one simulated delivery on one channel (Constitution VI: nothing is sent).
// A status change is a new record (`reportFor` = the record it reports on), never an update.
export function appendDelivery(store, { messageId, personId, channel, status, reason = null, trigger, content, at, reportFor = null }) {
  if (!CHANNELS.includes(channel)) throw new Error(`unknown channel ${channel}`);
  if (!STATUSES.includes(status)) throw new Error(`unknown status ${status}`);
  if (!TRIGGERS.includes(trigger)) throw new Error(`unknown trigger ${trigger}`);
  const entry = Object.freeze({
    id: nextId(store, 'dlv'),
    messageId,
    personId,
    channel,
    status,
    reason,
    trigger,
    content,
    at: at ?? store.state.now,
    reportFor,
  });
  store.state.deliveries.push(entry);
  return entry;
}
