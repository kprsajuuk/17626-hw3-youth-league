// Receipt confirmation and notice status.
// REQ-12: a recipient can confirm receipt of a FINAL notice.
// REQ-13: coach (own team) and administrator see per-recipient, per-channel status and the
//         families who have not confirmed.
// REQ-14: wording only claims "confirmed receipt".
// REQ-10, REQ-13, REQ-08 (V2, CR-8, research R-15): confirmation is counted per child. A child is
// confirmed once a parent notified about that child confirms; a parent once every child named in
// their notice is confirmed; a family once all its affected children are. `recipient.childIds`
// never holds a child the parent is restricted for, so a restricted parent can never count for,
// or be listed next to, that child. (Replaces the family rule of Clarifications 2026-11-16.)

import { notify, teamOfCoach } from './store.js';
import { can } from './permissions.js';
import { childDisplayName } from './recipients.js';
import { cancelEscalations } from './delivery.js';

const CHANNELS = ['in-app', 'email', 'text', 'call'];

function hasConfirmation(store, noticeId, personId) {
  return store.state.confirmations.some((c) => c.noticeId === noticeId && c.personId === personId);
}

// REQ-10, REQ-13 (CR-8): some parent notified about this child has confirmed.
export function childConfirmed(store, notice, childId) {
  return notice.recipients.some((r) => r.childIds.includes(childId) && hasConfirmation(store, notice.id, r.personId));
}

// REQ-12, REQ-10 (CR-8): a parent is confirmed once every child named in their notice is
// confirmed (by them or another parent notified about that child); a coach by their own action.
export function isConfirmedFor(store, notice, personId) {
  const recipient = notice.recipients.find((r) => r.personId === personId);
  if (!recipient) return false;
  if (!recipient.familyId) return hasConfirmation(store, notice.id, personId);
  return recipient.childIds.every((cid) => childConfirmed(store, notice, cid));
}

// The family's children named in this notice (optionally limited, e.g. to a coach's team).
function familyChildIds(notice, familyId, inScope = () => true) {
  return [...new Set(notice.recipients.filter((r) => r.familyId === familyId).flatMap((r) => r.childIds))].filter(inScope);
}

// REQ-13 (CR-8): a family is confirmed once all of its affected children are confirmed.
export function familyConfirmed(store, notice, familyId, inScope = () => true) {
  return familyChildIds(notice, familyId, inScope).every((cid) => childConfirmed(store, notice, cid));
}

// REQ-12
export function confirmReceipt(store, actorId, noticeId) {
  const notice = store.state.notices[noticeId];
  if (!notice || !notice.recipients.some((r) => r.personId === actorId)) return { ok: false, error: 'not-recipient' };
  if (notice.state === 'superseded') return { ok: false, error: 'superseded' };
  if (!hasConfirmation(store, noticeId, actorId)) {
    store.state.confirmations.push(Object.freeze({ noticeId, personId: actorId, at: store.state.now }));
  }
  // REQ-10 / REQ-11 (CR-8): stop pending texts and calls for every recipient who is now
  // confirmed — possibly other parents of the same children, never a parent with an
  // unconfirmed child left.
  const nowConfirmed = notice.recipients.filter((r) => isConfirmedFor(store, notice, r.personId)).map((r) => r.personId);
  cancelEscalations(store, noticeId, nowConfirmed);
  notify(store);
  return { ok: true };
}

// REQ-13, REQ-14, REQ-18
export function noticeStatus(store, noticeId, viewerId) {
  if (!can(store, viewerId, 'view-status', noticeId)) return null;
  const { notices, games, people, children, families, deliveries } = store.state;
  const notice = notices[noticeId];
  const viewer = people[viewerId];
  const scopeTeams = viewer.role === 'admin' ? games[notice.gameId].teamIds : [teamOfCoach(store, viewerId).id];

  const inScope = (r) => (r.familyId
    ? r.childIds.some((cid) => scopeTeams.includes(children[cid].teamId))
    : scopeTeams.includes(r.teamId));

  const childInScope = (cid) => scopeTeams.includes(children[cid].teamId);

  const rows = notice.recipients.filter(inScope).map((r) => {
    const channels = {};
    for (const ch of CHANNELS) {
      // REQ-13 (CR-7): the latest record per channel ("sent", then the "delivered" report).
      const recs = deliveries.filter((d) => d.messageId === noticeId && d.personId === r.personId && d.channel === ch);
      channels[ch] = recs.length ? recs[recs.length - 1].status : '—';
    }
    const childIds = r.childIds.filter(childInScope);
    return {
      personId: r.personId,
      person: people[r.personId].name,
      familyId: r.familyId,
      family: r.familyId ? families[r.familyId].label : 'Coach',
      childIds,
      children: childIds.map((cid) => childDisplayName(children[cid])),
      channels,
      confirmedSelf: hasConfirmation(store, noticeId, r.personId),
      confirmed: r.familyId
        ? childIds.every((cid) => childConfirmed(store, notice, cid))
        : hasConfirmation(store, noticeId, r.personId),
    };
  });

  // Count families, not people (one family may have two notified parents). CR-8: per child.
  const familyIds = [...new Set(rows.filter((r) => r.familyId).map((r) => r.familyId))];
  const notConfirmed = familyIds
    .filter((fid) => !familyConfirmed(store, notice, fid, childInScope))
    .map((fid) => ({
      familyId: fid,
      label: families[fid].label,
      // REQ-08, REQ-13 (CR-8): only the parents notified about an unconfirmed child, each with only
      // those children — a restricted parent is never listed next to the restricted child.
      parents: rows
        .filter((r) => r.familyId === fid)
        .map((r) => ({ name: r.person, childIds: r.childIds.filter((cid) => !childConfirmed(store, notice, cid)) }))
        .filter((p) => p.childIds.length)
        .map((p) => ({ name: p.name, children: p.childIds.map((cid) => childDisplayName(children[cid])) })),
    }));
  const confirmedCount = familyIds.length - notConfirmed.length;

  return {
    noticeId,
    rows,
    notConfirmed,
    totalFamilies: familyIds.length,
    confirmedFamilies: confirmedCount,
    summary: `${confirmedCount} of ${familyIds.length} confirmed receipt`, // REQ-14
  };
}
