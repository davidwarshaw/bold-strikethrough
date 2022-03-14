export default class CombatSubSystem {
  constructor() {}

  hackSelectsCharacter(attacker, defender, weapon) {
    // console.log(`hacking: ${defender.characterType}`);
    defender.controlledByPlayer();
  }

  fireHitsCharacter(attacker, defender, weapon) {
    const damage = weapon.damage.fire;
    defender.damageHealth(damage);
    defender.attackedBy = attacker;
    const { stoppingPower } = defender.stats;
    return { stoppingPower };
  }

  meleeHitsCharacter(attacker, defender, weapon) {
    const damage = weapon.damage.melee;
    defender.damageHealth(damage);
  }
}
