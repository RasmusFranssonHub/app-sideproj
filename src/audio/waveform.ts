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
  const width = canvas.width
  const height = canvas.height
  const step = Math.floor(data.length / width)

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#4caf50"

  for (let i = 0; i < width; i++) {
    let min = 1
    let max = -1

    for (let j = 0; j < step; j++) {
      const value = data[i * step + j]
      if (value < min) min = value
      if (value > max) max = value
    }

    ctx.fillRect(
      i,
      (1 + min) * height / 2,
      1,
      Math.max(1, (max - min) * height / 2)
    )
  }
}

export default drawWaveform