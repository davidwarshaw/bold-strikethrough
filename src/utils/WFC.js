import createTree from "functional-red-black-tree";

import properties from "../properties";

import TileMath from "./TileMath";

export default class WFC {
  constructor(rules, weights, width, height) {
    this.weights = weights;
    this.width = width;
    this.height = height;

    this.directions = ["up", "down", "left", "right"];

    // this.bst = new bst.BST();

    this.validate(rules, weights);
    this.processLookupFromRules(rules);
    this.reset();
  }

  async run(putTileCallback) {
    let step = 0;
    console.log("WFC run start");
    while (!this.allCollapsed()) {
      const collapsedIndex = this.step();

      const collapsedTile = this.getTileForIndex(collapsedIndex);
      putTileCallback(collapsedTile);

      step++;
    }
    console.log("WFC run end");
  }

  getTileForIndex(index) {
    const id = this.generated[index].ids[0];
    const { x, y } = this.xyFromIndex(index);
    return { x, y, id };
  }

  step() {
    const collapseIndex = this.indexOfLowestEntropyCell();

    let workingGrid, contradiction;
    let tries = -1;
    do {
      tries++;
      console.log(`Collapse try: ${tries}`);

      // Get a working copy of the grid
      workingGrid = this.copyGrid();

      // Collapse a tile
      const collapsedId = properties.rng.getItem(workingGrid[collapseIndex].ids);
      workingGrid[collapseIndex].ids = [collapsedId];

      // Get the neighbors of the collapsed tile
      const neighborTiles = this.getNeighborTiles(collapseIndex);

      // Recursively constrain the neighbors
      contradiction = this.constrainNeighborTiles(workingGrid, neighborTiles, [collapsedId]);
    } while (contradiction);

    // No contradiction, so save the grid
    this.generated = workingGrid;

    return collapseIndex;
  }

  copyGrid() {
    return JSON.parse(JSON.stringify(this.generated));
  }

  constrainNeighborTiles(workingGrid, tiles, idConstraints) {
    // console.log("constrainNeighborTiles");
    // console.log(tiles);
    // console.log(idConstraints);
    const outcomes = tiles
      .map((tile) => {
        const index = this.indexFromXY(tile.position);
        const validIds = workingGrid[index].ids.filter((candidateId) =>
          idConstraints.some(
            (id) => this.makeRuleKey(id, tile.direction, candidateId) in this.lookup
          )
        );
        // No valid IDs, a contradiction
        if (validIds.length === 0) {
          console.log(`contradiction: tile: ${tile}`);
          return { contradiction: true, index: null, validIds: null };
        }
        const existingIds = workingGrid[index].ids.length;
        const newIds = validIds.length;
        if (newIds === existingIds) {
          return { contradiction: false, index: null, validIds: null };
        }

        workingGrid[index].ids = validIds;
        workingGrid[index].entropy = this.entropyForIds(validIds);
        return { contradiction: false, index, validIds };
      })
      .filter((outcome) => outcome.contradiction || outcome.index);

    if (outcomes.some((outcome) => outcome.contradiction)) {
      // At least one contradiction
      console.log(`contradiction in neighbors`);
      return true;
    }

    if (outcomes.length === 0) {
      return false;
    }

    return outcomes
      .map((outcome) => {
        const neighborTiles = this.getNeighborTiles(outcome.index);
        const contradiction = this.constrainNeighborTiles(
          workingGrid,
          neighborTiles,
          outcome.validIds
        );
        if (contradiction) {
          console.log(`contradiction in outcomes`);
        }
        return contradiction;
      })
      .some((contradiction) => contradiction);
  }

  getNeighborTiles(fixedIndex) {
    const { x, y } = this.xyFromIndex(fixedIndex);
    const neighbors = this.directions
      .map((direction) => {
        const position = TileMath.getTileNeighborByDirection({ x, y }, direction);
        if (this.tileIsValid(position)) {
          return { direction, position };
        }
        return null;
      })
      .filter((tile) => tile);
    return neighbors;
  }

  tileIsValid(tile) {
    return tile.x >= 0 && tile.x < this.width && tile.y >= 0 && tile.y < this.height;
  }

  indexOfLowestEntropyCell() {
    const sortedByEntropy = this.generated
      .filter((cell) => cell.ids.length > 1)
      .sort((left, right) => left.entropy - right.entropy);
    const lowestEntropyCell = sortedByEntropy[0];
    return lowestEntropyCell.index;
  }

  entropyForIds(ids) {
    const weightSum = ids
      .map((id) => this.weights[id])
      .reduce(function (previous, current) {
        return previous + current;
      }, 0);
    return weightSum + properties.rng.getUniform();
  }

  allCollapsed() {
    return !this.generated.some((cell) => cell.ids.length > 1);
  }

  validate(rules, weights) {
    const ruleIds = {};
    rules.forEach((rule) => {
      const { tileId, neighborId, direction } = rule;
      if (!(tileId in weights)) {
        throw `tile ID: ${tileId} not found in weights`;
      }
      if (!(neighborId in weights)) {
        throw `tile ID: ${neighborId} not found in weights`;
      }
      if (this.directions.indexOf(direction) < 0) {
        throw `direction: ${direction} is invalid. Must be one of ['up, 'down', 'left', 'right']`;
      }
      ruleIds[tileId] = true;
      ruleIds[neighborId] = true;
    });
    const numWeightIds = Object.keys(weights).length;
    const numRuleIds = Object.keys(ruleIds).length;
    if (numWeightIds !== numRuleIds) {
      throw `mismatched rules and weights: ${numWeightIds} IDs in weights ${numRuleIds} IDs in rules`;
    }
  }

  processLookupFromRules(rules) {
    this.lookup = {};
    rules.forEach((rule) => {
      const { tileId, neighborId, direction } = rule;
      this.lookup[this.makeRuleKey(tileId, direction, neighborId)] = true;
    });
  }

  reset() {
    const ids = Object.keys(this.weights);
    this.generated = Array(this.height * this.width)
      .fill()
      .map((_, index) => ({ index, ids, entropy: this.entropyForIds(ids) }));
  }

  makeRuleKey(tileId, direction, neighborId) {
    return `${tileId}-${direction}-${neighborId}`;
  }

  xyFromIndex(index) {
    const x = Math.floor(index / this.width);
    const y = index % this.width;
    return { x, y };
  }

  indexFromXY({ x, y }) {
    const index = x * this.width + y;
    return index;
  }
}
