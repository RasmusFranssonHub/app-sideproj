import { store } from "../state/store"
import { renderCurrentTime } from "../ui/timeline"


let audio: HTMLAudioElement | null = null

export function loadTrack(src: string) {
  if (audio) audio.pause()

  audio = new Audio(src)
  store.audio = audio

  audio.onloadedmetadata = () => {
  store.duration = audio!.duration
}

  audio.ontimeupdate = () => {
    store.currentTime = audio!.currentTime
    renderCurrentTime()
  }

  audio.play()
}

export function play() {
  audio?.play()
}

export function pause() {
  audio?.pause()
}

