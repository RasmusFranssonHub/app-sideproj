// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ibclobhyhyqyomrlldec.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_vwIaFCWgZlbnHgVuk1AyrA_Gjzb7IG-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Profile = {
  id: string
  username: string
  created_at: string
}

export type Project = {
  id: string
  user_id: string
  name: string
  file_name: string
  duration: number
  audio_path: string | null
  created_at: string
  updated_at: string
}

export type Comment = {
  id: string
  project_id: string
  user_id: string
  seconds: number[]
  text: string
  type: string
  color: string
  status: 'todo' | 'working' | 'review' | 'done'
  created_at: string
}