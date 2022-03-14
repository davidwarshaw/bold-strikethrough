import properties from "../properties";

import TileMath from "../utils/TileMath";
import Inventory from "./Inventory2";

const CYAN = 0x00ffff;
const MAGENTA = 0xff00ff;

export default class Character extends Phaser.GameObjects.Container {
  constructor(scene, map, tile, id, characterType, items) {
    super(scene, 0, 0);

    const spritesheet = `character-${characterType}`;
    this.sprite = scene.add.sprite(0, 0, spritesheet);
    this.add(this.sprite);
    this.setSize(this.sprite.width, this.sprite.height);

    this.scene = scene;
    this.map = map;
    this.characterId = id;
    this.characterType = characterType;

    scene.add.existing(this);

    this.fireLine = scene.add.graphics();

    this.isAlive = true;
    this.isPlayerControlled = false;
    this.hackTurnsLeft = 20;
    this.direction = "left";
    this.moveThisTurn = true;
    this.inventory = new Inventory(items);

    this.moveQueue = [];

    this.stats = {
      maxHealth: 100,
      health: 100,
      stoppingPower: 2,
    };

    this.healthBar = scene.add.graphics();
    this.healthBar.setVisible(true);
    this.add(this.healthBar);
    this.updateHealthBar();

    this.arrow = scene.add.sprite(0, -40, "arrow", 0);
    this.add(this.arrow);

    this.selectionArrow = scene.add.sprite(0, 12, "selection-arrow", 0);
    this.selectionArrow.setVisible(false);
    this.selectionArrow.setFlipY(true);
    this.add(this.selectionArrow);

    this.hackPercent = scene.font.render(-12, -60, "99%", "magenta");
    this.hackPercent.setVisible(false);
    this.add(this.hackPercent);

    this.hackTurnsLeftDisplay = scene.font.render(
      -8,
      -60,
      this.hackTurnsLeft.toLocaleString().padStart(1, ""),
      "cyan"
    );
    this.hackTurnsLeftDisplay.setVisible(false);
    this.add(this.hackTurnsLeftDisplay);

    // Origin is more towards the bottom right of the sprite
    this.sprite.setOrigin(0.5, 0.9);

    const world = TileMath.addHalfTile(map.tilemap.tileToWorldXY(tile.x, tile.y));
    this.setPosition(world.x, world.y);

    scene.anims.create({
      key: `${characterType}_idle`,
      frames: scene.anims.generateFrameNumbers(spritesheet, { start: 0, end: 0 }),
      frameRate: properties.animFrameRate,
      repeat: 0,
    });
    scene.anims.create({
      key: `${characterType}_melee`,
      frames: scene.anims.generateFrameNumbers(spritesheet, { start: 1, end: 1 }),
      frameRate: properties.animFrameRate,
      repeat: 0,
    });
    scene.anims.create({
      key: `${characterType}_fire`,
      frames: scene.anims.generateFrameNumbers(spritesheet, { start: 2, end: 2 }),
      frameRate: properties.animFrameRate,
      repeat: 0,
    });
    scene.anims.create({
      key: `${characterType}_dead`,
      frames: scene.anims.generateFrameNumbers(spritesheet, { start: 3, end: 3 }),
      frameRate: properties.animFrameRate,
      repeat: 0,
    });

    this.stopAnimation();

    // const stopFrame = this.anims.currentAnim.frames[0];
    // this.anims.stopOnFrame(stopFrame);

    this.sounds = {
      walk: scene.sound.add("walk", { loop: true }),
    };

    this.nextTurn = null;
  }

  setArrowFromDirection() {
    switch (this.direction) {
      case "left":
        this.arrow.setRotation(Math.PI);
        break;
      case "right":
        this.arrow.setRotation(0);
        break;
      case "up":
        this.arrow.setRotation(Math.PI * 1.5);
        break;
      case "down":
        this.arrow.setRotation(Math.PI * 0.5);
        break;
    }
  }

  setDepthForY() {
    const depth = this.isAlive ? this.y : this.y - 1;
    this.sprite.setDepth(depth);
  }

  bringToFront() {
    this.sprite.setDepth(this.sprite.depth + 1);
  }

  playWithFlip(animationKey) {
    // There is no 'right' animation in the spritesheet. It's just flipped 'left'.
    if (this.direction === "right") {
      this.sprite.flipX = true;
      this.sprite.anims.play(animationKey.replace("right", "left"));
    } else {
      this.sprite.flipX = false;
      this.sprite.anims.play(animationKey);
    }
  }

  playAnimationForAction(to, action) {
    let key = action;
    if (key === "move") {
      key = "idle";
    }
    // Play moving animation only if different from the one that's playing now
    this.direction = TileMath.directionFromMove(this.getTilePosition(), to);
    const animationKey = `${this.characterType}_${key}`;
    this.playWithFlip(animationKey);
    this.setArrowFromDirection();
    this.setDepthForY();
  }

  stopAnimation() {
    const idleAnimationKey = `${this.characterType}_idle`;
    this.playWithFlip(idleAnimationKey);
  }

  getTilePosition() {
    return this.map.tilemap.worldToTileXY(this.x, this.y);
  }

  isAtTilePosition(tilePosition) {
    if (!this.isAlive) {
      return false;
    }
    const characterTilePosition = this.getTilePosition();
    return characterTilePosition.x === tilePosition.x && characterTilePosition.y === tilePosition.y;
  }

  setNextTurn(nextTurn) {
    this.nextTurn = nextTurn;
  }

  setMoveQueue(path) {
    this.moveQueue = path.slice(1).map((tile, i) => {
      const turn = {
        type: "MOVE",
        from: path[i], // NOTE: This is the previous tile, because we sliced the array
        to: tile, // The current tile
      };
      return turn;
    });
  }

  getMoveQueuePath() {
    return this.moveQueue.map((turn) => ({ x: turn.to.x, y: turn.to.y }));
  }

  popNextPathPosition() {
    if (this.moveQueue.length > 0) {
      return this.moveQueue.shift();
    }
    return null;
  }

  peekNextTurn() {
    if (this.moveQueue.length > 0) {
      return this.moveQueue[0];
    }
    return this.nextTurn;
  }

  popNextTurn() {
    if (this.moveQueue.length > 0) {
      return this.moveQueue.shift();
    }
    const nextTurn = this.nextTurn;
    this.nextTurn = null;
    return nextTurn;
  }

  updateHealthBar() {
    const { health, maxHealth } = this.stats;
    const y = -30;
    const left = -10;
    const width = 20;
    const filled = Math.round((health / maxHealth) * width);

    this.healthBar.clear();

    this.healthBar.lineStyle(2, MAGENTA, 1.0);
    this.healthBar.beginPath();
    this.healthBar.moveTo(left, y);
    this.healthBar.lineTo(left + width, y);
    this.healthBar.closePath();
    this.healthBar.strokePath();

    this.healthBar.lineStyle(2, CYAN, 1.0);
    this.healthBar.beginPath();
    this.healthBar.moveTo(left, y);
    this.healthBar.lineTo(left + filled, y);
    this.healthBar.closePath();
    this.healthBar.strokePath();
  }

  damageHealth(damage) {
    let killed = false;
    this.stats.health -= damage;
    if (this.stats.health < 0) {
      this.stats.health = 0;
      killed = true;
    }
    this.updateHealthBar();

    // console.log(
    //   `character: ${this.characterType} damage: ${damage} killed: ${killed} health: ${this.stats.health}`
    // );

    if (killed) {
      this.kill();
    }
  }

  controlledByPlayer() {
    this.scene.juice.shake(this.sprite, { x: 1, duration: properties.animFrameRate });
    this.isPlayerControlled = true;
    this.hackTurnsLeftDisplay.setVisible(true);
    this.arrow.setTexture("arrow", 1);
  }

  controlTurnOver() {
    this.hackTurnsLeft -= 1;
    this.hackTurnsLeftDisplay.setText(this.hackTurnsLeft.toLocaleString().padStart(1, ""));
    if (this.hackTurnsLeft <= 0) {
      this.freedFromControl();
    }
  }

  freedFromControl() {
    this.isPlayerControlled = false;
    this.hackTurnsLeftDisplay.setVisible(false);
    this.arrow.setTexture("arrow", 0);
  }

  kill() {
    this.isAlive = false;
    this.arrow.setVisible(false);
    this.healthBar.setVisible(false);
    this.freedFromControl();
    this.playAnimationForAction(this.direction, "dead");
  }
}
