import { astar, Graph } from "./pathAStar";

export default class AStar {
  constructor(map, player, enemies) {
    this.map = map;
    this.player = player;
    this.enemies = enemies;

    this.defaultConfig = {
      blockedByEnemies: false,
      blockedByPlayer: false,
    };

    this.recreateGraph();
  }

  recreateGraph() {
    const matrix = this.map.toGraphMatrix();
    let matrixWithEnemies;
    if (this.enemies) {
      matrixWithEnemies = matrix.map((row, y) =>
        row.map((passable, x) => (this.enemies.someAtTilePosition({ x, y }) ? 0 : passable))
      );
    } else {
      matrixWithEnemies = matrix;
    }
    this.graph = new Graph(matrixWithEnemies, { diagonal: true });
  }

  findPath(from, to, pathConfig) {
    // console.log(`findPath: from: ${from.x}, ${to.x} to: ${to.x}, ${to.y}`);
    const start = this.graph.grid[from.y][from.x];
    const end = this.graph.grid[to.y][to.x];
    const result = astar.search(this.graph, start, end, {
      heuristic: astar.heuristics.diagonal,
    });
    const path = result.map((node) => {
      const { x, y } = node;
      return { x: y, y: x };
    });
    if (path.length) {
      path.unshift({ x: from.x, y: from.y });
    }
    return path;
  }
}
