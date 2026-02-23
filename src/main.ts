import "./styles/main.scss"

import { bindUpload } from "./tracks/upload"
import { bindPlayerControls } from "./ui/events"
import { bindPlayheadDrag } from "./ui/timeline"

bindUpload()
bindPlayerControls()
bindPlayheadDrag()
