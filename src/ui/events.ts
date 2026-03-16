import { play, pause, seekToSecond } from '../audio/player';
import { store } from '../state/store';

// ── Format seconds → "m:ss" ──────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Update the two time displays every frame ─────
function startTimeTick() {
  const currentEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');

  function tick() {
    if (store.audio) {
      if (currentEl) currentEl.textContent = formatTime(store.audio.currentTime);
      if (durationEl && store.duration) durationEl.textContent = formatTime(store.duration);
    }
    requestAnimationFrame(tick);
  }

  tick();
}

startTimeTick();

// ── Player controls ───────────────────────────────
export function bindPlayerControls() {
  const playPauseBtn = document.getElementById('play-pause');
  const rewindBtn = document.getElementById('rewind');
  const forwardBtn = document.getElementById('fast-forward');

  playPauseBtn?.addEventListener('click', () => {
    if (!store.audio) return;
    if (store.audio.paused) {
      play();
    } else {
      pause();
    }
  });

  rewindBtn?.addEventListener('click', () => {
    if (!store.audio) return;
    seekToSecond(0);
  });

  forwardBtn?.addEventListener('click', () => {
    if (!store.audio) return;
    seekToSecond(store.duration - 0.01);
  });
}

// ── Re-attach listeners after new track load ─────
export function rebindAudioEndedState() {
  const playPauseBtn = document.getElementById('play-pause');

  store.audio?.addEventListener('ended', () => {
    playPauseBtn?.classList.remove('is-playing');
  });
  store.audio?.addEventListener('pause', () => {
    playPauseBtn?.classList.remove('is-playing');
  });
  store.audio?.addEventListener('play', () => {
    playPauseBtn?.classList.add('is-playing');
  });
}