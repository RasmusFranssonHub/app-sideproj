export type Track = {
  url: string
  fileName: string
}

export const store = {
  audio: null as HTMLAudioElement | null,
  duration: 0,
  currentTime: 0,
  comments: [],
  currentTrack: null as Track | null,
}
