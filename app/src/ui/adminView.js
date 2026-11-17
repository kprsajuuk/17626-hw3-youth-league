// Administrator view (Brenda). REQ-01 (verification record before publishing), REQ-02 (only the
// admin sees the publish form), REQ-03 / REQ-04 (FINAL status with old → new, instruction, author,
// time; V2: Cancelled / Moved with field, time or both, CR-5; a cancellation is final, CR-2),
// REQ-06 (activity log), REQ-13 (notice status), REQ-20 (started games: no publish form),
// Constitution VI (visible delivery log).

import { el, gameCard, gameDetail, noticeStatusTable, deliveryLogTable, table } from './components.js';
import { formatTime, toDateTimeLocal, timeOnDay } from './format.js';
import { can } from '../domain/permissions.js';
import { publishChange, gameStatus, whereWhen, VERIFICATION_SOURCES } from '../domain/notices.js';
import { noticeStatus } from '../domain/confirmations.js';
import { activityLog, deliveryLog } from '../domain/queries.js';
import { currentDetails, gameStarted, isCancelled } from '../domain/store.js';

const ERROR_TEXT = {
  'verification-required': 'A verification record (source and time) is required before publishing.',
  'verification-in-future': 'The verification time cannot be later than the current time.',
  'invalid-change': 'A move must change the field, the kickoff time or both, and a new kickoff must be in the future.',
  'game-cancelled': 'This game is cancelled. A cancellation is final.',
  'instruction-required': 'Tell families what to do before publishing.',
  'game-started': 'This game has already started, so it can no longer be changed.',
  'not-authorized': 'Only the league administrator can publish an official status.',
};

let ui = freshUi();

function freshUi() {
  return { tab: 'games', selectedGameId: null, draft: null, message: null };
}

export function resetUi() {
  ui = freshUi();
}

function freshDraft() {
  // newField / newKickoff null = not yet pre-filled with the game's current details.
  return { changeType: 'moved', newField: null, newKickoff: null, instruction: '', instructionEdited: false, source: '', confirmedAt: '' };
}

// Suggested instruction per change; Brenda can edit it (spec Assumptions). V2 (CR-5): a move may
// change the field, the time or both.
function suggestedInstruction(d, current) {
  if (d.changeType === 'cancelled') return 'No game today; do not travel.';
  const field = (d.newField || '').trim();
  const kickoff = d.newKickoff ? new Date(d.newKickoff).getTime() : null;
  const fieldMoved = !!field && field !== current.field;
  const timeMoved = kickoff !== null && !Number.isNaN(kickoff) && kickoff !== current.kickoff;
  if (fieldMoved && timeMoved) return `Go to ${field} for the new kickoff at ${formatTime(kickoff)}.`;
  if (fieldMoved) return `Go to ${field} at the original time.`;
  if (timeMoved) return `Arrive for the new kickoff at ${formatTime(kickoff)}.`;
  return 'Change the field, the kickoff time or both.';
}

// REQ-03, REQ-20: why a game offers no publish form.
function noPublishNote(store, game) {
  if (gameStarted(store, game)) return 'This game has already started.';
  if (isCancelled(store, game)) return ERROR_TEXT['game-cancelled'];
  return 'Only the league administrator can publish an official status.';
}

export function render(store, personaId, root) {
  const games = Object.values(store.state.games).sort((a, b) => a.scheduled.kickoff - b.scheduled.kickoff);
  const deliveries = deliveryLog(store, personaId);
  const activity = activityLog(store, personaId);

  const tab = (id, label) => el('button', {
    class: ui.tab === id ? 'active' : null,
    onclick: () => { ui.tab = id; rerender(); },
  }, label);

  const rerender = () => { root.replaceChildren(); render(store, personaId, root); };

  root.append(
    el('h1', {}, 'League administrator — Brenda'),
    el('div', { class: 'tabs' },
      tab('games', 'Games'),
      tab('delivery', `Delivery log (${deliveries.length})`),
      tab('activity', `Activity log (${activity.length})`)),
  );

  if (ui.tab === 'delivery') {
    root.append(el('p', { class: 'muted' }, 'Every simulated in-app alert, email, text and call. Entries cannot be edited.'),
      deliveryLogTable(store, deliveries));
    return;
  }
  if (ui.tab === 'activity') {
    root.append(el('p', { class: 'muted' }, 'Every publish and attempt, with author and time. Entries cannot be edited.'),
      table([
        { label: 'Time', render: (e) => formatTime(e.at) },
        { label: 'Type', key: 'type' },
        { label: 'Author', render: (e) => store.state.people[e.authorId]?.name ?? e.authorId },
        { label: 'Content', key: 'content' },
      ], activity, 'No activity yet.'));
    return;
  }

  for (const game of games) {
    const selected = ui.selectedGameId === game.id;
    root.append(gameCard({
      title: gameStatus(store, game.id).title,
      status: gameStatus(store, game.id),
      whereWhen: whereWhen(store, game.id),
      selected,
      onOpen: () => {
        ui.selectedGameId = selected ? null : game.id;
        ui.draft = freshDraft();
        ui.message = null;
        rerender();
      },
      extra: selected ? selectedGame(store, personaId, game, rerender) : null,
    }));
  }
}

function selectedGame(store, personaId, game, rerender) {
  const st = gameStatus(store, game.id);
  return el('div', {},
    gameDetail(store, game.id),
    can(store, personaId, 'publish', game.id)
      ? publishForm(store, personaId, game, rerender)
      : el('p', { class: 'muted' }, noPublishNote(store, game)),
    st.noticeId ? el('div', {}, el('h3', {}, 'Notice status'), noticeStatusTable(noticeStatus(store, st.noticeId, personaId))) : null);
}

// REQ-01, REQ-02, REQ-03
function publishForm(store, personaId, game, rerender) {
  const d = ui.draft || (ui.draft = freshDraft());
  const current = currentDetails(store, game);
  if (d.newField === null) d.newField = current.field;
  if (d.newKickoff === null) d.newKickoff = toDateTimeLocal(current.kickoff);
  if (!d.instructionEdited) d.instruction = suggestedInstruction(d, current);

  // Text/time edits update the draft in place (no re-render), so a click on Publish right after
  // typing is not lost to a re-rendered button. Only the change-type radio re-renders the form.
  let instructionBox = null;
  const update = (key, redraw = false) => (e) => {
    d[key] = e.target.value;
    if (key === 'instruction') d.instructionEdited = true;
    if (!d.instructionEdited && instructionBox) {
      d.instruction = suggestedInstruction(d, current);
      instructionBox.value = d.instruction;
    }
    if (redraw) rerender();
  };

  const typeOption = (value, label) => el('label', {},
    el('input', { type: 'radio', name: 'changeType', value, checked: d.changeType === value, onchange: update('changeType', true) }),
    ` ${label}`);

  const submit = () => {
    const res = publishChange(store, personaId, {
      gameId: game.id,
      changeType: d.changeType,
      newField: d.newField,
      newKickoff: d.newKickoff ? new Date(d.newKickoff).getTime() : null,
      instruction: d.instruction,
      verification: { source: d.source, confirmedAt: d.confirmedAt ? timeOnDay(store.state.now, d.confirmedAt) : null },
    });
    if (res.ok) {
      ui.draft = freshDraft();
      ui.message = { ok: true, text: 'Published as FINAL. Affected families and coaches have been notified (simulated).' };
    } else {
      ui.message = { ok: false, text: ERROR_TEXT[res.error] || res.error };
    }
    rerender();
  };

  return el('fieldset', {},
    el('legend', {}, 'Publish an official change (FINAL)'),
    el('div', { class: 'row' },
      typeOption('cancelled', 'Cancelled'),
      typeOption('moved', 'Moved (field, time or both)')),
    d.changeType === 'moved'
      ? el('div', { class: 'row' },
        el('div', { class: 'field' }, el('label', { for: 'newField' }, `Field (now ${current.field})`),
          el('input', { id: 'newField', value: d.newField, placeholder: 'e.g. Field 7', oninput: update('newField') })),
        el('div', { class: 'field' }, el('label', { for: 'newKickoff' }, `Kickoff (now ${formatTime(current.kickoff)})`),
          el('input', { id: 'newKickoff', type: 'datetime-local', value: d.newKickoff, min: toDateTimeLocal(store.state.now), oninput: update('newKickoff'), onchange: update('newKickoff') })))
      : null,
    el('div', { class: 'field' }, el('label', { for: 'instruction' }, 'What families should do'),
      instructionBox = el('textarea', { id: 'instruction', oninput: update('instruction') }, d.instruction)),
    el('div', { class: 'row' },
      el('div', { class: 'field' }, el('label', { for: 'source' }, 'Verified with'),
        el('select', { id: 'source', onchange: update('source') },
          el('option', { value: '', selected: !d.source }, '— choose —'),
          VERIFICATION_SOURCES.map((s) => el('option', { value: s, selected: d.source === s }, s)))),
      el('div', { class: 'field' }, el('label', { for: 'confirmedAt' }, 'Confirmed at (today)'),
        el('input', { id: 'confirmedAt', type: 'time', value: d.confirmedAt, oninput: update('confirmedAt'), onchange: update('confirmedAt') }))),
    ui.message ? el('p', { class: ui.message.ok ? 'ok' : 'error', role: 'status' }, ui.message.text) : null,
    el('button', { class: 'primary', onclick: submit }, 'Publish FINAL notice'));
}
