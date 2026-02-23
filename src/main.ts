import "./styles/main.scss"

import { bindUpload } from "./tracks/upload"
import { bindPlayerControls } from "./ui/events"

// 🔴 VIKTIG RAD
import "./ui/timeline"

bindUpload()
bindPlayerControls()
