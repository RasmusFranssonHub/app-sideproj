import './styles/main.scss'
 
import { bindUpload } from './tracks/upload'
import { bindPlayerControls } from './ui/events'
import { bindSecondClick, bindSecondDrag, bindPlayheadDrag, bindPauseComment } from './ui/timeline'
import { bindCommentPopup, renderCommentsList } from './ui/comments'
import { updateNav } from './lib/auth-guard'

 
bindUpload()
bindPlayerControls()
bindSecondClick()
bindSecondDrag()
bindPlayheadDrag()
bindCommentPopup()
renderCommentsList()
bindPauseComment()
updateNav()
