// Coach view. REQ-02 (no publish controls; status is read-only for coaches), REQ-12 (coach
// confirms receipt of own alerts), REQ-13 (notice status for own team), Constitution VI
// (team-scoped delivery log), REQ-05 (UNCONFIRMED heads-up to the coach's own team, CF-1).

import { el, gameCard, gameDetail, noticeStatusTable, deliveryLogTable, alertCard } from './components.js';
import { gameStatus, whereWhen, sendHeadsUp } from '../domain/notices.js';
import { can } from '../domain/permissions.js';
import { noticeStatus, confirmReceipt } from '../domain/confirmations.js';
import { alertsFor, deliveryLog } from '../domain/queries.js';
import { teamOfCoach } from '../domain/store.js';

const freshUi = () => ({ tab: 'games', selectedGameId: null, headsUpText: '', headsUpMessage: null });
let ui = freshUi();

export function resetUi() {
  ui = freshUi();
}

const HEADS_UP_ERRORS = {
  'not-authorized': 'You can only send a heads-up for games of your own team.',
  'message-required': 'Write a short message first.',
  'game-started': 'This game has already started.',
};

// REQ-05
function headsUpForm(store, personaId, game, team, rerender) {
  const send = () => {
    const res = sendHeadsUp(store, personaId, { gameId: game.id, message: ui.headsUpText });
    ui.headsUpMessage = res.ok
      ? { ok: true, text: `Heads-up sent to ${team.name} families, labelled UNCONFIRMED (simulated).` }
      : { ok: false, text: HEADS_UP_ERRORS[res.error] || res.error };
    if (res.ok) ui.headsUpText = '';
    rerender();
  };
  return el('fieldset', {},
    el('legend', {}, 'Send an UNCONFIRMED heads-up'),
    el('p', { class: 'small muted' }, `Goes to all families of ${team.name}. Labelled UNCONFIRMED – it does not change the official status.`),
    el('textarea', { id: 'headsUp', placeholder: 'e.g. Field 3 may close due to rain', oninput: (e) => { ui.headsUpText = e.target.value; } }, ui.headsUpText),
    ui.headsUpMessage ? el('p', { class: ui.headsUpMessage.ok ? 'ok' : 'error', role: 'status' }, ui.headsUpMessage.text) : null,
    el('button', { class: 'primary', onclick: send }, 'Send UNCONFIRMED heads-up'));
}

export function render(store, personaId, root) {
  const team = teamOfCoach(store, personaId);
  const person = store.state.people[personaId];
  const games = Object.values(store.state.games)
    .filter((g) => g.teamIds.includes(team.id))
    .sort((a, b) => a.scheduled.kickoff - b.scheduled.kickoff);
  const alerts = alertsFor(store, personaId);
  const deliveries = deliveryLog(store, personaId);
  const rerender = () => { root.replaceChildren(); render(store, personaId, root); };
  const tab = (id, label) => el('button', { class: ui.tab === id ? 'active' : null, onclick: () => { ui.tab = id; rerender(); } }, label);

  root.append(
    el('h1', {}, `Coach — ${person.name}`),
    el('p', { class: 'muted' }, 'Only the league administrator can publish an official change.'),
    el('div', { class: 'tabs' },
      tab('games', 'Team games'),
      tab('alerts', `My alerts (${alerts.filter((a) => a.unconfirmed).length} to confirm)`),
      tab('delivery', `Delivery log — ${team.name} (${deliveries.length})`)),
  );

  if (ui.tab === 'alerts') {
    const onConfirm = (id) => confirmReceipt(store, personaId, id);
    root.append(el('div', {}, alerts.length ? alerts.map((a) => alertCard(a, onConfirm)) : el('p', { class: 'muted' }, 'No alerts yet.')));
    return;
  }
  if (ui.tab === 'delivery') {
    root.append(el('p', { class: 'muted' }, `Simulated messages to ${team.name} families and to you.`),
      deliveryLogTable(store, deliveries));
    return;
  }

  for (const game of games) {
    const selected = ui.selectedGameId === game.id;
    const st = gameStatus(store, game.id);
    root.append(gameCard({
      title: st.title,
      status: st,
      whereWhen: whereWhen(store, game.id),
      selected,
      onOpen: () => { ui.selectedGameId = selected ? null : game.id; ui.headsUpMessage = null; rerender(); },
      extra: selected
        ? el('div', {},
          gameDetail(store, game.id),
          can(store, personaId, 'heads-up', game.id) ? headsUpForm(store, personaId, game, team, rerender) : null,
          st.noticeId
            ? el('div', {}, el('h3', {}, `Notice status — ${team.name}`), noticeStatusTable(noticeStatus(store, st.noticeId, personaId)))
            : null)
        : null,
    }));
  }
}
