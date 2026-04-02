import { store } from '../state/store'
import { showCommentPopup } from './comments'
import { seekToSecond } from '../audio/player'
import { renderWaveform } from '../audio/waveform'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── TICK ──────────────────────────────────
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

    const ct = document.getElementById('current-time')
    const dur = document.getElementById('duration')
    if (ct) ct.textContent = formatTime(store.currentTime)
    if (dur) dur.textContent = formatTime(store.duration)
  }

  requestAnimationFrame(tick)
}
tick()

// ── DOTS ──────────────────────────────────
let isDraggingDot = false

export function renderCommentDots() {
  const dotsContainer = document.getElementById('timeline-dots')
  const timeline = document.getElementById('timeline')
  if (!dotsContainer || !timeline || !store.duration) return

  dotsContainer.querySelectorAll('.comment-dot').forEach(el => el.remove())

  const sorted = [...store.comments].sort((a, b) => a.seconds[0] - b.seconds[0])

  sorted.forEach((comment, i) => {
    if (!comment.seconds.length) return

    const dot = document.createElement('div')
    dot.className = 'comment-dot'
    dot.style.setProperty('--dot-color', comment.color)
    updateDotPosition(dot, comment.seconds[0], timeline)

    dot.innerHTML = `
      <div class="comment-dot-bubble">
        <span class="comment-dot-time">${formatTime(comment.seconds[0])}</span>
      </div>
      <div class="comment-dot-arrow"></div>
      <div class="comment-dot-circle">${i + 1}</div>
    `

    const circle = dot.querySelector('.comment-dot-circle') as HTMLElement
    const timeLabel = dot.querySelector('.comment-dot-time') as HTMLElement

    // Mouse drag
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
        updateDotPosition(dot, newTime, timeline)
        timeLabel.textContent = formatTime(newTime)
      }

      const onUp = () => {
        isDraggingDot = false
        document.body.style.cursor = ''
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        renderCommentDots()
        document.dispatchEvent(new CustomEvent('soundrev:commentschanged'))
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    })

    // Touch drag
    circle.addEventListener('touchstart', (e) => {
      e.preventDefault()
      e.stopPropagation()
      isDraggingDot = true

      const onMove = (ev: TouchEvent) => {
        const touch = ev.touches[0]
        const rect = timeline.getBoundingClientRect()
        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
        const newTime = (x / rect.width) * store.duration
        comment.seconds[0] = Math.floor(newTime)
        updateDotPosition(dot, newTime, timeline)
        timeLabel.textContent = formatTime(newTime)
      }

      const onUp = () => {
        isDraggingDot = false
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onUp)
        renderCommentDots()
        document.dispatchEvent(new CustomEvent('soundrev:commentschanged'))
      }

      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', onUp)
    }, { passive: false })

    dotsContainer.appendChild(dot)
  })
}

// Position dot using timeline's actual pixel width
// so dots always align with the waveform regardless of zoom/scroll
function updateDotPosition(dot: HTMLElement, timeSeconds: number, timeline: HTMLElement) {
  const rect = timeline.getBoundingClientRect()
  const dotsContainer = document.getElementById('timeline-dots') as HTMLElement
  const dotsRect = dotsContainer.getBoundingClientRect()

  // Calculate pixel position within timeline
  const pxInTimeline = (timeSeconds / store.duration) * rect.width
  // Offset by timeline's left relative to dots container
  const pxInDots = pxInTimeline + (rect.left - dotsRect.left)

  dot.style.left = `${pxInDots}px`
}

// ── CLICK ─────────────────────────────────
let isDragging = false

export function bindSecondClick() {
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  if (!canvas) return

  canvas.addEventListener('click', (e) => {
    if (isDragging || isDraggingDot) return
    if (!store.duration) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const second = (x / rect.width) * store.duration
    seekToSecond(second)
    store.selectedSeconds.clear()
    store.selectedSeconds.add(Math.floor(second))
    showCommentPopup(second)
  })
}

export function bindPauseComment() {
  store.audio?.addEventListener('pause', () => {
    if (!store.audio || store.audio.ended) return
    showCommentPopup(store.audio.currentTime)
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