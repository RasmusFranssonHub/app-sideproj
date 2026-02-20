import { store } from "../state/store"

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
