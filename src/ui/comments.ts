import { store } from '../state/store'
import { seekToSecond } from '../audio/player'
import { saveCurrentProject, exportProjectJson } from '../tracks/projects'

const popup = document.getElementById('comment-popup')!
const textEl = document.getElementById('comment-text') as HTMLTextAreaElement
const typeEl = document.getElementById('comment-type') as HTMLSelectElement
const colorEl = document.getElementById('comment-color') as HTMLInputElement
const timestampEl = document.getElementById('comment-timestamp') as HTMLInputElement
const commentBtn = document.getElementById('comment-btn')!
const commentBtnLabel = document.getElementById('comment-btn-label')!

let pendingTime = 0
let editingCommentId: string | null = null

export function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseTime(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2})$/)
  if (!match) return null
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

function isOpen(): boolean {
  return popup.classList.contains('visible')
}

function openPopup() {
  popup.classList.add('visible')
  commentBtnLabel.textContent = 'Close'
  commentBtn.classList.add('is-open')
  setTimeout(() => textEl.focus(), 50)
}

export function hideCommentPopup() {
  popup.classList.remove('visible')
  commentBtnLabel.textContent = 'Comment'
  commentBtn.classList.remove('is-open')
  editingCommentId = null
}

export function showCommentPopup(timeSeconds: number) {
  pendingTime = timeSeconds
  editingCommentId = null
  timestampEl.value = formatTime(timeSeconds)
  textEl.value = ''
  typeEl.value = 'general'
  colorEl.value = '#ff0000'
  ;(document.getElementById('comment-delete') as HTMLButtonElement).style.display = 'none'
  document.getElementById('comment-popup-title')!.textContent = 'Add comment'
  openPopup()
}

export function showEditCommentPopup(commentId: string) {
  const comment = store.comments.find(c => c.id === commentId)
  if (!comment) return
  editingCommentId = commentId
  pendingTime = comment.seconds[0]
  timestampEl.value = formatTime(comment.seconds[0])
  textEl.value = comment.text
  typeEl.value = comment.type
  colorEl.value = comment.color
  ;(document.getElementById('comment-delete') as HTMLButtonElement).style.display = 'inline-flex'
  document.getElementById('comment-popup-title')!.textContent = 'Edit comment'
  openPopup()
}

export function bindCommentPopup() {
  commentBtn.addEventListener('click', () => {
    isOpen() ? hideCommentPopup() : showCommentPopup(store.audio?.currentTime ?? 0)
  })

  document.getElementById('comment-cancel')?.addEventListener('click', hideCommentPopup)

  document.getElementById('save-comment')!.addEventListener('click', () => {
    const parsedTime = parseTime(timestampEl.value)
    const finalTime = parsedTime !== null ? parsedTime : pendingTime

    if (editingCommentId) {
      const idx = store.comments.findIndex(c => c.id === editingCommentId)
      if (idx !== -1) {
        store.comments[idx] = {
          ...store.comments[idx],
          seconds: [Math.floor(finalTime)],
          text: textEl.value,
          type: typeEl.value,
          color: colorEl.value,
        }
      }
    } else {
      store.comments.push({
        id: crypto.randomUUID(),
        seconds: [Math.floor(finalTime)],
        text: textEl.value,
        type: typeEl.value,
        color: colorEl.value,
        status: 'todo',
        createdAt: Date.now(),
      })
    }

    store.selectedSeconds.clear()
    hideCommentPopup()
    renderCommentsList()
  })

  document.getElementById('comment-delete')?.addEventListener('click', () => {
    if (!editingCommentId) return
    store.comments = store.comments.filter(c => c.id !== editingCommentId)
    hideCommentPopup()
    renderCommentsList()
  })

  // Action bar
  document.getElementById('action-save')?.addEventListener('click', () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    saveCurrentProject(name)
    showFeedback('action-save', 'Saved ✓')
  })

  document.getElementById('action-workspace')?.addEventListener('click', () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    saveCurrentProject(name)
    window.location.href = '/app-sideproj/workspace'
  })

  document.getElementById('action-share')?.addEventListener('click', () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    const project = saveCurrentProject(name)
    exportProjectJson(project)
    showFeedback('action-share', 'Downloaded ✓')
  })

  // Edit pencil
  document.getElementById('project-name-edit')?.addEventListener('click', () => {
    const input = document.getElementById('project-name-input') as HTMLInputElement
    input.focus()
    input.select()
  })

  // Delete modal
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
  document.getElementById('modal-save')?.addEventListener('click', () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    const project = saveCurrentProject(name)
    exportProjectJson(project)
    document.getElementById('delete-modal')?.classList.add('hidden')
  })
}

function showFeedback(id: string, msg: string) {
  const btn = document.getElementById(id)
  if (!btn) return
  const orig = btn.textContent ?? ''
  btn.textContent = msg
  setTimeout(() => { btn.textContent = orig }, 2000)
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

  for (const comment of sorted) {
    const li = document.createElement('li')
    li.className = 'comment-item'
    li.style.setProperty('--color', comment.color)
    li.innerHTML = `
      <span class="comment-item-time">${formatTime(comment.seconds[0])}</span>
      <span class="comment-item-type">${comment.type}</span>
      <span class="comment-item-text">${comment.text || '<em class="comment-empty">no text</em>'}</span>
      <span class="comment-item-edit" title="Edit">✎</span>
    `
    li.addEventListener('click', () => seekToSecond(comment.seconds[0]))
    li.querySelector('.comment-item-edit')!.addEventListener('click', (e) => {
      e.stopPropagation()
      showEditCommentPopup(comment.id)
    })
    list.appendChild(li)
  }
}