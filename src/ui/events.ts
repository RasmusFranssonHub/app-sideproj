import { play, pause } from "../audio/player"

export function bindPlayerControls() {
  document.getElementById("play")?.addEventListener("click", play)
  document.getElementById("pause")?.addEventListener("click", pause)
}
