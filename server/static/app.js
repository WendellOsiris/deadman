const toggle = document.getElementById('toggle');
const toggleHandle = toggle.querySelector('.toggle-handle');
const statusPill = document.getElementById('status-pill');
const statusText = document.getElementById('status-text');
const refreshBtn = document.getElementById('refresh-btn');
const toast = document.getElementById('toast');

const HANDLE_OFF = 4;
const HANDLE_ON = 104;
const SHUTDOWN_HOLD_MS = 1500;
const SHUTDOWN_TICK_MS = 50;
const FAST_POLL_INTERVAL = 2000;
const MAX_FAST_POLLS = 15; // 2s × 15 = 30s max

let currentOnline = null;
let pendingCommand = null;
let fastPollsLeft = 0;
let fastPollTimer = null;
let holdInterval = null;
let holdProgress = 0;
let isChecking = false;

function setToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  if (msg) setTimeout(() => { toast.textContent = ''; toast.className = 'toast'; }, 3000);
}

function setStatus(online) {
  currentOnline = online;

  if (online === null) {
    statusPill.className = 'status-pill';
    statusText.textContent = 'unreachable';
    return;
  }

  statusPill.className = 'status-pill ' + (online ? 'online' : 'offline');
  statusText.textContent = online ? 'online' : 'offline';

  if (!pendingCommand) {
    toggle.className = 'toggle' + (online ? ' on' : '');
  }
}

async function checkStatus() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();

    if (pendingCommand) {
      const expectedOnline = pendingCommand === 'wake';
      if (d.online === expectedOnline) {
        // reached desired state — stop polling
        pendingCommand = null;
        fastPollsLeft = 0;
        setStatus(d.online);
        toggle.className = 'toggle' + (d.online ? ' on' : '');
      } else if (fastPollsLeft > 0) {
        fastPollsLeft--;
        // update status pill only, keep toggle in pending state
        statusPill.className = 'status-pill ' + (d.online ? 'online' : 'offline');
        statusText.textContent = d.online ? 'online' : 'offline';
        fastPollTimer = setTimeout(checkStatus, FAST_POLL_INTERVAL);
      } else {
        // timed out — stop polling, show current state
        pendingCommand = null;
        setStatus(d.online);
        toggle.className = 'toggle' + (d.online ? ' on' : '');
        setToast('no response from PC', 'danger');
      }
    } else {
      setStatus(d.online);
    }
  } catch {
    statusPill.className = 'status-pill';
    statusText.textContent = 'unreachable';
    if (pendingCommand) {
      pendingCommand = null;
      toggle.className = 'toggle' + (currentOnline ? ' on' : '');
    }
  }
}

async function refreshStatus() {
  if (isChecking || pendingCommand) return;
  isChecking = true;
  refreshBtn.disabled = true;
  refreshBtn.classList.add('spinning');
  await checkStatus();
  isChecking = false;
  refreshBtn.disabled = false;
  setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
}

async function sendCommand(cmd) {
  try {
    const r = await fetch('/api/' + cmd, { method: 'POST' });
    const d = await r.json();
    if (d.ok) {
      pendingCommand = cmd;
      fastPollsLeft = MAX_FAST_POLLS;
      toggle.classList.add('pending');
      clearTimeout(fastPollTimer);
      fastPollTimer = setTimeout(checkStatus, FAST_POLL_INTERVAL);
    } else {
      toggle.className = 'toggle' + (currentOnline ? ' on' : '');
      setToast('error: ' + (d.error || 'unknown'), 'danger');
    }
  } catch {
    toggle.className = 'toggle' + (currentOnline ? ' on' : '');
    setToast('could not reach server', 'danger');
  }
}

// --- Wake: single tap when offline ---
function handleWake() {
  if (pendingCommand || currentOnline) return;
  toggle.className = 'toggle on pending';
  sendCommand('wake');
}

// --- Shutdown: press and hold 1.5s when online ---
function startHold() {
  if (pendingCommand || !currentOnline) return;
  holdProgress = 0;
  toggleHandle.style.transition = 'none';
  holdInterval = setInterval(() => {
    holdProgress += SHUTDOWN_TICK_MS / SHUTDOWN_HOLD_MS;
    const pos = HANDLE_ON + (HANDLE_OFF - HANDLE_ON) * Math.min(holdProgress, 1);
    toggleHandle.style.left = pos + 'px';
    if (holdProgress >= 1) {
      cancelHold();
      toggle.className = 'toggle pending';
      sendCommand('shutdown');
    }
  }, SHUTDOWN_TICK_MS);
}

function cancelHold() {
  if (!holdInterval) return;
  clearInterval(holdInterval);
  holdInterval = null;
  holdProgress = 0;
  toggleHandle.style.transition = '';
  toggleHandle.style.left = '';
}

// Toggle event listeners
toggle.addEventListener('mousedown', startHold);
toggle.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); }, { passive: false });

toggle.addEventListener('mouseup', () => {
  if (holdInterval) { cancelHold(); } else { handleWake(); }
});
toggle.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (holdInterval) { cancelHold(); } else { handleWake(); }
}, { passive: false });

toggle.addEventListener('mouseleave', cancelHold);
toggle.addEventListener('touchcancel', cancelHold);

// Refresh button
refreshBtn.addEventListener('click', refreshStatus);

// Initial status check
checkStatus();
