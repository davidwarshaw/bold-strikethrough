import properties from "../properties";

import WFCSystem from "../systems/WFCSystem";
import FreeWalkSystem from "../systems/FreeWalkSystem";

import GameMap from "../sprites/GameMap";
import Player from "../sprites/Player";

import seedMap from "../../assets/maps/wfc-seed-01.json";

export default class WFCScene extends Phaser.Scene {
  constructor() {
    super({ key: "WFCScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    const tileset = "tileset";
    // this.seedMap.tilemap = this.make.tilemap({ key: "map-wfc-seed-01" });
    // this.seedMap.tileset = this.seedMap.tilemap.addTilesetImage(tileset, tileset);
    // this.seedMap.layers.seed = this.seedMap.tilemap.createLayer("seed", this.seedMap.tileset, 0, 0);
    // this.seedMap.tilemap.setLayer("seed");

    this.wfcSystem = new WFCSystem(this, seedMap);

    this.map = new GameMap(this, this.wfcSystem);

    this.player = new Player(this, this.map, { x: 4, y: 4 });
    this.freeWalkSystem = new FreeWalkSystem(this, this.map, this.player);

    const { widthInPixels, heightInPixels } = this.map.tilemap;
    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.startFollow(this.player, true, 1, 1, 0, 0);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer) =>
      this.freeWalkSystem.pointerDown(pointer)
    );
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer) =>
      this.freeWalkSystem.pointerUp(pointer)
    );

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
      this.input.off(Phaser.Input.Events.POINTER_UP);
    });

    this.wfcSystem.wfc.run((tile) => this.map.putTile(tile));
  }

  update(time, delta) {}
}
