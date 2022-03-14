import itemDefinitions from "../definitions/itemDefinitions.json";
import utils from "../utils/utils";

export default class Inventory {
  constructor(items) {
    this.items = items;
  }

  getItemBySlot(slot) {
    const itemName = this.items[slot];
    return itemDefinitions[itemName];
  }

  getDisplayForm() {
    return Object.entries(this.items).map((entry) => {
      const slot = entry[0];
      const itemName = this.items[slot];
      const definition = itemDefinitions[itemName];
      return { slot, itemName, definition };
    });
  }
}
