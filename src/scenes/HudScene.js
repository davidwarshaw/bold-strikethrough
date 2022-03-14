import properties from "../properties";

import uiDefinitions from "../definitions/uiDefinitions.json";

import TileMath from "../utils/TileMath";

import Font from "../ui/Font";

export default class HudScene extends Phaser.Scene {
  constructor() {
    super({ key: "HudScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    // this.inventoryButton = this.createButtons(0, "inventory-button");
    // this.equipmentButton = this.createButtons(1, "equipment-button");
    this.hackButton = this.createButtons(0, "hack-button");

    const gameScene = this.scene.get("GameScene");
    gameScene.events.on("hack-complete", () => {
      this.hackButton.buttonImage.visible = false;
      this.hackButton.activeImage.visible = false;
    });
    gameScene.events.on("hack-ended", () => {
      this.hackButton.buttonImage.visible = true;
    });
    gameScene.events.on("wayfinder-change", (vector) => this.setWayfinder(vector));
    gameScene.events.on("damage-ship", (text) => this.setDamageText(text));
  }

  setFuelLevel(level) {}

  setWayfinder(vector) {}

  setDamageText(text) {}

  createButtons(index, buttonType) {
    const buttonX = 16 + (32 + 4) * index;
    const buttonY = properties.height - 16;

    const buttonImage = this.add.image(buttonX, buttonY, buttonType, 1);
    buttonImage.setInteractive();

    const activeImage = this.add.image(buttonX, buttonY, "button-active");
    activeImage.visible = false;

    buttonImage.on("pointerdown", () => {
      this.events.emit("pressed-button", buttonType);
      if (buttonType !== "inventory-button") {
        activeImage.visible = true;
      }
    });

    return { buttonImage, activeImage };
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
