import properties from "../properties";

import levelDefinitions from "../definitions/levelDefinitions.json";

import Font from "../ui/Font";

import HudScene from "../scenes/HudScene";

import GameSystem from "../systems/GameSystem";

import ModuleSystem from "../systems/ModuleSystem";

import GameMap from "../sprites/GameMap";
import Player from "../sprites/Player";
import Enemies from "../sprites/Enemies";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    this.moduleSystem = new ModuleSystem();

    const { widthInModules, heightInModules, style } = levelDefinitions[this.playState.levelNumber];
    this.map = new GameMap(this, widthInModules, heightInModules, style, this.moduleSystem);

    this.player = new Player(this, this.map, this.map.spawn, this.playState);
    this.enemies = new Enemies(this, this.map);
    this.map.getEnemySpawnCandidates(3 * this.playState.levelNumber + 1).forEach((spawn) => {
      this.enemies.add(spawn, "01");
    });

    this.cameras.main.setBounds(
      0,
      0,
      this.map.tilemap.widthInPixels,
      this.map.tilemap.heightInPixels
    );
    this.cameras.main.startFollow(this.player, true, 1, 1, 0, 0);

    this.gameSystem = new GameSystem(this, this.map, this.player, this.enemies);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer) =>
      this.gameSystem.pointerDown(pointer)
    );
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer) => this.gameSystem.pointerUp(pointer));

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
      this.input.off(Phaser.Input.Events.POINTER_UP);
    });

    const hudScene = this.scene.get("HudScene");
    hudScene.events.on("pressed-button", (buttonName) => {
      // console.log(`hud button presed ${buttonName}`);
      switch (buttonName) {
        case "hack-button": {
          if (this.gameSystem.chooseHack) {
            this.gameSystem.chooseHack = false;
            this.enemies.showHackPercent(false);
          } else {
            this.gameSystem.chooseHack = true;
            this.enemies.showHackPercent(true);
          }
          return;
        }
        case "inventory-button": {
          this.playState.inventoryCharacter = this.player;
          this.scene.pause("GameSccene");
          this.scene.setVisible(false, "GameScene");
          this.scene.pause("HudScene");
          this.scene.setVisible(false, "HudScene");
          this.scene.launch("InventoryScene", this.playState);
          return;
        }
      }
    });
  }

  update(time, delta) {}

  pointerdown(pointer) {
    // console.log('\nPointer Down:');
    // console.log(`turnState: ${this.turnState}`);
    switch (this.turnState) {
    }
  }

  playerKilled() {
    this.scene.remove("HudScene");
    this.scene.start("GameOverScene", this.playState);
  }

  nextLevel() {
    this.playState.levelNumber++;
    if (this.playState.levelNumber > 4) {
      this.playState.levelNumber = 0;
      this.scene.start("WinScene");
    } else {
      this.scene.remove("HudScene");
      this.scene.add("HudScene", HudScene, true, this.playState);
      this.scene.start("GameScene", this.playState);
    }
  }
}
