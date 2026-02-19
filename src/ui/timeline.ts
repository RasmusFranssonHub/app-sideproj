import { store } from "../state/store"

const timeEl = document.getElementById("current-time")

export function renderCurrentTime() {
  if (!timeEl) return

  timeEl.textContent = store.currentTime.toFixed(2)
}
