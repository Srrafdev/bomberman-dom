//  second aremont mean [2, 2, 2, 2, 3, 3, 3, 3, 3, 3] = 40% tree and 60% grass
export default class TileMap {
  constructor(container, por, rows = 11, columns = 15) {
    this.container = container;
    this.rows = rows;
    this.columns = columns;
    this.por = por

    this.map = [
      [1.1, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.3],
      [1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5],
      [1.4, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1.5],
      [1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5],
      [1.4, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1.5],
      [1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5],
      [1.4, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1.5],
      [1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5],
      [1.4, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1.5],
      [1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5],
      [1.6, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.8],
    ];
    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
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
          this.map[row][col] = 3

        } else if (this.map[row][col] === 0) {
          let random = Math.round(Math.random() * (9 - 0) + 0);
          this.map[row][col] = por[random]
        }
      }
    }
  }

  draw() {
    const containerWidth = this.container.offsetWidth;
    const containerHeight = this.container.offsetHeight;

    const tileSize = Math.min(
      containerWidth / this.columns,
      containerHeight / this.rows
    );

    this.container.style.gridTemplateRows = `repeat(${this.rows}, ${tileSize}px)`;
    this.container.style.gridTemplateColumns = `repeat(${this.columns}, ${tileSize}px)`;

    this.container.innerHTML = ""; // Clear previous tiles
    // console.log(containerHeight, containerWidth);
    // console.log(tileSize);
    // console.log(this.container);

    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
        const tileValue = this.map[row][col];
        const tileDiv = document.createElement("div");
        tileDiv.classList.add("tile");
        tileDiv.dataset.row = row;
        tileDiv.dataset.col = col;
        const tileClasses = {
          1: "toba",
          1.1: "topLeft",
          1.2: "top",
          1.3: "topRight",
          1.4: "left",
          1.5: "right",
          1.6: "downLeft",
          1.7: "down",
          1.8: "downRight",
          2: "tree",
          3: "grass",
          4: "box"
        };
        const className = tileClasses[tileValue];
        if (className) {
          tileDiv.id = className
          tileDiv.classList.add(className);
        }

        this.container.appendChild(tileDiv);
      }
    }
  }

  // added by ayoub
  setTile(row, col, value) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.columns) {
      this.map[row][col] = value; // hadi 3la web soket

      const existingTile = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (existingTile) {
        
        // can add more
        const tileClasses = {
          4: "box"
        };
        
        const className = tileClasses[value];
        if (className && existingTile.id === "grass") {
          existingTile.className = "tile";
          existingTile.id = className;
          existingTile.classList.add(className);
        }
      }
      return true;
    }
    return false;
  }

}