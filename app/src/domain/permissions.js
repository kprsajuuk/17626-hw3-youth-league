// Role permissions (research R-8). REQ-02 (only the administrator publishes official status),
// REQ-05 (coach heads-up for own team only), REQ-19 (enforced for the active persona).
// Views use can() to hide controls; domain commands call it again and reject.

import { gameStarted, teamOfCoach } from './store.js';

export function can(store, actorId, action, target) {
  const { people, games, notices } = store.state;
  const actor = people[actorId];
  if (!actor) return false;

  switch (action) {
    case 'publish': {
      // REQ-02
      const game = games[target];
      return actor.role === 'admin' && !!game && !gameStarted(store, game);
    }
    case 'heads-up': {
      // REQ-05
      const game = games[target];
      const team = actor.role === 'coach' ? teamOfCoach(store, actorId) : null;
      return !!game && !!team && game.teamIds.includes(team.id) && !gameStarted(store, game);
    }
    case 'view-status': {
      // REQ-13: admin for any notice; a coach for notices of games of their team.
      const notice = notices[target];
      if (!notice) return false;
      if (actor.role === 'admin') return true;
      const team = actor.role === 'coach' ? teamOfCoach(store, actorId) : null;
      return !!team && games[notice.gameId].teamIds.includes(team.id);
    }
    case 'view-activity-log':
      // REQ-06
      return actor.role === 'admin';
    default:
      return false;
  }
}
