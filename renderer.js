const playBtn = document.getElementById('playBtn');
const pinBtn = document.getElementById('pinBtn');
const dockCameraBtn = document.getElementById('dockCameraBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const scriptInput = document.getElementById('scriptInput');
const speedInput = document.getElementById('speedInput');
const fontInput = document.getElementById('fontInput');
const crawlWindow = document.querySelector('.crawl-window');
const crawlTrack = document.getElementById('crawlTrack');
const crawlText = document.getElementById('crawlText');
const statusText = document.getElementById('statusText');

let isPlaying = false;
let trackY = 0;
let previousTimestamp = 0;

function syncScript() {
  const text = scriptInput.value.trim() || 'Paste your script here and press play.';
  crawlText.textContent = text;
  resetTrack();
}

function resetTrack() {
  const lineHeight = getLineHeight();
  trackY = Math.max(crawlWindow.clientHeight - lineHeight * 1.6, 24);
  crawlTrack.style.transform = `translate3d(0, ${trackY}px, 0)`;
}

function updateFontSize() {
  crawlText.style.fontSize = `${fontInput.value}px`;
}

function setPlaying(nextState) {
  isPlaying = nextState;
  playBtn.textContent = isPlaying ? 'Pause' : 'Play';
  statusText.textContent = isPlaying ? `Playing at ${speedInput.value}px/s` : 'Paused';

  if (isPlaying) {
    previousTimestamp = 0;
    requestAnimationFrame(step);
  }
}

function getResetThreshold() {
  return -crawlText.offsetHeight - 24;
}

function getLineHeight() {
  const computedLineHeight = Number.parseFloat(window.getComputedStyle(crawlText).lineHeight);
  return Number.isFinite(computedLineHeight) ? computedLineHeight : Number(fontInput.value) * 1.28;
}

function step(timestamp) {
  if (!isPlaying) {
    return;
  }

  if (!previousTimestamp) {
    previousTimestamp = timestamp;
  }

  const delta = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  trackY -= Number(speedInput.value) * delta;
  const resetThreshold = getResetThreshold();

  if (trackY <= resetThreshold) {
    trackY = Math.max(crawlWindow.clientHeight - getLineHeight() * 1.6, 24);
  }

  crawlTrack.style.transform = `translate3d(0, ${trackY}px, 0)`;
  requestAnimationFrame(step);
}

function bumpRange(input, amount) {
  const nextValue = Math.min(Number(input.max), Math.max(Number(input.min), Number(input.value) + amount));
  input.value = String(nextValue);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

scriptInput.addEventListener('input', syncScript);
fontInput.addEventListener('input', () => {
  updateFontSize();
  resetTrack();
});
speedInput.addEventListener('input', () => {
  if (isPlaying) {
    statusText.textContent = `Playing at ${speedInput.value}px/s`;
  }
});

playBtn.addEventListener('click', () => setPlaying(!isPlaying));
pinBtn.addEventListener('click', () => window.teleprompterWindow.togglePin());
dockCameraBtn.addEventListener('click', () => window.teleprompterWindow.dockToCamera());
minimizeBtn.addEventListener('click', () => window.teleprompterWindow.minimize());

window.teleprompterWindow.onPinStateChange((pinned) => {
  pinBtn.textContent = pinned ? 'Pinned' : 'Unpinned';
});

window.addEventListener('keydown', (event) => {
  if (event.target === scriptInput) {
    return;
  }

  if (event.code === 'Space') {
    event.preventDefault();
    setPlaying(!isPlaying);
  }

  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    bumpRange(speedInput, 4);
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    bumpRange(speedInput, -4);
  }

  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    bumpRange(fontInput, 2);
  }

  if (event.key === '-') {
    event.preventDefault();
    bumpRange(fontInput, -2);
  }
});

syncScript();
updateFontSize();
window.addEventListener('resize', resetTrack);
