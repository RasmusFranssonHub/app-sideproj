import { store } from '../state/store'
import { seekToSecond } from '../audio/player'

const popup = document.getElementById('comment-popup')!
const textEl = document.getElementById('comment-text') as HTMLTextAreaElement
const typeEl = document.getElementById('comment-type') as HTMLSelectElement
const colorEl = document.getElementById('comment-color') as HTMLInputElement
const timestampEl = document.getElementById('comment-timestamp') as HTMLInputElement

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

export function showCommentPopup(timeSeconds: number) {
  pendingTime = timeSeconds
  editingCommentId = null
  timestampEl.value = formatTime(timeSeconds)
  textEl.value = ''
  typeEl.value = 'general'
  colorEl.value = '#ff0000'
  document.getElementById('comment-delete')!.style.display = 'none'
  document.getElementById('comment-popup-title')!.textContent = 'Add comment'
  popup.classList.remove('hidden')
  popup.classList.add('visible')
  setTimeout(() => textEl.focus(), 50)
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
  document.getElementById('comment-delete')!.style.display = 'block'
  document.getElementById('comment-popup-title')!.textContent = 'Edit comment'
  popup.classList.remove('hidden')
  popup.classList.add('visible')
  setTimeout(() => textEl.focus(), 50)
}

export function hideCommentPopup() {
  popup.classList.remove('visible')
  popup.classList.add('hidden')
  editingCommentId = null
}

export function bindCommentPopup() {
  document.getElementById('comment-cancel')?.addEventListener('click', hideCommentPopup)

  // Comment button in player
  document.getElementById('comment-btn')?.addEventListener('click', () => {
    const t = store.audio?.currentTime ?? 0
    showCommentPopup(t)
  })

  document.getElementById('save-comment')!.addEventListener('click', () => {
    const parsedTime = parseTime(timestampEl.value)
    const finalTime = parsedTime !== null ? parsedTime : pendingTime

    if (editingCommentId) {
      // Update existing
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
      // New comment
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
      <span class="comment-item-edit">✎</span>
    `

    // Click left part = seek
    const timeEl = li.querySelector('.comment-item-time')!
    timeEl.addEventListener('click', (e) => {
      e.stopPropagation()
      seekToSecond(comment.seconds[0])
    })

    // Click edit icon = edit popup
    const editEl = li.querySelector('.comment-item-edit')!
    editEl.addEventListener('click', (e) => {
      e.stopPropagation()
      showEditCommentPopup(comment.id)
    })

    // Click anywhere else = seek
    li.addEventListener('click', () => seekToSecond(comment.seconds[0]))

    list.appendChild(li)
  }
}