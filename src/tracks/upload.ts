import { store } from '../state/store'
import { loadTrack } from '../audio/player'
import drawWaveform from '../audio/waveform'
import { rebindAudioEndedState } from '../ui/events'
import { bindPauseComment } from '../ui/timeline'
import { renderCommentsList } from '../ui/comments'
import { type SavedProject } from '../tracks/projects'

export function bindUpload() {
  const input = document.getElementById('upload') as HTMLInputElement
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const uploadSection = document.querySelector('.player-style') as HTMLElement

  // Load project from uploads page if set
  const pending = sessionStorage.getItem('soundrev_load_project')
  if (pending) {
    sessionStorage.removeItem('soundrev_load_project')
    const project: SavedProject = JSON.parse(pending)
    loadProjectIntoPlayer(project)
  }

  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const baseName = file.name.replace(/\.[^/.]+$/, '')

    store.currentTrack = { fileName: file.name, url }
    store.currentProjectId = null
    store.comments = []

    loadTrack(url)
    await drawWaveform(file, canvas)

    rebindAudioEndedState()
    bindPauseComment()

    uploadSection?.classList.add('hidden')

    const projectNameEl = document.getElementById('project-name')
    const projectNameInput = document.getElementById('project-name-input') as HTMLInputElement
    projectNameEl?.classList.remove('hidden')
    projectNameInput.value = baseName

    document.getElementById('player')?.classList.remove('hidden')
    document.getElementById('play-pause')?.classList.add('is-playing')
    renderCommentsList()
  })
}

function loadProjectIntoPlayer(project: SavedProject) {
  const uploadSection = document.querySelector('.player-style') as HTMLElement

  store.currentProjectId = project.id
  store.comments = project.comments
  store.duration = project.duration
  store.currentTrack = { fileName: project.fileName, url: '' }

  uploadSection?.classList.add('hidden')

  const projectNameEl = document.getElementById('project-name')
  const projectNameInput = document.getElementById('project-name-input') as HTMLInputElement
  projectNameEl?.classList.remove('hidden')
  projectNameInput.value = project.name

  document.getElementById('player')?.classList.remove('hidden')

  // Prompt to re-upload audio
  const notice = document.createElement('div')
  notice.className = 'reupload-notice'
  notice.innerHTML = `Re-upload <strong>${project.fileName}</strong> to resume playback`
  document.querySelector('.timeline-row')?.insertAdjacentElement('beforebegin', notice)

  const input = document.getElementById('upload') as HTMLInputElement
  input.addEventListener('change', () => notice.remove(), { once: true })

  renderCommentsList()
}
