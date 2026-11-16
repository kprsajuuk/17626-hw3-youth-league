// Demo bar. REQ-19: switch persona (administrator, coaches, parents) and advance simulated time.

import { el } from './components.js';
import { formatClock } from './format.js';
import { advanceClock } from '../domain/clock.js';
import { resetDemo } from '../domain/store.js';

let personaId = 'brenda';

export function currentPersona() {
  return personaId;
}

export function setPersona(id) {
  personaId = id;
}

let clockNode = null;

export function updateClock(store) {
  if (clockNode) clockNode.textContent = formatClock(store.state.now);
}

export function renderDemoBar(store, root, onPersonaChange) {
  const people = Object.values(store.state.people);
  const group = (label, role) => el('optgroup', { label },
    people.filter((p) => p.role === role)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => el('option', { value: p.id, selected: p.id === personaId }, p.name)));

  const select = el('select', {
    id: 'persona',
    onchange: (e) => { personaId = e.target.value; onPersonaChange(); },
  }, group('Administrator', 'admin'), group('Coaches', 'coach'), group('Parents', 'parent'));

  clockNode = el('span', { class: 'clock', title: 'Demo clock' }, formatClock(store.state.now));

  root.replaceChildren(
    el('label', { for: 'persona' }, 'Viewing as'),
    select,
    el('span', { class: 'spacer' }),
    el('span', { class: 'muted' }, 'Demo clock'),
    clockNode,
    el('button', { onclick: () => advanceClock(store, 1) }, '+1 min'),
    el('button', { onclick: () => advanceClock(store, 5) }, '+5 min'),
    el('button', { onclick: () => resetDemo(store) }, 'Reset demo'),
  );
}
