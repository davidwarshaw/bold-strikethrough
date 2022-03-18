export default class MovementSubSystem {
  constructor(aStar, map, player, enemies) {
    this.aStar = aStar;
    this.map = map;
    this.player = player;
    this.enemies = enemies;
  }

  tryToPathPlayer(playerControlled, toTile) {
    const path = this.aStar.findPath(playerControlled.getTilePosition(), toTile);
    // console.log("path:");
    // console.log(path);
    if (path.length > 1) {
      playerControlled.setMoveQueue(path);
      return true;
    }
    return false;
  }
}
