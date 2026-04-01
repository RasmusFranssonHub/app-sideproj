import './styles/main.scss'
import './styles/mobile.scss'
import './styles/auth.scss'
import { signIn, signUp, getUser } from './lib/api'

// Redirect if already logged in
getUser().then(user => {
  if (user) window.location.href = '/app-sideproj/uploads.html'
})

// ── Tabs ──────────────────────────────────
const tabLogin = document.getElementById('tab-login')!
const tabSignup = document.getElementById('tab-signup')!
const formLogin = document.getElementById('form-login')!
const formSignup = document.getElementById('form-signup')!

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active')
  tabSignup.classList.remove('active')
  formLogin.classList.remove('hidden')
  formSignup.classList.add('hidden')
})

tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active')
  tabLogin.classList.remove('active')
  formSignup.classList.remove('hidden')
  formLogin.classList.add('hidden')
})

// ── Login ─────────────────────────────────
document.getElementById('btn-login')!.addEventListener('click', async () => {
  const email = (document.getElementById('login-email') as HTMLInputElement).value
  const password = (document.getElementById('login-password') as HTMLInputElement).value
  const errorEl = document.getElementById('login-error')!
  const btn = document.getElementById('btn-login') as HTMLButtonElement

  errorEl.classList.add('hidden')
  btn.textContent = 'Signing in...'
  btn.disabled = true

  try {
    await signIn(email, password)
    window.location.href = '/app-sideproj/uploads.html'
  } catch (e: unknown) {
    errorEl.textContent = e instanceof Error ? e.message : 'Login failed'
    errorEl.classList.remove('hidden')
    btn.textContent = 'Sign in'
    btn.disabled = false
  }
})

// ── Signup ────────────────────────────────
document.getElementById('btn-signup')!.addEventListener('click', async () => {
  const username = (document.getElementById('signup-username') as HTMLInputElement).value
  const email = (document.getElementById('signup-email') as HTMLInputElement).value
  const password = (document.getElementById('signup-password') as HTMLInputElement).value
  const errorEl = document.getElementById('signup-error')!
  const successEl = document.getElementById('signup-success')!
  const btn = document.getElementById('btn-signup') as HTMLButtonElement

  errorEl.classList.add('hidden')
  successEl.classList.add('hidden')
  btn.textContent = 'Creating account...'
  btn.disabled = true

  try {
    await signUp(email, password, username)
    successEl.classList.remove('hidden')
    btn.textContent = 'Create account'
    btn.disabled = false
  } catch (e: unknown) {
    errorEl.textContent = e instanceof Error ? e.message : 'Signup failed'
    errorEl.classList.remove('hidden')
    btn.textContent = 'Create account'
    btn.disabled = false
  }
})

// Enter key support
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return
  if (!formLogin.classList.contains('hidden')) {
    document.getElementById('btn-login')!.click()
  } else {
    document.getElementById('btn-signup')!.click()
  }
})


import { initMobile } from './mobile/mobile'
initMobile()