function keyFromTilePosition(tilePosition) {
  return `${tilePosition.x}-${tilePosition.y}`;
}

function tilePositionFromKey(key) {
  return { x: Number(key.split("-")[0]), y: Number(key.split("-")[1]) };
}

function groupBy(arr, key) {
  return arr.reduce((grouped, element) => {
    const val = element[key];
    grouped[val] = grouped[val] || [];
    grouped[val].push(element);
    return grouped;
  }, {});
}

export default {
  keyFromTilePosition,
  tilePositionFromKey,
  groupBy,
};
