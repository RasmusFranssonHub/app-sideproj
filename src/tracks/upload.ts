import { store } from '../state/store'
import { loadTrack } from '../audio/player'
import drawWaveform from '../audio/waveform'
import { renderCommentsList } from '../ui/comments'
import { renderCommentDots } from '../ui/timeline'
import { loadProjectWithComments, getAudioUrl, type SavedProject } from '../tracks/projects'

// Expose current file so comments.ts can upload it on save
let _currentFile: File | null = null
export function getCurrentFile(): File | null { return _currentFile }

export function bindUpload() {
  const input = document.getElementById('upload') as HTMLInputElement
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const uploadSection = document.querySelector('.player-style') as HTMLElement

  // Load project from session (from uploads/workspace page)
  const pending = sessionStorage.getItem('soundrev_load_project')
  if (pending) {
    sessionStorage.removeItem('soundrev_load_project')
    const project: SavedProject = JSON.parse(pending)
    loadProjectIntoPlayer(project, canvas, uploadSection)
    return
  }

  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    // Validate audio file
    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/opus',
      'audio/flac', 'audio/x-flac', 'audio/aiff', 'audio/x-aiff',
      'audio/x-ms-wma', 'audio/webm'
    ]
    const validExts = /\.(mp3|wav|aac|m4a|ogg|opus|flac|aiff|aif|wma)$/i
    if (!validTypes.includes(file.type) && !validExts.test(file.name)) {
      alert('Please upload an audio file (mp3, wav, aac, m4a, flac, ogg, etc.)')
      input.value = ''
      return
    }

    _currentFile = file
    const url = URL.createObjectURL(file)
    const baseName = file.name.replace(/\.[^/.]+$/, '')

    store.currentTrack = { fileName: file.name, url }
    store.currentProjectId = null
    store.comments = []
    store.duration = 0

    loadTrack(url)
    await drawWaveform(file, canvas)
    document.dispatchEvent(new CustomEvent('soundrev:trackloaded'))

    uploadSection?.classList.add('hidden')
    showPlayer(baseName)
    renderCommentsList()
    renderCommentDots()

    // Show save prompt if not logged in
    const { getUser } = await import('../lib/api')
    const user = await getUser()
    if (!user) showSavePrompt()
  })
}

function showPlayer(name: string) {
  const nameEl = document.getElementById('project-name')
  const nameInput = document.getElementById('project-name-input') as HTMLInputElement
  nameEl?.classList.remove('hidden')
  if (nameInput) nameInput.value = name
  document.getElementById('player')?.classList.remove('hidden')
  document.getElementById('play-pause')?.classList.add('is-playing')
}

async function loadProjectIntoPlayer(project: SavedProject, canvas: HTMLCanvasElement, uploadSection: HTMLElement) {
  try {
    const { comments } = await loadProjectWithComments(project.id)
    store.comments = comments
  } catch { store.comments = [] }

  store.currentProjectId = project.id
  store.duration = project.duration
  store.currentTrack = { fileName: project.file_name, url: '' }

  uploadSection?.classList.add('hidden')
  showPlayer(project.name)
  renderCommentsList()
  renderCommentDots()

  if (project.audio_path) {
    try {
      const url = await getAudioUrl(project.audio_path)
      store.currentTrack = { fileName: project.file_name, url }
      loadTrack(url)

      // Download blob so waveform can render and currentFile is available
      const resp = await fetch(url)
      const blob = await resp.blob()
      const file = new File([blob], project.file_name)
      _currentFile = file
      await drawWaveform(file, canvas)
      return
    } catch (e) {
      console.warn('Could not load audio from storage', e)
    }
  }

  // Audio not yet in Storage — show re-upload notice
  showReuploadNotice(project.file_name, canvas)
}

function showReuploadNotice(fileName: string, canvas: HTMLCanvasElement) {
  document.getElementById('reupload-notice')?.remove()
  const notice = document.createElement('div')
  notice.id = 'reupload-notice'
  notice.className = 'reupload-notice'
  notice.innerHTML = `
    <span>Re-upload <strong>${fileName}</strong> to enable playback</span>
    <label class="reupload-label">Choose file<input type="file" accept="audio/*" style="display:none" /></label>
  `
  const inp = notice.querySelector('input') as HTMLInputElement
  inp.addEventListener('change', async () => {
    const file = inp.files?.[0]
    if (!file) return
    _currentFile = file
    const url = URL.createObjectURL(file)
    store.currentTrack = { fileName: file.name, url }
    loadTrack(url)
    await drawWaveform(file, canvas)
    notice.remove()
  })
  document.querySelector('.timeline-row')?.insertAdjacentElement('beforebegin', notice)
}

function showSavePrompt() {
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
  document.querySelector('.action-bar-wrapper')?.insertAdjacentElement('beforebegin', prompt)
}