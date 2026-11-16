// Official change notices. REQ-01 (verification required), REQ-02 (admin only), REQ-03 (cancel /
// field / time with old → new and instruction), REQ-04 (FINAL, author, time, replaces earlier),
// REQ-06 (every attempt logged), REQ-05 (coach heads-up, always UNCONFIRMED, never official,
// superseded by the FINAL notice — CF-1 compromise).

import { nextId, notify, currentDetails, gameStarted, gameName, teamOfCoach } from './store.js';
import { appendActivity } from './log.js';
import { dispatchFinalNotice, dispatchHeadsUp, cancelEscalations } from './delivery.js';
import { formatTime } from '../ui/format.js';

export const CHANGE_TYPES = ['cancelled', 'field', 'time'];
export const VERIFICATION_SOURCES = ['City', 'Parks Department'];
export const URGENT_WINDOW = 2 * 60 * 60 * 1000; // REQ-10 (OQ-1): urgent = kickoff within 2 hours

const toTime = (v) => (v === undefined || v === null || v === '' ? null : typeof v === 'number' ? v : new Date(v).getTime());

// REQ-03, REQ-04: wording from contracts/domain-api.md "Wording rules".
export function noticeLabel(notice) {
  switch (notice.changeType) {
    case 'cancelled':
      return 'FINAL – Cancelled';
    case 'field':
      return `FINAL – Moved: ${notice.old.field} → ${notice.new.field}`;
    case 'time':
      return `FINAL – Time changed: ${formatTime(notice.old.kickoff)} → ${formatTime(notice.new.kickoff)}`;
    default:
      return 'FINAL';
  }
}

// REQ-01, REQ-02, REQ-03, REQ-04, REQ-06
export function publishChange(store, actorId, input = {}) {
  const { people, games, notices } = store.state;
  const actor = people[actorId];
  const game = games[input.gameId];
  const nowTs = store.state.now;

  const reject = (error) => {
    // REQ-06: rejected attempts are logged too; nothing else changes.
    appendActivity(store, {
      type: 'publish-rejected',
      authorId: actorId,
      content: `Publish rejected (${error}) for ${game ? gameName(store, game) : 'unknown game'}`,
    });
    notify(store);
    return { ok: false, error };
  };

  if (!game) return reject('invalid-change');
  if (!actor || actor.role !== 'admin') return reject('not-authorized'); // REQ-02
  if (gameStarted(store, game)) return reject('game-started');

  // REQ-01: verification record (source + time) is mandatory; no fixed decision time assumed.
  const v = input.verification || {};
  const confirmedAt = toTime(v.confirmedAt);
  if (!VERIFICATION_SOURCES.includes(v.source) || confirmedAt === null || Number.isNaN(confirmedAt)) {
    return reject('verification-required');
  }
  if (confirmedAt > nowTs) return reject('verification-in-future');

  // REQ-03: one of cancelled / field / time, and it must actually change something.
  const current = currentDetails(store, game);
  const old = { kickoff: current.kickoff, field: current.field };
  let neu;
  switch (input.changeType) {
    case 'cancelled':
      if (current.cancelled) return reject('invalid-change');
      neu = {};
      break;
    case 'field': {
      const field = (input.newField || '').trim();
      if (!field || field === old.field) return reject('invalid-change');
      neu = { field };
      break;
    }
    case 'time': {
      const kickoff = toTime(input.newKickoff);
      if (kickoff === null || Number.isNaN(kickoff) || kickoff === old.kickoff || kickoff <= nowTs) {
        return reject('invalid-change');
      }
      neu = { kickoff };
      break;
    }
    default:
      return reject('invalid-change');
  }

  const instruction = (input.instruction || '').trim();
  if (!instruction) return reject('instruction-required');

  const soonestKickoff = Math.min(old.kickoff, neu.kickoff ?? old.kickoff);
  const notice = {
    id: nextId(store, 'notice'),
    gameId: game.id,
    kind: 'final',
    changeType: input.changeType,
    old,
    new: neu,
    instruction,
    verification: Object.freeze({ source: v.source, confirmedAt }),
    authorId: actorId,
    publishedAt: nowTs,
    urgent: soonestKickoff - nowTs <= URGENT_WINDOW, // REQ-10 / REQ-11: sooner of old/new kickoff
    state: 'current',
    supersededBy: null,
    recipients: [],
  };

  // REQ-04: the new FINAL notice replaces any earlier notice for this game.
  const previous = game.currentNoticeId ? notices[game.currentNoticeId] : null;
  if (previous) {
    previous.state = 'superseded';
    previous.supersededBy = notice.id;
    cancelEscalations(store, previous.id); // REQ-10: escalation restarts for the new notice
  }
  notices[notice.id] = notice;
  game.currentNoticeId = notice.id;

  // REQ-05: the FINAL notice replaces any active heads-up for this game.
  for (const h of Object.values(store.state.headsUps)) {
    if (h.gameId === game.id && h.state === 'active') {
      h.state = 'superseded';
      h.supersededBy = notice.id;
    }
  }

  // REQ-06
  appendActivity(store, {
    type: 'publish',
    authorId: actorId,
    content: `${noticeLabel(notice)} — ${gameName(store, game)} (${formatTime(old.kickoff)}, ${old.field}). `
      + `Instruction: ${instruction} Verified with ${v.source} at ${formatTime(confirmedAt)}.`,
  });

  dispatchFinalNotice(store, notice); // REQ-09, REQ-16 (US2)
  notify(store);
  return { ok: true, noticeId: notice.id };
}

// REQ-03, REQ-04: what a game entry shows.
export function gameStatus(store, gameId) {
  const { games, notices, people } = store.state;
  const game = games[gameId];
  const current = currentDetails(store, game);
  const notice = game.currentNoticeId ? notices[game.currentNoticeId] : null;
  const base = { gameId, title: gameName(store, game), current, headsUps: headsUpsFor(store, gameId) };
  if (!notice) {
    return { ...base, kind: 'scheduled', label: 'As scheduled', changeType: null, old: null, new: null,
      instruction: null, author: null, publishedAt: null, verification: null, noticeId: null };
  }
  return {
    ...base,
    kind: 'final',
    label: noticeLabel(notice),
    changeType: notice.changeType,
    old: notice.old,
    new: notice.new,
    instruction: notice.instruction,
    author: people[notice.authorId].name,
    publishedAt: notice.publishedAt,
    verification: notice.verification,
    noticeId: notice.id,
  };
}

// Earlier (superseded) notices of a game, newest first (REQ-04).
export function noticeHistory(store, gameId) {
  return Object.values(store.state.notices)
    .filter((n) => n.gameId === gameId)
    .sort((a, b) => b.publishedAt - a.publishedAt || (a.id < b.id ? 1 : -1));
}

// "Sat 10:00 · Field 3", or "Cancelled" — for cards.
export function whereWhen(store, gameId) {
  const d = currentDetails(store, store.state.games[gameId]);
  return d.cancelled ? `was ${formatTime(d.kickoff)} · ${d.field}` : `${formatTime(d.kickoff)} · ${d.field}`;
}

export const HEADS_UP_PREFIX = 'UNCONFIRMED – not official yet';

// REQ-05: heads-ups of a game, newest first, for game details.
export function headsUpsFor(store, gameId) {
  const { headsUps, people } = store.state;
  return Object.values(headsUps)
    .filter((h) => h.gameId === gameId)
    .sort((a, b) => b.sentAt - a.sentAt || (a.id < b.id ? 1 : -1))
    .map((h) => ({ id: h.id, message: h.message, author: people[h.authorId].name, sentAt: h.sentAt, state: h.state, teamId: h.teamId }));
}

// REQ-05, REQ-06, REQ-07, REQ-08 (OQ-3: every eligible family of the coach's own team).
export function sendHeadsUp(store, actorId, input = {}) {
  const { people, games } = store.state;
  const actor = people[actorId];
  const game = games[input.gameId];
  const team = actor && actor.role === 'coach' ? teamOfCoach(store, actorId) : null;

  const reject = (error) => {
    appendActivity(store, {
      type: 'heads-up-rejected',
      authorId: actorId,
      content: `Heads-up rejected (${error}) for ${game ? gameName(store, game) : 'unknown game'}`,
    });
    notify(store);
    return { ok: false, error };
  };

  if (!game || !team || !game.teamIds.includes(team.id)) return reject('not-authorized');
  if (gameStarted(store, game)) return reject('game-started');
  const message = (input.message || '').trim();
  if (!message) return reject('message-required');

  const headsUp = {
    id: nextId(store, 'headsup'),
    gameId: game.id,
    teamId: team.id,
    message,
    authorId: actorId,
    sentAt: store.state.now,
    state: 'active',
    supersededBy: null,
    recipients: [],
  };
  store.state.headsUps[headsUp.id] = headsUp;
  appendActivity(store, {
    type: 'heads-up',
    authorId: actorId,
    content: `${HEADS_UP_PREFIX}: "${message}" — ${gameName(store, game)}, sent to ${team.name} families.`,
  });
  dispatchHeadsUp(store, headsUp); // in-app + email only; never escalates (REQ-17)
  notify(store);
  return { ok: true, headsUpId: headsUp.id };
}
