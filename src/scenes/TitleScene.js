import properties from "../properties";
import Async from "../utils/Async";

import Font from "../ui/Font";
import Menu from "../ui/Menu";

import HudScene from "../scenes/HudScene";

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    const storage = window.localStorage;

    this.font = new Font(this);

    const centerX = properties.width / 2;
    const centerY = properties.height / 2;

    this.add.image(centerX, centerY, "title-background");
    this.add.image(centerX - 70, centerY - 20, "title");
    this.titleBar = this.add.image(centerX - 246, centerY - 24, "title-bar").setOrigin(0, 0);

    const alreadyPlayed = storage.getItem("playedIntroAnimation");
    const tweenDuration = alreadyPlayed === "true" ? 0 : 16 * properties.turnDurationMillis;

    this.barTween = Async.tween(this, {
      targets: this.titleBar,
      scaleX: 44,
      duration: tweenDuration,
    }).then(() => {
      this.menu = new Menu(
        this,
        [
          {
            text: "play",
            cb: () => {
              storage.setItem("playedIntroAnimation", "true");
              this.scene.add("HudScene", HudScene, true, this.playState);
              this.scene.start("GameScene", this.playState);
            },
          },
        ],
        centerX - 108,
        centerY + 72
      );
    });
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
