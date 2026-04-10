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

    // Mobile scrolling — smooth via lerp
    if (window.innerWidth <= 768) {
      const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
      const wfCanvas = document.getElementById('waveform') as HTMLCanvasElement
      if (wrapper && wfCanvas) {
        const isZoomedOut = wrapper.classList.contains('zoomed-out')

        if (isZoomedOut) {
          // Zoomed out: no scroll, wave fills full wrapper
          wrapper.scrollLeft = 0
        } else {
          const canvasW = wfCanvas.offsetWidth
          const wrapW = wrapper.clientWidth
          // Content is center 50% of canvas (25% padding each side)
          const targetX = (0.25 + progress * 0.5) * canvasW
          const targetScroll = Math.max(0, Math.min(targetX - wrapW / 2, canvasW - wrapW))
          // Smooth lerp — only during playback
          if (store.audio && !store.audio.paused) {
            wrapper.scrollLeft += (targetScroll - wrapper.scrollLeft) * 0.12
          } else {
            wrapper.scrollLeft = targetScroll
          }
        }
      }
    }

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
function updateDotPosition(dot: HTMLElement, timeSeconds: number, _timeline: HTMLElement) {
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const dotsContainer = document.getElementById('timeline-dots') as HTMLElement
  if (!dotsContainer || !canvas || !store.duration) return

  const isMobile = window.innerWidth <= 768
  const wrapper = isMobile ? document.querySelector('.timeline-wrapper') as HTMLElement : null
  const isZoomedOut = wrapper?.classList.contains('zoomed-out') ?? false

  const canvasRect = canvas.getBoundingClientRect()
  const dotsRect = dotsContainer.getBoundingClientRect()

  let pxInCanvas: number
  if (isMobile && !isZoomedOut) {
    // Content is center 50% of canvas — offset by 25%
    const contentStart = canvasRect.width * 0.25
    const contentWidth = canvasRect.width * 0.5
    pxInCanvas = contentStart + (timeSeconds / store.duration) * contentWidth
  } else {
    pxInCanvas = (timeSeconds / store.duration) * canvasRect.width
  }

  // Convert canvas px to dots container px
  const pxInDots = pxInCanvas + (canvasRect.left - dotsRect.left)
  dot.style.left = `${pxInDots}px`
}

// ── CLICK ─────────────────────────────────
let isDragging = false

export function bindSecondClick() {
  // Desktop only — mobile uses drag scrub instead
  if (window.innerWidth <= 768) return

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

// Mobile: drag waveform left/right to scrub.
// The center line is the playhead — waveform moves under it.
// No tap-to-seek. Desktop untouched.
export function bindMobileWaveformScrub() {
  if (window.innerWidth > 768) return

  const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
  const timeline = document.getElementById('timeline') as HTMLElement
  if (!wrapper || !timeline) return

  let dragging = false
  let lastX = 0

  const getCanvas = () => document.getElementById('waveform') as HTMLCanvasElement

  timeline.addEventListener('touchstart', (e) => {
    if (!store.duration) return
    dragging = true
    lastX = e.touches[0].clientX
  }, { passive: true })

  window.addEventListener('touchmove', (e) => {
    if (!dragging || !store.duration) return
    const dx = e.touches[0].clientX - lastX
    lastX = e.touches[0].clientX
    const dragCanvas = getCanvas()
    // Use canvas width (waveform only, no padding) for accurate time mapping
    const canvasWidth = dragCanvas ? dragCanvas.offsetWidth : wrapper.clientWidth * 2
    // drag left = forward, drag right = backward
    const dtSeconds = -(dx / canvasWidth) * store.duration
    const newTime = Math.max(0, Math.min(store.currentTime + dtSeconds, store.duration))
    seekToSecond(newTime)
  }, { passive: true })

  window.addEventListener('touchend', () => {
    dragging = false
  })
}
