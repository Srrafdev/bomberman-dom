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

function NewUserPage() {
  return vdm("div", { class: "contener_auth" },
    vdm("div", { class: "contener_name" },
      vdm("input", { class: "input_name" })
      // EmotesCat(3)
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
      `(${tile.gridY+1}, ${tile.gridX+1})`
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
router.add("/", Home)
  .add("/auth", NewUserPage)

router.setNotFound(() =>
  vdm("div", {},
    vdm("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)