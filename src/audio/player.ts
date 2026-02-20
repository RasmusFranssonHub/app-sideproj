import { store } from "../state/store"

let audio: HTMLAudioElement | null = null

export function loadTrack(src: string) {
  if (audio) audio.pause()

  audio = new Audio(src)
  store.audio = audio

  audio.onloadedmetadata = () => {
    store.duration = audio!.duration
  }

  audio.play()
}

