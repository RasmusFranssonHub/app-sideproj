export function initMobile() {
  if (window.innerWidth > 768) return
  initHamburger()
  initWaveformMobile()
  injectMobileActionBar()
}

// ── Hamburger ─────────────────────────────
function initHamburger() {
  const nav = document.querySelector('.header-nav') as HTMLElement
  const head = document.querySelector('.nav-bar-head') as HTMLElement
  if (!nav || !head) return

  // Drawer label
  const label = document.createElement('span')
  label.className = 'nav-drawer-label'
  label.textContent = 'Menu'
  nav.insertAdjacentElement('afterbegin', label)

  // Hamburger button
  const btn = document.createElement('button')
  btn.className = 'nav-hamburger'
  btn.setAttribute('aria-label', 'Open menu')
  btn.innerHTML = `<span></span><span></span><span></span>`
  head.appendChild(btn)

  // Overlay
  const overlay = document.createElement('div')
  overlay.className = 'nav-overlay'
  document.body.appendChild(overlay)

  const open = () => {
    nav.classList.add('open')
    overlay.classList.add('open')
    btn.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  const close = () => {
    nav.classList.remove('open')
    overlay.classList.remove('open')
    btn.classList.remove('open')
    document.body.style.overflow = ''
  }

  btn.addEventListener('click', () =>
    nav.classList.contains('open') ? close() : open()
  )
  overlay.addEventListener('click', close)
  nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setTimeout(close, 80))
  )
}

// ── Waveform zoom + time bar ──────────────
function initWaveformMobile() {
  const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
  const currentTimeEl = document.getElementById('current-time')
  const durationEl = document.getElementById('duration')
  if (!wrapper) return

  const bar = document.createElement('div')
  bar.className = 'timeline-bottom-bar'

  const times = document.createElement('div')
  times.className = 'timeline-bottom-times'
  times.innerHTML = `<span id="m-cur">0:00</span><span class="sep">/</span><span id="m-dur">0:00</span>`

  const zoomBtn = document.createElement('button')
  zoomBtn.className = 'waveform-zoom-btn'
  setZoomLabel(zoomBtn, true)

  bar.appendChild(times)
  bar.appendChild(zoomBtn)
  wrapper.insertAdjacentElement('afterend', bar)

  if (currentTimeEl && durationEl) {
    const sync = () => {
      const c = document.getElementById('m-cur')
      const d = document.getElementById('m-dur')
      if (c) c.textContent = currentTimeEl.textContent
      if (d) d.textContent = durationEl.textContent
    }
    new MutationObserver(sync).observe(currentTimeEl, { childList: true, subtree: true, characterData: true })
    new MutationObserver(sync).observe(durationEl, { childList: true, subtree: true, characterData: true })
  }

  let zoomed = true
  zoomBtn.addEventListener('click', () => {
    zoomed = !zoomed
    wrapper.classList.toggle('zoomed-out', !zoomed)
    setZoomLabel(zoomBtn, zoomed)
  })
}

function setZoomLabel(btn: HTMLElement, zoomed: boolean) {
  btn.textContent = zoomed ? '− zoom out' : '+ zoom in'
}

// ── Mobile action bar ─────────────────────
function injectMobileActionBar() {
  // Remove existing if any
  document.getElementById('mobile-action-bar')?.remove()

  const bar = document.createElement('div')
  bar.id = 'mobile-action-bar'
  // Start hidden — shown when player is active
  bar.style.display = 'none'

  bar.innerHTML = `
    <button id="mob-delete" class="action-btn action-btn--delete">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
      </svg>
      Delete
    </button>
    <button id="mob-save" class="action-btn action-btn--save">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      Save
    </button>
  `

  document.body.appendChild(bar)

  // Mirror to desktop buttons
  document.getElementById('mob-delete')?.addEventListener('click', () => {
    document.getElementById('action-delete')?.click()
  })
  document.getElementById('mob-save')?.addEventListener('click', () => {
    document.getElementById('action-save')?.click()
  })

  // Show/hide based on player visibility
  const player = document.getElementById('player')
  const showBar = () => {
    bar.style.display = player?.classList.contains('hidden') ? 'none' : 'flex'
  }

  if (player) {
    new MutationObserver(showBar).observe(player, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }
  showBar()
}