
function getFromMap(map, x, y) {
  const height = map.length;
  const width = map[0].length;

  return x >= 0 && y >= 0 && x < width && y < height ? map[y][x] : null;
}

function getNeighbors(map, x, y) {
  return [
    getFromMap(map, x - 1, y - 1),
    getFromMap(map, x, y - 1),
    getFromMap(map, x + 1, y - 1),
    getFromMap(map, x - 1, y),
    getFromMap(map, x + 1, y),
    getFromMap(map, x - 1, y + 1),
    getFromMap(map, x, y + 1),
    getFromMap(map, x + 1, y + 1)
  ];
}


function getBitArray(map, x, y, name) {
  const neighbors = getNeighbors(map, x, y);
  neighbors.splice(4, 0, getFromMap(map, x, y));
  return neighbors.map(tile => tile === name ? 1 : 0);
}

function getBitArrayOld(map, x, y, name) {
  const boolArray = new Array(9);
  boolArray[0] = getFromMap(map, x + 1, y - 1) !== name;
  boolArray[1] = getFromMap(map, x, y - 1) !== name;
  boolArray[2] = getFromMap(map, x + 1, y - 1) !== name;
  boolArray[3] = getFromMap(map, x - 1, y) !== name;
  boolArray[4] = getFromMap(map, x, y) !== name;
  boolArray[5] = getFromMap(map, x + 1, y) !== name;
  boolArray[6] = boolArray[7] && boolArray[3] ? getFromMap(map, x - 1, y + 1) !== name : true;
  boolArray[7] = getFromMap(map, x, y + 1) !== name;
  boolArray[8] = boolArray[7] && boolArray[5] ? getFromMap(map, x + 1, y + 1) !== name : true;
  const bitArray = boolArray.map(patch => patch ? 1 : 0);
  return bitArray;
}

function getAutoTileFromBitArray(bitArray) {
  if (bitArray[3] && bitArray[5] &&
    (!bitArray[1] || !bitArray[7])) {
    name = 'wall-top-east-west';
  }
  else if (bitArray[1] && bitArray[7] &&
    (!bitArray[3] || !bitArray[5])) {
    name = 'wall-top-north-south';
  }
  const bitString = bitArray.join('');
  switch (bitString) {
    case '111111110':
      name = 'wall-top-north-west';
      break;
    case '111111011':
      name = 'wall-top-north-east';
      break;
    case '110111111':
      name = 'wall-top-south-west';
      break;
    case '011111111':
      name = 'wall-top-south-east';
      break;
    case '000011011':
      name = 'wall-top-north-west';
      break;
    case '000110110':
      name = 'wall-top-north-east';
      break;
    case '011011000':
      name = 'wall-top-south-west';
      break;
    case '110110000':
      name = 'wall-top-south-east';
      break;
  }
  return name;
}

function getSingleAutoTile(map, x, y, tile) {
  const west = getFromMap(map, x - 1, y) === tile;
  const east = getFromMap(map, x + 1, y) === tile;
  const north = getFromMap(map, x, y - 1) === tile;
  const south = getFromMap(map, x, y + 1) === tile;
  if (north && south) {
    return 'north-south';
  }
  if (east && west) {
    return 'east-west';
  }
  if (north && west) {
    return 'north-west';
  }
  if (north && east) {
    return 'north-east';
  }
  if (south && west) {
    return 'south-west';
  }
  if (south && east) {
    return 'south-east';
  }
}

function countNeighbors(map, x, y, neighbors) {
  const neighborsToCheck = Array.isArray(neighbors) ? neighbors : [neighbors];

  return getNeighbors(map, x, y)
    .map(tile => neighborsToCheck.includes(tile))
    .filter(matchingTile => matchingTile).length;
}

function findTilesWithNeighbors(map, target, neighbors, count) {
  const targetsToCheck = Array.isArray(target) ? target : [target];
  return Object.values(map)
    .filter(tile => targetsToCheck.includes(tile.name))
    .filter(tile => countNeighbors(map, tile.x, tile.y, neighbors) >= count);
}

function findTilesByChance(map, target, chance) {
  const targetsToCheck = Array.isArray(target) ? target : [target];
  return Object.values(map)
    .filter(tile => targetsToCheck.includes(tile.name))
    .filter(() => properties.rng.getPercentage() <= chance);
}

function searchAndAssign(map, x, y, nameToFind, nameToAssign) {
  if(map[utils.keyFromXY(x, y)]) {
    if(map[utils.keyFromXY(x, y)].name !== nameToFind ||
        map[utils.keyFromXY(x, y)].secondPass) {
      return;
    }
    map[utils.keyFromXY(x, y)].secondPass = true;
    map[utils.keyFromXY(x, y)].name = nameToAssign;
    searchAndAssign(map, x, y + 1, nameToFind, nameToAssign);
    searchAndAssign(map, x, y - 1, nameToFind, nameToAssign);
    searchAndAssign(map, x - 1, y, nameToFind, nameToAssign);
    searchAndAssign(map, x + 1, y, nameToFind, nameToAssign);
  }
}

function generateBaseMap(width, height) {
  return [...Array(height).keys()].map(() => [...Array(width).keys()].map(() => ''));
}

function createCircle(map, fill, center, innerRadius, outerRadius) {
  for (let y = 0; y < properties.localHeight; y++) {
    for (let x = 0; x < properties.localWidth; x++) {
      const xRadius = Math.abs(x - center.x);
      const yRadius = Math.abs(y - center.y);

      if ((xRadius >= innerRadius && xRadius <= outerRadius &&
          yRadius <= outerRadius) ||
        (yRadius >= innerRadius && yRadius <= outerRadius &&
          xRadius <= outerRadius)) {
        map[y][x] = fill;
      }
    }
  }

}

export default {
  getFromMap,
  getNeighbors,
  getBitArray,
  getAutoTileFromBitArray,
  getSingleAutoTile,
  countNeighbors,
  findTilesWithNeighbors,
  findTilesByChance,
  searchAndAssign,
  generateBaseMap,
  createCircle,
}