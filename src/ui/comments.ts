import { store } from '../state/store'
import { seekToSecond } from '../audio/player'

const popup = document.getElementById('comment-popup')!
const textEl = document.getElementById('comment-text') as HTMLTextAreaElement
const typeEl = document.getElementById('comment-type') as HTMLSelectElement
const colorEl = document.getElementById('comment-color') as HTMLInputElement
const timestampEl = document.getElementById('comment-timestamp') as HTMLInputElement
const commentBtn = document.getElementById('comment-btn')!
const commentBtnLabel = document.getElementById('comment-btn-label')!

let pendingTime = 0
let editingCommentId: string | null = null
let popupOpen = false

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

function openPopup() {
  document.querySelector(".player-card")?.classList.add("popup-open")
  popupOpen = true
  popup.classList.remove('hidden')
  requestAnimationFrame(() => popup.classList.add('visible'))
  commentBtnLabel.textContent = 'Close'
  commentBtn.classList.add('is-open')
}

export function hideCommentPopup() {
  popupOpen = false
  popup.classList.remove('visible')
  setTimeout(() => popup.classList.add('hidden'), 300)
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
  const deleteBtn = document.getElementById('comment-delete') as HTMLButtonElement
  deleteBtn.style.display = 'none'
  document.getElementById('comment-popup-title')!.textContent = 'Add comment'
  openPopup()
  setTimeout(() => textEl.focus(), 320)
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
  const deleteBtn = document.getElementById('comment-delete') as HTMLButtonElement
  deleteBtn.style.display = 'inline-flex'
  document.getElementById('comment-popup-title')!.textContent = 'Edit comment'
  openPopup()
  setTimeout(() => textEl.focus(), 320)
}

export function bindCommentPopup() {
  // Toggle on comment button click
  commentBtn.addEventListener('click', () => {
    if (popupOpen) {
      hideCommentPopup()
    } else {
      const t = store.audio?.currentTime ?? 0
      showCommentPopup(t)
    }
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

  // Delete project modal
  document.getElementById('delete-project-btn')?.addEventListener('click', () => {
    document.getElementById('delete-modal')?.classList.remove('hidden')
  })
  document.getElementById('modal-cancel')?.addEventListener('click', () => {
    document.getElementById('delete-modal')?.classList.add('hidden')
  })
  document.getElementById('modal-confirm-delete')?.addEventListener('click', () => {
    // Reset everything
    store.comments = []
    store.currentTrack = null
    store.duration = 0
    store.currentTime = 0
    if (store.audio) { store.audio.pause(); store.audio = null }
    document.getElementById('player')?.classList.add('hidden')
    document.getElementById('delete-modal')?.classList.add('hidden')
    document.querySelector('.player-style')?.classList.remove('hidden')
    document.getElementById('project-name')?.classList.add('hidden')
    renderCommentsList()
  })
  document.getElementById('modal-save')?.addEventListener('click', () => {
    // Save project as JSON download
    const projectName = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'project'
    const data = {
      name: projectName,
      fileName: store.currentTrack?.fileName,
      comments: store.comments,
      savedAt: Date.now(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}.soundrev.json`
    a.click()
    URL.revokeObjectURL(url)
    document.getElementById('delete-modal')?.classList.add('hidden')
  })
}

export function renderCommentsList() {
  const list = document.getElementById('comments-list')
  const panel = document.getElementById('comments-panel')
  if (!list || !panel) return

  list.innerHTML = ''

  if (store.comments.length > 0) {
    panel.classList.remove('hidden')
  } else {
    panel.classList.add('hidden')
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

    const editEl = li.querySelector('.comment-item-edit')!
    editEl.addEventListener('click', (e) => {
      e.stopPropagation()
      showEditCommentPopup(comment.id)
    })

    list.appendChild(li)
  }
}