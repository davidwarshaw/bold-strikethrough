import TileMath from "./TileMath";
const CIRCUIT_BREAKER = 10000;

export default class AStar {
  constructor(map, player, enemies) {
    this.map = map;
    this.player = player;
    this.enemies = enemies;

    this.defaultConfig = {
      blockedByEnemies: false,
      blockedByPlayer: false,
    };
  }

  addNeighbor(neighbors, x, y, config) {
    const passable = this.map.tileIsPassable({ x, y });
    if (!passable) {
      return;
    }

    if (this.enemies) {
      const enemyAtTile = this.enemies.someAtTilePosition({ x, y });
      if (config.blockedByEnemies && enemyAtTile) {
        return;
      }
    }

    neighbors.push({ x, y });
  }

  getNeighbors(point, config) {
    const neighbors = [];
    this.addNeighbor(neighbors, point.x, point.y - 1, config);
    this.addNeighbor(neighbors, point.x, point.y + 1, config);
    this.addNeighbor(neighbors, point.x - 1, point.y, config);
    this.addNeighbor(neighbors, point.x + 1, point.y, config);
    return neighbors;
  }

  addToOpenSet(openSet, goal, current, previous) {
    // Calculate the scores need to judge better paths
    const gScore = previous ? previous.gScore + 1 : 0;
    const hScore = Math.sqrt(Math.pow(goal.x - current.x, 2) + Math.pow(goal.y - current.y, 2));
    const fScore = gScore + hScore;
    const currentNode = {
      x: current.x,
      y: current.y,
      previous,
      gScore,
      hScore,
      fScore,
    };

    // if the open set is empty no need to search for the insertion point
    if (openSet.length === 0) {
      openSet.push(currentNode);
      return;
    }

    // Search for the insertion point in the queue and insert
    for (let i = 0; i < openSet.length; i++) {
      const e = openSet[i];
      if (fScore < e.fScore || (fScore === e.fScore && hScore < e.hScore)) {
        openSet.splice(i, 0, currentNode);
        return;
      }
    }
  }

  findPath(from, to, pathConfig) {
    const config = pathConfig || this.defaultConfig;
    let circuitCount = 0;
    const openSet = [];
    const closedSet = {};

    this.addToOpenSet(openSet, to, from, null);

    while (openSet.length > 0) {
      // Left pop the next best node from the priority queue
      const current = openSet.shift();

      // If the current key is in the closed set, go to the next one
      const currentKey = TileMath.keyFromPoint(current);
      if (currentKey in closedSet) {
        continue;
      }

      // Add to the closed set
      closedSet[currentKey] = current;

      // If we're at the goal, stop searching
      if (current.x === to.x && current.y === to.y) {
        break;
      }

      // Check neighbors
      for (let neighbor of this.getNeighbors(current, config)) {
        const neighborKey = TileMath.keyFromPoint(neighbor);
        if (neighborKey in closedSet) {
          continue;
        }
        this.addToOpenSet(openSet, to, neighbor, current);
      }

      circuitCount++;
      if (circuitCount >= CIRCUIT_BREAKER) {
        console.log("AStar CIRCUIT_BREAKER tripped.");
        return [];
      }
    }

    // Reconstruct path by left pushing previous nodes back to start
    const path = [];
    let node = closedSet[TileMath.keyFromPoint(to)];
    while (node) {
      path.unshift({ x: node.x, y: node.y });
      node = node.previous;
    }
    return path;
  }
}
