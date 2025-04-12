import { Router, setRoot, StateManagement } from "./miniframework.js";
import { renderComponent } from "./miniframework.js";
import { vdm } from "./miniframework.js";
import TileMap from "./tile_map.js";

setRoot("app")
const router = new Router(renderComponent)

function Home() {
  const contanerRef = (elemnt) => {
    const tileMap = new TileMap(elemnt)
    tileMap.draw()
  }

  return vdm("div", { id: "game-container", ref: contanerRef })
}

function NewUserPage() {
  return vdm("div", { class: "contener_auth" },
    vdm("div", { class: "contener_name" },
      EmotesCat(3)
    )
  )
}

function message(text) {
  return vdm('div', { class: "message_image" }, text)
}

// defferent emotes cat 0 -> 14
function EmotesCat(emoteNumber) {
  const root = document.documentElement
  const steps = {
    0: 1,
    1: 2,
    2: 5,
    3: 4,
    4: 2,
    5: 2,
    6: 2,
    7: 2,
    8: 2,
    9: 2,
    10: 2,
    11: 2,
    12: 1,
    13: 2,
    14: 1
  }
  if (steps[emoteNumber]) {
    root.style.setProperty('--EmotesNumber', emoteNumber)
    root.style.setProperty('--EmotesSteps', steps[emoteNumber])
  }
  return vdm("div", { class: "emotes_cat" })
}

function backToHome(path) {
  return vdm("button", { onClick: () => router.link(path) }, `go to ${path}`)
}

router.add("/", Home)
  .add("/auth", NewUserPage)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)