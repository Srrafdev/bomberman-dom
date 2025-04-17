import { waitingChattingPage } from "./htmls.js";
import { EventSystem, Router, setRoot } from "./miniframework.js";
import { renderComponent } from "./miniframework.js";
import { vdm } from "./miniframework.js";

setRoot("app")
const router = new Router(renderComponent)
export { room, left_time, sendMessage, messages }

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

function Game() {
  let rows = 11;
  let columns = 15;
  let por = [10, 11, 11, 11, 11, 11, 11, 11, 11, 11]

  let map = [
    [2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
    [5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 6],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
    [5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 6],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
    [5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 6],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
    [5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 6],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
    [7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9],
  ];

  function mpbuild() {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const positionPlayrs = [
          [1, 1], //p1
          [1, 2],
          [2, 1],
          [1, 13],// p2
          [1, 12],
          [2, 13],
          [9, 1], // p3
          [8, 1],
          [9, 2],
          [9, 13], //p4
          [8, 13],
          [9, 12]
        ];

        if (positionPlayrs.some(([r, c]) => r === row && c === col)) {
          map[row][col] = 11

        } else if (map[row][col] === 0) {
          let random = Math.round(Math.random() * 9);
          map[row][col] = por[random]
        }
      }
    }
  }
  mpbuild()

  function draw() {
    let tiles = []
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const tileValue = map[row][col];
        const tileClasses = {
          1: "toba",
          2: "topLeft",
          3: "top",
          4: "topRight",
          5: "left",
          6: "right",
          7: "downLeft",
          8: "down",
          9: "downRight",
          10: "tree",
          11: "grass",
          12: "box"
        };
        const className = tileClasses[tileValue];
        tiles.push(vdm("div", {
          class: `tile ${className ?? ""}`,
          "data-row": row,
          "data-col": col,
          id: className ?? "",
        }))
      }
    }
    return tiles
  }

  const contanerRef = (container) => {
    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight;

    const tileSize = Math.min(
      containerWidth / columns,
      containerHeight / rows
    );

    container.style.gridTemplateRows = `repeat(${rows}, ${tileSize}px)`;
    container.style.gridTemplateColumns = `repeat(${columns}, ${tileSize}px)`;
  }

  return vdm("div", {}, vdm("div", { id: "game-container", ref: contanerRef }, ...draw()), CurrPlayer())
}

// -------------------------- yassine
let ws
let room = {}
let left_time = 20
let nickname
let messages = []
function sendMessage(e) {
  e.preventDefault();
  let message = document.getElementById("message").value;
  document.getElementById("message").value = "";
  console.log("send message", message);
  ws.send(JSON.stringify({ type: "chat", message: message, nickname: nickname }));
}

function enter(event) {
  messages = []
  event.preventDefault();
  nickname = document.getElementById("nickname").value;

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
    ws.send(JSON.stringify({ type: "set_nickname", nickname: nickname }));
  };

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === "room_info") {
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
      if (left_time === 0){
        ws.send(JSON.stringify({ type: "creat_map", nickname: nickname }))
        router.link("/game")
      }

    } else if (data.type === "player_left") {
      // Handle player leaving in the game

    } else if (data.type === "chat") {
      let is_mine = data.nickname === nickname
      console.log(data.nickname, nickname)
      messages.push({ nickname: data.nickname, message: data.message, is_mine: is_mine });
      renderComponent(waitingChattingPage, false);
    }
  };

  ws.onclose = function () {
    console.log("Disconnected from server");
    router.link("/");

  };

  ws.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
  router.link("/waiting");
}

function NewUserPage() {
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
      currPlayer.style.top = `${tileRect.top + 2.5}px`;
      currPlayer.style.left = `${tileRect.left + 2.5}px`;


      const spriteScaleFactor = playerHeight / 32;

      currPlayer.style.setProperty('--sprite-width', `${32 * spriteScaleFactor}px`);
      currPlayer.style.setProperty('--sprite-height', `${32 * spriteScaleFactor}px`);
      currPlayer.style.setProperty('--sprite-sheet-width', `${128 * spriteScaleFactor}px`);

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
      gridY: Math.floor(corner.x / tileWidth),
      gridX: Math.floor(corner.y / tileHeight)
    }));

    debugInfo["uniqueTiles"] = gridPositions.map(tile => `(${tile.gridX + 1}, ${tile.gridY + 1})`).join(", ");
    return gridPositions;
  }

  function getTileInfo(gridY, gridX) {
    const tileElement = document.querySelector(
      `[data-row="${gridX + 1}"][data-col="${gridY + 1}"]`
    );
    return {
      walkable: tileElement ? (tileElement.id === "grass") : false
    };
  }

  function canMove(newX, newY) {
    const tiles = getPlayerTiles(newX, newY);
    debugInfo["tiles"] = tiles.map(tile => `(${tile.gridX + 1}, ${tile.gridY + 1})`).join(", ");
    const canMove = tiles.every(tile => {
      const tileInfo = getTileInfo(tile.gridY, tile.gridX);
      return tileInfo.walkable;
    });
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
      `(${tile.gridX + 1}, ${tile.gridY + 1})`
    ).join(", ");

    tiles.forEach((tile, index) => {
      const tileInfo = getTileInfo(tile.gridY, tile.gridX);
      debugInfo[`Tile ${index + 1}`] =
        `(${tile.gridY}, ${tile.gridX}) - Type: ${tileInfo.id || 'unknown'} - ${tileInfo.walkable ? 'walkable' : 'blocked'}`;
    });

    updateDebugInfo(debugInfo);
  }

  function startGameLoop() {
    function gameLoop() {
      let newXPos = xPos;
      let newYPos = yPos;
      let moved = false;
      let direction = lastDirection;

      if (keysPressed["ArrowUp"]) {
        newYPos -= speedY;
        direction = "top";
        moved = true;
      } else if (keysPressed["ArrowDown"]) {
        newYPos += speedY;
        direction = "down";
        moved = true;
      }

      if (keysPressed["ArrowLeft"]) {
        newXPos -= speedX;
        direction = "left";
        moved = true;
      } else if (keysPressed["ArrowRight"]) {
        newXPos += speedX;
        direction = "right";
        moved = true;
      }

      if (moved) {
        if (currentDirection !== direction) {
          updatePlayerState("moving", direction);
        }
      } else if (isMoving) {
        updatePlayerState("idle", lastDirection);
      }

      isMoving = moved;

      if (newXPos !== xPos && canMove(newXPos, yPos)) xPos = newXPos;
      if (newYPos !== yPos && canMove(xPos, newYPos)) yPos = newYPos;

      currPlayer.style.transform = `translate(${xPos}px, ${yPos}px)`;

      updateDebugWithTiles();
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
  .add("/game", Game)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)