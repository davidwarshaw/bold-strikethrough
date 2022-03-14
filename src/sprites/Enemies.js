import enemyDefinitions from "../definitions/enemyDefinitions.json";

import Enemy from "../sprites/Enemy";

export default class Enemies {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;

    this.list = [];

    this.nextId = 1;
  }

  add(tile, enemyType) {
    const enemyName = `enemy-${enemyType}`;
    const items = JSON.parse(JSON.stringify(enemyDefinitions[enemyName].items));
    this.list.push(new Enemy(this.scene, this.map, tile, this.nextId, enemyType, items));
    this.nextId++;
  }

  showHackPercent() {
    this.getAliveNotPlayerControlled().forEach((enemy) => enemy.hackPercent.setVisible(true));
  }

  hideHackPercent() {
    this.list.forEach((enemy) => enemy.hackPercent.setVisible(false));
  }

  someAtTilePosition(tilePosition) {
    return this.list.some((enemy) => enemy.isAtTilePosition(tilePosition));
  }

  getByTilePosition(tilePosition) {
    const candidates = this.list.filter((enemy) => enemy.isAtTilePosition(tilePosition));
    return candidates.length > 0 ? candidates[0] : null;
  }

  getAliveNotPlayerControlled() {
    return this.list.filter((enemy) => enemy.isAlive && !enemy.isPlayerControlled);
  }

  getAlivePlayerControlled() {
    return this.list.filter((enemy) => enemy.isAlive && enemy.isPlayerControlled);
  }

  getAlive() {
    return this.list.filter((enemy) => enemy.isAlive);
  }

  getFov() {
    const fov = {};
    this.list.forEach((enemy) => {
      Object.assign(fov, enemy.fov.field);
    });
    return fov;
  }
}
