import { resolveConfig } from "prettier";
import properties from "../properties";

import Async from "../utils/Async";
import TileMath from "../utils/TileMath";
import AStar from "../utils/AStar2";

import AiSubSystem from "./subSystems/AiSubSystem";
import MovementSubSystem from "./subSystems/MovementSubSystem";
import CombatSubSystem from "./subSystems/CombatSubSystem";
import BallisticsSubSystem from "./subSystems/BallisticsSubSystem";

const CHOOSE_ACTION = "CHOOSE_ACTION";
const PLAYER_TURN = "PLAYER_TURN";
const PLAYER_CONTROLLED_TURN = "PLAYER_CONTROLLED_TURN";
const ENEMY_TURN = "ENEMY_TURN";

export default class GameSystem {
  constructor(scene, map, player, enemies) {
    this.scene = scene;
    this.map = map;
    this.player = player;
    this.enemies = enemies;

    this.state = CHOOSE_ACTION;
    this.chooseHack = false;

    this.aStar = new AStar(map, player, enemies);

    this.aiSubSystem = new AiSubSystem(this.aStar, map, player, enemies);
    this.movementSubSystem = new MovementSubSystem(this.aStar, map, player, enemies);
    this.combatSubSystem = new CombatSubSystem();
    this.ballisticsSubSystem = new BallisticsSubSystem(
      scene,
      this.combatSubSystem,
      map,
      player,
      enemies
    );

    this.fillPlayerControlled();

    // Set the initial highlights
    this.map.highlightPath(this.player.characterId, this.player.getMoveQueuePath());
  }

  async pointerDown(pointer) {
    if (!this.player.isAlive) {
      return;
    }
    const selectedTile = this.tileFromPointer(pointer);
    // console.log(`pointerDown: ${selectedTile.x}, ${selectedTile.y}`);
    // console.log("this.currentPlayerControlled:");
    // console.log(this.currentPlayerControlled);
    switch (this.state) {
      case CHOOSE_ACTION: {
        if (this.chooseHack) {
          // Click on an enemy to hack
          if (this.enemies.someAtTilePosition(selectedTile)) {
            const distance = TileMath.distance(this.player.getTilePosition(), selectedTile);
            const enemy = this.enemies.getByTilePosition(selectedTile);
            const hackWeapon = null;
            this.combatSubSystem.hackSelectsCharacter(this.player, enemy, hackWeapon);
            this.chooseHack = false;

            this.enemies.hideHackPercent();
            this.scene.events.emit("hack-complete");

            this.nextPlayerControlled();
          }
          return;
        }
        // Click on the player to WAIT
        if (this.currentPlayerControlled.isAtTilePosition(selectedTile)) {
          this.currentPlayerControlled.setNextTurn({ type: "WAIT" });
          this.nextPlayerControlled();
          return;
        }
        // Click on an enemy to attack
        if (this.enemies.someAtTilePosition(selectedTile)) {
          const distance = TileMath.distance(
            this.currentPlayerControlled.getTilePosition(),
            selectedTile
          );
          if (distance == 1) {
            this.currentPlayerControlled.setNextTurn({ type: "MELEE", to: selectedTile });
            this.nextPlayerControlled();
            return;
          } else {
            this.currentPlayerControlled.setNextTurn({ type: "FIRE", to: selectedTile });
            this.nextPlayerControlled();
            return;
          }
        }
        // Click on a path to MOVE
        const playerHasPathed = this.movementSubSystem.tryToPathPlayer(
          this.currentPlayerControlled,
          selectedTile
        );
        if (playerHasPathed) {
          this.map.highlightPath(
            this.currentPlayerControlled.characterId,
            this.currentPlayerControlled.getMoveQueuePath()
          );
          this.nextPlayerControlled();
        }
        return;
      }
      // If we're not choosing an action, cancel any current queued move
      default: {
        if (this.player.peekNextTurn()) {
          this.player.setMoveQueue([]);
          this.map.highlightPath(this.player.characterId, this.player.getMoveQueuePath());
        }
        for (let playerControlledEnemy of this.enemies.getAlivePlayerControlled()) {
          if (playerControlledEnemy.peekNextTurn()) {
            playerControlledEnemy.setMoveQueue([]);
            this.map.highlightPath(
              playerControlledEnemy.characterId,
              playerControlledEnemy.getMoveQueuePath()
            );
          }
        }
        this.fillPlayerControlled();
        this.changeState(CHOOSE_ACTION);
        return;
      }
    }
  }

  async pointerUp(pointer) {
    const tile = this.tileFromPointer(pointer);
    // console.log(`pointerUp: ${tile.x}, ${tile.y}`);
  }

  tileFromPointer(pointer) {
    const { worldX, worldY } = pointer;
    const tile = this.map.tilemap.worldToTileXY(worldX, worldY);
    return tile;
  }

  checkGoal() {
    const playerPosition = this.player.getTilePosition();
    if (playerPosition.x === this.map.goal.x && playerPosition.y === this.map.goal.y) {
      this.scene.nextLevel();
    }
  }

  checkPlayerKilled() {
    if (!this.player.isAlive) {
      this.scene.playerKilled();
    }
  }

  nextPlayerControlled() {
    // console.log("nextPlayerControlled: before:");
    // console.log(this.currentPlayerControlled);
    if (this.currentPlayerControlled) {
      this.currentPlayerControlled.selectionArrow.setVisible(false);
    }
    this.currentPlayerControlled = this.playerControlled.shift();
    // console.log("nextPlayerControlled: after");
    // console.log(this.currentPlayerControlled);
    if (this.currentPlayerControlled) {
      this.currentPlayerControlled.selectionArrow.setVisible(true);
    }
    if (!this.currentPlayerControlled) {
      this.takeTurns();
    }
  }

  fillPlayerControlled() {
    this.playerControlled = this.enemies.getAlivePlayerControlled();
    this.playerControlled.unshift(this.player);
    // console.log("fillPlayerControlled: after");
    // console.log(this.currentPlayerControlled);
    this.nextPlayerControlled();
  }

  async takeTurns() {
    if (!this.player.isAlive) {
      return;
    }
    if (this.player.peekNextTurn()) {
      this.changeState(PLAYER_TURN);
      this.map.highlightPath(this.player.characterId, this.player.getMoveQueuePath());
      await this.tryToTakeCharacterTurn(this.player);

      // If the player is on the goal, go to the next level
      this.checkGoal();

      for (let playerControlledEnemy of this.enemies.getAlivePlayerControlled()) {
        this.changeState(PLAYER_CONTROLLED_TURN);
        this.map.highlightPath(
          playerControlledEnemy.characterId,
          playerControlledEnemy.getMoveQueuePath()
        );
        await this.tryToTakeCharacterTurn(playerControlledEnemy);
        playerControlledEnemy.controlTurnOver();
      }

      this.changeState(ENEMY_TURN);
      await this.tryToTakeEnemiesTurn();

      // this.map.highlightFov(this.enemies.getFov());
      await Async.sleep(properties.roundIntervalMillis);
      await this.takeTurns();
    } else {
      this.fillPlayerControlled();
      this.changeState(CHOOSE_ACTION);

      this.map.highlightPath(this.player.characterId, this.player.getMoveQueuePath());
      for (let playerControlledEnemy of this.enemies.getAlivePlayerControlled()) {
        this.map.highlightPath(
          playerControlledEnemy.characterId,
          playerControlledEnemy.getMoveQueuePath()
        );
      }
    }

    // regenerate astar map
    this.aStar.recreateGraph();

    // End the game if the player was killed
    this.checkPlayerKilled();

    if (this.enemies.getAlivePlayerControlled().length === 0) {
      this.scene.events.emit("hack-ended");
    }
  }

  async tryToTakeEnemiesTurn() {
    // console.log("tryToTakeEnemiesTurn:");

    // Determine turns
    this.enemies
      .getAliveNotPlayerControlled()
      .forEach((enemy) => enemy.setNextTurn(this.aiSubSystem.determineTurn(enemy)));

    // Play turns out
    const turnPromises = this.enemies.getAliveNotPlayerControlled().map(
      (enemy) =>
        new Promise((resolve) => {
          this.tryToTakeCharacterTurn(enemy);
          resolve();
        })
    );
    await Promise.all(turnPromises);

    // Update FOVs
    this.enemies.getAliveNotPlayerControlled().forEach((enemy) => enemy.recalculateFov());
  }

  async tryToTakeCharacterTurn(character) {
    // Left pop turn from the queue
    // console.log("tryToTakeCharacterTurn:");
    const turn = character.popNextTurn();
    if (!turn) {
      // console.log(`No more ${character.characterType} turns`);
      return;
    }
    // console.log(`${character.characterType} action: ${turn.type}`);
    switch (turn.type) {
      case "WAIT": {
        character.setArrowFromDirection();
        character.stopAnimation();
        return;
      }
      case "MOVE": {
        return this.characterMove(character, turn.to);
      }
      case "FIRE": {
        return this.characterFire(character, turn.to);
      }
      case "MELEE": {
        return this.characterMelee(character, turn.to);
        return;
      }
    }
  }

  async characterMelee(character, to) {
    // console.log(`character: ${character.characterType} melee to: ${to.x}, ${to.y}`);
    character.playAnimationForAction(to, "melee");
    character.bringToFront();

    const hitCharacter = this.ballisticsSubSystem.characterAtTilePosition(to);
    if (!hitCharacter) {
      return;
    }

    const weapon = character.inventory.getItemBySlot("melee");

    const results = this.combatSubSystem.meleeHitsCharacter(character, hitCharacter, weapon);

    // Tween movement
    const toTileWorld = TileMath.addHalfTile(this.map.tilemap.tileToWorldXY(to.x, to.y));
    character.sounds.melee.play();
    return Async.tween(this.scene, {
      targets: character,
      x: toTileWorld.x,
      y: toTileWorld.y,
      repeat: 0,
      yoyo: true,
      duration: properties.turnDurationMillis,
    }).then(() => {
      this.scene.juice.add(hitCharacter.sprite).flash();
      character.playAnimationForAction(to, "idle");
    });
  }

  createFireSequenceBeat(character, lineFrom, lineTo, hitCharacters) {
    const pauseAmount = () => 0.5 * properties.turnDurationMillis + properties.rng.getUniform();
    const createLine = () =>
      new Promise((resolve) => {
        // console.log("Creating line");
        character.fireLine.clear();
        character.fireLine.lineStyle(2, 0xffffff, 1.0);
        character.fireLine.beginPath();
        character.fireLine.moveTo(lineFrom.x, lineFrom.y);
        character.fireLine.lineTo(lineTo.x, lineTo.y);
        character.fireLine.closePath();
        character.fireLine.strokePath();
        character.fireLine.setVisible(true);
        resolve();
      });
    const pause = () => Async.timer(this.scene, { duration: pauseAmount() });
    const clear = () =>
      new Promise((resolve) => {
        // console.log("Clearing line");
        character.fireLine.clear();
        resolve();
      });
    const hit = () =>
      new Promise((resolve) => {
        hitCharacters.forEach((hitCharacter) => {
          this.scene.juice.add(hitCharacter.sprite).flash();
          resolve();
        });
      });

    if (hitCharacters.length > 0) {
      return [createLine, pause, hit, clear, pause];
    }

    return [createLine, pause, clear, pause];
  }

  async characterFire(character, to) {
    // console.log(`character: ${character.characterType} fire to: ${to.x}, ${to.y}`);
    character.playAnimationForAction(to, "fire");
    character.bringToFront();

    const weapon = character.inventory.getItemBySlot("firearm");
    const results = this.ballisticsSubSystem.fire(character, to, weapon);

    const beats = results.map((result) => {
      const { startTile, endTile, hitCharacters } = result;
      const lineFrom = TileMath.addHalfTile(
        this.map.tilemap.tileToWorldXY(startTile.x, startTile.y - 1)
      );
      const lineTo = TileMath.addHalfTile(this.map.tilemap.tileToWorldXY(endTile.x, endTile.y - 1));
      return this.createFireSequenceBeat(character, lineFrom, lineTo, hitCharacters);
    });

    const sequence = Async.sequential(beats.flat()).then(() =>
      character.playAnimationForAction(to, "idle")
    );

    character.sounds.fire.play();
    return sequence;
  }

  async characterMove(character, to) {
    const from = character.getTilePosition();
    // console.log(
    //   `character: ${character.characterType} move from: ${from.x}, ${from.y} to: ${to.x}, ${to.y}`
    // );
    character.playAnimationForAction(to, "move");

    // Tween movement
    character.sounds.walk.play();
    const toTileWorld = TileMath.addHalfTile(this.map.tilemap.tileToWorldXY(to.x, to.y));
    return Async.tween(this.scene, {
      targets: character,
      x: toTileWorld.x,
      y: toTileWorld.y,
      duration: properties.turnDurationMillis,
    }).then(() => {
      character.sounds.walk.stop();
      character.setDepthForY();
      // // If there's no next turn for the player, stop the animation
      // if (!character.peekNextTurn()) {
      //   character.stopAnimation();
      // }
    });
  }

  changeState(newState) {
    if (newState !== this.state) {
      // console.log(`Changing state to: ${newState}`);
      this.state = newState;
    } else {
      // console.log(`Redundant state change to: ${newState}`);
    }
  }
}
