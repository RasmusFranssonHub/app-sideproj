import { store } from '../state/store'
import { loadTrack } from '../audio/player'
import drawWaveform from '../audio/waveform'
import { rebindAudioEndedState } from '../ui/events'
import { bindPauseComment } from '../ui/timeline'

export function bindUpload() {
  const input = document.getElementById('upload') as HTMLInputElement
  const canvas = document.getElementById('waveform') as HTMLCanvasElement
  const uploadSection = document.querySelector('.player-style') as HTMLElement

  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const baseName = file.name.replace(/\.[^/.]+$/, '')

    store.currentTrack = { fileName: file.name, url }

    loadTrack(url)
    await drawWaveform(file, canvas)

    rebindAudioEndedState()
    bindPauseComment()

    // Hide upload, show player + project name
    uploadSection?.classList.add('hidden')

    const projectNameEl = document.getElementById('project-name')
    const projectNameInput = document.getElementById('project-name-input') as HTMLInputElement
    projectNameEl?.classList.remove('hidden')
    projectNameInput.value = baseName

    document.getElementById('player')?.classList.remove('hidden')
    document.getElementById('play-pause')?.classList.remove('is-playing')
  })
}
