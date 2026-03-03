import "./styles/main.scss"

import { bindUpload } from "./tracks/upload"
import { bindPlayerControls } from "./ui/events"
import { bindSecondClick, bindSecondDrag } from "./ui/timeline"
import { bindCommentPopup, renderCommentsList } from "./ui/comments"

bindUpload()
bindPlayerControls()
bindSecondClick()
bindSecondDrag()
bindCommentPopup()
renderCommentsList()
