// src/lib/api.ts — all Supabase calls in one place
import { supabase, type Project, type Comment } from './superbase'

// ── AUTH ──────────────────────────────────

export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ── PROJECTS ──────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createProject(name: string, fileName: string, duration: number): Promise<Project> {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, file_name: fileName, duration, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  // Delete audio from storage first
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

// ── COMMENTS ──────────────────────────────

export async function getComments(projectId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createComment(projectId: string, comment: Omit<Comment, 'id' | 'project_id' | 'user_id' | 'created_at'>): Promise<Comment> {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('comments')
    .insert({ ...comment, project_id: projectId, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateComment(id: string, updates: Partial<Comment>): Promise<void> {
  const { error } = await supabase.from('comments').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

// ── AUDIO STORAGE ──────────────────────────

export async function uploadAudio(projectId: string, file: File): Promise<string> {
  const user = await getUser()
  if (!user) throw new Error('Not logged in')

  const path = `${user.id}/${projectId}/${file.name}`
  const { error } = await supabase.storage.from('audio').upload(path, file, { upsert: true })
  if (error) throw error

  // Save path on project
  await updateProject(projectId, { audio_path: path })
  return path
}

export async function getAudioUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from('audio').createSignedUrl(path, 3600)
  if (!data?.signedUrl) throw new Error('Could not get audio URL')
  return data.signedUrl
}