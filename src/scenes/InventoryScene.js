import properties from "../properties";

import uiDefinitions from "../definitions/uiDefinitions.json";

import TileMath from "../utils/TileMath";

import Font from "../ui/Font";

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: "InventoryScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    this.character = this.playState.inventoryCharacter;

    this.inventoryButton = this.createInventoryButton();

    this.descriptionText = this.font.render(32 + 8, 32, "");
    this.itemButtons = this.createItemButtons();

    this.selectItem(this.itemButtons[0].item);
  }

  equipItem(item) {
    console.log("equip item:");
    console.log(item);
    this.character.inventory.equipItem(item.number);
    this.itemButtons.forEach((itemButton) => {
      if (itemButton.equipButton) {
        const { item } = this.character.inventory.getItemByNumber(itemButton.item.number);
        console.log(item);
        const equipFrame = item.equipped ? 1 : 0;
        itemButton.equipButton.setTexture("equip-button", equipFrame);
      }
    });
  }

  selectItem(item) {
    this.itemButtons.forEach((itemButton) => {
      const activeFrame = item.number === itemButton.item.number ? 0 : 1;
      itemButton.frame.setTexture("small-button-frame", activeFrame);
    });
    const chars = item.description.split("");
    let description = "";
    let lineCharCount = 0;
    for (let i = 0; i < item.description.length; i++) {
      if (lineCharCount > 20 && chars[i] === " ") {
        description = description + "\n";
        lineCharCount = -1;
      } else {
        description = description + chars[i];
      }
      lineCharCount++;
    }
    this.descriptionText.setText(description);
  }

  createItemButtons() {
    const top = 32;
    const frameX = properties.width - 32 - 90 - 26 - 8;
    const equipX = properties.width - 32 - 10;
    return this.character.inventory.getDisplayForm().map((item, i) => {
      console.log(item);
      const y = top + i * (32 + 8);

      const frame = this.add.image(frameX, y, "small-button-frame", 1);
      frame.setInteractive();
      frame.on("pointerdown", () => {
        // this.sounds.enter.play();
        this.selectItem(item);
      });

      const textLeft = frameX - 90 + 16;
      const text = this.font.render(textLeft, y - 4, item.name);
      const number = this.font.render(
        textLeft + 138,
        y - 4,
        item.count.toLocaleString().padStart(2, "0")
      );

      let equipButton;
      if (item.equippable) {
        const equipFrame = item.equipped ? 1 : 0;
        equipButton = this.add.image(equipX, y, "equip-button", equipFrame);
        equipButton.setInteractive();
        equipButton.on("pointerdown", () => {
          // this.sounds.enter.play();
          this.equipItem(item);
        });
      }

      return { frame, text, number, equipButton, item };
    });
  }

  createInventoryButton() {
    const buttonX = 16 + (32 + 4) * 0;
    const buttonY = properties.height - 16;

    const buttonImage = this.add.image(buttonX, buttonY, "inventory-button", 1);
    buttonImage.setInteractive();

    const activeImage = this.add.image(buttonX, buttonY, "button-active");
    activeImage.visible = false;

    buttonImage.on("pointerdown", () => {
      this.scene.resume("GameScene");
      this.scene.setVisible(true, "GameScene");
      this.scene.resume("HudScene");
      this.scene.setVisible(true, "HudScene");
      this.scene.stop();
    });

    return { buttonImage, activeImage };
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
