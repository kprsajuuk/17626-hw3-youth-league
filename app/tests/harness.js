// Minimal browser test harness (research R-7). No framework, no network.

const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertTrue(cond, msg = 'expected condition to be true') {
  if (!cond) throw new Error(msg);
}

export function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`.trim());
  }
}

export function assertDeepEqual(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg} expected ${b}, got ${a}`.trim());
}

export async function run(root = document.getElementById('results')) {
  let passed = 0;
  const lines = [];
  for (const t of tests) {
    try {
      await t.fn();
      passed += 1;
      lines.push({ ok: true, name: t.name });
    } catch (err) {
      lines.push({ ok: false, name: t.name, error: err.message });
      console.error(t.name, err);
    }
  }
  const total = tests.length;
  const summary = document.createElement('p');
  summary.id = 'summary';
  summary.className = passed === total ? 'pass' : 'fail';
  summary.textContent = `${passed} / ${total} tests passed`;
  root.appendChild(summary);
  const list = document.createElement('ul');
  for (const l of lines) {
    const li = document.createElement('li');
    li.className = l.ok ? 'pass' : 'fail';
    li.textContent = `${l.ok ? 'PASS' : 'FAIL'}  ${l.name}${l.error ? ` — ${l.error}` : ''}`;
    list.appendChild(li);
  }
  root.appendChild(list);
  return { passed, total };
}
