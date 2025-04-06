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

function About() {
  return vdm("h1", {}, "About Page",
    backToHome("/"));
}

function backToHome(path) {
  return vdm("button", { onClick: () => router.link(path) }, `go to ${path}`)
}

router.add("/", Home)
  .add("/about", About)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)