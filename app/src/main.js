// App boot. REQ-19: routes the view by the active persona's role; the demo clock runs at real
// speed and can be advanced from the demo bar.

import { createStore, subscribe } from './domain/store.js';
import { tick, SECOND } from './domain/clock.js';
import { renderDemoBar, currentPersona, setPersona, updateClock } from './ui/demoBar.js';
import * as adminView from './ui/adminView.js';
import * as coachView from './ui/coachView.js';
import * as parentView from './ui/parentView.js';

const VIEWS = { admin: adminView, coach: coachView, parent: parentView };

const store = createStore();
const bar = document.getElementById('demo-bar');
const root = document.getElementById('view');

function render() {
  renderDemoBar(store, bar, render);
  const person = store.state.people[currentPersona()];
  root.replaceChildren();
  VIEWS[person.role].render(store, person.id, root);
}

subscribe(store, (reason) => {
  if (reason === 'tick') {
    updateClock(store); // keep form inputs intact on real-time seconds
    return;
  }
  if (reason === 'reset') {
    Object.values(VIEWS).forEach((v) => v.resetUi && v.resetUi());
    if (!store.state.people[currentPersona()]) setPersona('brenda');
  }
  render();
});

setInterval(() => tick(store, store.state.now + SECOND, 'tick'), SECOND);

render();

// Exposed for debugging in the browser console only.
window.__store = store;
