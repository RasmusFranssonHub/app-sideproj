export async function drawWaveform(
  file: File,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  const durationSeconds = Math.floor(audioBuffer.duration)
  const width = canvas.width
  const height = canvas.height
  const blockWidth = width / durationSeconds

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#4caf50"

  for (let second = 0; second < durationSeconds; second++) {
    const start = second * sampleRate
    const end = start + sampleRate

    let sum = 0
    for (let i = start; i < end; i++) {
      sum += Math.abs(data[i])
    }

    const rms = sum / sampleRate
    const blockHeight = rms * height * 3 // gain, justera vid behov

    const x = second * blockWidth
    const y = (height - blockHeight) / 2

    ctx.fillRect(x, y, blockWidth - 1, blockHeight)
  }
}

export default drawWaveform