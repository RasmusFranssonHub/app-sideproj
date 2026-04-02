import './styles/main.scss'
import './styles/uploads.scss'
import './mobile/mobile.scss'
import { requireAuth, updateNav } from './lib/auth-guard'
import { loadProjects, deleteProject, loadProjectWithComments, getAudioUrl, type SavedProject } from './tracks/projects'
import { initMobile } from './mobile/mobile'

requireAuth().catch(() => {})
updateNav()
initMobile()

function fmt(s: number): string {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Track active audio globally so only one plays at a time
let activeAudio: HTMLAudioElement | null = null
let activePlayBtn: HTMLElement | null = null

function stopActive() {
  activeAudio?.pause()
  activePlayBtn?.classList.remove('is-playing')
  activeAudio = null
  activePlayBtn = null
}

async function renderList() {
  const list = document.getElementById('uploads-list')!
  const header = document.getElementById('uploads-header')!
  list.innerHTML = '<li class="uploads-loading">Loading…</li>'

  let projects: SavedProject[]
  try {
    projects = await loadProjects()
  } catch {
    list.innerHTML = '<li class="uploads-loading">Sign in to see your projects.</li>'
    return
  }

  list.innerHTML = ''

  if (projects.length === 0) {
    list.innerHTML = '<li class="uploads-empty-state"><p>No projects yet.</p><a href="/app-sideproj/" class="pv-action-btn pv-action-primary">Upload your first track →</a></li>'
    header.querySelector('.uploads-new-btn')?.classList.remove('hidden')
    return
  }

  // Hide "New track" button when projects exist
  header.querySelector('.uploads-new-btn')?.classList.add('hidden')

  for (const project of projects) {
    let comments: { id: string, seconds: number[], text: string, type: string, color: string, status: string, createdAt: number }[] = []
    try {
      const result = await loadProjectWithComments(project.id)
      comments = result.comments
    } catch { /* ok */ }

    const li = document.createElement('li')
    li.className = 'upload-item'
    li.dataset.id = project.id

    li.innerHTML = `
      <div class="upload-row" data-open="false">
        <div class="upload-row-play">
          <button class="upload-play-btn" aria-label="Play">
            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
        </div>
        <div class="upload-row-info">
          <div class="upload-item-name">${project.name}</div>
          <div class="upload-item-sub">
            <span class="upload-chip">${fmt(project.duration)}</span>
            <span class="upload-chip">${comments.length} comment${comments.length !== 1 ? 's' : ''}</span>
            <span class="upload-chip upload-chip-date">${fmtDate(project.updated_at)}</span>
          </div>
        </div>
        <button class="upload-expand-btn" aria-label="Expand" title="Expand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <div class="upload-detail hidden">
        <div class="upload-progress-row">
          <span class="pv-time upload-cur">0:00</span>
          <div class="upload-progress-bar">
            <div class="upload-progress-fill"></div>
          </div>
          <span class="pv-time upload-dur">${fmt(project.duration)}</span>
        </div>

        <div class="upload-reupload hidden">
          <label class="pv-reupload-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Re-upload "${project.file_name}" to play
            <input type="file" accept="audio/*" style="display:none" class="reupload-input" />
          </label>
        </div>

        ${comments.length > 0 ? `
        <div class="upload-comments">
          <ul class="upload-comments-list">
            ${[...comments].sort((a,b) => a.seconds[0]-b.seconds[0]).map((c,i) => `
              <li class="pv-comment-item" style="--cc:${c.color}" data-seek="${c.seconds[0]}">
                <span class="pv-comment-num" style="background:${c.color}">${i+1}</span>
                <span class="pv-comment-time">${fmt(c.seconds[0])}</span>
                <span class="pv-comment-text">${c.text || '<em style="opacity:.3">no text</em>'}</span>
              </li>
            `).join('')}
          </ul>
        </div>` : ''}

        <div class="upload-actions">
          <button class="pv-action-btn pv-action-primary upload-open-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Open in player
          </button>
          <button class="pv-action-btn upload-workspace-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Workspace
          </button>
          <button class="pv-action-btn upload-share-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
          <button class="pv-action-btn pv-action-danger upload-delete-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Delete
          </button>
        </div>
      </div>
    `

    // Audio state per item
    let audio: HTMLAudioElement | null = null
    let audioLoaded = false

    const playBtn = li.querySelector('.upload-play-btn') as HTMLElement
    const detail = li.querySelector('.upload-detail') as HTMLElement
    const expandBtn = li.querySelector('.upload-expand-btn') as HTMLElement
    const row = li.querySelector('.upload-row') as HTMLElement
    const progressFill = li.querySelector('.upload-progress-fill') as HTMLElement
    const progressBar = li.querySelector('.upload-progress-bar') as HTMLElement
    const curEl = li.querySelector('.upload-cur') as HTMLElement
    const reuploadWrap = li.querySelector('.upload-reupload') as HTMLElement
    const reuploadInput = li.querySelector('.reupload-input') as HTMLInputElement

    // Load audio from Supabase
    async function loadAudio() {
      if (audioLoaded) return
      audioLoaded = true
      if (project.audio_path) {
        try {
          const url = await getAudioUrl(project.audio_path)
          audio = new Audio(url)
          bindAudio()
          reuploadWrap.classList.add('hidden')
        } catch {
          reuploadWrap.classList.remove('hidden')
        }
      } else {
        reuploadWrap.classList.remove('hidden')
      }
    }

    function bindAudio() {
      if (!audio) return
      audio.addEventListener('timeupdate', () => {
        if (!audio) return
        curEl.textContent = fmt(audio.currentTime)
        progressFill.style.width = audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : '0'
      })
      audio.addEventListener('ended', () => {
        playBtn.classList.remove('is-playing')
        if (activeAudio === audio) { activeAudio = null; activePlayBtn = null }
      })
    }

    reuploadInput.addEventListener('change', () => {
      const file = reuploadInput.files?.[0]
      if (!file) return
      audio = new Audio(URL.createObjectURL(file))
      bindAudio()
      reuploadWrap.classList.add('hidden')
    })

    // Play button
    playBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await loadAudio()
      if (!audio) return
      if (playBtn.classList.contains('is-playing')) {
        audio.pause()
        playBtn.classList.remove('is-playing')
        activeAudio = null; activePlayBtn = null
      } else {
        stopActive()
        audio.play()
        playBtn.classList.add('is-playing')
        activeAudio = audio; activePlayBtn = playBtn
      }
    })

    // Progress bar seek
    progressBar.addEventListener('click', async (e) => {
      await loadAudio()
      if (!audio) return
      const rect = progressBar.getBoundingClientRect()
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 0)
    })

    // Expand/collapse
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const isOpen = row.dataset.open === 'true'
      if (!isOpen) {
        detail.classList.remove('hidden')
        row.dataset.open = 'true'
        expandBtn.classList.add('open')
        loadAudio()
      } else {
        detail.classList.add('hidden')
        row.dataset.open = 'false'
        expandBtn.classList.remove('open')
      }
    })

    // Comment seek
    li.querySelectorAll('.pv-comment-item').forEach(item => {
      item.addEventListener('click', async () => {
        await loadAudio()
        if (!audio) return
        const seek = parseFloat((item as HTMLElement).dataset.seek || '0')
        audio.currentTime = seek
        stopActive()
        audio.play()
        playBtn.classList.add('is-playing')
        activeAudio = audio; activePlayBtn = playBtn
      })
    })

    // Actions
    li.querySelector('.upload-open-btn')?.addEventListener('click', () => {
      sessionStorage.setItem('soundrev_load_project', JSON.stringify(project))
      window.location.href = '/app-sideproj/'
    })
    li.querySelector('.upload-workspace-btn')?.addEventListener('click', () => {
      sessionStorage.setItem('soundrev_load_project', JSON.stringify(project))
      window.location.href = '/app-sideproj/workspace.html'
    })
    li.querySelector('.upload-share-btn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ ...project, comments }, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${project.name}.soundrev.json`
      a.click()
    })
    li.querySelector('.upload-delete-btn')?.addEventListener('click', async () => {
      if (!confirm(`Delete "${project.name}"?`)) return
      audio?.pause()
      await deleteProject(project.id)
      li.remove()
    })

    list.appendChild(li)
  }
}

renderList()