import { store } from '../state/store'

export type SavedProject = {
  id: string
  name: string
  fileName: string
  duration: number
  comments: typeof store.comments
  savedAt: number
}

const STORAGE_KEY = 'soundrev_projects'

export function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function saveCurrentProject(name: string): SavedProject {
  const projects = loadProjects()
  const id = store.currentProjectId ?? crypto.randomUUID()
  store.currentProjectId = id

  const project: SavedProject = {
    id,
    name,
    fileName: store.currentTrack?.fileName ?? '',
    duration: store.duration,
    comments: [...store.comments],
    savedAt: Date.now(),
  }

  const idx = projects.findIndex(p => p.id === id)
  if (idx !== -1) {
    projects[idx] = project
  } else {
    projects.unshift(project)
  }

  saveProjects(projects)
  return project
}

export function deleteProject(id: string) {
  saveProjects(loadProjects().filter(p => p.id !== id))
}

export function exportProjectJson(project: SavedProject) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name}.soundrev.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}