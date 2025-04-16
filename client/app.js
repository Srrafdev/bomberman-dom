import { waitingChattingPage } from "./htmls.js";
import { EventSystem, Router, setRoot, StateManagement } from "./miniframework.js";
import { renderComponent } from "./miniframework.js";
import { vdm } from "./miniframework.js";
import TileMap from "./tile_map.js";

setRoot("app")
const router = new Router(renderComponent)

function createDebugPanel() {
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style.position = 'absolute';
  debugPanel.style.bottom = '10px';
  debugPanel.style.left = '10px';
  debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugPanel.style.color = 'white';
  debugPanel.style.padding = '10px';
  debugPanel.style.borderRadius = '5px';
  debugPanel.style.fontFamily = 'monospace';
  debugPanel.style.fontSize = '12px';
  debugPanel.style.maxWidth = '300px';
  debugPanel.style.maxHeight = '150px';
  debugPanel.style.overflow = 'auto';
  debugPanel.style.zIndex = '1000';
  document.body.appendChild(debugPanel);
  return debugPanel;
}

function updateDebugInfo(info) {
  const debugPanel = document.getElementById('debug-panel') || createDebugPanel();
  debugPanel.innerHTML = Object.entries(info)
    .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
    .join('');
}

let tileMap  // by ayoub

function Home() {
  const contanerRef = (elemnt) => {
    const mapData = [2, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    tileMap = new TileMap(elemnt, mapData);
    tileMap.draw();
  }

  return vdm("div", {}, vdm("div", { id: "game-container", ref: contanerRef }), CurrPlayer())
}

// -------------------------- yassine
let ws
export let room = {}
export let left_time = 20
function NewUserPage() {

  function enter(event) {
    event.preventDefault();
    let nickname = document.getElementById("nickname").value;

    if (!nickname) {
      alert("Please enter a nickname.");
      return;
    }
    if (nickname.length < 1) {
      alert("Nickname must be 2 characters or more.");
      return;
    }
    ws = new WebSocket("ws://localhost:8080");

    // onopen event is triggered when the connection is established
    ws.onopen = function () {
      console.log("Connected to server");
      ws.send(JSON.stringify({ type: "set_nickname", nickname: nickname }));
    };

    ws.onmessage = function (event) {
      // console.log("some data received", event);
      const data = JSON.parse(event.data);

      console.log(data.type, data.players);
      if (data.type === "room_info") {
        // console.log("Room info:", data);
        room = data;

      } else if (data.state === "waiting" && (data.type === "new_player" || data.type === "player_left")) {
        room.players = data.players
        if (data.type === "player_left" && room.players.length === 1) {
          left_time = 20
        }
        renderComponent(waitingChattingPage, false);
      } else if (data.type === "countdown") {
        left_time = data.timeLeft
        renderComponent(waitingChattingPage, false)
      } else if (data.type === "player_left") {
        // Handle player leaving

      }
    };

    ws.onclose = function () {
      console.log("Disconnected from server");
      router.link("/");

    };

    ws.onerror = function (error) {
      console.error("WebSocket error:", error);
    };
    event.target.href = "/waiting"
    router.link("/waiting");
  }
  return (
    vdm("div", { class: "contener_auth" },
      vdm("div", { class: "pixel2" },
        vdm("input", { type: "text", class: "input_name", id: "nickname", placeholder: "your name", maxlength: "20" }),
        vdm("button", { class: "btn_add_name", onClick: (e) => enter(e) }, "play"),
        EmotesCat(2, "insert your name")
      )
    ))
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
  let speedX = 0.5;
  let speedY = 0.5;
  let tileWidth = 0;
  let tileHeight = 0;
  let playerWidth = 0;
  let playerHeight = 0;
  let debugInfo = {};
  let currentDirection = "idle";
  let isMoving = false;
  let lastDirection = "down";

  let gridX, gridY //--------------------------------- added by ayoub

  function initGame() {
    currPlayer = document.getElementById("current-player");
    const tileElement = document.querySelector('[data-row="1"][data-col="1"]');
    if (!tileElement) {
      updateDebugInfo({ "Error": "Could not find initial tile for positioning" });
      return;
    }
    const tileRect = tileElement.getBoundingClientRect();
    tileWidth = Math.round(tileRect.width);
    tileHeight = Math.round(tileRect.height);
    playerWidth = tileWidth - 5;
    playerHeight = tileHeight - 5;
    speedX = Math.max(1, Math.floor(tileWidth / 20));
    speedY = Math.max(1, Math.floor(tileHeight / 20));

    if (currPlayer) {
      currPlayer.style.width = `${playerWidth}px`;
      currPlayer.style.height = `${playerHeight}px`;
      currPlayer.style.top = `${tileRect.top}px`;
      currPlayer.style.left = `${tileRect.left}px`;


      const spriteScaleFactor = playerHeight / 48;

      currPlayer.style.setProperty('--sprite-width', `${48 * spriteScaleFactor}px`);
      currPlayer.style.setProperty('--sprite-height', `${48 * spriteScaleFactor}px`);
      currPlayer.style.setProperty('--sprite-sheet-width', `${192 * spriteScaleFactor}px`);

      updatePlayerState("idle");
    }

    debugInfo["Player Size"] = `Width: ${playerWidth}, Height: ${playerHeight}`;
    EventSystem.add(document, "keydown", (e) => { keysPressed[e.key] = true; });
    EventSystem.add(document, "keyup", (e) => { keysPressed[e.key] = false; });

    startGameLoop();
  }

  function updatePlayerState(state, direction) {
    currPlayer.classList.remove("right", "left", "top", "down", "idle", "idle-right", "idle-left", "idle-top", "idle-down");

    if (state === "idle") {
      if (direction) {
        currPlayer.classList.add(`idle-${direction}`);
        lastDirection = direction;
      } else {
        currPlayer.classList.add(`idle-${lastDirection}`);
      }

      currentDirection = "idle";

    } else {
      currPlayer.classList.add(direction);
      lastDirection = direction;
      currentDirection = direction;
    }

    debugInfo["Current State"] = state;
    debugInfo["Current Direction"] = direction || lastDirection;
  }

  function getPlayerTiles(playerX, playerY) {
    const corners = [
      { x: playerX, y: playerY },
      { x: playerX + playerWidth, y: playerY },
      { x: playerX, y: playerY + playerHeight },
      { x: playerX + playerWidth, y: playerY + playerHeight }
    ];
    debugInfo["corners"] = corners.map(corner => `(${corner.x}, ${corner.y})`).join(", ");
    const gridPositions = corners.map(corner => ({
      gridX: Math.floor(corner.x / tileWidth),
      gridY: Math.floor(corner.y / tileHeight)
    }));
    const uniqueTiles = [];
    gridPositions.forEach(pos => {
      const exists = uniqueTiles.some(tile =>
        tile.gridX === pos.gridX && tile.gridY === pos.gridY
      );

      if (!exists) {
        uniqueTiles.push(pos);
      }
    });
    debugInfo["uniqueTiles"] = uniqueTiles.map(tile => `(${tile.gridY + 1}, ${tile.gridX + 1})`).join(", ");
    return uniqueTiles;
  }

  function getTileInfo(gridX, gridY) {
    const tileElement = document.querySelector(
      `[data-row="${gridY + 1}"][data-col="${gridX + 1}"]`
    );
    return {
      walkable: tileElement ? (tileElement.id === "grass") : false
    };
  }

  function canMove(newX, newY) {
    const tiles = getPlayerTiles(newX, newY);
    const canMove = tiles.every(tile => {
      const tileInfo = getTileInfo(tile.gridX, tile.gridY);
      return tileInfo.walkable;
    });
    debugInfo["tiles"] = tiles.map(tile => `(${tile.gridY + 1}, ${tile.gridX + 1})`).join(", ");
    debugInfo["Can Move"] = canMove ? "Yes" : "No";
    return canMove;
  }

  function updateDebugWithTiles() {
    const tiles = getPlayerTiles(xPos, yPos);

    debugInfo["Player Position"] = `X: ${xPos}, Y: ${yPos}`;
    debugInfo["Player Grid"] = `X: ${Math.floor(xPos / tileWidth)}, Y: ${Math.floor(yPos / tileHeight)}`;
    debugInfo["Player Corner Grid"] = `X: ${Math.floor((xPos + playerWidth - 1) / tileWidth)}, Y: ${Math.floor((yPos + playerHeight - 1) / tileHeight)}`;
    debugInfo["Current Direction"] = currentDirection;
    debugInfo["Last Direction"] = lastDirection;
    debugInfo["Is Moving"] = isMoving ? "Yes" : "No";

    debugInfo["Current Tiles"] = tiles.map(tile =>
      `(${tile.gridY + 1}, ${tile.gridX + 1})`
    ).join(", ");

    tiles.forEach((tile, index) => {
      const tileInfo = getTileInfo(tile.gridX, tile.gridY);
      debugInfo[`Tile ${index + 1}`] =
        `(${tile.gridX}, ${tile.gridY}) - Type: ${tileInfo.id || 'unknown'} - ${tileInfo.walkable ? 'walkable' : 'blocked'}`;
    });

    updateDebugInfo(debugInfo);
  }

  function startGameLoop() {
    function gameLoop() {
      let newXPos = xPos;
      let newYPos = yPos;
      let moved = false;
      let direction = lastDirection;

      // -------------------- added by ayoub
      let tas7i7BombX = 1
      let tas7i7BombY = 1

      // ------------------------------------------------------------------------------ ayoub logic
      if (keysPressed["ArrowUp"]) {
        newYPos -= speedY;
        direction = "top";
        moved = true;

        const modX = newXPos % tileWidth;
        const percentX = (modX * 100) / tileWidth;
        if (percentX > 60) newXPos += (tileWidth - modX);
        else if (percentX < 40) newXPos -= modX;
        else newYPos += speedY;

        gridY = Math.floor((newYPos) / tileHeight);
        gridX = Math.floor((newXPos + tileWidth / 2) / tileWidth);

        tas7i7BombX = 1
        tas7i7BombY = 2
      } else if (keysPressed["ArrowDown"]) {
        newYPos += speedY;
        direction = "down";
        moved = true;

        const modX = newXPos % tileWidth;
        const percentX = (modX * 100) / tileWidth;
        if (percentX > 60) newXPos += (tileWidth - modX);
        else if (percentX < 40) newXPos -= modX;
        else newYPos -= speedY;

        gridY = Math.ceil((newYPos) / tileHeight);
        gridX = Math.floor((newXPos + tileWidth / 2) / tileWidth);

        tas7i7BombX = 1
        tas7i7BombY = 0
      } else if (keysPressed["ArrowLeft"]) {
        newXPos -= speedX;
        direction = "left";
        moved = true;

        const modY = newYPos % tileHeight;
        const percentY = (modY * 100) / tileHeight;
        if (percentY > 60) newYPos += (tileHeight - modY);
        else if (percentY < 40) newYPos -= modY;
        else newXPos += speedX;

        gridX = Math.floor((newXPos) / tileWidth);
        gridY = Math.floor((newYPos + tileHeight / 2) / tileHeight);

        tas7i7BombX = 2
        tas7i7BombY = 1

      } else if (keysPressed["ArrowRight"]) {
        newXPos += speedX;
        direction = "right";
        moved = true;

        const modY = newYPos % tileHeight;
        const percentY = (modY * 100) / tileHeight;
        if (percentY > 60) newYPos += (tileHeight - modY);
        else if (percentY < 40) newYPos -= modY;
        else newXPos -= speedX;

        gridX = Math.ceil((newXPos) / tileWidth);
        gridY = Math.floor((newYPos + tileHeight / 2) / tileHeight);

        tas7i7BombX = 0
        tas7i7BombY = 1
      } else {
        gridX = Math.floor((newXPos + tileWidth / 2) / tileWidth);
        gridY = Math.floor((newYPos + tileHeight / 2) / tileHeight);
        tas7i7BombX = 1
        tas7i7BombY = 1
      }

      // ------------------------------------------------------------------------------ last
      //   if (keysPressed["ArrowUp"]) {
      //     newYPos -= speedY;
      //     direction = "top";
      //     moved = true;
      //   } else if (keysPressed["ArrowDown"]) {
      //     newYPos += speedY;
      //     direction = "down";
      //     moved = true;
      //   }

      //   if (keysPressed["ArrowLeft"]) {
      //     newXPos -= speedX;
      //     direction = "left";
      //     moved = true;
      //   } else if (keysPressed["ArrowRight"]) {
      //     newXPos += speedX;
      //     direction = "right";
      //     moved = true;
      //   }

      // ----------------------- bomb ayoub
      if (keysPressed[" "]) {
        tileMap.setTile(gridY + tas7i7BombY, gridX + tas7i7BombX, 4)
        keysPressed[" "] = false
      }
      // ------------------------------------

      if (moved) {
        if (currentDirection !== direction) {
          updatePlayerState("moving", direction);
        }
      } else if (isMoving) {
        updatePlayerState("idle", lastDirection);
      }

      isMoving = moved;

      // ------------------------------------------------------------------------------ last
      // if (newXPos !== xPos && canMove(newXPos, yPos)) xPos = newXPos;
      // if (newYPos !== yPos && canMove(xPos, newYPos)) yPos = newYPos;

      // ------------------------------------------------------------------------------ $ added by ayoub
      const destinationTile = document.querySelector(`[data-row="${gridY + 1}"][data-col="${gridX + 1}"]`);

      if (destinationTile && destinationTile.id === "grass") {
        xPos = newXPos;
        yPos = newYPos;
      }
      // ------------------------------------------------------------------------------- end |

      currPlayer.style.transform = `translate(${xPos}px, ${yPos}px)`;

      // updateDebugWithTiles();
      animationFrameId = requestAnimationFrame(gameLoop);
    }


    animationFrameId = requestAnimationFrame(gameLoop);
  }

  setTimeout(initGame, 10);
  return vdm("div", {
    id: "current-player",
    class: "current-player idle-down" // default state
  });
}
router
  .add("/", NewUserPage)
  .add("/waiting", waitingChattingPage)
  .add("/game", Home)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)