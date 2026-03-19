// src/tracks/projects.ts — Supabase version
import { supabase } from '../lib/superbase'
import { getUser } from '../lib/api'
import { store } from '../state/store'
import type { Comment } from '../state/store'

export type SavedProject = {
  id: string
  name: string
  file_name: string
  duration: number
  audio_path: string | null
  created_at: string
  updated_at: string
}

// ── Projects ──────────────────────────────

export async function loadProjects(): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function saveCurrentProject(name: string): Promise<SavedProject> {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')

  if (store.currentProjectId) {
    // Update existing
    const { data, error } = await supabase
      .from('projects')
      .update({
        name,
        file_name: store.currentTrack?.fileName ?? '',
        duration: store.duration,
        updated_at: new Date().toISOString(),
      })
      .eq('id', store.currentProjectId)
      .select()
      .single()
    if (error) throw error

    // Sync comments
    await syncComments(store.currentProjectId)
    return data
  } else {
    // Create new
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        file_name: store.currentTrack?.fileName ?? '',
        duration: store.duration,
        user_id: user.id,
      })
      .select()
      .single()
    if (error) throw error

    store.currentProjectId = data.id
    await syncComments(data.id)
    return data
  }
}

async function syncComments(projectId: string) {
  const user = await getUser()
  if (!user) return

  // Delete all existing comments for this project and re-insert
  await supabase.from('comments').delete().eq('project_id', projectId)

  if (store.comments.length === 0) return

  const rows = store.comments.map((c: Comment) => ({
    id: c.id,
    project_id: projectId,
    user_id: user.id,
    seconds: c.seconds,
    text: c.text,
    type: c.type,
    color: c.color,
    status: c.status,
  }))

  const { error } = await supabase.from('comments').insert(rows)
  if (error) throw error
}

export async function loadProjectWithComments(projectId: string): Promise<{
  project: SavedProject
  comments: Comment[]
}> {
  const { data: project, error: pe } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (pe) throw pe

  const { data: comments, error: ce } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (ce) throw ce

  return {
    project,
    comments: (comments ?? []).map(c => ({
      id: c.id,
      seconds: c.seconds,
      text: c.text,
      type: c.type,
      color: c.color,
      status: c.status,
      createdAt: new Date(c.created_at).getTime(),
    })),
  }
}

export async function deleteProject(id: string): Promise<void> {
  // Delete audio from storage if exists
  const { data: project } = await supabase
    .from('projects')
    .select('audio_path')
    .eq('id', id)
    .single()

  if (project?.audio_path) {
    await supabase.storage.from('audio').remove([project.audio_path])
  }

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── Audio storage ──────────────────────────

export async function uploadAudio(projectId: string, file: File): Promise<string> {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')

  const path = `${user.id}/${projectId}/${file.name}`
  const { error } = await supabase.storage
    .from('audio')
    .upload(path, file, { upsert: true })
  if (error) throw error

  await supabase
    .from('projects')
    .update({ audio_path: path, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return path
}

export async function getAudioUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('audio')
    .createSignedUrl(path, 3600)
  if (!data?.signedUrl) throw new Error('Could not get audio URL')
  return data.signedUrl
}

// ── Helpers ───────────────────────────────

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function exportProjectJson(project: SavedProject & { comments?: Comment[] }) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name}.soundrev.json`
  a.click()
  URL.revokeObjectURL(url)
}