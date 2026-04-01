export function initMobile() {
  if (window.innerWidth > 768) return

  initHamburger()
  initWaveformZoom()
  initCommentsToggle()
  moveTimesToBottom()
}

// ── Hamburger nav ─────────────────────────

function initHamburger() {
  const nav = document.querySelector('.header-nav') as HTMLElement
  const head = document.querySelector('.nav-bar-head') as HTMLElement
  if (!nav || !head) return

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

  function open() {
    nav.classList.add('open')
    overlay.classList.add('open')
    btn.classList.add('open')
    btn.setAttribute('aria-label', 'Close menu')
  }

  function close() {
    nav.classList.remove('open')
    overlay.classList.remove('open')
    btn.classList.remove('open')
    btn.setAttribute('aria-label', 'Open menu')
  }

  btn.addEventListener('click', () => nav.classList.contains('open') ? close() : open())
  overlay.addEventListener('click', close)
  nav.querySelectorAll('a, button').forEach(el => el.addEventListener('click', close))
}

// ── Waveform zoom + times below ──────────

function moveTimesToBottom() {
  const wrapper = document.querySelector('.timeline-wrapper') as HTMLElement
  const currentTimeEl = document.getElementById('current-time')
  const durationEl = document.getElementById('duration')
  if (!wrapper || !currentTimeEl || !durationEl) return

  // Hide the side times
  currentTimeEl.style.display = 'none'
  durationEl.style.display = 'none'

  // Create bottom bar with times + zoom button
  const bar = document.createElement('div')
  bar.className = 'timeline-bottom-bar'

  const times = document.createElement('div')
  times.className = 'timeline-bottom-times'
  times.innerHTML = `
    <span id="mobile-current-time">0:00</span>
    <span class="sep">/</span>
    <span id="mobile-duration">0:00</span>
  `

  const zoomBtn = document.createElement('button')
  zoomBtn.className = 'waveform-zoom-btn'
  zoomBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
    Zoom out
  `

  bar.appendChild(times)
  bar.appendChild(zoomBtn)
  wrapper.insertAdjacentElement('afterend', bar)

  // Sync times from original elements
  const observer = new MutationObserver(() => {
    const mt = document.getElementById('mobile-current-time')
    const md = document.getElementById('mobile-duration')
    if (mt) mt.textContent = currentTimeEl.textContent
    if (md) md.textContent = durationEl.textContent
  })
  observer.observe(currentTimeEl, { childList: true, characterData: true, subtree: true })
  observer.observe(durationEl, { childList: true, characterData: true, subtree: true })

  // Zoom toggle
  let zoomed = true
  zoomBtn.addEventListener('click', () => {
    zoomed = !zoomed
    wrapper.classList.toggle('zoomed-out', !zoomed)
    zoomBtn.innerHTML = zoomed
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> Zoom out`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg> Zoom in`
  })
}

function initWaveformZoom() {
  // handled in moveTimesToBottom
}

// ── Comments toggle ───────────────────────

function initCommentsToggle() {
  const panel = document.getElementById('comments-panel')
  const list = document.getElementById('comments-list')
  if (!panel || !list) return

  // Wrap list in collapsible wrapper
  const wrapper = document.createElement('div')
  wrapper.id = 'comments-list-wrapper'
  list.parentNode!.insertBefore(wrapper, list)
  wrapper.appendChild(list)

  // Create toggle bar
  const bar = document.createElement('div')
  bar.className = 'comments-toggle-bar'

  const label = document.createElement('div')
  label.className = 'comments-toggle-label'

  const countBadge = document.createElement('span')
  countBadge.className = 'comments-toggle-count'
  countBadge.id = 'mobile-comment-count'
  countBadge.textContent = '0'

  label.innerHTML = `Comments `
  label.appendChild(countBadge)

  const chevron = document.createElement('span')
  chevron.className = 'comments-toggle-chevron'
  chevron.textContent = '▾'

  bar.appendChild(label)
  bar.appendChild(chevron)
  panel.insertAdjacentElement('afterbegin', bar)

  let open = false

  function updateCount() {
    if (!list) return
    const n = list.querySelectorAll('.comment-item').length
    countBadge.textContent = String(n)
    // Auto-open if first comment added
    if (n > 0 && !open) toggle()
  }

  function toggle() {
    open = !open
    wrapper.classList.toggle('open', open)
    chevron.classList.toggle('open', open)
  }

  bar.addEventListener('click', toggle)

  // Watch for comment list changes to update count
  const mo = new MutationObserver(updateCount)
  mo.observe(list, { childList: true })
  updateCount()
}