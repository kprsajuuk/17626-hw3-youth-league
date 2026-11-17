// Simulated delivery (research R-4, R-5). Constitution VI: nothing is really sent; each
// channel only appends a DeliveryRecord to the visible delivery log.
// REQ-09 (in-app + email to every recipient on publish), REQ-16 (dispatched at publish time),
// REQ-08 / REQ-18 (content names only eligible children, by first name + initial).
// REQ-05: heads-ups go in-app + email to the coach's own team only and never escalate.
// REQ-10: text if no confirmation within 5 min, or at once when the change is urgent.
// REQ-11: urgent changes also place a call to each parent still unconfirmed after 2 min
//         (Clarifications 2026-11-16, OQ-2). V2 (CR-8): escalation stops per recipient once every
//         child named in their notice is confirmed. V2 (CR-6, REQ-20): nothing is due at or after kickoff.
// REQ-13 (V2, CR-7): dispatch records "sent"; one simulated minute later a "delivered" report.

import { appendDelivery } from './log.js';
import { resolveRecipients, childDisplayName } from './recipients.js';
import { noticeLabel, HEADS_UP_PREFIX } from './notices.js';
import { gameName, currentDetails, nextId, notify } from './store.js';
import { isConfirmedFor } from './confirmations.js';
import { formatTime } from '../ui/format.js';

// Text of one message for one recipient (REQ-03, REQ-08, REQ-17, REQ-18).
export function renderNoticeContent(store, notice, recipient) {
  const { games, children, teams } = store.state;
  const game = games[notice.gameId];
  const lines = [`${noticeLabel(notice)}.`, `${gameName(store, game)}, originally ${formatTime(notice.old.kickoff)} at ${notice.old.field}.`];
  if (notice.changeType === 'moved') {
    // REQ-03 (V2, CR-5): one notice names every detail that changed.
    const { field, kickoff } = notice.new;
    if (field !== undefined && kickoff !== undefined) lines.push(`New field: ${field}. New kickoff: ${formatTime(kickoff)}.`);
    else if (field !== undefined) lines.push(`New field: ${field} (time unchanged).`);
    else lines.push(`New kickoff: ${formatTime(kickoff)} (field unchanged).`);
  }
  if (notice.changeType === 'cancelled') lines.push('The game will not take place.');
  lines.push(`What to do: ${notice.instruction}`);
  if (recipient.childIds.length) {
    lines.push(`For: ${recipient.childIds.map((id) => childDisplayName(children[id])).join(', ')}`); // names already end in "."
  } else if (recipient.teamId) {
    lines.push(`For: ${teams[recipient.teamId].name} (coach).`);
  }
  return lines.join(' ');
}

// REQ-13 (V2, CR-7): a channel with a contact on file is "sent"; a missing contact fails at once.
function contactStatus(person, channel) {
  if (channel === 'in-app') return { status: 'sent', reason: null };
  if (channel === 'email') return person.email ? { status: 'sent', reason: null } : { status: 'failed', reason: 'No email on file' };
  return person.phone ? { status: 'sent', reason: null } : { status: 'failed', reason: 'No phone on file' };
}

export const REPORT_DELAY = 60 * 1000; // REQ-13 (V2, CR-7): delivery report 1 simulated minute after "sent"

// REQ-13, REQ-06 (V2, CR-7, research R-14): for every "sent" record without a report whose minute
// has passed, append a "delivered" report. Pending reports are derived from the append-only log.
export function processDeliveryReports(store) {
  const { deliveries } = store.state;
  const reported = new Set(deliveries.filter((d) => d.reportFor).map((d) => d.reportFor));
  const due = deliveries.filter((d) => d.status === 'sent' && !reported.has(d.id) && d.at + REPORT_DELAY <= store.state.now);
  for (const d of due) {
    appendDelivery(store, {
      messageId: d.messageId,
      personId: d.personId,
      channel: d.channel,
      status: 'delivered',
      trigger: 'delivery-report',
      content: d.content,
      at: d.at + REPORT_DELAY,
      reportFor: d.id,
    });
  }
  return due.length;
}

export function deliver(store, message, recipient, channel, trigger, content, at) {
  const person = store.state.people[recipient.personId];
  const { status, reason } = contactStatus(person, channel);
  return appendDelivery(store, { messageId: message.id, personId: person.id, channel, status, reason, trigger, content, at });
}

export const TEXT_DELAY = 5 * 60 * 1000; // REQ-10 (OQ-1: 5 minutes)
export const CALL_DELAY = 2 * 60 * 1000; // REQ-11 (OQ-2: 2 minutes, team assumption)

function schedule(store, notice, personId, channel, dueAt) {
  store.state.escalations.push({ id: nextId(store, 'esc'), noticeId: notice.id, personId, channel, dueAt, state: 'pending' });
}

// REQ-09, REQ-16, REQ-07, REQ-08, REQ-17, REQ-10, REQ-11
export function dispatchFinalNotice(store, notice) {
  const recipients = resolveRecipients(store, notice.gameId, { kind: 'final' });
  notice.recipients = recipients;
  const { people } = store.state;
  for (const r of recipients) {
    const content = renderNoticeContent(store, notice, r);
    deliver(store, notice, r, 'in-app', 'publish', content, notice.publishedAt);
    deliver(store, notice, r, 'email', 'publish', content, notice.publishedAt);
    if (notice.urgent) {
      deliver(store, notice, r, 'text', 'urgent', content, notice.publishedAt); // REQ-10: at once
      if (people[r.personId].role === 'parent') schedule(store, notice, r.personId, 'call', notice.publishedAt + CALL_DELAY); // REQ-11
    } else {
      schedule(store, notice, r.personId, 'text', notice.publishedAt + TEXT_DELAY); // REQ-10
    }
  }
  return recipients;
}

// REQ-10, REQ-11: run on every clock change. Sends each due escalation whose family (or coach)
// has still not confirmed, stamped with its own due time so a +5 min jump is exact.
export function processDueEscalations(store) {
  const { notices, escalations } = store.state;
  const due = escalations
    .filter((e) => e.state === 'pending' && e.dueAt <= store.state.now)
    .sort((a, b) => a.dueAt - b.dueAt);
  let sent = 0;
  for (const e of due) {
    const notice = notices[e.noticeId];
    // REQ-20 (CR-6): nothing is sent once the game has started. Compared with `dueAt`, not "now",
    // so a large clock jump still sends what fell due before kickoff, with its own time.
    const kickoff = currentDetails(store, store.state.games[notice.gameId]).kickoff;
    if (notice.state !== 'current' || isConfirmedFor(store, notice, e.personId) || e.dueAt >= kickoff) {
      e.state = 'cancelled';
      continue;
    }
    const r = notice.recipients.find((x) => x.personId === e.personId);
    const trigger = e.channel === 'call' ? 'no-confirmation-2min' : 'no-confirmation-5min';
    deliver(store, notice, r, e.channel, trigger, renderNoticeContent(store, notice, r), e.dueAt);
    e.state = 'sent';
    sent += 1;
  }
  if (sent) notify(store, 'data');
  return sent;
}

// REQ-04 / REQ-10: cancel pending escalations of a notice (all, or only for some people).
export function cancelEscalations(store, noticeId, personIds = null) {
  for (const e of store.state.escalations) {
    if (e.noticeId === noticeId && e.state === 'pending' && (!personIds || personIds.includes(e.personId))) {
      e.state = 'cancelled';
    }
  }
}

// REQ-05, REQ-08, REQ-18: text of a heads-up for one recipient.
export function renderHeadsUpContent(store, headsUp, recipient) {
  const { games, children, teams } = store.state;
  const game = games[headsUp.gameId];
  const forWhom = recipient.childIds.length
    ? `For: ${recipient.childIds.map((id) => childDisplayName(children[id])).join(', ')}`
    : `For: ${teams[recipient.teamId].name} (coach).`;
  const d = currentDetails(store, game);
  return `${HEADS_UP_PREFIX}: ${headsUp.message} ${gameName(store, game)}, ${formatTime(d.kickoff)} at ${d.field}. `
    + `The official status has not changed; wait for a FINAL notice. ${forWhom}`;
}

// REQ-05, REQ-07, REQ-08
export function dispatchHeadsUp(store, headsUp) {
  const recipients = resolveRecipients(store, headsUp.gameId, { kind: 'heads-up', teamId: headsUp.teamId });
  headsUp.recipients = recipients;
  for (const r of recipients) {
    const content = renderHeadsUpContent(store, headsUp, r);
    deliver(store, headsUp, r, 'in-app', 'publish', content, headsUp.sentAt);
    deliver(store, headsUp, r, 'email', 'publish', content, headsUp.sentAt);
  }
  return recipients;
}
