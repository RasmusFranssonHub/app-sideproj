import { store } from "../state/store"

export function drawPlayhead(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx || !store.duration) return

  const progress = store.currentTime / store.duration
  const x = canvas.width * progress

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = "red"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, canvas.height)
  ctx.stroke()
}