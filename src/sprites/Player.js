import Character from "./Character";

export default class Player extends Character {
  constructor(scene, map, tile, playState) {
    super(scene, map, tile, 0, "player", playState.items);
    this.controlledByPlayer();
    this.hackTurnsLeftDisplay.setVisible(false);
    this.stats.maxHealth = 200;
    this.stats.health = 200;
  }
}
