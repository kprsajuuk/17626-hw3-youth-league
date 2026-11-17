// Parent view. REQ-12 (unconfirmed FINAL alerts stay prominent until receipt is confirmed),
// REQ-14 (receipt wording), REQ-08 (restricted children never shown), REQ-18 (names).
// REQ-05: active heads-ups shown as UNCONFIRMED, separate from FINAL alerts.
// REQ-15: one combined list of every eligible child's games today and later (parentGames).
// REQ-20 (V2, CR-6): started games tagged "Started"; their alerts move to "Earlier messages".

import { el, statusBadge, alertCard } from './components.js';
import { whereWhen } from '../domain/notices.js';
import { confirmReceipt } from '../domain/confirmations.js';
import { alertsFor, parentGames } from '../domain/queries.js';
import { formatTime } from './format.js';

export function resetUi() {}

export function render(store, personaId, root) {
  const person = store.state.people[personaId];
  const alerts = alertsFor(store, personaId);
  const open = alerts.filter((a) => a.unconfirmed);
  const pending = alerts.filter((a) => a.kind === 'heads-up' && !a.superseded);
  const earlier = alerts.filter((a) => !a.unconfirmed && !pending.includes(a));
  const onConfirm = (id) => confirmReceipt(store, personaId, id);

  const games = parentGames(store, personaId); // REQ-15, REQ-08

  root.append(
    el('h1', {}, `Parent — ${person.name}`),
    el('h2', {}, `Needs your confirmation (${open.length})`),
    el('div', {}, open.length ? open.map((a) => alertCard(a, onConfirm)) : el('p', { class: 'muted' }, 'No unconfirmed alerts.')),
    el('div', {}, pending.length
      ? [el('h2', {}, `Possible changes — not official yet (${pending.length})`), pending.map((a) => alertCard(a, onConfirm))]
      : null),
    el('h2', {}, 'My children’s games'),
    el('div', {}, games.length
      ? games.map((g) => el('div', { class: g.labelKind === 'unconfirmed' ? 'card card-unconfirmed' : 'card' },
        el('div', { class: 'row' },
          el('strong', {}, g.children.join(', ')),
          el('span', {}, g.title),
          statusBadge(g.labelKind),
          g.labelKind === 'final' ? el('span', {}, g.status.label) : null,
          g.started ? statusBadge('started') : null, // REQ-20
          el('span', { class: 'muted' }, whereWhen(store, g.gameId)),
          g.unconfirmedAlerts.length ? statusBadge('failed', 'Needs your confirmation') : null),
        g.labelKind === 'final'
          ? el('p', { class: 'small' },
            el('strong', {}, 'Was: '), `${formatTime(g.status.old.kickoff)} · ${g.status.old.field}`, ' · ',
            el('strong', {}, 'What to do: '), g.status.instruction)
          : el('p', { class: 'small muted' }, 'Official status: as scheduled.'),
        g.headsUps.map((h) => el('p', { class: 'small' },
          statusBadge('unconfirmed', 'UNCONFIRMED – not official yet'), ` Coach heads-up at ${formatTime(h.at)}; the official status above has not changed.`))))
      : el('p', { class: 'muted' }, 'No games today or later.')),
    el('h2', {}, 'Earlier messages'),
    el('div', {}, earlier.length ? earlier.map((a) => alertCard(a, onConfirm)) : el('p', { class: 'muted' }, 'None yet.')),
  );
}
