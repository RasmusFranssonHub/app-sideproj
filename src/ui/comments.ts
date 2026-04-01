import { store } from '../state/store'
import { seekToSecond } from '../audio/player'
import { saveCurrentProject } from '../tracks/projects'

const PASTEL_COLORS = [
  '#ffb3b3','#ffcc99','#ffeb99','#b3ffb3',
  '#99e6ff','#b3b3ff','#f0b3ff','#ffb3d9',
]

let selectedColor = PASTEL_COLORS[0]

/* ── Time helpers ── */
function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseTime(val: string): number {
  const parts = val.split(':')
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1])
  return 0
}

/* ── Popup open/close ── */
function openPopup(id: string) {
  document.getElementById(id)?.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}
function closePopup(id: string) {
  document.getElementById(id)?.classList.add('hidden')
  document.body.style.overflow = ''
}

/* ── Platform detection ── */
function getOS(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

function buildLocalBlob(name: string): Blob {
  return new Blob([JSON.stringify({
    id: '',
    name,
    file_name: store.currentTrack?.fileName ?? '',
    duration: store.duration,
    comments: store.comments,
    created_at: new Date().toISOString(),
  }, null, 2)], { type: 'application/json' })
}

/* ── Build share options dynamically ── */
function buildShareOptions() {
  const container = document.getElementById('share-options')
  if (!container) return
  container.classList.add('share-grid')

  const os = getOS()
  const url = () => (window as any)._shareUrl || window.location.href
  const name = () => (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Project'

  type ShareOption = {
    id: string
    label: string
    desc: string
    iconHtml: string
    iconClass: string
    action: () => void
  }

  // Messenger always uses real logo SVG (blue)
  const messengerSvg = `<svg viewBox="0 0 24 24" fill="#0099FF" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px"><path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.84 1.32 5.376 3.407 7.11l.003 2.632 2.548-1.403A10.73 10.73 0 0 0 12 20.518c5.523 0 10-4.145 10-9.259S17.523 2 12 2zm1.054 12.467-2.547-2.72-4.973 2.72 5.467-5.8 2.607 2.72 4.912-2.72-5.466 5.8z"/></svg>`

  const options: ShareOption[] = [
    {
      id: 'share-email', label: 'Email', desc: 'Open mail app',
      iconHtml: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      iconClass: 'share-icon-email',
      action: () => { window.open(`mailto:?subject=${encodeURIComponent(name() + ' — SoundRev')}&body=${encodeURIComponent('Check out my SoundRev project: ' + url())}`); closePopup('share-popup') }
    },
    {
      id: 'share-sms',
      label: os === 'ios' ? 'iMessage' : os === 'android' ? 'Messages' : 'SMS',
      desc: os === 'ios' ? 'Open in Messages' : os === 'android' ? 'Open in Messages' : 'Open SMS app',
      iconHtml: os === 'ios'
        ? `<svg viewBox="0 0 24 24" fill="#30D158" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      iconClass: 'share-icon-sms',
      action: () => { window.open(`sms:?body=${encodeURIComponent('Check out my SoundRev project: ' + url())}`); closePopup('share-popup') }
    },
    {
      id: 'share-messenger', label: 'Messenger', desc: 'Share on Messenger',
      iconHtml: messengerSvg,
      iconClass: '',
      action: () => { window.open(`fb-messenger://share?link=${encodeURIComponent(url())}`); closePopup('share-popup') }
    },
    {
      id: 'share-copy', label: 'Copy link', desc: 'Copy to clipboard',
      iconHtml: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
      iconClass: 'share-icon-copy',
      action: async () => {
        await navigator.clipboard.writeText(url())
        const btn = document.getElementById('share-copy')
        if (btn) {
          const t = btn.querySelector('.popup-option-title') as HTMLElement
          const orig = t.textContent
          t.textContent = 'Copied ✓'
          setTimeout(() => { t.textContent = orig }, 2000)
        }
      }
    },
  ]

  container.innerHTML = ''
  options.forEach(opt => {
    const btn = document.createElement('button')
    btn.className = 'popup-option'
    btn.id = opt.id
    btn.innerHTML = `
      <div class="popup-option-icon ${opt.iconClass}">${opt.iconHtml}</div>
      <div class="popup-option-text">
        <span class="popup-option-title">${opt.label}</span>
        <span class="popup-option-desc">${opt.desc}</span>
      </div>
    `
    btn.addEventListener('click', opt.action)
    container.appendChild(btn)
  })
}

/* ── Show comment popup ── */
export function showCommentPopup(timeSeconds: number = store.currentTime) {
  const popup = document.getElementById('comment-popup')
  const btn = document.getElementById('comment-btn')
  const ts = document.getElementById('comment-timestamp') as HTMLInputElement
  if (!popup || !btn) return

  popup.classList.add('visible')
  btn.classList.add('is-open')
  if (ts) ts.value = formatTime(Math.floor(timeSeconds))
}

export function hideCommentPopup() {
  document.getElementById('comment-popup')?.classList.remove('visible')
  document.getElementById('comment-btn')?.classList.remove('is-open')
}

/* ── Bind all popup & button logic ── */
export function bindCommentPopup() {
  // Listen for dot-drag updates from timeline (avoids circular import)
  document.addEventListener('soundrev:commentschanged', () => renderCommentsList())


  // Build color swatches
  const row = document.getElementById('color-picker-row')
  if (row) {
    PASTEL_COLORS.forEach((c, i) => {
      const sw = document.createElement('button')
      sw.className = 'color-swatch' + (i === 0 ? ' selected' : '')
      sw.style.background = c
      sw.setAttribute('aria-label', c)
      sw.addEventListener('click', () => {
        selectedColor = c
        row.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'))
        sw.classList.add('selected')
      })
      row.appendChild(sw)
    })
  }

  // Comment trigger
  document.getElementById('comment-btn')?.addEventListener('click', () => {
    const popup = document.getElementById('comment-popup')
    if (popup?.classList.contains('visible')) hideCommentPopup()
    else showCommentPopup(store.currentTime)
  })

  document.getElementById('comment-cancel')?.addEventListener('click', hideCommentPopup)

  // Save comment
  document.getElementById('save-comment')?.addEventListener('click', () => {
    const text = (document.getElementById('comment-text') as HTMLTextAreaElement)?.value
    const type = (document.getElementById('comment-type') as HTMLSelectElement)?.value
    const ts = (document.getElementById('comment-timestamp') as HTMLInputElement)?.value
    const second = parseTime(ts)

    store.comments.push({
      id: crypto.randomUUID(),
      seconds: [second],
      text,
      type,
      color: selectedColor,
      status: 'todo',
      createdAt: Date.now(),
    })

    ;(document.getElementById('comment-text') as HTMLTextAreaElement).value = ''
    hideCommentPopup()
    renderCommentsList()
    document.dispatchEvent(new CustomEvent('soundrev:commentschanged'))
  })

  // Timestamp colon lock
  const tsInput = document.getElementById('comment-timestamp') as HTMLInputElement
  tsInput?.addEventListener('keydown', (e) => {
    const pos = tsInput.selectionStart ?? 0
    if (e.key === 'Backspace' && pos === 2) e.preventDefault()
  })

  // Speed
  document.getElementById('playback-speed')?.addEventListener('change', (e) => {
    if (store.audio) store.audio.playbackRate = parseFloat((e.target as HTMLSelectElement).value)
  })

  // Project name edit
  document.getElementById('project-name-edit')?.addEventListener('click', () => {
    const input = document.getElementById('project-name-input') as HTMLInputElement
    input.focus()
    input.select()
  })

  // ── Comments panel toggle ──
  document.getElementById('comments-panel-header')?.addEventListener('click', () => {
    const wrapper = document.getElementById('comments-list-wrapper')
    const toggle = document.getElementById('comments-panel-toggle')
    const collapsed = wrapper?.classList.toggle('collapsed')
    toggle?.classList.toggle('collapsed', collapsed)
  })

  // ── Bottom bar: Save popup ──
  document.getElementById('action-save')?.addEventListener('click', () => openPopup('save-popup'))

  document.getElementById('save-popup-close')?.addEventListener('click', () => closePopup('save-popup'))
  document.getElementById('save-popup')?.querySelector('.fullscreen-popup-backdrop')
    ?.addEventListener('click', () => closePopup('save-popup'))

  document.getElementById('save-popup-uploads')?.addEventListener('click', async () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    const { getUser } = await import('../lib/api')
    const user = await getUser()
    closePopup('save-popup')
    if (!user) { window.location.href = '/app-sideproj/login.html'; return }
    try {
      await saveCurrentProject(name)
      showFeedback('action-save', 'Saved ✓')
    } catch { showFeedback('action-save', 'Error') }
  })

  document.getElementById('save-popup-share')?.addEventListener('click', async () => {
    const name = (document.getElementById('project-name-input') as HTMLInputElement)?.value || 'Untitled'
    closePopup('save-popup')
    const { getUser } = await import('../lib/api')
    const user = await getUser()
    let blob: Blob
    if (user) {
      try { const p = await saveCurrentProject(name); blob = new Blob([JSON.stringify(p,null,2)],{type:'application/json'}) }
      catch { blob = buildLocalBlob(name) }
    } else { blob = buildLocalBlob(name) }
    ;(window as any)._shareUrl = URL.createObjectURL(blob)
    buildShareOptions()
    openPopup('share-popup')
  })

  // ── Share popup ──
  document.getElementById('share-popup-close')?.addEventListener('click', () => closePopup('share-popup'))
  document.getElementById('share-popup')?.querySelector('.fullscreen-popup-backdrop')
    ?.addEventListener('click', () => closePopup('share-popup'))

  // ── Bottom bar: Delete popup ──
  document.getElementById('action-delete')?.addEventListener('click', () => openPopup('delete-popup'))

  document.getElementById('delete-popup-close')?.addEventListener('click', () => closePopup('delete-popup'))
  document.getElementById('delete-popup')?.querySelector('.fullscreen-popup-backdrop')
    ?.addEventListener('click', () => closePopup('delete-popup'))

  document.getElementById('delete-popup-save-first')?.addEventListener('click', () => {
    closePopup('delete-popup')
    openPopup('save-popup')
  })

  document.getElementById('delete-popup-confirm')?.addEventListener('click', () => {
    closePopup('delete-popup')
    store.comments = []
    store.currentTrack = null
    store.duration = 0
    store.currentTime = 0
    store.currentSecond = 0
    store.currentProjectId = null
    if (store.audio) { store.audio.pause(); store.audio = null }
    document.getElementById('player')?.classList.add('hidden')
    document.getElementById('project-name')?.classList.add('hidden')
    document.querySelector('.player-style')?.classList.remove('hidden')
    renderCommentsList()
  })
}

/* ── Render comments list ── */
export function renderCommentsList() {
  const list = document.getElementById('comments-list')
  const panel = document.getElementById('comments-panel')
  const countEl = document.getElementById('comments-count')
  if (!list || !panel) return

  list.innerHTML = ''

  if (store.comments.length === 0) {
    panel.classList.add('hidden')
    return
  }
  

  panel.classList.remove('hidden')
  if (countEl) countEl.textContent = String(store.comments.length)

  const sorted = [...store.comments].sort((a, b) => a.seconds[0] - b.seconds[0])

  sorted.forEach((comment, i) => {
    const li = document.createElement('li')
    li.className = 'comment-item'
    li.style.setProperty('--color', comment.color)

    li.innerHTML = `
      <span class="comment-item-num" style="background:${comment.color}">${i + 1}</span>
      <span class="comment-item-time">${formatTime(comment.seconds[0])}</span>
      <span class="comment-item-type">${comment.type}</span>
      <span class="comment-item-text">${comment.text || '<em style="opacity:.3">no text</em>'}</span>
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

function showEditCommentPopup(id: string) {
  const comment = store.comments.find(c => c.id === id)
  if (!comment) return
  const text = document.getElementById('comment-text') as HTMLTextAreaElement
  const type = document.getElementById('comment-type') as HTMLSelectElement
  const ts = document.getElementById('comment-timestamp') as HTMLInputElement
  if (text) text.value = comment.text
  if (type) type.value = comment.type
  if (ts) ts.value = formatTime(comment.seconds[0])
  showCommentPopup(comment.seconds[0])

  const saveBtn = document.getElementById('save-comment')!
  const orig = saveBtn.onclick
  saveBtn.onclick = () => {
    comment.text = (document.getElementById('comment-text') as HTMLTextAreaElement).value
    comment.type = (document.getElementById('comment-type') as HTMLSelectElement).value
    comment.color = selectedColor
    comment.seconds[0] = parseTime((document.getElementById('comment-timestamp') as HTMLInputElement).value)
    hideCommentPopup()
    renderCommentsList()
    saveBtn.onclick = orig as any
  }
}

function showFeedback(id: string, msg: string) {
  const btn = document.getElementById(id)
  if (!btn) return
  const orig = btn.innerHTML
  btn.innerHTML = msg
  setTimeout(() => { btn.innerHTML = orig }, 2000)
}