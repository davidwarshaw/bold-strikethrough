import Character from "./Character";

export default class Player extends Character {
  constructor(scene, map, tile, playState) {
    super(scene, map, tile, 0, "player", playState.items);

    this.stats.maxHealth = 200;
    this.stats.health = 200;

    this.sounds.fire = scene.sound.add("fire-player");
    this.sounds.die = scene.sound.add("die-player");
    this.sounds.hackEnded = scene.sound.add("hack-ended", { volume: 0 });

    this.controlledByPlayer();

    this.hackTurnsLeftDisplay.setVisible(false);
  }
}
