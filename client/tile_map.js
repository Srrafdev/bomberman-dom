import { vdm } from "./miniframework.js";

//  second aremont mean [2, 2, 2, 2, 3, 3, 3, 3, 3, 3] = 40% tree and 60% grass
export default class TileMap {
  constructor(por, rows = 11, columns = 15) {
    // this.container = container;
    this.rows = rows;
    this.columns = columns;
    this.por = por

    this.map = [
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
          this.map[row][col] = 11

        } else if (this.map[row][col] === 0) {
          let random = Math.round(Math.random() * (9 - 0) + 0);
          this.map[row][col] = por[random]
        }
      }
    }
  }

  draw() {
    let tiles = []
    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
        const tileValue = this.map[row][col];
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
}