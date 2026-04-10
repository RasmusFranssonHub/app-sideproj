export function initMobile() {
  if (window.innerWidth > 768) return
  initHamburger()
  initTimelineBottom()
  injectMobileActionBar()
}

export function initMobileTimeline() {
  if (window.innerWidth > 768) return

  document.addEventListener('soundrev:commentschanged', () => {
    const list = document.getElementById('comments-list')
    const placeholder = document.getElementById('comments-placeholder')
    if (placeholder) {
      placeholder.style.display = list && list.children.length > 0 ? 'none' : 'flex'
    }
  })
}

// Called after waveform is fully drawn — sets padding so time=0 is at center
export function applyMobileTimelineOffset() {
  if (window.innerWidth > 768) return

  // No padding needed — canvas is 220% wide, scrollLeft formula handles centering
  // At progress=0: scrollLeft = 0*canvasW - half = negative → clamped to 0
  // This naturally places time=0 at wrapperWidth/2 from left = center ✓
  setTimeout(() => {
    const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
    if (wrapper) wrapper.scrollLeft = 0
  }, 200)
}

// ── Hamburger ─────────────────────────────
function initHamburger() {
  const nav = document.querySelector('.header-nav') as HTMLElement
  const head = document.querySelector('.nav-bar-head') as HTMLElement
  if (!nav || !head) return

  const btn = document.createElement('button')
  btn.className = 'nav-hamburger'
  btn.setAttribute('aria-label', 'Menu')
  btn.innerHTML = '<span></span><span></span><span></span>'
  head.appendChild(btn)

  const overlay = document.createElement('div')
  overlay.className = 'nav-overlay'
  document.body.appendChild(overlay)

  const ul = nav.querySelector('ul')
  if (ul) {
    ul.innerHTML = `
      <li><a href="/app-sideproj/">+ New track</a></li>
      <li><a href="/app-sideproj/uploads.html">Uploads</a></li>
      <li><a href="/app-sideproj/workspace.html">Workspace</a></li>
      <li><a href="/app-sideproj/settings.html">Settings</a></li>
    `

    const saveLi = document.createElement('li')
    saveLi.id = 'nav-save-li'
    saveLi.style.cssText = 'display:none;border-top:1px solid rgba(255,255,255,0.06);margin-top:8px;padding-top:8px;'
    saveLi.innerHTML = `
      <a id="nav-save-link" style="display:block;padding:15px 8px;font-size:0.95em;color:rgba(255,255,255,0.7);cursor:pointer;border-radius:6px;">Save project</a>
      <a id="nav-delete-link" style="display:block;padding:15px 8px;font-size:0.95em;color:rgba(255,90,90,0.6);cursor:pointer;border-radius:6px;">Delete project</a>
    `
    ul.appendChild(saveLi)

    saveLi.querySelector('#nav-save-link')?.addEventListener('click', () => {
      closeNav()
      setTimeout(() => document.getElementById('action-save')?.click(), 200)
    })
    saveLi.querySelector('#nav-delete-link')?.addEventListener('click', () => {
      closeNav()
      setTimeout(() => document.getElementById('action-delete')?.click(), 200)
    })

    const player = document.getElementById('player')
    if (player) {
      new MutationObserver(() => {
        saveLi.style.display = player.classList.contains('hidden') ? 'none' : 'block'
      }).observe(player, { attributes: true, attributeFilter: ['class'] })
    }
  }

  const openNav = () => {
    nav.classList.add('open')
    overlay.classList.add('open')
    btn.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  const closeNav = () => {
    nav.classList.remove('open')
    overlay.classList.remove('open')
    btn.classList.remove('open')
    document.body.style.overflow = ''
  }

  btn.addEventListener('click', () =>
    nav.classList.contains('open') ? closeNav() : openNav()
  )
  overlay.addEventListener('click', closeNav)
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeNav()))
}

// ── Time display + zoom below timeline ────
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
    // Redraw waveform at new canvas size
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('soundrev:redrawwaveform'))
      document.dispatchEvent(new CustomEvent('soundrev:renderdots'))
    }, 60)
  })
}

// ── Big comment button at bottom ──────────
function injectMobileActionBar() {
  document.getElementById('mobile-comment-btn')?.remove()

  const commentBtn = document.createElement('button')
  commentBtn.id = 'mobile-comment-btn'
  commentBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span id="mob-comment-label">Add comment</span>
  `
  document.body.appendChild(commentBtn)

  commentBtn.addEventListener('click', () => {
    document.getElementById('comment-btn')?.click()
  })

  const updateLabel = () => {
    const label = document.getElementById('mob-comment-label')
    if (!label) return
    const t = document.getElementById('current-time')?.textContent || '0:00'
    label.textContent = `Comment at ${t}`
  }
  setInterval(updateLabel, 500)

  const player = document.getElementById('player')
  if (player) {
    const update = () => {
      commentBtn.style.display = player.classList.contains('hidden') ? 'none' : 'flex'
    }
    new MutationObserver(update).observe(player, { attributes: true, attributeFilter: ['class'] })
    update()
  }
}