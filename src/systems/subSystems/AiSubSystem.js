import properties from "../../properties";
import TileMath from "../../utils/TileMath";

const PATROL = "PATROL";
const SEARCH = "SEARCH";
const COMBAT = "COMBAT";
const WATCH = "WATCH";

const TURN_CHANCE = 0.3;

export default class AiSubSystem {
  constructor(aStar, map, player, enemies) {
    this.aStar = aStar;
    this.map = map;
    this.player = player;
    this.enemies = enemies;
  }

  rotateDirectionClockwise(direction) {
    switch (direction) {
      case "up": {
        return "right";
        break;
      }
      case "down": {
        return "left";
        break;
      }
      case "left": {
        return "up";
        break;
      }
      case "right": {
        return "down";
        break;
      }
    }
  }

  setPathToPlayer(enemy, enemyTilePosition, playerPosition) {
    const path = this.aStar.findPath(enemyTilePosition, playerPosition);
    enemy.setMoveQueue(path);
  }

  actionForMoveOnPath(enemy) {
    const nextTilePosition = enemy.popNextPathPosition();
    if (nextTilePosition) {
      return nextTilePosition;
    }
    return null;
  }

  actionForMoveInDirection(enemy, enemyTilePosition) {
    let nextTilePosition = TileMath.getTileNeighborByDirection(enemyTilePosition, enemy.direction);
    let nextTileIsPassable = this.map.tileIsPassable(nextTilePosition);

    // Sometimes pretend we hit a wall
    const roll = properties.rng.getUniform();
    if (roll < TURN_CHANCE) {
      nextTileIsPassable = false;
    }

    while (!nextTileIsPassable) {
      const nextDirection = this.rotateDirectionClockwise(enemy.direction);
      // console.log(`nextDirection: ${nextDirection}`);
      nextTilePosition = TileMath.getTileNeighborByDirection(enemyTilePosition, nextDirection);
      nextTileIsPassable = this.map.tileIsPassable(nextTilePosition);
      enemy.direction = nextDirection;
    }

    return { type: "MOVE", to: nextTilePosition };
  }

  determineTurn(enemy) {
    // console.log(`determineTurn(enemy): ${enemy.ai.mode}`);

    // Waiting has the highest priority
    const mustWait = enemy.popWait();
    if (mustWait) {
      return { type: "WAIT" };
    }

    const enemyTilePosition = enemy.getTilePosition();

    // If we were attacked, the attacker is our new target
    if (enemy.attackedBy) {
      enemy.ai.mode = COMBAT;
      enemy.ai.targetCharacter = enemy.attackedBy;
      enemy.attackedBy = null;
      const targetCharacterPosition = enemy.ai.targetCharacter.getTilePosition();
      const newDirection = TileMath.directionToPoint(enemyTilePosition, targetCharacterPosition);
      // console.log(`attacked character newDirection: ${newDirection}`);
      enemy.direction = newDirection;
      enemy.recalculateFov();
    }

    const targetCharacter = enemy.ai.targetCharacter || this.player;
    const targetCharacterPosition = targetCharacter.getTilePosition();
    const targetCharacterSpotted = enemy.fov.isVisible(targetCharacterPosition);
    const distanceToTargetCharacter = TileMath.distance(enemyTilePosition, targetCharacterPosition);
    const enemyFirearm = enemy.inventory.getItemBySlot("firearm");

    if (!targetCharacter.isAlive) {
      enemy.ai.mode = PATROL;
    } else if (targetCharacterSpotted) {
      // When we see the target, drop any queued moves and set the last known position
      enemy.setMoveQueue([]);
      enemy.ai.lastKnownTargetPosition = targetCharacterPosition;
      enemy.ai.mode = COMBAT;
    } else if (enemy.ai.lastKnownTargetPosition) {
      // When we don't see the target, go looking for them at their last known position
      this.setPathToPlayer(enemy, enemyTilePosition, enemy.ai.lastKnownTargetPosition);
      enemy.ai.mode = SEARCH;
    } else {
      enemy.ai.mode = PATROL;
    }

    switch (enemy.ai.mode) {
      case PATROL: {
        enemy.ai.targetCharacter = null;
        enemy.ai.lastKnownTargetPosition = null;
        enemy.setWait(1);
        return this.actionForMoveInDirection(enemy, enemyTilePosition);
      }
      case SEARCH: {
        // If we're searching, we'll get our move from the move queue, so return a dummy action
        return { type: "PATROL" };
      }
      case COMBAT: {
        if (distanceToTargetCharacter === 1) {
          // Always melee a player next to you
          return { type: "MELEE", to: targetCharacterPosition };
        } else if (enemyFirearm) {
          // Fire at the player on sight
          // console.log("Setting turn to FIRE");
          return { type: "FIRE", to: targetCharacterPosition };
        } else {
          // return
          return {};
        }
      }
      case WATCH: {
        const direction = this.rotateDirectionClockwise(enemy.direction);
        // Wait a few turns after watching
        enemy.setWait(1);
        enemy.direction = direction;
        return { type: "WAIT" };
      }
    }
  }
}
