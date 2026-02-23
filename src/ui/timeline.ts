import { store } from "../state/store"
import { drawPlayhead } from "../audio/playhead"

const timeEl = document.getElementById("current-time")

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function renderCurrentTime() {
  if (!timeEl) return

  const current = formatTime(store.currentTime)
  const duration = store.duration
    ? formatTime(store.duration)
    : "--:--"

  timeEl.textContent = `${current} / ${duration}`
}

const playheadCanvas =
  document.getElementById("playhead") as HTMLCanvasElement

function tick() {
  if (store.audio && !store.audio.paused) {
    store.currentTime = store.audio.currentTime
  }

  renderCurrentTime()

  if (playheadCanvas) {
    drawPlayhead(playheadCanvas)
  }

  requestAnimationFrame(tick)
}

tick()

export function bindWaveformSeek() {
  const canvas = document.getElementById("waveform") as HTMLCanvasElement
  if (!canvas) return

  canvas.addEventListener("click", (e) => {
    if (!store.audio || !store.duration) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const progress = x / rect.width

    const seekTime = progress * store.duration

    store.audio.currentTime = seekTime
    store.currentTime = seekTime
  })
}
