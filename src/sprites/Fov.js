import utils from '../utils/utils';
import TileMath from '../utils/TileMath';
import properties from '../properties';

export default class Fov {
  constructor(map) {
    this.map = map;

    this.field = {};
  }

  clear() {
    this.field = {};
  }

  isVisible(tilePosition) {
    return this.field[utils.keyFromTilePosition(tilePosition)];
  }

  vectorsForFacing(facing) {
    let facingVector = {
      left: { x: 0, y: 0 },
      right: { x: 0, y: 0 },
    };
    switch(facing) {
      case 'up': {
        facingVector.left = { x: -1, y: 1};
        facingVector.right = { x: 1, y: 1};
        break;
      }
      case 'down': {
        facingVector.left = { x: 1, y: -1};
        facingVector.right = { x: -1, y: -1};
        break;
      }
      case 'left': {
        facingVector.left = { x: 1, y: -1};
        facingVector.right = { x: 1, y: 1};
        break;
      }
      case 'right': {
        facingVector.left = { x: -1, y: -1};
        facingVector.right = { x: -1, y: 1};
        break;
      }
    }
    return facingVector;
  }

  shoulderTilesForFacing(tilePosition, facing) {
    if (facing === 'up' || facing === 'down') {
      return [
        { x: tilePosition.x - 1, y: tilePosition.y },
        { x: tilePosition.x, y: tilePosition.y },
        { x: tilePosition.x + 1, y: tilePosition.y }
      ];
    }
    else {
      return [
        { x: tilePosition.x, y: tilePosition.y - 1 },
        { x: tilePosition.x, y: tilePosition.y },
        { x: tilePosition.x, y: tilePosition.y + 1 }
      ];
    }
  }

  recalculate(tilePosition, facing) {
    this.field = {};
    this.shoulderTilesForFacing(tilePosition, facing)
      .forEach((shoulderTilePosition) => {
        this.field[utils.keyFromTilePosition(shoulderTilePosition)] = true;
      });
    
    const { left, right } = this.vectorsForFacing(facing);
    
    if (facing === 'up' || facing === 'down') {
      this.castLight(tilePosition, 1, 1.0, 0.0, left.x, 0, 0, left.y);
      this.castLight(tilePosition, 1, 1.0, 0.0, right.x, 0, 0, right.y);
    }
    else {
      this.castLight(tilePosition, 1, 1.0, 0.0, 0, left.x, left.y, 0);
      this.castLight(tilePosition, 1, 1.0, 0.0, 0, right.x, right.y, 0);
    }
  }

  inBound(tilePosition) {
    return tilePosition.x >= 0 && tilePosition.y >= 0 &&
      tilePosition.x < properties.mapWidthTiles && tilePosition.y < properties.mapHeightTiles;
  }

  castLight(tilePosition, row, start, end, xx, xy, yx, yy) {
    const radius = 50;

    let newStart = 0.0;
    if (start < end) {
        return;
    }

    let blocked = false;
    for (let distance = row; distance <= radius && !blocked; distance++) {
      const deltaY = -distance;
      
      for (let deltaX = -distance; deltaX <= 0; deltaX++) {
          const currentTilePosition = {
            x: tilePosition.x + deltaX * xx + deltaY * xy,
            y: tilePosition.y + deltaX * yx + deltaY * yy,
          };
          let leftSlope = (deltaX - 0.5) / (deltaY + 0.5);
          let rightSlope = (deltaX + 0.5) / (deltaY - 0.5);

          if (!this.inBound(currentTilePosition) || start < rightSlope) {
              continue;
          } else if (end > leftSlope) {
              break;
          }

          // check if it's within the lightable area and light if needed
          if (TileMath.distance(tilePosition, { x: deltaX, y: deltaY }) <= radius) {
              this.field[utils.keyFromTilePosition(currentTilePosition)] = true;
          }

          // previous cell was a blocking one
          if (blocked) {
            // hit a wall
              if (!this.map.tileIsViewable(currentTilePosition)) {
                  newStart = rightSlope;
                  continue;
              } else {
                  blocked = false;
                  start = newStart;
              }
          } else {
              // hit a wall within sight line
              if (!this.map.tileIsViewable(currentTilePosition) && distance < radius) {
                  blocked = true;
                  this.castLight(tilePosition, distance + 1, start, leftSlope, xx, xy, yx, yy);
                  newStart = rightSlope;
              }
          }
      }
  }
  }
}