// src/lib/auth-guard.ts
// Call this at the top of every page that requires login
import { supabase } from './superbase'

export async function requireAuth(redirectTo = '/app-sideproj/login.html'): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    window.location.href = redirectTo
    throw new Error('Not authenticated')
  }
  return data.user.id
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Update nav to show username + logout when logged in
export async function updateNav() {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return

  // Replace Login link with username + logout
  const loginLinks = document.querySelectorAll('a[href*="login.html"]')
  loginLinks.forEach(link => {
    const li = link.parentElement
    if (!li) return
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Account'
    li.innerHTML = `
      <span class="nav-username">${username}</span>
      <button class="nav-logout" id="nav-logout-btn">Sign out</button>
    `
    document.getElementById('nav-logout-btn')?.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = '/app-sideproj/login.html'
    })
  })
}