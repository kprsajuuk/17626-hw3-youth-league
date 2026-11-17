// Mock league fixtures — fictional people only (Constitution VI, research R-9).
// Supports scenarios for REQ-07 (affected teams only), REQ-08 (court-order restrictions),
// REQ-13 (missing contact → failed channel), REQ-17 (siblings → one notice), REQ-18 (no addresses).

export const DEMO_START = '2026-11-21T08:30'; // Saturday, local time

// Helper: a family with parents [id, name, email, phone] and children [id, first, last, teamId].
function family(id, label, parents, children) {
  return { id, label, parents, children };
}

const mail = (id) => `${id}@mail.example.test`;
let phoneSeq = 100;
const phone = () => `555-0${phoneSeq++}`;

// Undefined email/phone = generated fake contact; null = "not on file".
const FAMILIES = [
  // U10 Blue — exactly 10 families (A–I and M)
  family('fam-a', 'Family A', [['ana-adams', 'Ana Adams']], [['ava-adams', 'Ava', 'Adams', 'u10-blue']]),
  family('fam-b', 'Family B', [['xavier-bell', 'Xavier Bell'], ['yolanda-bell', 'Yolanda Bell']],
    [['bea-bell', 'Bea', 'Bell', 'u10-blue']]),
  family('fam-c', 'Family C', [['carl-chen', 'Carl Chen']], [['cody-chen', 'Cody', 'Chen', 'u10-blue']]),
  family('fam-d', 'Family D', [['dana-diaz', 'Dana Diaz']],
    [['dev-diaz', 'Dev', 'Diaz', 'u10-blue'], ['dia-diaz', 'Dia', 'Diaz', 'u10-blue']]),
  family('fam-e', 'Family E', [['wes-evans', 'Wes Evans'], ['erin-evans', 'Erin Evans']],
    [['eli-evans', 'Eli', 'Evans', 'u10-blue'], ['emma-evans', 'Emma', 'Evans', 'u10-blue']]),
  family('fam-f', 'Family F', [['fay-fox', 'Fay Fox', null]], [['finn-fox', 'Finn', 'Fox', 'u10-blue']]),
  family('fam-g', 'Family G', [['gus-gray', 'Gus Gray', undefined, null]], [['gia-gray', 'Gia', 'Gray', 'u10-blue']]),
  family('fam-h', 'Family H', [['hana-hill', 'Hana Hill']], [['hugo-hill', 'Hugo', 'Hill', 'u10-blue']]),
  family('fam-i', 'Family I', [['ivan-iqbal', 'Ivan Iqbal']], [['isla-iqbal', 'Isla', 'Iqbal', 'u10-blue']]),
  family('fam-m', 'Family M', [['mike-moreno', 'Mike Moreno']],
    [['max-moreno', 'Max', 'Moreno', 'u10-blue'], ['mia-moreno', 'Mia', 'Moreno', 'u12-red']]),
  // U10 Red — 4 families
  family('fam-j', 'Family J', [['jo-james', 'Jo James']], [['jay-james', 'Jay', 'James', 'u10-red']]),
  family('fam-k', 'Family K', [['kim-kato', 'Kim Kato']], [['kai-kato', 'Kai', 'Kato', 'u10-red']]),
  family('fam-l', 'Family L', [['lee-lopez', 'Lee Lopez']], [['lia-lopez', 'Lia', 'Lopez', 'u10-red']]),
  family('fam-n', 'Family N', [['nia-nash', 'Nia Nash']], [['noa-nash', 'Noa', 'Nash', 'u10-red']]),
  // U12 Red — 4 families including Mike's (Mia, above)
  // V2 (research R-9): two unrestricted parents, so US6 #6 / CR-8 regression can be shown in the UI.
  family('fam-o', 'Family O', [['omar-ortiz', 'Omar Ortiz'], ['olga-ortiz', 'Olga Ortiz']], [['oli-ortiz', 'Oli', 'Ortiz', 'u12-red']]),
  family('fam-p', 'Family P', [['pat-park', 'Pat Park']], [['pia-park', 'Pia', 'Park', 'u12-red']]),
  family('fam-q', 'Family Q', [['quinn-ross', 'Quinn Ross']], [['remy-ross', 'Remy', 'Ross', 'u12-red']]),
  // U12 Gold — 3 families
  family('fam-s', 'Family S', [['sam-soto', 'Sam Soto']], [['sky-soto', 'Sky', 'Soto', 'u12-gold']]),
  family('fam-t', 'Family T', [['tara-tan', 'Tara Tan']], [['teo-tan', 'Teo', 'Tan', 'u12-gold']]),
  family('fam-u', 'Family U', [['uma-usman', 'Uma Usman']], [['uri-usman', 'Uri', 'Usman', 'u12-gold']]),
];

const STAFF = [
  ['brenda', 'Brenda (League Admin)', 'admin'],
  ['coach-u10-blue', 'Ray (Coach U10 Blue)', 'coach'],
  ['coach-u10-red', 'Coach Rivera (U10 Red)', 'coach'],
  ['coach-u12-red', 'Coach Patel (U12 Red)', 'coach'],
  ['coach-u12-gold', 'Coach Gomez (U12 Gold)', 'coach'],
];

const TEAMS = [
  ['u10-blue', 'U10 Blue', 'coach-u10-blue'],
  ['u10-red', 'U10 Red', 'coach-u10-red'],
  ['u12-red', 'U12 Red', 'coach-u12-red'],
  ['u12-gold', 'U12 Gold', 'coach-u12-gold'],
];

// REQ-08: parent X is restricted for their only child; parent W for one of two children.
const RESTRICTIONS = [
  { parentId: 'xavier-bell', childId: 'bea-bell' },
  { parentId: 'wes-evans', childId: 'eli-evans' },
];

const GAMES = [
  ['g-u10', ['u10-blue', 'u10-red'], '2026-11-21T10:00', 'Field 3'],
  ['g-u12', ['u12-red', 'u12-gold'], '2026-11-22T10:00', 'Field 5'],
  ['g-past', ['u12-gold', 'u12-red'], '2026-11-21T07:00', 'Field 1'],
];

// Returns a fresh copy of all fixtures every call, so "Reset demo" restores the start state.
export function seed() {
  phoneSeq = 100;
  const people = {};
  const families = {};
  const children = {};
  const teams = {};
  const games = {};

  for (const [id, name, role] of STAFF) {
    people[id] = { id, name, role, email: mail(id), phone: phone(), familyId: null };
  }
  for (const f of FAMILIES) {
    families[f.id] = { id: f.id, label: f.label, parentIds: [], childIds: [] };
    for (const [id, name, email, ph] of f.parents) {
      people[id] = {
        id,
        name,
        role: 'parent',
        email: email === undefined ? mail(id) : email,
        phone: ph === undefined ? phone() : ph,
        familyId: f.id,
      };
      families[f.id].parentIds.push(id);
    }
    for (const [id, firstName, lastName, teamId] of f.children) {
      children[id] = { id, firstName, lastName, teamId, familyId: f.id };
      families[f.id].childIds.push(id);
    }
  }
  for (const [id, name, coachId] of TEAMS) teams[id] = { id, name, coachId };
  for (const [id, teamIds, kickoff, field] of GAMES) {
    games[id] = {
      id,
      teamIds: [...teamIds],
      scheduled: { kickoff: new Date(kickoff).getTime(), field },
      currentNoticeId: null,
    };
  }
  return {
    people,
    families,
    children,
    teams,
    games,
    restrictions: RESTRICTIONS.map((r) => ({ ...r })),
  };
}
