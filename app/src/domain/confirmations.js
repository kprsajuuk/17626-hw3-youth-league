// Receipt confirmation and notice status.
// REQ-12: a recipient can confirm receipt of a FINAL notice.
// REQ-13: coach (own team) and administrator see per-recipient, per-channel status and the
//         families who have not confirmed.
// REQ-14: wording only claims "confirmed receipt".
// Clarifications 2026-11-16: a family is confirmed once any notified parent confirms.

import { notify, teamOfCoach } from './store.js';
import { can } from './permissions.js';
import { childDisplayName } from './recipients.js';
import { cancelEscalations } from './delivery.js';

const CHANNELS = ['in-app', 'email', 'text', 'call'];

function hasConfirmation(store, noticeId, personId) {
  return store.state.confirmations.some((c) => c.noticeId === noticeId && c.personId === personId);
}

// REQ-12 + Clarifications: confirmed for this recipient's family (or the coach themself).
export function isConfirmedFor(store, notice, personId) {
  const recipient = notice.recipients.find((r) => r.personId === personId);
  if (!recipient) return false;
  if (!recipient.familyId) return hasConfirmation(store, notice.id, personId);
  return notice.recipients
    .filter((r) => r.familyId === recipient.familyId)
    .some((r) => hasConfirmation(store, notice.id, r.personId));
}

// REQ-12
export function confirmReceipt(store, actorId, noticeId) {
  const notice = store.state.notices[noticeId];
  if (!notice || !notice.recipients.some((r) => r.personId === actorId)) return { ok: false, error: 'not-recipient' };
  if (notice.state === 'superseded') return { ok: false, error: 'superseded' };
  if (!hasConfirmation(store, noticeId, actorId)) {
    store.state.confirmations.push(Object.freeze({ noticeId, personId: actorId, at: store.state.now }));
  }
  // REQ-10 / REQ-11 + Clarifications: stop pending texts and calls for the whole family
  // (or just the coach).
  const me = notice.recipients.find((r) => r.personId === actorId);
  const family = me.familyId ? notice.recipients.filter((r) => r.familyId === me.familyId).map((r) => r.personId) : [actorId];
  cancelEscalations(store, noticeId, family);
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

  const rows = notice.recipients.filter(inScope).map((r) => {
    const channels = {};
    for (const ch of CHANNELS) {
      const recs = deliveries.filter((d) => d.messageId === noticeId && d.personId === r.personId && d.channel === ch);
      channels[ch] = recs.length ? recs[recs.length - 1].status : '—';
    }
    return {
      personId: r.personId,
      person: people[r.personId].name,
      familyId: r.familyId,
      family: r.familyId ? families[r.familyId].label : 'Coach',
      children: r.childIds
        .filter((cid) => scopeTeams.includes(children[cid].teamId))
        .map((cid) => childDisplayName(children[cid])),
      channels,
      confirmedSelf: hasConfirmation(store, noticeId, r.personId),
      familyConfirmed: isConfirmedFor(store, notice, r.personId),
    };
  });

  // Count families, not people (one family may have two notified parents).
  const familyIds = [...new Set(rows.filter((r) => r.familyId).map((r) => r.familyId))];
  const notConfirmed = familyIds
    .filter((fid) => !rows.some((r) => r.familyId === fid && r.familyConfirmed))
    .map((fid) => ({
      familyId: fid,
      label: families[fid].label,
      // REQ-08: each parent is listed only with their own eligible children, so a restricted
      // parent never appears next to the child they are restricted for.
      parents: rows.filter((r) => r.familyId === fid).map((r) => ({ name: r.person, children: r.children })),
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
