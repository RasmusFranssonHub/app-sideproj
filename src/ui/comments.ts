import { store } from '../state/store'
import { seekToSecond } from '../audio/player'
import { saveCurrentProject, exportProjectJson } from '../tracks/projects'
import { renderCommentDots } from './timeline'

let pendingTime = 0
let editingCommentId: string | null = null
let selectedColor = '#ffb3b3'

// ── Lazy DOM getters (avoids null at module load time) ──
const el = {
  popup: () => document.getElementById('comment-popup'),
  text: () => document.getElementById('comment-text') as HTMLTextAreaElement | null,
  type: () => document.getElementById('comment-type') as HTMLSelectElement | null,
  timestamp: () => document.getElementById('comment-timestamp') as HTMLInputElement | null,
  btn: () => document.getElementById('comment-btn'),
  btnLabel: () => document.getElementById('comment-btn-label'),
  title: () => document.getElementById('comment-popup-title'),
  deleteBtn: () => document.getElementById('comment-delete') as HTMLButtonElement | null,
}

export function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseTime(str: string): number | null {
  const match = str.match(/^(\d*):(\d{0,2})$/)
  if (!match) return null
  const m = parseInt(match[1] || '0')
  const s = parseInt(match[2] || '0')
  if (s > 59) return null
  return m * 60 + s
}

function bindTimestampInput() {
  const ts = el.timestamp()
  if (!ts) return
  ts.addEventListener('keydown', (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && ts.value === ':') {
      e.preventDefault()
    }
  })
  ts.addEventListener('input', () => {
    let val = ts.value
    if (!val.includes(':')) {
      val = val.replace(/\D/g, '')
      ts.value = val.length > 0 ? val + ':' : '0:'
    }
    const parts = ts.value.split(':')
    const mins = parts[0].replace(/\D/g, '').slice(0, 2)
    const secs = (parts[1] || '').replace(/\D/g, '').slice(0, 2)
    ts.value = `${mins}:${secs}`
  })
}

// ── Pastel palette ──
const PASTEL_COLORS = [
  '#ffb3b3', '#ffcc99', '#fff099', '#b3f0b3',
  '#99ccff', '#d4b3ff', '#99e6e6', '#ffb3d9',
]

function buildColorPicker() {
  const container = document.getElementById('comment-color-picker')
  if (!container) return
  container.innerHTML = ''
  PASTEL_COLORS.forEach(color => {
    const swatch = document.createElement('button')
    swatch.className = 'color-swatch'
    swatch.style.background = color
    swatch.dataset.color = color
    if (color === selectedColor) swatch.classList.add('selected')
    swatch.addEventListener('click', (e) => {
      e.preventDefault()
      selectedColor = color
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'))
      swatch.classList.add('selected')
    })
    container.appendChild(swatch)
  })
}

function isOpen(): boolean {
  return el.popup()?.classList.contains('visible') ?? false
}

function openPopup() {
  el.popup()?.classList.add('visible')
  if (el.btnLabel()) el.btnLabel()!.textContent = 'Close'
  el.btn()?.classList.add('is-open')
  buildColorPicker()
  setTimeout(() => el.text()?.focus(), 50)
}

export function hideCommentPopup() {
  el.popup()?.classList.remove('visible')
  if (el.btnLabel()) el.btnLabel()!.textContent = 'Comment'
  el.btn()?.classList.remove('is-open')
  editingCommentId = null
}

export function showCommentPopup(timeSeconds: number) {
  pendingTime = timeSeconds
  editingCommentId = null
  const ts = el.timestamp()
  if (ts) ts.value = formatTime(timeSeconds)
  const text = el.text()
  if (text) text.value = ''
  const type = el.type()
  if (type) type.value = 'general'
  selectedColor = PASTEL_COLORS[0]
  const deleteBtn = el.deleteBtn()
  if (deleteBtn) deleteBtn.style.display = 'none'
  const title = el.title()
  if (title) title.textContent = 'Add comment'
  openPopup()
}

export function showEditCommentPopup(commentId: string) {
  const comment = store.comments.find(c => c.id === commentId)
  if (!comment) return
  editingCommentId = commentId
  pendingTime = comment.seconds[0]
  const ts = el.timestamp()
  if (ts) ts.value = formatTime(comment.seconds[0])
  const text = el.text()
  if (text) text.value = comment.text
  const type = el.type()
  if (type) type.value = comment.type
  selectedColor = comment.color
  const deleteBtn = el.deleteBtn()
  if (deleteBtn) deleteBtn.style.display = 'inline-flex'
  const title = el.title()
  if (title) title.textContent = 'Edit comment'
  openPopup()
}

export function bindCommentPopup() {
  bindTimestampInput()

  el.btn()?.addEventListener('click', () => {
    isOpen() ? hideCommentPopup() : showCommentPopup(store.audio?.currentTime ?? 0)
  })

  document.getElementById('comment-cancel')?.addEventListener('click', hideCommentPopup)

  document.getElementById('save-comment')?.addEventListener('click', () => {
    const ts = el.timestamp()
    const parsedTime = ts ? parseTime(ts.value) : null
    const finalTime = parsedTime !== null ? parsedTime : pendingTime
    const text = el.text()?.value ?? ''
    const type = el.type()?.value ?? 'general'

    if (editingCommentId) {
      const idx = store.comments.findIndex(c => c.id === editingCommentId)
      if (idx !== -1) {
        store.comments[idx] = {
          ...store.comments[idx],
          seconds: [Math.floor(finalTime)],
          text,
          type,
          color: selectedColor,
        }
      }
    } else {
      store.comments.push({
        id: crypto.randomUUID(),
        seconds: [Math.floor(finalTime)],
        text,
        type,
        color: selectedColor,
        status: 'todo',
        createdAt: Date.now(),
      })
    }

    store.selectedSeconds.clear()
    hideCommentPopup()
    renderCommentsList()
    renderCommentDots()
  })

  document.getElementById('comment-delete')?.addEventListener('click', () => {
    if (!editingCommentId) return
    store.comments = store.comments.filter(c => c.id !== editingCommentId)
    hideCommentPopup()
    renderCommentsList()
    renderCommentDots()
  })

  // Action bar
  document.getElementById('action-save')?.addEventListener('click', async () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    const { getUser } = await import('../lib/api')
    const user = await getUser()
    if (!user) {
      window.location.href = '/app-sideproj/login.html'
      return
    }
    try {
      await saveCurrentProject(name)
      showFeedback('action-save', 'Saved ✓')
    } catch (e) {
      showFeedback('action-save', 'Error saving')
    }
  })

  document.getElementById('action-workspace')?.addEventListener('click', () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    saveCurrentProject(name)
    window.location.href = '/app-sideproj/workspace.html'
  })

  document.getElementById('action-share')?.addEventListener('click', async () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    const { getUser } = await import('../lib/api')
    const user = await getUser()
    if (user) {
      const project = await saveCurrentProject(name)
      exportProjectJson(project)
    } else {
      // Export without saving if not logged in
      exportProjectJson({
        id: '',
        name,
        file_name: store.currentTrack?.fileName ?? '',
        duration: store.duration,
        audio_path: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    showFeedback('action-share', 'Downloaded ✓')
  })

  document.getElementById('project-name-edit')?.addEventListener('click', () => {
    const input = document.getElementById('project-name-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })

  document.getElementById('delete-project-btn')?.addEventListener('click', () => {
    document.getElementById('delete-modal')?.classList.remove('hidden')
  })
  document.getElementById('modal-cancel')?.addEventListener('click', () => {
    document.getElementById('delete-modal')?.classList.add('hidden')
  })
  document.getElementById('modal-confirm-delete')?.addEventListener('click', () => {
    store.comments = []
    store.currentTrack = null
    store.duration = 0
    store.currentTime = 0
    store.currentProjectId = null
    if (store.audio) { store.audio.pause(); store.audio = null }
    document.getElementById('player')?.classList.add('hidden')
    document.getElementById('delete-modal')?.classList.add('hidden')
    document.querySelector('.player-style')?.classList.remove('hidden')
    document.getElementById('project-name')?.classList.add('hidden')
    renderCommentsList()
  })
  document.getElementById('modal-save')?.addEventListener('click', async () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    const project = await saveCurrentProject(name)
    exportProjectJson(project)
    document.getElementById('delete-modal')?.classList.add('hidden')
  })
}

function showFeedback(id: string, msg: string) {
  const btn = document.getElementById(id)
  if (!btn) return
  const orig = btn.innerHTML
  btn.textContent = msg
  setTimeout(() => { btn.innerHTML = orig }, 2000)
}

export function renderCommentsList() {
  const list = document.getElementById('comments-list')
  const panel = document.getElementById('comments-panel')
  const commentSection = document.querySelector('.comment-section')
  if (!list || !panel) return

  list.innerHTML = ''

  if (store.comments.length > 0) {
    panel.classList.remove('hidden')
    commentSection?.classList.add('panel-below')
  } else {
    panel.classList.add('hidden')
    commentSection?.classList.remove('panel-below')
  }

  const sorted = [...store.comments].sort((a, b) => a.seconds[0] - b.seconds[0])

  sorted.forEach((comment, i) => {
    const li = document.createElement('li')
    li.className = 'comment-item'
    li.style.setProperty('--color', comment.color)
    li.innerHTML = `
      <span class="comment-item-num" style="background:${comment.color}">${i + 1}</span>
      <span class="comment-item-time">${formatTime(comment.seconds[0])}</span>
      <span class="comment-item-type">${comment.type}</span>
      <span class="comment-item-text">${comment.text || '<em class="comment-empty">no text</em>'}</span>
      <span class="comment-item-edit">✎ Edit</span>
    `
    li.addEventListener('click', () => seekToSecond(comment.seconds[0]))
    li.querySelector('.comment-item-edit')!.addEventListener('click', (e) => {
      e.stopPropagation()
      showEditCommentPopup(comment.id)
    })
    list.appendChild(li)
  })
}