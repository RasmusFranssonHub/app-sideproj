import { store } from '../state/store'
import { showCommentPopup } from './comments'
import { seekToSecond } from '../audio/player'
import { renderWaveform } from '../audio/waveform'

// ─────────────────────────────────────────
// 🎨 TICK
// ─────────────────────────────────────────

function tick() {
  if (store.audio && !store.audio.paused) {
    store.currentTime = store.audio.currentTime
    store.currentSecond = Math.floor(store.audio.currentTime)
  }

  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const handle = document.getElementById('playhead-handle') as HTMLElement

  if (canvas && store.duration > 0) {
    const progress = store.currentTime / store.duration
    renderWaveform(canvas, progress)
    drawCommentMarkers(canvas)

    if (handle) {
      handle.style.left = `${progress * 100}%`
    }
  }

  requestAnimationFrame(tick)
}

tick()

// ─────────────────────────────────────────
// 🔴 COMMENT MARKERS
// ─────────────────────────────────────────

function drawCommentMarkers(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !store.duration) return

  for (const comment of store.comments) {
    if (comment.seconds.length === 0) continue
    const x = (comment.seconds[0] / store.duration) * canvas.width
    ctx.beginPath()
    ctx.arc(x, canvas.height - 8, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = comment.color
    ctx.fill()
  }
}

// ─────────────────────────────────────────
// 🧭 PIXEL → SECOND
// ─────────────────────────────────────────

function getSecondFromMouse(e: MouseEvent, canvas: HTMLCanvasElement): number | null {
  if (!store.duration) return null
  const rect = canvas.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  return (x / rect.width) * store.duration
}

// ─────────────────────────────────────────
// 🖱️ CLICK = seek + open comment popup
// ─────────────────────────────────────────

let isDragging = false

export function bindSecondClick() {
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  if (!canvas) return

  canvas.addEventListener('click', (e) => {
    if (isDragging) return
    const second = getSecondFromMouse(e, canvas)
    if (second === null) return

    seekToSecond(second)
    store.selectedSeconds.clear()
    store.selectedSeconds.add(Math.floor(second))
    showCommentPopup(second)
  })
}

// ─────────────────────────────────────────
// ⏸ PAUSE = open comment popup
// ─────────────────────────────────────────

export function bindPauseComment() {
  store.audio?.addEventListener('pause', () => {
    if (!store.audio || store.audio.ended) return
    const t = store.audio.currentTime
    store.selectedSeconds.clear()
    store.selectedSeconds.add(Math.floor(t))
    showCommentPopup(t)
  })
}

// ─────────────────────────────────────────
// 🖱️ DRAG playhead handle
// ─────────────────────────────────────────

export function bindPlayheadDrag() {
  const handle = document.getElementById('playhead-handle') as HTMLElement
  const timeline = document.getElementById('timeline') as HTMLElement
  if (!handle || !timeline) return

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault()
    isDragging = true
    document.body.style.cursor = 'grabbing'
  })

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || !store.duration) return
    const rect = timeline.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    seekToSecond((x / rect.width) * store.duration)
  })

  window.addEventListener('mouseup', () => {
    if (!isDragging) return
    isDragging = false
    document.body.style.cursor = ''
  })
}

export function bindSecondDrag() {
  // Kept for main.ts compatibility — drag handled by bindPlayheadDrag
}