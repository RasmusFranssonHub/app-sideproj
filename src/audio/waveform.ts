export let waveformPeaks: number[] = []

export async function drawWaveform(file: File, canvas: HTMLCanvasElement) {
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
  const playedX = Math.floor(progress * width)

  ctx.clearRect(0, 0, width, height)

  for (let px = 0; px < width; px++) {
    const peak = waveformPeaks[px]
    const barHeight = Math.max(2, peak * height * 0.88)
    const y = (height - barHeight) / 2

    if (px < playedX) {
      // Played — bright white
      ctx.fillStyle = 'rgba(255,255,255,0.90)'
    } else {
      // Unplayed — muted
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
    }
    ctx.fillRect(px, y, 1, barHeight)
  }
}

export default drawWaveform