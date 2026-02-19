export type Comment = {
  id: string
  time: number
  text: string
}

export const store = {
  audio: null as HTMLAudioElement | null,
  duration: 0,
  currentTime: 0,
  comments: [] as Comment[],
}
