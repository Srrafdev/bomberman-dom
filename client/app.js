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

function Home() {
  const contanerRef = (elemnt) => {
    const mapData = [2, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    const tileMap = new TileMap(elemnt, mapData);
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
  let skipCorner = { x: 0, y: 0 };
  function initGame() {
    currPlayer = document.getElementById("current-player");
    const tileElement = document.querySelector('[data-row="1"][data-col="1"]');
    if (!tileElement) {
      updateDebugInfo({ "Error": "Could not find initial tile for positioning" });
      return;
    }
    const tileRect = tileElement.getBoundingClientRect();
    // debugInfo["Tile Rect"] = `Top: ${tileRect.top}, Left: ${tileRect.left}, Width: ${tileRect.width}, Height: ${tileRect.height}`;
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
    debugInfo["uniqueTiles"] = uniqueTiles.map(tile => `(${tile.gridX + 1}, ${tile.gridY + 1})`).join(", ");
    return {
      corners,
      uniqueTiles
    };
  }

  function getTileInfo(gridX, gridY) {
    const tileElement = document.querySelector(
      `[data-row="${gridY + 1}"][data-col="${gridX + 1}"]`
    );
    return {
      id: tileElement.id,
      walkable: tileElement ? (tileElement.id === "grass") : false
    };
  }

  function checkCorners(corners) {
    let cornerTiles = getPlayerTiles(corners[0].x, corners[0].y);
    let cornerTilesBool = cornerTiles.uniqueTiles.map(
      tile => getTileInfo(tile.gridX, tile.gridY)
    );
    let direction = "";
    let index = 0;
    let cal = 0;
    if (cornerTilesBool.length < 4) {
      debugInfo["cornerTilesBool"] = ''
      console.log("out");
      return {
        canMove: false,
        skipCorner: null,
        direction: "",
        index: -1,
      };
    }

    else {
      for (let idx = 0; idx < cornerTilesBool.length; idx++) {
        if (!cornerTilesBool[idx].walkable) {
          cal++;
          if (cal > 1) {
            return {
              canMove: false,
              skipCorner: null,
              direction: "",
              index: -1,
            }
          }
          index = idx;
        }
      }
      if (index === 0) {
        if (lastDirection == "left") {
          skipCorner.y = cornerTiles.corners[0].y - (tileWidth * (cornerTiles.uniqueTiles[0].gridY + 1));
          skipCorner.x = 3;
          debugInfo["Corner tiles"] = cornerTiles.corners[0].y;
          debugInfo["Corner uniqueTiles"] = (tileWidth * (cornerTiles.uniqueTiles[0].gridY + 1));
          console.log(skipCorner);
          console.log("left", index);
          direction = "left";
        } else if (lastDirection == "top") {
          skipCorner.x = cornerTiles.corners[0].x - (tileWidth * (cornerTiles.uniqueTiles[0].gridX + 1));
          skipCorner.y = 3;
          debugInfo["Corner tiles"] = cornerTiles.corners[0].y;
          debugInfo["Corner uniqueTiles"] = (tileWidth * (cornerTiles.uniqueTiles[0].gridY + 1));
          console.log(skipCorner);
          direction = "top";
          console.log("top", index);
        }
      } else if (index === 1) {
        if (lastDirection == "right") {
          skipCorner.y = cornerTiles.corners[1].y - (tileWidth * (cornerTiles.uniqueTiles[1].gridY + 1));
          skipCorner.x = 3;
          debugInfo["Corner tiles"] = cornerTiles.corners[1].y;
          debugInfo["Corner uniqueTiles"] = (tileWidth * (cornerTiles.uniqueTiles[1].gridY + 1));
          console.log(skipCorner);
          direction = "right";
          console.log("right", index);
        } else if (lastDirection == "top") {
          skipCorner.x = cornerTiles.corners[1].x - (tileWidth * (cornerTiles.uniqueTiles[1].gridX)) + 1;
          skipCorner.y = 3;
          debugInfo["Corner tiles"] = cornerTiles.corners[1].y;
          debugInfo["Corner uniqueTiles"] = (tileWidth * (cornerTiles.uniqueTiles[1].gridY + 1));
          console.log(skipCorner);
          direction = "top";
          console.log("top", index);
        }
      } else if (index === 2) {
        if (lastDirection == "left") {
          skipCorner.x = 3;
          skipCorner.y = cornerTiles.corners[2].y - (tileHeight * cornerTiles.uniqueTiles[2].gridY) + 1;
          direction = "left";
          console.log("left", index);
        } else if (lastDirection == "down") {
          skipCorner.x = cornerTiles.corners[2].x - (tileWidth * (cornerTiles.uniqueTiles[2].gridX + 1));
          skipCorner.y = 3;
          direction = "down";
          console.log("down", index);
        }
      } else if (index === 3) {
        if (lastDirection == "right") {
          skipCorner.x = 3;
          skipCorner.y = cornerTiles.corners[3].y - (tileHeight * cornerTiles.uniqueTiles[3].gridY) + 1;
          debugInfo["Corner tiles"] = cornerTiles.corners[3].y;
          debugInfo["Corner uniqueTiles"] = (tileHeight * cornerTiles.uniqueTiles[3].gridY);
          console.log(skipCorner);
          direction = "right";
          console.log("right", index);
        } else if (lastDirection == "down") {
          skipCorner.x = cornerTiles.corners[3].x - (tileWidth * cornerTiles.uniqueTiles[3].gridX) + 1;
          skipCorner.y = 3;
          direction = "down";
          console.log("down", index);
        }
      }
    }
    debugInfo["cornerTilesBool"] = cornerTilesBool.map(info => info.walkable).join(", ");
    return {
      canMove: false,
      skipCorner,
      direction,
      index,
    }
  }

  function canMove(newX, newY) {
    let turnToDirection = {
      canMove: false,
      skipCorner: null,
      direction: "",
      index: -1,
    };
    const tiles = getPlayerTiles(newX, newY);
    debugInfo["tiles"] = tiles.uniqueTiles.map(tile => `(${tile.gridX + 1}, ${tile.gridY + 1})`).join(", ");
    tiles.uniqueTiles.forEach((tile, index) => {
      const tileInfo = getTileInfo(tile.gridX, tile.gridY);

      debugInfo[`Tile ${index + 1}`] =
        `(${tile.gridX + 1}, ${tile.gridY + 1}) - Type: ${tileInfo.id || 'unknown'} - ${tileInfo.walkable ? 'walkable' : 'blocked'}`;
    });
    const canMove = tiles.uniqueTiles.every(tile => {
      const tileInfo = getTileInfo(tile.gridX, tile.gridY);
      if (tileInfo.walkable === false) {
        turnToDirection = checkCorners(tiles.corners);
      }
      return tileInfo.walkable;
    });
    turnToDirection.canMove = canMove;
    debugInfo["Can Move"] = canMove ? "Yes" : "No";
    return turnToDirection;
  }

  function updateCornering(result) {
    debugInfo["corner skipCorner x"] = result.skipCorner.x;
    debugInfo["corner skipCorner y"] = result.skipCorner.y;
    debugInfo["corner index"] = result.index;
    debugInfo["corner direction"] = result.direction;
    if (!result.skipCorner || result.direction === "") return;
    const { skipCorner, direction, index } = result;
    if (index === 0) {
      if (direction === "left") {
        yPos += Math.min(speedY, Math.abs(skipCorner.y));
      } else if (direction === "top") {
        xPos += Math.min(speedX, Math.abs(skipCorner.x));
      }
    }
    else if (index === 1) {
      if (direction === "right") {
        yPos += Math.min(speedY, Math.abs(skipCorner.y));
      } else if (direction === "top") {
        xPos -= Math.min(speedX, Math.abs(skipCorner.x));
      }
    }
    else if (index === 2) {
      if (direction === "left") {
        yPos -= Math.min(speedY, Math.abs(skipCorner.y));
      } else if (direction === "down") {
        xPos += Math.min(speedX, Math.abs(skipCorner.x));
      }
    }
    else if (index === 3) {
      if (direction === "right") {
        yPos -= Math.min(speedY, Math.abs(skipCorner.y));
      } else if (direction === "down") {
        xPos -= Math.min(speedX, Math.abs(skipCorner.x));
      }
    }
  }
  function updateDebugWithTiles() {
    const tiles = getPlayerTiles(xPos, yPos);

    debugInfo["Player Position"] = `X: ${xPos}, Y: ${yPos}`;
    debugInfo["Player Grid"] = `X: ${Math.round(xPos / tileWidth) + 1}, Y: ${Math.round(yPos / tileHeight) + 1}`;
    debugInfo["Player Corner Grid"] = `X: ${Math.floor((xPos + playerWidth - 1) / tileWidth)}, Y: ${Math.floor((yPos + playerHeight - 1) / tileHeight)}`;
    debugInfo["Current Direction"] = currentDirection;
    debugInfo["Last Direction"] = lastDirection;
    debugInfo["Is Moving"] = isMoving ? "Yes" : "No";

    debugInfo["Current Tiles"] = tiles.uniqueTiles.map(tile =>
      `(${tile.gridX + 1}, ${tile.gridY + 1})`
    ).join(", ");

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
      if (newYPos !== yPos && canMove(xPos, newYPos).canMove) yPos = newYPos
      else if ((canMove(xPos, newYPos).direction !== "" && canMove(xPos, newYPos).canMove === false)) {
        console.log(canMove(xPos, newYPos));
        updateCornering(canMove(xPos, newYPos));
      } else if (newXPos !== xPos && canMove(newXPos, yPos).canMove) xPos = newXPos;
      else if (canMove(newXPos, yPos).direction !== "" && canMove(newXPos, yPos).canMove === false) {
        console.log("test flage");
        updateCornering(canMove(newXPos, yPos));
      }
      debugInfo["position final"] = `(${xPos}px, ${yPos}px)`
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
  .add("/game", Home)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)