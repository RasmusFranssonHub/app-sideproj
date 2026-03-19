import './styles/main.scss'
import './styles/uploads.scss'
import { requireAuth, updateNav } from './lib/auth-guard'
import {
  loadProjects,
  deleteProject,
  exportProjectJson,
  formatDuration,
  formatDate,
  loadProjectWithComments,
  type SavedProject,
} from './tracks/projects'

// ── Auth guard ────────────────────────────
requireAuth().catch(() => {}) // redirect handled inside
updateNav()

// ── Mini waveform ─────────────────────────
function drawMiniWaveform(canvas: HTMLCanvasElement, project: SavedProject & { comments?: { seconds: number[], color: string }[] }) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const bars = 120
  const barW = w / bars
  for (let i = 0; i < bars; i++) {
    const seed = Math.sin(i * 0.4) * 0.5 + Math.sin(i * 0.13) * 0.3 + 0.2
    const barH = Math.max(2, seed * h * 0.85)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillRect(i * barW, (h - barH) / 2, barW - 1, barH)
  }

  if (project.duration > 0 && project.comments) {
    const sorted = [...project.comments].sort((a, b) => a.seconds[0] - b.seconds[0])
    const r = 7
    sorted.forEach((comment, i) => {
      const cx = (comment.seconds[0] / project.duration) * w
      const cy = h - r - 2
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 3
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = comment.color
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#000'
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(i + 1), cx, cy + 0.5)
    })
    ctx.textAlign = 'start'
    ctx.textBaseline = 'alphabetic'
  }
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── List view ─────────────────────────────
async function renderList() {
  const list = document.getElementById('uploads-list')!
  const empty = document.getElementById('uploads-empty')!

  list.innerHTML = '<li class="uploads-loading">Loading projects...</li>'

  let projects: SavedProject[]
  try {
    projects = await loadProjects()
  } catch {
    list.innerHTML = '<li class="uploads-loading">Sign in to see your projects.</li>'
    return
  }

  list.innerHTML = ''

  if (projects.length === 0) {
    empty.classList.remove('hidden')
    return
  }
  empty.classList.add('hidden')

  for (const project of projects) {
    const li = document.createElement('li')
    li.className = 'upload-item'
    const canvasId = `wf-${project.id}`

    // Load comments for waveform dots
    let commentCount = 0
    let commentsForDots: { seconds: number[], color: string }[] = []
    try {
      const { comments } = await loadProjectWithComments(project.id)
      commentCount = comments.length
      commentsForDots = comments
    } catch { /* ok */ }

    li.innerHTML = `
      <div class="upload-item-waveform">
        <canvas id="${canvasId}" height="48"></canvas>
      </div>
      <div class="upload-item-info">
        <span class="upload-item-name">${project.name}</span>
        <div class="upload-item-sub">
          <span class="upload-item-duration">${formatDuration(project.duration)}</span>
          <span class="upload-item-comments">${commentCount} comment${commentCount !== 1 ? 's' : ''}</span>
          <span class="upload-item-date">${formatDate(project.created_at)}</span>
        </div>
      </div>
      <button class="upload-btn-delete" title="Delete">✕</button>
    `

    requestAnimationFrame(() => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement
      if (canvas) {
        canvas.width = canvas.parentElement!.clientWidth || 300
        drawMiniWaveform(canvas, { ...project, comments: commentsForDots })
      }
    })

    li.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('upload-btn-delete')) return
      openProjectView(project, commentsForDots)
    })

    li.querySelector('.upload-btn-delete')!.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (confirm(`Delete "${project.name}"?`)) {
        await deleteProject(project.id)
        renderList()
      }
    })

    list.appendChild(li)
  }
}

// ── Project view ──────────────────────────
function openProjectView(project: SavedProject, comments: { id?: string, seconds: number[], color: string, type?: string, text?: string }[]) {
  document.getElementById('uploads-list')!.classList.add('hidden')
  document.getElementById('uploads-empty')!.classList.add('hidden')
  document.getElementById('uploads-header')?.classList.add('hidden')

  const view = document.getElementById('project-view')!
  view.classList.remove('hidden')

  document.getElementById('project-view-name')!.textContent = project.name
  document.getElementById('project-view-file')!.textContent = project.file_name
  document.getElementById('project-view-duration')!.textContent = formatDuration(project.duration)
  document.getElementById('project-view-date')!.textContent = formatDate(project.created_at)
  document.getElementById('project-view-count')!.textContent =
    `${comments.length} comment${comments.length !== 1 ? 's' : ''}`

  const canvas = document.getElementById('project-view-canvas') as HTMLCanvasElement
  requestAnimationFrame(() => {
    canvas.width = canvas.parentElement!.clientWidth || 800
    drawMiniWaveform(canvas, { ...project, comments })
  })

  const commentsList = document.getElementById('project-view-comments')!
  commentsList.innerHTML = ''
  const sorted = [...comments].sort((a, b) => a.seconds[0] - b.seconds[0])

  if (sorted.length === 0) {
    commentsList.innerHTML = '<li class="project-view-no-comments">No comments yet</li>'
  } else {
    sorted.forEach((comment, i) => {
      const li = document.createElement('li')
      li.className = 'project-view-comment'
      li.style.setProperty('--color', comment.color)
      li.innerHTML = `
        <span class="pvc-num" style="background:${comment.color}">${i + 1}</span>
        <span class="pvc-time">${formatTime(comment.seconds[0])}</span>
        <span class="pvc-type">${comment.type || ''}</span>
        <span class="pvc-text">${(comment as { text?: string }).text || '<em style="opacity:0.35">no text</em>'}</span>
      `
      commentsList.appendChild(li)
    })
  }

  document.getElementById('project-view-open')!.onclick = () => {
    sessionStorage.setItem('soundrev_load_project', JSON.stringify(project))
    window.location.href = '/app-sideproj/'
  }
  document.getElementById('project-view-export')!.onclick = () => {
    exportProjectJson({ ...project })
  }
}

document.getElementById('project-view-back')?.addEventListener('click', () => {
  document.getElementById('project-view')!.classList.add('hidden')
  document.getElementById('uploads-list')!.classList.remove('hidden')
  document.getElementById('uploads-header')?.classList.remove('hidden')
  renderList()
})

renderList()