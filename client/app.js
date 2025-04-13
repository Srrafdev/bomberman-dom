import { EventSystem, Router, setRoot, StateManagement } from "./miniframework.js";
import { renderComponent } from "./miniframework.js";
import { vdm } from "./miniframework.js";
import TileMap from "./tile_map.js";

setRoot("app")
const router = new Router(renderComponent)

function Home() {
  const contanerRef = (elemnt) => {
    const tileMap = new TileMap(elemnt, [2, 2, 2, 2, 3, 3, 3, 3, 3, 3])
    tileMap.draw()
  }

  return vdm("div", {}, vdm("div", { id: "game-container", ref: contanerRef }), CurrPlayer())
}

function NewUserPage() {
  return (
    vdm("div", { class: "contener_auth" },
      vdm("div", { class: "pixel2" },
        vdm("input", { type: "text", class: "input_name", placeholder: "your name", maxlength: "20" }),
        vdm("button", { class: "btn_add_name" }, "play"),
        EmotesCat(2, "insert your name")
      )
    ))
}

function message(text) {
  return vdm('div', { class: "message_image" }, text)
}

// defferent emotes cat 0 -> 14
function EmotesCat(emoteNumber, message, random = true) {
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
  function setanime() {
    if (steps[emoteNumber]) {
      root.style.setProperty('--EmotesNumber', emoteNumber)
      root.style.setProperty('--EmotesSteps', steps[emoteNumber])
    }
    emoteNumber = Math.round(Math.random() * (13 - 1) + 1);
  }
  setanime()
  if (random) setInterval(() => setanime(), 3000);

  return (
    vdm("div", { class: "contaner_emotes" },
      vdm("div", { class: "emotes_cat" }),
      vdm("div", { class: "message_emotes" },
        vdm("p", {}, message)
      )
    )
  )
}

function backToHome(path) {
  return vdm("button", { onClick: () => router.link(path) }, `go to ${path}`)
}

function CurrPlayer() {
  let currPlayer;
  let xPos = 0;
  let yPos = 0;
  let keysPressed = {};
  let animationFrameId;
  let speedX = 5;
  let speedY = 5;
  let width = 0;
  let height = 0;

  function initGame() {
    currPlayer = document.getElementById("current-player");
    const tileElement = document.querySelector('[data-row="1"][data-col="1"]');
    if (!tileElement) {
      console.error("Could not find initial tile for positioning", tileElement);
      return;
    }
    const tileRect = tileElement.getBoundingClientRect();
    width = tileRect.width;
    height = tileRect.height;
    speedX = Math.floor(width / 10);
    speedY = Math.floor(height / 10);
    console.log(`Tile size: ${width}x${height}, Speed: ${speedX},${speedY}`);
    if (currPlayer) {
      currPlayer.style.width = `${width}px`;
      currPlayer.style.height = `${height}px`;
      currPlayer.style.top = `${tileRect.top}px`; // top make drop frame work by translate
      currPlayer.style.left = `${tileRect.left}px`; // left make drop frame work by translate
      console.log(`Player position: ${tileRect.top}px, ${tileRect.left}px`);
    }
    EventSystem.add(document, "keydown", (e) => { keysPressed[e.key] = true; });
    EventSystem.add(document, "keyup", (e) => { keysPressed[e.key] = false; });
    startGameLoop();
  }

  function startGameLoop() {
    function gameLoop() {
      if (keysPressed["ArrowUp"]) yPos -= speedY;
      if (keysPressed["ArrowDown"]) yPos += speedY;
      if (keysPressed["ArrowLeft"]) xPos -= speedX;
      if (keysPressed["ArrowRight"]) xPos += speedX;

      const tile = document.elementFromPoint(xPos, yPos);
      if (tile && tile.classList.contains("tile")) {
        console.log("Collision with tile detected");
      }

      if (currPlayer) {
        currPlayer.style.transform = `translate(${xPos}px, ${yPos}px)`;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  setTimeout(initGame, 10);

  return vdm("div", {
    id: "current-player",
    class: "current-player"
  });
}

router.add("/", Home)
  .add("/auth", NewUserPage)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)