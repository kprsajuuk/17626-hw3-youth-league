// Read-only queries used by the views.
// REQ-06: activity log (administrator only).
// REQ-12, REQ-17: alertsFor — a person's messages, unconfirmed ones flagged.
// REQ-13, Constitution VI: deliveryLog — visible simulated deliveries, scoped to the viewer.
// REQ-15, REQ-08: parentGames — every eligible child's games today (V2: including started ones,
// REQ-20) and later, in one list. REQ-20 (V2, CR-6): alerts of started games need no confirmation.

import { can } from './permissions.js';
import { teamOfCoach, gameName, currentDetails, gameStarted } from './store.js';
import { noticeLabel, HEADS_UP_PREFIX, gameStatus } from './notices.js';
import { isConfirmedFor } from './confirmations.js';
import { childDisplayName, isRestricted } from './recipients.js';

// The text a person was actually sent (their in-app record), so a message never changes after
// the game changes (REQ-06: content is logged as sent).
function sentContent(store, messageId, personId) {
  const rec = store.state.deliveries.find((d) => d.messageId === messageId && d.personId === personId && d.channel === 'in-app');
  return rec ? rec.content : '';
}

// REQ-20: the demo clock's calendar day (local time).
function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// REQ-06
export function activityLog(store, viewerId) {
  if (!can(store, viewerId, 'view-activity-log')) return [];
  return [...store.state.activity].reverse();
}

// REQ-12, REQ-17: one entry per message (never one per child or per channel).
// REQ-05: heads-ups are listed too, labelled UNCONFIRMED; they never need confirmation and are
// marked superseded once the FINAL notice replaces them.
export function alertsFor(store, personId) {
  const finals = finalAlertsFor(store, personId);
  const heads = headsUpAlertsFor(store, personId);
  return [...finals, ...heads].sort((a, b) => b.at - a.at);
}

function headsUpAlertsFor(store, personId) {
  const { headsUps, games, children } = store.state;
  return Object.values(headsUps)
    .filter((h) => h.recipients.some((r) => r.personId === personId))
    .map((h) => {
      const r = h.recipients.find((x) => x.personId === personId);
      return {
        id: h.id,
        kind: 'heads-up',
        gameId: h.gameId,
        game: gameName(store, games[h.gameId]),
        label: HEADS_UP_PREFIX,
        at: h.sentAt,
        content: sentContent(store, h.id, personId),
        children: r.childIds.map((cid) => childDisplayName(children[cid])),
        superseded: h.state === 'superseded',
        confirmed: false,
        unconfirmed: false,
      };
    });
}

function finalAlertsFor(store, personId) {
  const { notices, games, children } = store.state;
  return Object.values(notices)
    .filter((n) => n.recipients.some((r) => r.personId === personId))
    .sort((a, b) => b.publishedAt - a.publishedAt || (a.id < b.id ? 1 : -1))
    .map((n) => {
      const r = n.recipients.find((x) => x.personId === personId);
      const confirmed = isConfirmedFor(store, n, personId); // REQ-10 (CR-8): per child
      const started = gameStarted(store, games[n.gameId]); // REQ-20 (CR-6)
      return {
        id: n.id,
        kind: 'final',
        gameId: n.gameId,
        game: gameName(store, games[n.gameId]),
        label: noticeLabel(n),
        at: n.publishedAt,
        notice: n,
        content: sentContent(store, n.id, personId),
        children: r.childIds.map((cid) => childDisplayName(children[cid])),
        superseded: n.state === 'superseded',
        confirmed,
        started,
        // REQ-12, REQ-20: once the game has started the alert leaves "Needs your confirmation".
        unconfirmed: n.state === 'current' && !confirmed && !started,
      };
    });
}

// REQ-13, Constitution VI. Admin: every record. Coach: records for games of their team, limited
// to their team's families and themself. Parents: none.
export function deliveryLog(store, viewerId) {
  const { people, notices, games, children } = store.state;
  const viewer = people[viewerId];
  if (!viewer) return [];
  const all = [...store.state.deliveries].reverse();
  if (viewer.role === 'admin') return all;
  if (viewer.role !== 'coach') return [];
  const team = teamOfCoach(store, viewerId);
  return all.filter((d) => {
    const msg = notices[d.messageId] || store.state.headsUps[d.messageId];
    if (!msg || !games[msg.gameId].teamIds.includes(team.id)) return false;
    if (d.personId === viewerId) return true;
    const r = msg.recipients.find((x) => x.personId === d.personId);
    return !!r && r.childIds.some((cid) => children[cid].teamId === team.id);
  });
}

// REQ-15, REQ-08, REQ-05, REQ-20: games of the parent's children whose current kickoff is today
// (by the demo clock, started or not) or later, minus children the parent is restricted for,
// sorted by kickoff. Started games stay until the end of that day, tagged via `started`.
// labelKind: 'final' (official change), 'unconfirmed' (only an active heads-up), 'scheduled'.
export function parentGames(store, parentId) {
  const { people, families, children, games } = store.state;
  const person = people[parentId];
  if (!person || person.role !== 'parent') return [];
  const kids = families[person.familyId].childIds
    .filter((cid) => !isRestricted(store, parentId, cid))
    .map((cid) => children[cid]);
  const alerts = alertsFor(store, parentId);

  return Object.values(games)
    .filter((g) => currentDetails(store, g).kickoff >= startOfDay(store.state.now))
    .map((g) => ({ game: g, kids: kids.filter((c) => g.teamIds.includes(c.teamId)) }))
    .filter((x) => x.kids.length)
    .sort((a, b) => currentDetails(store, a.game).kickoff - currentDetails(store, b.game).kickoff)
    .map(({ game, kids: k }) => {
      const status = gameStatus(store, game.id);
      const gameAlerts = alerts.filter((a) => a.gameId === game.id);
      const headsUps = gameAlerts.filter((a) => a.kind === 'heads-up' && !a.superseded);
      let labelKind = 'scheduled';
      if (status.kind === 'final') labelKind = 'final';
      else if (headsUps.length) labelKind = 'unconfirmed';
      return {
        gameId: game.id,
        game,
        title: status.title,
        children: k.map(childDisplayName),
        status,
        labelKind,
        started: status.started,
        headsUps,
        unconfirmedAlerts: gameAlerts.filter((a) => a.unconfirmed),
      };
    });
}
