import { store } from "../state/store"
import { loadTrack } from "../audio/player"
import drawWaveform from "../audio/waveform"

export function bindUpload() {
  const input = document.getElementById("upload") as HTMLInputElement
  const canvas = document.getElementById("waveform") as HTMLCanvasElement

  input.addEventListener("change", async () => {
    const file = input.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)

    store.currentTrack = {
      fileName: file.name,
      url,
    }

    loadTrack(url)

    if (canvas) {
      drawWaveform(file, canvas)
    }

    const waveformCanvas =
      document.getElementById("waveform") as HTMLCanvasElement

  drawWaveform(file, waveformCanvas)
  })
}
