import './styles/main.scss'
import './styles/uploads.scss'
import { loadProjects, deleteProject, exportProjectJson, formatDuration, formatDate, type SavedProject } from './tracks/projects'

function render() {
  const list = document.getElementById('uploads-list')!
  const empty = document.getElementById('uploads-empty')!
  const projects = loadProjects()

  list.innerHTML = ''

  if (projects.length === 0) {
    empty.classList.remove('hidden')
    return
  }

  empty.classList.add('hidden')

  for (const project of projects) {
    const li = document.createElement('li')
    li.className = 'upload-item'
    li.innerHTML = `
      <div class="upload-item-main">
        <div class="upload-item-info">
          <span class="upload-item-name">${project.name}</span>
          <span class="upload-item-file">${project.fileName}</span>
        </div>
        <div class="upload-item-meta">
          <span class="upload-item-duration">${formatDuration(project.duration)}</span>
          <span class="upload-item-comments">${project.comments.length} comment${project.comments.length !== 1 ? 's' : ''}</span>
          <span class="upload-item-date">${formatDate(project.savedAt)}</span>
        </div>
      </div>
      <div class="upload-item-actions">
        <button class="upload-btn-open">Open</button>
        <button class="upload-btn-export">Export</button>
        <button class="upload-btn-delete">✕</button>
      </div>
    `

    li.querySelector('.upload-btn-open')!.addEventListener('click', () => {
      sessionStorage.setItem('soundrev_load_project', JSON.stringify(project))
      window.location.href = '/app-sideproj/'
    })

    li.querySelector('.upload-btn-export')!.addEventListener('click', () => {
      exportProjectJson(project as SavedProject)
    })

    li.querySelector('.upload-btn-delete')!.addEventListener('click', () => {
      if (confirm(`Delete "${project.name}"?`)) {
        deleteProject(project.id)
        render()
      }
    })

    list.appendChild(li)
  }
}

render()