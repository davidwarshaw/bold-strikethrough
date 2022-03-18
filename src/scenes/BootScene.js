import HudScene from "../scenes/HudScene";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.playState = {
      levelNumber: 3,
      items: {
        firearm: "Seburo C-25A",
        melee: "Seburo C-25A",
        equipment: null,
      },
    };

    // UI
    this.load.image("title", "assets/images/title.png");
    this.load.image("title-bar", "assets/images/title-bar.png");
    this.load.image("title-background", "assets/images/title-background.png");

    this.load.image("font-small-white", "assets/fonts/atari-like-white.png");
    this.load.image("font-small-magenta", "assets/fonts/atari-like-magenta.png");
    this.load.image("font-small-cyan", "assets/fonts/atari-like-cyan.png");
    this.load.spritesheet("small-button-frame", "assets/images/small-button-frame.png", {
      frameWidth: 180,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("large-button-frame", "assets/images/large-button-frame.png", {
      frameWidth: 320,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("equip-button", "assets/images/equip-button.png", {
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });

    this.load.image("inventory-background", "assets/images/inventory-background.png");
    this.load.image("selection-arrow", "assets/images/selection-arrow.png");
    this.load.image("button-active", "assets/images/button-active.png");
    this.load.spritesheet("hack-button", "assets/images/hack-button.png", {
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("inventory-button", "assets/images/inventory-button.png", {
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("equipment-button", "assets/images/equipment-button.png", {
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });

    // Map
    this.load.image("tileset", "assets/maps/tileset.png");

    // Sprites
    this.load.spritesheet("arrow", "assets/images/arrow-spritesheet.png", {
      frameWidth: 8,
      frameHeight: 8,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet("character-player", "assets/images/characters/player-spritesheet.png", {
      frameWidth: 24,
      frameHeight: 24,
      margin: 0,
      spacing: 0,
    });
    this.load.spritesheet(
      "character-enemy-01",
      "assets/images/characters/enemy-01-spritesheet.png",
      {
        frameWidth: 24,
        frameHeight: 24,
        margin: 0,
        spacing: 0,
      }
    );
    this.load.spritesheet(
      "character-enemy-02",
      "assets/images/characters/enemy-02-spritesheet.png",
      {
        frameWidth: 24,
        frameHeight: 24,
        margin: 0,
        spacing: 0,
      }
    );

    // Audio
    this.load.audio("enter", "assets/audio/sfx_menu_select2.wav");

    this.load.audio("elevator", "assets/audio/sfx_movement_dooropen4.wav");

    this.load.audio("walk", "assets/audio/sfx_movement_footstepsloop4_fast.wav");
    this.load.audio("melee", "assets/audio/sfx_wpn_punch4.wav");
    this.load.audio("fire-player", "assets/audio/sfx_weapon_singleshot10.wav");
    this.load.audio("fire-enemy", "assets/audio/sfx_weapon_singleshot7.wav");
    this.load.audio("hit", "assets/audio/sfx_damage_hit2.wav");
    this.load.audio("hack", "assets/audio/sfx_sounds_negative2.wav");
    this.load.audio("die-enemy", "assets/audio/sfx_deathscream_human2.wav");
    this.load.audio("die-player", "assets/audio/sfx_sounds_error12.wav");
    this.load.audio("hack-ended", "assets/audio/sfx_sound_neutral5.wav");
  }

  create() {
    this.scene.start("TitleScene", this.playState);
    // this.scene.add("HudScene", HudScene, true, this.playState);
    // this.scene.start("GameScene", this.playState);
    // this.scene.start("GameOverScene", this.playState);
    // this.scene.start("WinScene", this.playState);
  }
}
