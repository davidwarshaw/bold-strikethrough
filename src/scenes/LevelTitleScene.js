import properties from '../properties';

import Font from '../ui/Font';

export default class LevelTitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelTitleScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    const centerX = properties.width / 2;
    const centerY = properties.height / 2;

    this.images = [];

    let offsetY = 20;
    this.images.push(this.add.image(centerX, centerY + offsetY, 'shovel'));

    offsetY += -32;
    let text = `night ${this.playState.level}`;
    let offsetX = this.offsetForText(text);
    this.images.push(this.font.render(centerX + offsetX, centerY + offsetY, text));

    this.input.keyboard.on('keydown', () => this.keyDown());
    this.buttonIsPressed = true;
    this.gamePadListeners = false;

    this.sounds = {
      enter: this.sound.add('enter'),
    }
  }

  update() {
    if (!this.gamePadListeners && this.input.gamepad && this.input.gamepad.pad1) {
      this.input.gamepad.pad1.on('down', () => {
        if (!this.buttonIsPressed) {
          this.keyDown();
        }
      });
      this.input.gamepad.pad1.on('up', () => this.buttonIsPressed = false);
      this.gamePadListeners = true;
    }
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }

  keyDown() {
    this.sounds.enter.play();
    this.input.gamepad.removeAllListeners();
    this.scene.start('GameScene', this.playState);
    this.scene.start('HudScene', this.playState);
  }
}
