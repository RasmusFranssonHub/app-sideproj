import { store } from '../state/store'
import { showCommentPopup } from './comments'
import { seekToSecond } from '../audio/player'
import { renderWaveform } from '../audio/waveform'
import { renderCommentsList } from './comments'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─────────────────────────────────────────
// TICK — only updates waveform + playhead
// Dots are NOT redrawn every frame
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
    if (handle) handle.style.left = `${progress * 100}%`
  }

  requestAnimationFrame(tick)
}

tick()

// ─────────────────────────────────────────
// COMMENT DOTS — rendered once, updated on change
// ─────────────────────────────────────────

let isDraggingDot = false

export function renderCommentDots() {
  const dotsContainer = document.getElementById('timeline-dots')
  const timeline = document.getElementById('timeline')
  if (!dotsContainer || !timeline || !store.duration) return

  dotsContainer.querySelectorAll('.comment-dot').forEach(el => el.remove())

  const sorted = [...store.comments].sort((a, b) => a.seconds[0] - b.seconds[0])

  sorted.forEach((comment, i) => {
    if (comment.seconds.length === 0) return

    const dot = document.createElement('div')
    dot.className = 'comment-dot'
    dot.style.left = `${(comment.seconds[0] / store.duration) * 100}%`
    dot.style.setProperty('--dot-color', comment.color)
    dot.innerHTML = `
      <div class="comment-dot-bubble">
        <span class="comment-dot-time">${formatTime(comment.seconds[0])}</span>
      </div>
      <div class="comment-dot-circle">${i + 1}</div>
    `

    const circle = dot.querySelector('.comment-dot-circle') as HTMLElement
    const timeLabel = dot.querySelector('.comment-dot-time') as HTMLElement

    circle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      isDraggingDot = true
      document.body.style.cursor = 'grabbing'

      const onMove = (ev: MouseEvent) => {
        const rect = timeline.getBoundingClientRect()
        const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width))
        const newTime = (x / rect.width) * store.duration
        comment.seconds[0] = Math.floor(newTime)
        dot.style.left = `${(newTime / store.duration) * 100}%`
        timeLabel.textContent = formatTime(newTime)
      }

      const onUp = () => {
        isDraggingDot = false
        document.body.style.cursor = ''
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        renderCommentDots()
        renderCommentsList()
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    })

    dotsContainer.appendChild(dot)
  })
}

// ─────────────────────────────────────────
// CLICK ON WAVEFORM
// ─────────────────────────────────────────

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
    if (isDragging || isDraggingDot) return
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