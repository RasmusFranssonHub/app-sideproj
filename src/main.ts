import "./styles/main.scss"

import { bindUpload } from "./tracks/upload"
import { bindPlayerControls } from "./ui/events"
import { bindWaveformSeek } from "./ui/timeline"

bindUpload()
bindPlayerControls()
bindWaveformSeek()
