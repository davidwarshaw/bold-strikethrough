import properties from "../properties";

import Font from "../ui/Font";
import Menu from "../ui/Menu";

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    const centerX = properties.width / 2;
    const centerY = properties.height / 2;

    this.add.image(centerX, centerY - 60, "character-player", 0);

    this.menu = new Menu(
      this,
      [
        {
          text: "back to title",
          cb: () => {
            this.scene.start("TitleScene", this.playState);
          },
        },
      ],
      centerX,
      centerY
    );
  }

  offsetForText(text) {
    const offset = -((text.length * 8) / 2);
    return offset;
  }
}
