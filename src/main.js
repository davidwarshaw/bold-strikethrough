import "phaser";

import phaserJuice from "../../phaser3-juice-plugin/dist/phaserJuicePlugin.min.js";

import properties from "./properties";

import BootScene from "./scenes/BootScene";
import TitleScene from "./scenes/TitleScene";
import GameScene from "./scenes/GameScene";
import GameOverScene from "./scenes/GameOverScene";
import InventoryScene from "./scenes/InventoryScene.js";
import WinScene from "./scenes/WinScene.js";

const config = {
  type: Phaser.WEBGL,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: properties.width,
    height: properties.height,
    zoom: properties.scale,
  },
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: {
        showBody: properties.debug,
        showStaticBody: properties.debug,
      },
    },
  },
  plugins: {
    scene: [{ key: "phaserJuice", plugin: phaserJuice, mapping: "juice" }],
  },
  scene: [BootScene, TitleScene, GameScene, GameOverScene, InventoryScene, WinScene],
};

const game = new Phaser.Game(config); // eslint-disable-line no-unused-vars
