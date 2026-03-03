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

export function play() {
  store.audio?.play()
}

export function pause() {
  store.audio?.pause()
}

export function seekToSecond(second: number) {
  if (!store.audio) return

  store.audio.currentTime = second
  store.currentTime = second
  store.currentSecond = Math.floor(second)
}


