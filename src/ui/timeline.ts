import { store } from "../state/store"
import { showCommentPopup } from "./comments"

// ─────────────────────────────────────────
// ⏱️ TICK – transport-driven rendering
// ─────────────────────────────────────────

function tick() {
  if (store.audio && !store.audio.paused) {
    store.currentTime = store.audio.currentTime
    store.currentSecond = Math.floor(store.audio.currentTime)
  }

  drawTimeline()
  requestAnimationFrame(tick)
}

tick()

// ─────────────────────────────────────────
// 🎨 DRAW TIMELINE (sekundblock)
// ─────────────────────────────────────────

function drawTimeline() {
  const canvas = document.getElementById("waveform") as HTMLCanvasElement
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const seconds = Math.ceil(store.duration)
  if (seconds === 0) return

  const blockWidth = canvas.width / seconds
  const height = canvas.height

  ctx.clearRect(0, 0, canvas.width, height)

  for (let s = 0; s < seconds; s++) {
    const isPlaying = s === store.currentSecond
    const isSelected = store.selectedSeconds.has(s)
    const hasComment = store.comments.some(c =>
      c.seconds.includes(s)
    )

    // 🎯 PRIORITET: selection > comment > playhead > idle
    if (isSelected) {
      ctx.fillStyle = "#ff9800" // markerad
    } else if (hasComment) {
      ctx.fillStyle = "#e53935" // kommenterad
    } else if (isPlaying) {
      ctx.fillStyle = "#4caf50" // spelar
    } else {
      ctx.fillStyle = "#2b2b2b" // idle
    }

    ctx.fillRect(
      s * blockWidth,
      0,
      blockWidth - 1,
      height
    )
  }
}

// ─────────────────────────────────────────
// 🧭 MOUSE → SECOND
// ─────────────────────────────────────────

function getSecondFromMouse(
  e: MouseEvent,
  canvas: HTMLCanvasElement
): number | null {
  if (!store.duration) return null

  const rect = canvas.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))

  const seconds = Math.ceil(store.duration)
  const blockWidth = rect.width / seconds

  return Math.floor(x / blockWidth)
}

// ─────────────────────────────────────────
// ⏩ SEEK
// ─────────────────────────────────────────

function seekToSecond(second: number) {
  if (!store.audio) return
  store.audio.currentTime = second
  store.currentTime = second
  store.currentSecond = second
}

// ─────────────────────────────────────────
// 🖱️ CLICK = SEEK + SELECT
// ─────────────────────────────────────────

export function bindSecondClick() {
  const canvas = document.getElementById("waveform") as HTMLCanvasElement
  if (!canvas) return

  canvas.addEventListener("click", (e) => {
    const second = getSecondFromMouse(e, canvas)
    if (second === null) return

    store.selectedSeconds.clear()
    store.selectedSeconds.add(second)

    seekToSecond(second)
  })
}

// ─────────────────────────────────────────
// 🖱️ DRAG = MULTI-SELECT
// ─────────────────────────────────────────

let isSelecting = false
let selectionStart: number | null = null

export function bindSecondDrag() {
  const canvas = document.getElementById("waveform") as HTMLCanvasElement
  if (!canvas) return

  canvas.addEventListener("mousedown", (e) => {
    const second = getSecondFromMouse(e, canvas)
    if (second === null) return

    isSelecting = true
    selectionStart = second
    store.selectedSeconds.clear()
    store.selectedSeconds.add(second)
  })

  window.addEventListener("mousemove", (e) => {
    if (!isSelecting || selectionStart === null) return

    const second = getSecondFromMouse(e, canvas)
    if (second === null) return

    store.selectedSeconds.clear()

    const from = Math.min(selectionStart, second)
    const to = Math.max(selectionStart, second)

    for (let s = from; s <= to; s++) {
      store.selectedSeconds.add(s)
    }
  })

  window.addEventListener("mouseup", () => {
    if (!isSelecting) return

    isSelecting = false
    selectionStart = null

    if (store.selectedSeconds.size > 0) {
      showCommentPopup()
    }
  })
}
