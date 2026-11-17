// Shared DOM helpers. REQ-05 (distinct FINAL / UNCONFIRMED / Superseded badges with text),
// REQ-20 (V2, CR-6: "Started" tag next to the official status),
// REQ-03 / REQ-04 (game detail), REQ-06 / REQ-13 (delivery log, notice status), REQ-12 (alerts).

import { gameStatus, noticeHistory, whereWhen, noticeLabel } from '../domain/notices.js';
import { formatTime } from './format.js';

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'value') node.value = value;
    else if (key === 'checked' || key === 'selected' || key === 'disabled') node[key] = Boolean(value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) appendChildren(node, child);
    else node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

const BADGE_TEXT = {
  final: 'FINAL',
  unconfirmed: 'UNCONFIRMED',
  superseded: 'Superseded',
  scheduled: 'As scheduled',
  started: 'Started', // REQ-20
};

// REQ-05
export function statusBadge(kind, text) {
  return el('span', { class: `badge badge-${kind}` }, text ?? BADGE_TEXT[kind] ?? kind);
}

// A game summary card. `status` comes from gameStatus().
export function gameCard({ title, status, whereWhen, selected, onOpen, extra }) {
  return el('div', { class: `card${selected ? ' selected' : ''}` },
    el('div', { class: 'row' },
      el('strong', {}, title),
      statusBadge(status.kind),
      status.kind === 'final' ? el('span', {}, status.label) : null,
      status.started ? statusBadge('started') : null, // REQ-20
      el('span', { class: 'muted' }, whereWhen),
      el('span', { class: 'spacer' }),
      onOpen ? el('button', { onclick: onOpen }, selected ? 'Close' : 'Open') : null),
    extra || null);
}

export function table(columns, rows, emptyText = 'Nothing yet.') {
  if (!rows.length) return el('p', { class: 'muted' }, emptyText);
  return el('div', { class: 'table-wrap' },
    el('table', {},
      el('thead', {}, el('tr', {}, columns.map((c) => el('th', {}, c.label)))),
      el('tbody', {}, rows.map((r) => el('tr', { class: r.rowClass || null },
        columns.map((c) => el('td', {}, c.render ? c.render(r) : r[c.key])))))));
}

// ---------------------------------------------------------------------------
// Feature blocks shared by the persona views.


// REQ-03, REQ-04: what a game entry shows (official status, old → new, instruction, author, time).
export function gameDetail(store, gameId) {
  const st = gameStatus(store, gameId);
  const history = noticeHistory(store, gameId).filter((n) => n.state === 'superseded');
  const people = store.state.people;
  const parts = [
    el('div', { class: 'row' }, statusBadge(st.kind), st.kind === 'final' ? el('span', { class: 'status-line' }, st.label) : null,
      st.started ? statusBadge('started') : null), // REQ-20
  ];
  if (st.kind === 'scheduled') {
    parts.push(el('p', {}, `${formatTime(st.current.kickoff)} at ${st.current.field}. No official change has been published.`));
  } else {
    const was = `${formatTime(st.old.kickoff)} · ${st.old.field}`;
    const now = st.changeType === 'cancelled' ? 'Cancelled — no game' : whereWhen(store, gameId);
    parts.push(
      el('p', {}, el('strong', {}, 'Was: '), was, el('br'), el('strong', {}, 'Now: '), now),
      el('p', {}, el('strong', {}, 'What families should do: '), st.instruction),
      el('p', { class: 'muted small' },
        `Posted by ${st.author} at ${formatTime(st.publishedAt)} · Verified with ${st.verification.source} at ${formatTime(st.verification.confirmedAt)}`),
    );
  }
  if (st.headsUps.length) {
    // REQ-05: heads-ups are visually distinct from FINAL and never shown as the official status.
    parts.push(el('h3', {}, 'Coach heads-ups'),
      st.headsUps.map((h) => el('div', { class: h.state === 'active' ? 'card card-unconfirmed small' : 'card small' },
        el('div', { class: 'row' },
          h.state === 'active' ? statusBadge('unconfirmed', 'UNCONFIRMED – not official yet') : statusBadge('superseded', 'Superseded by FINAL notice'),
          el('span', {}, `“${h.message}”`)),
        el('span', { class: 'muted' }, `Sent by ${h.author} at ${formatTime(h.sentAt)}`))));
  }
  if (history.length) {
    parts.push(el('h3', {}, 'Earlier notices for this game'),
      history.map((n) => el('div', { class: 'row small' },
        statusBadge('superseded', 'Superseded'),
        el('span', { class: 'muted' }, `${noticeLabel(n)} — posted by ${people[n.authorId].name} at ${formatTime(n.publishedAt)}`))));
  }
  return el('div', { class: 'card' }, parts);
}


// REQ-13 (V2, CR-7): sent → delivered, or failed.
function channelCell(value) {
  if (value === 'sent') return statusBadge('sent', 'sent');
  if (value === 'delivered') return statusBadge('ok', 'delivered');
  if (value === 'failed') return statusBadge('failed', 'failed');
  return el('span', { class: 'muted' }, value);
}

// REQ-13, REQ-14, REQ-18
export function noticeStatusTable(status) {
  if (!status) return null;
  return el('div', {},
    el('p', { class: 'summary' }, status.summary),
    status.notConfirmed.length
      ? el('div', { class: 'card not-confirmed' },
        el('strong', {}, `Not yet confirmed (${status.notConfirmed.length}) — call before departure`),
        el('ul', {}, status.notConfirmed.map((f) => el('li', {},
          `${f.label}: ${f.parents.map((p) => `${p.name} (for ${p.children.join(', ')})`).join('; ')}`))))
      : el('p', { class: 'ok' }, 'Every family has confirmed receipt.'),
    table([
      { label: 'Family', key: 'family' },
      { label: 'Parent / coach', key: 'person' },
      { label: 'Children', render: (r) => r.children.join(', ') || '—' },
      { label: 'In-app', render: (r) => channelCell(r.channels['in-app']) },
      { label: 'Email', render: (r) => channelCell(r.channels.email) },
      { label: 'Text', render: (r) => channelCell(r.channels.text) },
      { label: 'Call', render: (r) => channelCell(r.channels.call) },
      // REQ-13 (CR-8): a parent's receipt = every child named for them is confirmed.
      { label: 'Receipt', render: (r) => (r.confirmed ? statusBadge('ok', 'Confirmed') : statusBadge('failed', 'Not yet confirmed')) },
    ], status.rows));
}

const TRIGGER_TEXT = {
  publish: 'On publish',
  urgent: 'Urgent – sent at once',
  'no-confirmation-5min': 'No confirmation after 5 min',
  'no-confirmation-2min': 'No confirmation after 2 min',
  'delivery-report': 'Delivery report', // REQ-13 (V2, CR-7)
};

// REQ-06, REQ-09, REQ-13, Constitution VI: simulated deliveries are visible.
export function deliveryLogTable(store, records) {
  const people = store.state.people;
  return table([
    { label: 'Time', render: (d) => formatTime(d.at) },
    { label: 'Recipient', render: (d) => people[d.personId].name },
    { label: 'Channel', key: 'channel' },
    { label: 'Status', render: (d) => el('span', {}, channelCell(d.status), d.reason ? el('span', { class: 'muted small' }, ` ${d.reason}`) : null) },
    { label: 'Why', render: (d) => TRIGGER_TEXT[d.trigger] },
    { label: 'Message (simulated)', render: (d) => el('span', { class: 'small' }, d.content) },
  ], records, 'No messages have been simulated yet.');
}

// REQ-12, REQ-17: one card per message; unconfirmed FINAL alerts are prominent.
// REQ-05: heads-ups use the UNCONFIRMED style and have no confirm button.
export function alertCard(alert, onConfirm) {
  if (alert.kind === 'heads-up') {
    return el('div', { class: alert.superseded ? 'card' : 'card card-unconfirmed' },
      el('div', { class: 'row' },
        alert.superseded ? statusBadge('superseded', 'Superseded by FINAL notice') : statusBadge('unconfirmed', 'UNCONFIRMED – not official yet'),
        el('span', { class: 'muted' }, `${alert.game} · ${formatTime(alert.at)}`)),
      el('p', { class: alert.superseded ? 'small muted' : 'small' }, alert.content));
  }
  if (alert.unconfirmed) {
    return el('div', { class: 'alert-prominent' },
      el('div', { class: 'row' }, statusBadge('final'), el('strong', {}, alert.label), el('span', { class: 'muted' }, alert.game)),
      el('p', {}, alert.content),
      el('button', { class: 'primary', onclick: () => onConfirm(alert.id) }, 'Confirm receipt'));
  }
  return el('div', { class: 'card' },
    el('div', { class: 'row' },
      alert.superseded ? statusBadge('superseded', 'Superseded by a newer FINAL notice') : statusBadge('final'),
      el('strong', {}, alert.label),
      el('span', { class: 'muted' }, alert.game),
      alert.confirmed && !alert.superseded ? statusBadge('ok', 'Receipt confirmed') : null,
      // REQ-20 (CR-6): an unconfirmed alert of a started game needs no confirmation any more.
      alert.started && !alert.confirmed && !alert.superseded ? statusBadge('started', 'Game started – no confirmation needed') : null),
    el('p', { class: 'small muted' }, alert.content));
}
