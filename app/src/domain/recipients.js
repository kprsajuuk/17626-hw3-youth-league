// Recipient resolution and child display (research R-5).
// REQ-07: notices reach only the affected team(s); heads-ups only the sending coach's team.
// REQ-08: a parent restricted for a child never receives anything about that child.
// REQ-17: one recipient entry per parent per message, naming every eligible child.
// REQ-18: children are shown by first name and last initial only, everywhere.

// REQ-18
export function childDisplayName(child) {
  return `${child.firstName} ${child.lastName[0]}.`;
}

// REQ-08
export function isRestricted(store, parentId, childId) {
  return store.state.restrictions.some((r) => r.parentId === parentId && r.childId === childId);
}

// REQ-07, REQ-08, REQ-17
// audience: { kind: 'final' } → every league team in the game;
//           { kind: 'heads-up', teamId } → only that team.
export function resolveRecipients(store, gameId, audience) {
  const { games, families, children, teams } = store.state;
  const game = games[gameId];
  const teamIds = audience.kind === 'heads-up' ? [audience.teamId] : [...game.teamIds];
  const out = [];

  for (const family of Object.values(families)) {
    for (const parentId of family.parentIds) {
      // REQ-08: drop restricted children before anything is created for this parent.
      const childIds = family.childIds.filter(
        (cid) => teamIds.includes(children[cid].teamId) && !isRestricted(store, parentId, cid),
      );
      if (childIds.length) out.push({ personId: parentId, familyId: family.id, childIds }); // REQ-17
    }
  }
  for (const teamId of teamIds) {
    out.push({ personId: teams[teamId].coachId, familyId: null, childIds: [], teamId });
  }
  return out;
}
