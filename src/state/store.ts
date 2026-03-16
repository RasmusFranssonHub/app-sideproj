export type CommentStatus = 'todo' | 'working' | 'review' | 'done'

export type Comment = {
  id: string
  seconds: number[]
  text: string
  type: string
  color: string
  status: CommentStatus
  createdAt: number
}

export type Track = {
  url: string
  fileName: string
}

export const store = {
  audio: null as HTMLAudioElement | null,
  duration: 0,
  currentTime: 0,
  currentSecond: 0,
  currentTrack: null as Track | null,
  comments: [] as Comment[],
  selectedSeconds: new Set<number>(),
  activeCommentIds: new Set<string>(),
  currentProjectId: null as string | null,
}






