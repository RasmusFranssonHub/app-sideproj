import { store } from "../state/store"
import { loadTrack } from "../audio/player"

export function bindUpload() {
  const input = document.getElementById("upload") as HTMLInputElement

  input.addEventListener("change", () => {
    const file = input.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)

    store.currentTrack = {
      fileName: file.name,
      url,
    }

    loadTrack(url)
  })
}
