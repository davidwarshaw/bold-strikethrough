import TileMath from "../../utils/TileMath";

export default class BallisticsSubSystem {
  constructor(scene, combatSubSystem, map, player, enemies) {
    this.scene = scene;
    this.combatSubSystem = combatSubSystem;
    this.map = map;
    this.player = player;
    this.enemies = enemies;
  }

  evaluateFire(attacker, weapon, to) {
    const { width, height } = this.map.tilemap;
    const from = attacker.getTilePosition();
    const path = TileMath.tileRay(width, height, from.x, from.y, to.x, to.y);
    // let { power } = attacker.inventory.getWeaponStats(weapon);
    let power = Math.round(weapon.damage.fire / 10);
    const actualPath = [from];
    const hitCharacters = [];
    // Start at index 1, to skip resolving against attacker
    for (let i = 1; i < path.length; i++) {
      const tilePosition = path[i];

      const targettedTile = tilePosition.x === to.x && tilePosition.y === to.y;

      const stoppingPower = this.map.tileStoppingPower(tilePosition);
      power -= stoppingPower;

      const hitCharacter = this.characterAtTilePosition(tilePosition);
      if (hitCharacter) {
        const outcome = this.combatSubSystem.fireHitsCharacter(attacker, hitCharacter, weapon);
        // console.log("outcome:");
        // console.log(outcome);
        power -= outcome.stoppingPower;
        hitCharacters.push(hitCharacter);
      }

      actualPath.push(tilePosition);

      if (power <= 0) {
        break;
      }
    }
    return { actualPath, hitCharacters };
  }

  characterAtTilePosition(tilePosition) {
    if (this.enemies.someAtTilePosition(tilePosition)) {
      const enemy = this.enemies.getByTilePosition(tilePosition);
      return enemy;
    }

    if (this.player.isAtTilePosition(tilePosition)) {
      return this.player;
    }

    return null;
  }

  fire(attacker, to, weapon) {
    const results = [];
    for (let burst = 0; burst < weapon.bursts; burst++) {
      for (let round = 0; round < weapon.roundsPerBurst; round++) {
        const { actualPath, hitCharacters } = this.evaluateFire(attacker, weapon, to);
        const startTile = actualPath[1];
        const endTile = actualPath[actualPath.length - 1];
        results.push({ startTile, endTile, hitCharacters });
      }
    }
    const expendedAmmo = weapon.bursts * weapon.roundsPerBurst;

    return results;
  }
}
