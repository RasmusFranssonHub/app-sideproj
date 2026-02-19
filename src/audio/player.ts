import { store } from "../state/store"

let audio: HTMLAudioElement | null = null

export function loadTrack(src: string) {
  if (audio) audio.pause()

  audio = new Audio(src)
  store.audio = audio

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

import { renderCurrentTime } from "../ui/timeline"
