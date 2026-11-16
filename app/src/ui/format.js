// Time and label formatting (pure functions, no DOM). Used by views and by domain wording
// (REQ-03 labels such as "Sat 10:00 → Sat 13:00").

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// "Sat 10:00"
export function formatTime(ts) {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "Sat 08:30:15" — demo clock display
export function formatClock(ts) {
  const d = new Date(ts);
  return `${formatTime(ts)}:${pad(d.getSeconds())}`;
}

// "Sat 21 Nov, 10:00"
export function formatDateTime(ts) {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Value for <input type="datetime-local">
export function toDateTimeLocal(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Combine the demo day with an "HH:MM" time input value.
export function timeOnDay(dayTs, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(dayTs);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
