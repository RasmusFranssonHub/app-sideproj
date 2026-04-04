export let waveformPeaks: number[] = []

export async function drawWaveform(file: File, canvas: HTMLCanvasElement) {
  // Match canvas resolution to its actual CSS size (important on mobile)
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
  const width = canvas.width
  const samplesPerPx = totalSamples / width

  waveformPeaks = []
  for (let px = 0; px < width; px++) {
    const start = Math.floor(px * samplesPerPx)
    const end = Math.floor((px + 1) * samplesPerPx)
    let max = 0
    for (let i = start; i < end; i++) {
      const abs = Math.abs(data[i])
      if (abs > max) max = abs
    }
    waveformPeaks.push(max)
  }

  renderWaveform(canvas, 0)
}

export function renderWaveform(canvas: HTMLCanvasElement, progress: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx || waveformPeaks.length === 0) return

  const width = canvas.width
  const height = canvas.height

  // On mobile, the canvas does NOT include the left padding offset.
  // Played = everything that has passed under the center line = progress * width.
  // The padding-left on #timeline handles the visual offset.
  const playedX = Math.floor(progress * width)

  ctx.clearRect(0, 0, width, height)

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

export default drawWaveform