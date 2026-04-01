import './styles/main.scss'
import './mobile/mobile.scss'

import { bindUpload } from './tracks/upload'
import { bindPlayerControls } from './ui/events'
import { bindSecondClick, bindSecondDrag, bindPlayheadDrag } from './ui/timeline'
import { bindCommentPopup, renderCommentsList } from './ui/comments'
import { updateNav } from './lib/auth-guard'
import { initMobile } from './mobile/mobile'

bindUpload()
bindPlayerControls()
bindSecondClick()
bindSecondDrag()
bindPlayheadDrag()
bindCommentPopup()
renderCommentsList()
updateNav()
initMobile()
