import { store } from '../state/store'
import { showCommentPopup } from './comments'
import { seekToSecond } from '../audio/player'
import { renderWaveform } from '../audio/waveform'

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
    if (handle) handle.style.left = `${progress * 100}%`
  }

  requestAnimationFrame(tick)
}

tick()

// ── Numbered circles — perfectly round ──

function drawCommentMarkers(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !store.duration) return

  // Use CSS pixel size, not canvas internal resolution
  const sorted = [...store.comments].sort((a, b) => a.seconds[0] - b.seconds[0])
  const r = 11 // radius in canvas px

  sorted.forEach((comment, i) => {
    if (comment.seconds.length === 0) return

    const cx = (comment.seconds[0] / store.duration) * canvas.width
    const cy = canvas.height - r - 4

    // Shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 4

    // Circle — use equal x/y radius = perfect circle
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = comment.color
    ctx.fill()

    ctx.shadowBlur = 0

    // Number
    ctx.fillStyle = '#000000'
    ctx.font = `bold ${Math.round(r * 1.1)}px/1 ui-monospace, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), cx, cy + 0.5)
  })

  // Reset
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowBlur = 0
}

function getSecondFromMouse(e: MouseEvent, canvas: HTMLCanvasElement): number | null {
  if (!store.duration) return null
  const rect = canvas.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  return (x / rect.width) * store.duration
}

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

export function bindPauseComment() {
  store.audio?.addEventListener('pause', () => {
    if (!store.audio || store.audio.ended) return
    const t = store.audio.currentTime
    store.selectedSeconds.clear()
    store.selectedSeconds.add(Math.floor(t))
    showCommentPopup(t)
  })
}

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

export function bindSecondDrag() {}