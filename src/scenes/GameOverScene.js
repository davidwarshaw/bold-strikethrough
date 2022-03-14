import properties from "../properties";

import HudScene from "../scenes/HudScene";

import Font from "../ui/Font";
import Menu from "../ui/Menu";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    const centerX = properties.width / 2;
    const centerY = properties.height / 2;

    this.add.image(centerX, centerY - 60, "character-player", 3);

    this.menu = new Menu(
      this,
      [
        {
          text: "retry",
          cb: () => {
            this.scene.add("HudScene", HudScene, true, this.playState);
            this.scene.start("GameScene", this.playState);
          },
        },
      ],
      centerX,
      centerY
    );
  }

  offsetForText(text) {
    const offset = -((text.length * 8) / 2) - 80;
    return offset;
  }
}
