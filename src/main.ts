// Apply saved theme on every page load
const _t = localStorage.getItem('soundrev_theme')
if (_t) document.documentElement.setAttribute('data-theme', _t)

import './styles/main.scss'

import { bindUpload } from './tracks/upload'
import { bindPlayerControls } from './ui/events'
import { bindSecondClick, bindSecondDrag, bindPlayheadDrag } from './ui/timeline'
import { bindCommentPopup, renderCommentsList } from './ui/comments'
import { renderCommentDots } from './ui/timeline'
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

document.addEventListener('soundrev:commentschanged', () => renderCommentDots())
document.addEventListener('soundrev:renderdots', () => renderCommentDots())