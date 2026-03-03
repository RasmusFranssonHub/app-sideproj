import { store } from "../state/store"
import { seekToSecond } from "../audio/player"

/* ---------- DOM ---------- */

const popup = document.getElementById("comment-popup")!
const textEl = document.getElementById("comment-text") as HTMLTextAreaElement
const typeEl = document.getElementById("comment-type") as HTMLSelectElement
const colorEl = document.getElementById("comment-color") as HTMLInputElement

/* ---------- POPUP ---------- */

export function showCommentPopup() {
  popup.classList.remove("hidden")
  textEl.value = ""
}

export function hideCommentPopup() {
  popup.classList.add("hidden")
}

/* ---------- BIND ---------- */

export function bindCommentPopup() {
  document
    .getElementById("comment-cancel")!
    .addEventListener("click", hideCommentPopup)

  document
    .getElementById("comment-save")!
    .addEventListener("click", () => {
      if (store.selectedSeconds.size === 0) return

      store.comments.push({
        id: crypto.randomUUID(),
        seconds: [...store.selectedSeconds],
        text: textEl.value,
        type: typeEl.value,
        color: colorEl.value,
        status: "todo",
        createdAt: Date.now(),
      })

      store.selectedSeconds.clear()
      hideCommentPopup()
      renderCommentsList() // 👈 VIKTIG
    })
}

/* ---------- LISTA ---------- */

export function renderCommentsList() {
  const list = document.getElementById("comments-list")
  if (!list) return

  list.innerHTML = ""

  for (const comment of store.comments) {
    const li = document.createElement("li")
    li.className = "comment-item"
    li.style.setProperty("--color", comment.color)

    li.innerHTML = `
      <div class="comment-type">${comment.type}</div>
      <div class="comment-text">${comment.text}</div>
      <div class="comment-meta">
        @ ${comment.seconds.join(", ")}s · ${comment.status}
      </div>
    `

    // klick = hoppa till första sekunden
    li.addEventListener("click", () => {
      seekToSecond(comment.seconds[0])
    })

    list.appendChild(li)
  }
}