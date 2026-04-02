import './styles/main.scss'
import './mobile/mobile.scss'
import { updateNav } from './lib/auth-guard'
import { initMobile } from './mobile/mobile'
import './styles/settings.scss'

updateNav()
initMobile()

// ── Theme ─────────────────────────────────
const THEME_KEY = 'soundrev_theme'

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)

  const lightBtn = document.getElementById('theme-light')
  const darkBtn = document.getElementById('theme-dark')
  lightBtn?.classList.toggle('active', theme === 'light')
  darkBtn?.classList.toggle('active', theme === 'dark')
}

// Apply saved theme on load
const saved = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null
applyTheme(saved ?? 'dark')

document.getElementById('theme-light')?.addEventListener('click', () => applyTheme('light'))
document.getElementById('theme-dark')?.addEventListener('click', () => applyTheme('dark'))