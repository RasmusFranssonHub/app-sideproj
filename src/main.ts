import './styles/main.scss';
import { bindUpload } from "./tracks/upload"
import { bindPlayerControls } from "./ui/events"
import { drawPlayhead } from "./audio/playhead"

bindUpload()
bindPlayerControls()

const playheadCanvas = document.getElementById("playhead") as HTMLCanvasElement

function tick() {
  if (playheadCanvas) {
    drawPlayhead(playheadCanvas)
  }
  requestAnimationFrame(tick)
}

tick()
