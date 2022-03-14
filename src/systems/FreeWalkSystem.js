import properties from "../properties";

import Async from "../utils/Async";
import TileMath from "../utils/TileMath";

const CHOOSE_ACTION = "CHOOSE_ACTION";
const PLAYER_TURN = "PLAYER_TURN";

export default class FreeWalkSystem {
  constructor(scene, map, player) {
    this.scene = scene;
    this.map = map;
    this.player = player;

    this.state = CHOOSE_ACTION;
  }

  async pointerDown(pointer) {
    const selectedTile = this.tileFromPointer(pointer);
    console.log(`pointerDown: ${selectedTile.x}, ${selectedTile.y}`);
    switch (this.state) {
      case CHOOSE_ACTION: {
        // Click on the player to WAIT
        if (this.player.isAtTilePosition(selectedTile)) {
          this.player.setNextTurn({ type: "WAIT" });
          this.takeTurns();
          return;
        }
        // Click on a path to MOVE
        const path = TileMath.tileLine(
          this.player.getTilePosition().x,
          this.player.getTilePosition().y,
          selectedTile.x,
          selectedTile.y
        );
        this.player.setMoveQueue(path);
        this.takeTurns();
        return;
      }
      // If we're not choosing an action, cancel any current queued move
      default: {
        if (this.player.peekNextTurn()) {
          this.player.setMoveQueue([]);
          this.changeState(CHOOSE_ACTION);
        }
        return;
      }
    }
  }

  async pointerUp(pointer) {
    const tile = this.tileFromPointer(pointer);
    console.log(`pointerUp: ${tile.x}, ${tile.y}`);
  }

  tileFromPointer(pointer) {
    const { worldX, worldY } = pointer;
    const tile = this.map.tilemap.worldToTileXY(worldX, worldY);
    return tile;
  }

  async takeTurns() {
    if (this.player.peekNextTurn()) {
      this.changeState(PLAYER_TURN);
      await this.tryToTakeCharacterTurn(this.player);
      await this.takeTurns();
    } else {
      this.changeState(CHOOSE_ACTION);
    }
  }

  async tryToTakeCharacterTurn(character) {
    // Left pop turn from the queue
    console.log("tryToTakeCharacterTurn:");
    const turn = character.popNextTurn();
    if (!turn) {
      console.log(`No more ${character.characterType} turns`);
      return;
    }
    console.log(`${character.characterType} action: ${turn.type}`);
    switch (turn.type) {
      case "WAIT": {
        // Do nothing
        return;
      }
      case "WATCH": {
        character.direction = turn.direction;
        character.stopAnimation();
        return;
      }
      case "MOVE": {
        return this.characterMove(character, turn.to);
      }
      case "MELEE": {
        return;
      }
    }
  }

  async characterMove(character, to) {
    console.log(`character: ${character.characterType} to: ${to.x}, ${to.y}`);
    character.playAnimationForAction(to, "idle");

    // Tween movement
    const toTileWorld = TileMath.addHalfTile(this.map.tilemap.tileToWorldXY(to.x, to.y));
    return Async.tween(this.scene, {
      targets: character,
      x: toTileWorld.x,
      y: toTileWorld.y,
      duration: properties.turnDurationMillis,
    }).then(() => {
      // If there's no next turn for the player, stop the animation
      if (!character.peekNextTurn()) {
        character.stopAnimation();
      }
    });
  }

  changeState(newState) {
    if (newState !== this.state) {
      console.log(`Changing state to: ${newState}`);
      this.state = newState;
    } else {
      console.log(`Redundant state change to: ${newState}`);
    }
  }
}
