export function initMobile() {
  if (window.innerWidth > 768) return
  initHamburger()
  initTimelineBottom()
  injectMobileActionBar()
}

// Call after waveform loads to set padding so time=0 is at center line
export function initMobileTimeline() {
  if (window.innerWidth > 768) return
  const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
  const timeline = document.getElementById('timeline') as HTMLElement
  if (!wrapper || !timeline) return

  const half = wrapper.clientWidth / 2
  timeline.style.paddingLeft = `${half}px`
  // scrollLeft 0 now = time 0 at center
  wrapper.scrollLeft = 0
}

function initHamburger() {
  const nav = document.querySelector('.header-nav') as HTMLElement
  const head = document.querySelector('.nav-bar-head') as HTMLElement
  if (!nav || !head) return

  // Hamburger
  const btn = document.createElement('button')
  btn.className = 'nav-hamburger'
  btn.setAttribute('aria-label', 'Menu')
  btn.innerHTML = '<span></span><span></span><span></span>'
  head.appendChild(btn)

  // Overlay — z-index LOWER than nav drawer
  const overlay = document.createElement('div')
  overlay.className = 'nav-overlay'
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:900;'
  document.body.appendChild(overlay)

  // Nav drawer positioning handled by CSS media query in mobile.scss

  // Replace ul with clean vertical links
  const ul = nav.querySelector('ul') as HTMLElement
  if (ul) {
    ul.style.cssText = 'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;'
    ul.innerHTML = `
      <li><a href="/app-sideproj/" style="display:block;padding:14px 12px;color:rgba(255,255,255,0.8);text-decoration:none;border-radius:8px;font-size:0.95em;border:none;">+ New track</a></li>
      <li><a href="/app-sideproj/uploads.html" style="display:block;padding:14px 12px;color:rgba(255,255,255,0.8);text-decoration:none;border-radius:8px;font-size:0.95em;border:none;">Uploads</a></li>
      <li><a href="/app-sideproj/workspace.html" style="display:block;padding:14px 12px;color:rgba(255,255,255,0.8);text-decoration:none;border-radius:8px;font-size:0.95em;border:none;">Workspace</a></li>
      <li><a href="/app-sideproj/settings.html" style="display:block;padding:14px 12px;color:rgba(255,255,255,0.8);text-decoration:none;border-radius:8px;font-size:0.95em;border:none;">Settings</a></li>
      <li style="margin-top:auto;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);"><a href="/app-sideproj/login.html" style="display:block;padding:14px 12px;color:rgba(255,255,255,0.5);text-decoration:none;border-radius:8px;font-size:0.9em;border:none;" id="nav-login-link">Login</a></li>
    `
  }

  const openNav = () => {
    nav.classList.add('open')
    overlay.style.display = 'block'
    btn.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  const closeNav = () => {
    nav.classList.remove('open')
    overlay.style.display = 'none'
    btn.classList.remove('open')
    document.body.style.overflow = ''
  }

  btn.addEventListener('click', () => {
    nav.classList.contains('open') ? closeNav() : openNav()
  })

  overlay.addEventListener('click', closeNav)

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => closeNav())
  })

  // Update login/logout based on auth state
  import('../lib/auth-guard').then(({ getSession }) => {
    getSession().then(session => {
      const loginLink = document.getElementById('nav-login-link')
      if (!loginLink || !ul) return
      if (session?.user) {
        const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Account'
        // Add username display
        const userLi = document.createElement('li')
        userLi.style.cssText = 'padding: 8px 12px; font-size:0.78em; color:rgba(255,255,255,0.3); font-family: monospace;'
        userLi.textContent = username
        ul.insertBefore(userLi, loginLink.parentElement)
        // Change to sign out
        loginLink.textContent = 'Sign out'
        loginLink.removeAttribute('href')
        loginLink.addEventListener('click', async (e) => {
          e.preventDefault()
          const { supabase } = await import('../lib/superbase')
          await supabase.auth.signOut()
          window.location.href = '/app-sideproj/login.html'
        })
      }
    })
  })
}

function initTimelineBottom() {
  const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
  const currentTimeEl = document.getElementById('current-time')
  const durationEl = document.getElementById('duration')
  if (!wrapper) return

  const bar = document.createElement('div')
  bar.className = 'timeline-bottom-bar'

  const times = document.createElement('div')
  times.className = 'timeline-bottom-times'
  times.innerHTML = '<span id="m-cur">0:00</span><span class="sep">/</span><span id="m-dur">0:00</span>'

  const zoomBtn = document.createElement('button')
  zoomBtn.className = 'waveform-zoom-btn'
  zoomBtn.textContent = '− zoom out'

  bar.appendChild(times)
  bar.appendChild(zoomBtn)
  wrapper.insertAdjacentElement('afterend', bar)

  if (currentTimeEl) {
    new MutationObserver(() => {
      const c = document.getElementById('m-cur')
      if (c) c.textContent = currentTimeEl.textContent
    }).observe(currentTimeEl, { childList: true, subtree: true, characterData: true })
  }
  if (durationEl) {
    new MutationObserver(() => {
      const d = document.getElementById('m-dur')
      if (d) d.textContent = durationEl.textContent
    }).observe(durationEl, { childList: true, subtree: true, characterData: true })
  }

  let zoomed = true
  zoomBtn.addEventListener('click', () => {
    zoomed = !zoomed
    wrapper.classList.toggle('zoomed-out', !zoomed)
    zoomBtn.textContent = zoomed ? '− zoom out' : '+ zoom in'
    setTimeout(() => document.dispatchEvent(new CustomEvent('soundrev:renderdots')), 50)
  })
}

function injectMobileActionBar() {
  document.getElementById('mobile-action-bar')?.remove()

  const bar = document.createElement('div')
  bar.id = 'mobile-action-bar'
  bar.style.cssText = 'display:none;position:fixed;bottom:0;left:0;right:0;height:56px;background:#0e0e0e;border-top:1px solid rgba(255,255,255,0.09);z-index:300;'

  const delBtn = document.createElement('button')
  delBtn.id = 'mob-delete'
  delBtn.style.cssText = 'flex:1;height:100%;background:transparent;border:none;border-right:1px solid rgba(255,255,255,0.07);color:rgba(255,90,90,0.6);font-family:inherit;font-size:0.72em;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;'
  delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Delete`

  const saveBtn = document.createElement('button')
  saveBtn.id = 'mob-save'
  saveBtn.style.cssText = 'flex:1;height:100%;background:transparent;border:none;color:rgba(255,255,255,0.75);font-family:inherit;font-size:0.72em;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;'
  saveBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save`

  bar.appendChild(delBtn)
  bar.appendChild(saveBtn)
  document.body.appendChild(bar)

  delBtn.addEventListener('click', () => document.getElementById('action-delete')?.click())
  saveBtn.addEventListener('click', () => document.getElementById('action-save')?.click())

  const player = document.getElementById('player')
  if (player) {
    new MutationObserver(() => {
      bar.style.display = player.classList.contains('hidden') ? 'none' : 'flex'
    }).observe(player, { attributes: true, attributeFilter: ['class'] })
    bar.style.display = player.classList.contains('hidden') ? 'none' : 'flex'
  }
}