import properties from "../properties";

function edgeTileFromAngle(radians) {
  const x0 = Math.round(properties.localWidth / 2);
  const y0 = Math.round(properties.localHeight / 2);
  const x1 = Math.round(x0 + properties.localWidth * Math.cos(radians));
  const y1 = Math.round(y0 + properties.localHeight * Math.sin(radians));

  // console.log(`${x1}, ${y1}`);
  const ray = tileRay(x0, y0, x1, y1);
  const edgeTile = ray.pop();
  return edgeTile;
}

function tileLine(x0, y0, x1, y1) {
  const linePoints = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;

  let x = x0;
  let y = y0;
  let err = dx - dy;

  linePoints.push({ x, y });
  while (x !== x1 || y !== y1) {
    //console.log(`${x}-${y}`);
    const err2 = 2 * err;
    if (err2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (err2 < dx) {
      err += dx;
      y += sy;
    }
    linePoints.push({ x, y });
  }

  return linePoints;
}

function tileRay(width, height, x0, y0, x1, y1) {
  const linePoints = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;

  let x = x0;
  let y = y0;
  let err = dx - dy;

  linePoints.push({ x, y });
  while (x !== 0 && x !== width - 1 && y !== 0 && y !== height - 1) {
    const err2 = 2 * err;
    if (err2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (err2 < dx) {
      err += dx;
      y += sy;
    }
    linePoints.push({ x, y });
  }

  return linePoints;
}

function tileFromScreen(screen) {
  const x = Math.floor(screen.x / properties.tileWidth);
  const y = Math.floor(screen.y / properties.tileHeight);
  return { x, y };
}

function screenFromTile(tile) {
  const x = Math.round((0.5 + tile.x) * properties.tileWidth);
  const y = Math.round((0.5 + tile.y) * properties.tileHeight);
  return { x, y };
}

function addHalfTile(point) {
  return { x: point.x + 0.5 * properties.tileWidth, y: point.y + 0.5 * properties.tileHeight };
}

function getTileNeighborByDirection(tile, direction) {
  switch (direction) {
    case "left": {
      return { x: tile.x - 1, y: tile.y };
    }
    case "right": {
      return { x: tile.x + 1, y: tile.y };
    }
    case "up": {
      return { x: tile.x, y: tile.y - 1 };
    }
    case "down": {
      return { x: tile.x, y: tile.y + 1 };
    }
  }
}

function distance(from, to) {
  return Math.round(Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)));
}

function transpose(m) {
  const t = [];
  for (var y = 0; y < m.length; y++) {
    t.push([]);
    for (var x = 0; x < m[0].length; x++) {
      t[y].push(m[x][y]);
    }
  }
  return t;
}

function reverseRows(m) {
  return m.map((row) => row.reverse());
}

function rotateMatrixClockwise(m) {
  return reverseRows(transpose(m));
}

function rotateMatrixCounterClockwise(m) {
  return transpose(reverseRows(m));
}

function keyFromXY(x, y) {
  return keyFromPoint({ x, y });
}

function keyFromPoint(point) {
  return `${point.x}-${point.y}`;
}

function pointFromKey(key) {
  // console.log(`key: ${key}`);
  const x = parseInt(key.split("-")[0]);
  const y = parseInt(key.split("-")[1]);
  return { x, y };
}

function directionFromMove(from, to) {
  const left = from.x - to.x > 0;
  const right = from.x - to.x < 0;
  const up = from.y - to.y > 0;
  const down = from.y - to.y < 0;
  let direction;
  if (left || right) {
    direction = left ? "left" : "right";
  } else if (up || down) {
    direction = up ? "up" : "down";
  } else {
    direction = "down";
  }

  return direction;
}

function directionToPoint(from, to) {
  const horizontal = from.x - to.x;
  const left = horizontal > 0;
  const vertical = from.y - to.y;
  const up = vertical > 0;
  if (Math.abs(horizontal) > Math.abs(vertical)) {
    return left ? "left" : "right";
  } else {
    return up ? "up" : "down";
  }
}

function collisionMapFromTileMap(tileMap) {
  const collision = tileMap.layers.filter((layer) => layer.name === "collision")[0];
  const collisionMap = {};
  collision.data.forEach((row) =>
    row.forEach((tile) => {
      collisionMap[keyFromPoint(tile)] = tile.index > 0 ? true : false;
    })
  );
  return collisionMap;
}

export default {
  edgeTileFromAngle,
  tileLine,
  tileRay,
  tileFromScreen,
  screenFromTile,
  addHalfTile,
  getTileNeighborByDirection,
  distance,
  transpose,
  reverseRows,
  rotateMatrixClockwise,
  rotateMatrixCounterClockwise,
  keyFromXY,
  keyFromPoint,
  pointFromKey,
  directionFromMove,
  directionToPoint,
  collisionMapFromTileMap,
};
