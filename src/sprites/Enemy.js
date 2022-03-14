import Character from "./Character";

import Fov from "./Fov";

export default class Enemy extends Character {
  constructor(scene, map, tile, id, type, items) {
    super(scene, map, tile, id, `enemy-${type}`, items);

    this.fov = new Fov(map);
    this.ai = {
      mode: "PATROL",
      targetCharacter: null,
      lastKnownTargetPosition: null,
    };

    this.waitTurns = 0;

    this.recalculateFov();
  }

  setWait(turns) {
    this.waitTurns = turns;
  }

  popWait() {
    const wait = this.waitTurns;
    this.waitTurns = Phaser.Math.Clamp(this.waitTurns - 1, 0, 100);
    return wait > 0;
  }

  recalculateFov() {
    const tilePosition = this.getTilePosition();
    const facing = this.direction;
    this.fov.recalculate(tilePosition, facing);
  }
}
