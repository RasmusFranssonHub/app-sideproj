import { store } from '../state/store'
import { loadTrack } from '../audio/player'
import drawWaveform from '../audio/waveform'
import { rebindAudioEndedState } from '../ui/events'
import { bindPauseComment, renderCommentDots } from '../ui/timeline'
import * as commentsUi from '../ui/comments'
import {
  saveCurrentProject,
  loadProjectWithComments,
  uploadAudio,
  type SavedProject,
} from '../tracks/projects'
import { getUser } from '../lib/api'

const renderCommentsList = () => {
  const fn =
    (commentsUi as { renderCommentsList?: () => void }).renderCommentsList ??
    (commentsUi as { renderComments?: () => void }).renderComments
  if (fn) fn()
}

export function bindUpload() {
  const input = document.getElementById('upload') as HTMLInputElement
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const uploadSection = document.querySelector('.player-style') as HTMLElement

  // Load project from uploads/workspace page
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
    document.getElementById('bottom-bar')?.classList.remove('hidden')
    document.getElementById('play-pause')?.classList.add('is-playing')
    renderCommentsList()
    renderCommentDots()

    // Check if logged in — if not, show save prompt but don't block
    const user = await getUser()
    if (user) {
      try {
        const saved = await saveCurrentProject(baseName)
        store.currentProjectId = saved.id
        await uploadAudio(saved.id, file)
      } catch (e) {
        console.warn('Could not auto-save:', e)
      }
    } else {
      showSavePrompt()
    }
  })
}

function showSavePrompt() {
  // Remove existing prompt if any
  document.getElementById('save-prompt')?.remove()

  const prompt = document.createElement('div')
  prompt.id = 'save-prompt'
  prompt.className = 'save-prompt'
  prompt.innerHTML = `
    <span class="save-prompt-text">💾 Want to save your work?</span>
    <a href="/app-sideproj/login.html" class="save-prompt-btn">Create free account →</a>
    <button class="save-prompt-dismiss" title="Dismiss">✕</button>
  `
  prompt.querySelector('.save-prompt-dismiss')!.addEventListener('click', () => prompt.remove())

  // Insert above action bar
  document.querySelector('.action-bar-wrapper')?.insertAdjacentElement('beforebegin', prompt)
}

async function loadProjectIntoPlayer(project: SavedProject) {
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const uploadSection = document.querySelector('.player-style') as HTMLElement

  try {
    const { comments } = await loadProjectWithComments(project.id)
    store.comments = comments
  } catch {
    store.comments = []
  }

  store.currentProjectId = project.id
  store.duration = project.duration
  store.currentTrack = { fileName: project.file_name, url: '' }

  uploadSection?.classList.add('hidden')

  const projectNameEl = document.getElementById('project-name')
  const projectNameInput = document.getElementById('project-name-input') as HTMLInputElement
  projectNameEl?.classList.remove('hidden')
  projectNameInput.value = project.name

  document.getElementById('player')?.classList.remove('hidden')
  renderCommentsList()
  renderCommentDots()

  if (project.audio_path) {
    try {
      const { getAudioUrl } = await import('../tracks/projects')
      const url = await getAudioUrl(project.audio_path)
      store.currentTrack = { fileName: project.file_name, url }
      loadTrack(url)
      rebindAudioEndedState()
      bindPauseComment()
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], project.file_name)
      await drawWaveform(file, canvas)
    } catch {
      showReuploadNotice(project.file_name)
    }
  } else {
    showReuploadNotice(project.file_name)
  }
}

function showReuploadNotice(fileName: string) {
  const notice = document.createElement('div')
  notice.className = 'reupload-notice'
  notice.innerHTML = `Re-upload <strong>${fileName}</strong> to resume playback`
  document.querySelector('.timeline-row')?.insertAdjacentElement('beforebegin', notice)
  const input = document.getElementById('upload') as HTMLInputElement
  input.addEventListener('change', () => notice.remove(), { once: true })
}
