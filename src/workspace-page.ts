import './styles/main.scss'
import './styles/workspace.scss'
import { requireAuth, updateNav } from './lib/auth-guard'
import { loadProjects, loadProjectWithComments, type SavedProject } from './tracks/projects'
import { supabase } from './lib/superbase'

type Status = 'todo' | 'working' | 'review' | 'done'

type CommentCard = {
  id: string
  seconds: number[]
  text: string
  type: string
  color: string
  status: Status
  createdAt: number
}

let currentProject: SavedProject | null = null
let cards: CommentCard[] = []
let audio: HTMLAudioElement | null = null
let isPlaying = false

requireAuth().catch(() => {})
updateNav()

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

async function populateProjectSelect() {
  const select = document.getElementById('workspace-project-select') as HTMLSelectElement
  let projects: SavedProject[] = []

  try {
    projects = await loadProjects()
  } catch { /* not logged in */ }

  select.innerHTML = '<option value="">— select a project —</option>'
  projects.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = p.name
    select.appendChild(opt)
  })

  select.addEventListener('change', () => {
    const project = projects.find(p => p.id === select.value)
    if (project) loadProject(project)
    else clearProject()
  })

  return projects
}

async function loadProject(project: SavedProject) {
  currentProject = project

  document.getElementById('workspace-empty')!.classList.add('hidden')
  document.getElementById('workspace-board')!.classList.remove('hidden')
  document.getElementById('workspace-project-meta')!.classList.remove('hidden')
  document.getElementById('mini-player')!.classList.remove('hidden')
  document.getElementById('mini-track-name')!.textContent = project.name
  document.getElementById('mini-track-file')!.textContent = project.file_name
  document.getElementById('workspace-meta-file')!.textContent = project.file_name

  // Load comments from Supabase
  try {
    const { comments } = await loadProjectWithComments(project.id)
    document.getElementById('workspace-meta-comments')!.textContent =
      `${comments.length} comment${comments.length !== 1 ? 's' : ''}`

    // Load saved statuses from Supabase comments table
    cards = comments.map(c => ({
      id: c.id,
      seconds: c.seconds,
      text: c.text,
      type: c.type,
      color: c.color,
      status: c.status as Status,
      createdAt: c.createdAt,
    }))
  } catch {
    cards = []
  }

  renderBoard()
  setupAudio(project)
}

function clearProject() {
  currentProject = null
  document.getElementById('workspace-empty')!.classList.remove('hidden')
  document.getElementById('workspace-board')!.classList.add('hidden')
  document.getElementById('workspace-project-meta')!.classList.add('hidden')
  document.getElementById('mini-player')!.classList.add('hidden')
}

const STATUSES: Status[] = ['todo', 'working', 'review', 'done']

function renderBoard() {
  STATUSES.forEach(status => {
    const container = document.getElementById(`cards-${status}`)!
    const countEl = document.getElementById(`count-${status}`)!
    const filtered = cards
      .filter(c => c.status === status)
      .sort((a, b) => a.seconds[0] - b.seconds[0])

    countEl.textContent = String(filtered.length)
    container.innerHTML = ''

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'board-col-empty'
      empty.textContent = 'No items'
      container.appendChild(empty)
      return
    }

    filtered.forEach(card => {
      const el = document.createElement('div')
      el.className = 'board-card'
      el.style.setProperty('--card-color', card.color)

      el.innerHTML = `
        <div class="card-top">
          <span class="card-time">${formatTime(card.seconds[0])}</span>
          <span class="card-type">${card.type}</span>
        </div>
        <p class="card-text">${card.text || '<em class="card-empty">no text</em>'}</p>
        <div class="card-actions">
          <button class="card-seek">▶ ${formatTime(card.seconds[0])}</button>
          <select class="card-status-select" aria-label="Status">
            <option value="todo" ${card.status === 'todo' ? 'selected' : ''}>Backlog</option>
            <option value="working" ${card.status === 'working' ? 'selected' : ''}>In progress</option>
            <option value="review" ${card.status === 'review' ? 'selected' : ''}>In review</option>
            <option value="done" ${card.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>
      `

      el.querySelector('.card-seek')!.addEventListener('click', () => {
        if (audio) { audio.currentTime = card.seconds[0]; audio.play(); setPlaying(true) }
      })

      const sel = el.querySelector('.card-status-select') as HTMLSelectElement
      sel.addEventListener('change', async () => {
        const idx = cards.findIndex(c => c.id === card.id)
        if (idx !== -1) {
          cards[idx].status = sel.value as Status
          // Save status to Supabase
          await supabase.from('comments').update({ status: sel.value }).eq('id', card.id)
          renderBoard()
        }
      })

      container.appendChild(el)
    })
  })
}

function setupAudio(project: SavedProject) {
  const miniPlayer = document.getElementById('mini-player')!
  miniPlayer.querySelector('.mini-reupload')?.remove()
  if (audio) { audio.pause(); audio = null }
  setPlaying(false)

  // Try to load from Supabase Storage
  if (project.audio_path) {
    supabase.storage.from('audio').createSignedUrl(project.audio_path, 3600).then(({ data }) => {
      if (data?.signedUrl) {
        audio = new Audio(data.signedUrl)
        bindAudioEvents()
        return
      }
      promptReupload(miniPlayer)
    })
  } else {
    promptReupload(miniPlayer)
  }
}

function promptReupload(miniPlayer: HTMLElement) {
  const notice = document.createElement('div')
  notice.className = 'mini-reupload'
  const label = document.createElement('label')
  label.className = 'mini-upload-label'
  label.textContent = 'Upload audio to play'
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'
  input.style.display = 'none'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    if (audio) audio.pause()
    audio = new Audio(URL.createObjectURL(file))
    bindAudioEvents()
    notice.remove()
  })
  label.appendChild(input)
  notice.appendChild(label)
  miniPlayer.querySelector('.mini-player-controls')!.insertAdjacentElement('beforebegin', notice)
}

function bindAudioEvents() {
  if (!audio) return
  audio.addEventListener('timeupdate', updateProgress)
  audio.addEventListener('ended', () => setPlaying(false))
  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('mini-duration')!.textContent = formatTime(audio!.duration)
  })
}

function updateProgress() {
  if (!audio) return
  document.getElementById('mini-current')!.textContent = formatTime(audio.currentTime)
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
  ;(document.getElementById('mini-progress-fill') as HTMLElement).style.width = `${pct}%`
}

function setPlaying(playing: boolean) {
  isPlaying = playing
  document.getElementById('mini-play')!.classList.toggle('is-playing', playing)
}

function bindPlayerControls() {
  document.getElementById('mini-play')?.addEventListener('click', () => {
    if (!audio) return
    if (isPlaying) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  })
  document.getElementById('mini-rewind')?.addEventListener('click', () => { if (audio) audio.currentTime = 0 })
  document.getElementById('mini-end')?.addEventListener('click', () => { if (audio) audio.currentTime = audio.duration - 0.01 })
  document.getElementById('mini-progress-bar')?.addEventListener('click', (e) => {
    if (!audio) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration
  })
}

// ── Init ─────────────────────────────────
const projects = await populateProjectSelect()
bindPlayerControls()

const pending = sessionStorage.getItem('soundrev_load_project')
if (pending) {
  sessionStorage.removeItem('soundrev_load_project')
  const p: SavedProject = JSON.parse(pending)
  const select = document.getElementById('workspace-project-select') as HTMLSelectElement
  setTimeout(() => {
    select.value = p.id
    const found = projects.find((x: SavedProject) => x.id === p.id)
    if (found) loadProject(found)
  }, 50)
}