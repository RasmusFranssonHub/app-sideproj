import { store } from "../state/store"

const popup = document.getElementById("comment-popup")!
const textEl = document.getElementById("comment-text") as HTMLTextAreaElement
const typeEl = document.getElementById("comment-type") as HTMLSelectElement
const colorEl = document.getElementById("comment-color") as HTMLInputElement

export function showCommentPopup() {
  popup.classList.remove("hidden")
  textEl.value = ""
}

export function hideCommentPopup() {
  popup.classList.add("hidden")
}

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

        // 👇 NYA FÄLT
        status: "todo",
        createdAt: Date.now(),
        })


      store.selectedSeconds.clear()
      hideCommentPopup()
    })
}