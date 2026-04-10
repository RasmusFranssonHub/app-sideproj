export let waveformPeaks: number[] = []

export async function drawWaveform(file: File, canvas: HTMLCanvasElement) {
  // Match canvas resolution to its actual CSS size
  const cssWidth = canvas.clientWidth || canvas.width
  const cssHeight = canvas.clientHeight || canvas.height
  if (cssWidth > 0) {
    canvas.width = cssWidth * window.devicePixelRatio
    canvas.height = cssHeight * window.devicePixelRatio
  }
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  const data = audioBuffer.getChannelData(0)
  const totalSamples = data.length

  const isMobile = window.innerWidth <= 768
  const wrapper = isMobile ? document.querySelector('.timeline-wrapper') : null
  const isZoomedOut = wrapper?.classList.contains('zoomed-out') ?? false
  const width = canvas.width

  // Mobile zoomed-in: content in center 50% (25% empty each side)
  // Mobile zoomed-out: content fills full canvas width
  // Desktop: content fills full canvas width
  const contentStart = (isMobile && !isZoomedOut) ? Math.floor(width * 0.25) : 0
  const contentWidth = (isMobile && !isZoomedOut) ? Math.floor(width * 0.5) : width
  const samplesPerPx = totalSamples / contentWidth

  waveformPeaks = []
  for (let px = 0; px < contentWidth; px++) {
    const start = Math.floor(px * samplesPerPx)
    const end = Math.floor((px + 1) * samplesPerPx)
    let max = 0
    for (let i = start; i < end; i++) {
      const abs = Math.abs(data[i])
      if (abs > max) max = abs
    }
    waveformPeaks.push(max)
  }

  // Store mobile metadata for renderWaveform
  ;(canvas as any)._mobileContentStart = contentStart
  ;(canvas as any)._mobileContentWidth = contentWidth
  ;(canvas as any)._isMobile = isMobile
  ;(canvas as any)._isZoomedOut = isZoomedOut

  renderWaveform(canvas, 0)
}

export function renderWaveform(canvas: HTMLCanvasElement, progress: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx || waveformPeaks.length === 0) return

  const width = canvas.width
  const height = canvas.height

  const isMobileCanvas = (canvas as any)._isMobile
  const wrapper2 = isMobileCanvas ? document.querySelector('.timeline-wrapper') : null
  const nowZoomedOut = wrapper2?.classList.contains('zoomed-out') ?? false
  // If zoom state changed, use full width for zoomed-out
  const contentStart: number = (isMobileCanvas && !nowZoomedOut) ? ((canvas as any)._mobileContentStart ?? 0) : 0
  const contentWidth: number = (isMobileCanvas && !nowZoomedOut) ? ((canvas as any)._mobileContentWidth ?? width) : width
  const isMobile = isMobileCanvas && !nowZoomedOut

  ctx.clearRect(0, 0, width, height)

  if (isMobile) {
    // On mobile: played px = progress * contentWidth (within content area)
    const playedPx = Math.floor(progress * contentWidth)

    for (let i = 0; i < contentWidth; i++) {
      const peak = waveformPeaks[i]
      const barHeight = Math.max(2, peak * height * 0.88)
      const y = (height - barHeight) / 2
      const px = contentStart + i

      ctx.fillStyle = i < playedPx
        ? 'rgba(255,255,255,0.90)'
        : 'rgba(255,255,255,0.18)'
      ctx.fillRect(px, y, 1, barHeight)
    }
  } else {
    // Desktop: full width
    const playedX = Math.floor(progress * width)
    for (let px = 0; px < width; px++) {
      const peak = waveformPeaks[px]
      const barHeight = Math.max(2, peak * height * 0.88)
      const y = (height - barHeight) / 2
      ctx.fillStyle = px < playedX
        ? 'rgba(255,255,255,0.90)'
        : 'rgba(255,255,255,0.18)'
      ctx.fillRect(px, y, 1, barHeight)
    }
  }
}

export default drawWaveform