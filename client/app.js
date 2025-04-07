import { Router, setRoot } from "./miniframework.js";
import { renderComponent } from "./miniframework.js";
import { vdm } from "./miniframework.js";
import TileMap from "./tile_map.js";

setRoot("app")
const router = new Router(renderComponent)

function Home() {
  setTimeout(() => {
    const gamecontaner = document.getElementById("game-container")
    console.log(gamecontaner);
    const tileMap = new TileMap(gamecontaner)
    tileMap.draw()
  }, 10);

  return vdm("div", { id: "game-container" })
}

function auth() {
  return vdm("div", {class: "contener_auth"}, EmotesCat(3))
}

function message(text) {
  return vdm('div', {class : "message_image"}, text)
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
  .add("/auth", auth)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)