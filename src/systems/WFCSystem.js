import TileMath from "../utils/TileMath";

import WFC from "../utils/WFC";

export default class WFCSystem {
  constructor(scene, seedMap) {
    this.scene = scene;
    this.seedMap = seedMap;

    this.dimensions = {
      width: 40,
      height: 40,
    };

    const { weights, rules } = this.extractRules();
    console.log("weights:");
    console.log(weights);
    console.log("rules:");
    rules.forEach((rule) => console.log(rule));

    this.weights = weights;
    this.rules = rules;
    this.wfc = new WFC(rules, weights, this.dimensions.width, this.dimensions.height);
  }

  extractRules() {
    const rulesSet = {};

    const weights = {};

    const { data, width, height } = this.seedMap.layers[0];
    const correctedData = data.map((index) => index - 1);
    console.log(data);
    console.log(correctedData);
    console.log(width);
    console.log(height);

    correctedData.forEach((tileIndex) => {
      if (!(tileIndex in weights)) {
        weights[tileIndex] = 0;
      } else {
        if (tileIndex !== 11) {
          weights[tileIndex]++;
        }
      }
    });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const tileId = correctedData[index];

        ["up", "down", "left", "right"].forEach((direction) => {
          const neighborPosition = TileMath.getTileNeighborByDirection({ x, y }, direction);
          if (
            neighborPosition.y < 0 ||
            neighborPosition.y >= height ||
            neighborPosition.x < 0 ||
            neighborPosition.x >= width
          ) {
            return;
          }

          const neighborIndex = neighborPosition.y * width + neighborPosition.x;
          const neighborId = correctedData[neighborIndex];
          const ruleKey = [tileId, direction, neighborId].join("-");
          if (!(ruleKey in rulesSet)) {
            rulesSet[ruleKey] = true;
          }
        });
      }
    }
    const rules = Object.keys(rulesSet).map((ruleKey) => {
      const [tileIdString, direction, neighborIdString] = ruleKey.split("-");
      const tileId = Number(tileIdString);
      const neighborId = Number(neighborIdString);
      return { tileId, direction, neighborId };
    });

    return { weights, rules };
  }
}
