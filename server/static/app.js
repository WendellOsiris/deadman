const btn = document.getElementById('power-btn');
const statusPill = document.getElementById('status-pill');
const statusText = document.getElementById('status-text');
const toast = document.getElementById('toast');
const holdRing = document.getElementById('hold-ring');
const holdCircle = document.getElementById('hold-circle');

const CIRCUMFERENCE = 2 * Math.PI * 65; // exact: ~408.41
const HOLD_DURATION_MS = 5000;
const HOLD_INTERVAL_MS = 50;

let holdInterval = null;
let holdProgress = 0;

function setToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  if (msg) setTimeout(() => { toast.textContent = ''; toast.className = 'toast'; }, 3000);
}

function setStatus(online) {
  statusPill.className = 'status-pill ' + (online ? 'online' : 'offline');
  statusText.textContent = online ? 'online' : 'offline';
}

async function checkStatus() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    setStatus(d.online);
  } catch {
    statusPill.className = 'status-pill offline';
    statusText.textContent = 'unreachable';
  }
}

async function sendCommand(cmd) {
  try {
    const r = await fetch('/api/' + cmd, { method: 'POST' });
    const d = await r.json();
    if (d.ok) {
      setToast(cmd === 'wake' ? 'wake signal sent' : 'shutdown signal sent', 'success');
      btn.classList.add('success');
      setTimeout(() => btn.classList.remove('success'), 1200);
      setTimeout(checkStatus, 8000);
    } else {
      setToast('error: ' + (d.error || 'unknown'), 'danger');
    }
  } catch {
    setToast('could not reach server', 'danger');
  }
}

function setHoldColor(progress) {
  const pct = Math.min(progress, 100);
  btn.style.color = `color-mix(in srgb, var(--text-primary) ${100 - pct}%, var(--danger-stroke) ${pct}%)`;
}

function clearHoldColor() {
  btn.style.color = '';
}

function startHold() {
  holdRing.classList.remove('resetting');
  holdProgress = 0;
  holdInterval = setInterval(() => {
    holdProgress += HOLD_INTERVAL_MS / HOLD_DURATION_MS * 100;
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(holdProgress, 100) / 100);
    holdCircle.style.strokeDashoffset = offset;
    setHoldColor(holdProgress);
    if (holdProgress >= 100) {
      cancelHold();
      sendCommand('shutdown');
    }
  }, HOLD_INTERVAL_MS);
}

function cancelHold() {
  clearInterval(holdInterval);
  holdInterval = null;
  holdProgress = 0;
  holdRing.classList.add('resetting');
  holdCircle.style.strokeDashoffset = CIRCUMFERENCE;
  btn.classList.remove('pressing');
  clearHoldColor();
}

btn.addEventListener('mousedown', () => { btn.classList.add('pressing'); startHold(); });
btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.classList.add('pressing'); startHold(); }, { passive: false });

btn.addEventListener('mouseup', () => {
  if (holdProgress < 100) { cancelHold(); sendCommand('wake'); }
});
btn.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (holdProgress < 100) { cancelHold(); sendCommand('wake'); }
}, { passive: false });

btn.addEventListener('mouseleave', cancelHold);
btn.addEventListener('touchcancel', cancelHold);

checkStatus();
setInterval(checkStatus, 15000);
