import itemDefinitions from "../definitions/itemDefinitions.json";
import utils from "../utils/utils";

export default class Inventory {
  constructor(items) {
    this.items = items || [];
  }

  addItem(itemName, providedItemDetail) {
    const itemDetail = providedItemDetail || itemDefinitions[itemName];
    const numbers = this.items.map((item) => item.number);
    const largestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const itemNumber = largestNumber + 1;
    const newItem = Object.assign({}, { name: itemName, number: itemNumber }, itemDetail);
    this.items.push(newItem);
    return itemNumber;
  }

  equipItem(itemNumber) {
    const { item } = this.getItemByNumber(itemNumber);
    if (!item.equippable) {
      return;
    }

    // If another item equippable to the same slot is already equipped
    // to this slot, clear it
    const itemSlot = item.equipSlot;
    this.items
      .filter((item) => item.equipSlot === itemSlot)
      .forEach((item) => this.unequipItem(item.number));

    // Equip the item
    item.equipped = itemSlot;

    // Assigned items are inherently singular
    item.count = 1;
  }

  unequipItem(itemNumber) {
    const { item } = this.getItemByNumber(itemNumber);

    // Only equip if item is equippable
    if (item.equippable) {
      item.equipped = null;
    }
  }

  destroyItem(itemNumber) {
    const { item, i } = this.getItemByNumber(itemNumber);
    console.log(`Destroying itemNumber: ${itemNumber}: ${item.name}`);
    this.items.splice(i, 1);
  }

  getWeaponStats(weapon) {
    let power = 0;
    if (weapon.ammo && weapon.ammo in itemDefinitions) {
      power = itemDefinitions[weapon.ammo].power;
    }
    return { power };
  }

  expendAmmoForWeapon(weapon, squad) {
    console.log("inventory:");
    console.log(this.items);
    if (!weapon) {
      return null;
    }

    const smallArms = ["sidearm", "rifle", "submachine gun", "automatic rifle", "machine gun"];

    const smallArm = smallArms.includes(weapon.type);

    const weaponAmmoUsage = smallArm ? weapon.bursts * weapon.roundsPerBurst : 1;

    // If the weapon uses ammo, find it. Other wise the weapon is it's own ammo
    let ammoUnits = [];
    if (weapon.ammo) {
      ammoUnits = this.items
        .filter((item) => item.type === "ammunition" && item.name === weapon.ammo)
        .slice(0, weaponAmmoUsage);
    } else {
      const { item } = this.getItemByNumber(weapon.number);

      // Find the slot and unequip the weapon from them
      const currentlyAssigned = squad.getByNumber(item.equipped);
      currentlyAssigned.secondary = null;

      // Unequip the item
      this.unequipItem(item.number);

      ammoUnits = [item];
    }

    const ammoExpendedCount = ammoUnits.length;

    console.log(ammoUnits);
    ammoUnits.forEach((unit) => this.destroyItem(unit.number));

    console.log(`Expending ${ammoExpendedCount} of ${weaponAmmoUsage} of type ${weapon.ammo}`);
    return ammoExpendedCount;
  }

  size() {
    return this.items.length;
  }

  getItems() {
    return this.items;
  }

  getItemByNumber(number) {
    const itemPairs = this.items
      .map((item, i) => ({ item, i }))
      .filter((itemPair) => itemPair.item.number === number);
    const { item, i } = itemPairs.length > 0 ? itemPairs[0] : { item: null, i: null };
    return { item, i };
  }

  getItemByEquipSlot(equipSlot) {
    const equipped = this.items.filter((item) => item.equipped === equipSlot);
    return equipped.length > 0 ? equipped[0] : null;
  }

  getAmmoCountForWeapon(weapon) {
    if (!weapon) {
      return null;
    }

    // If the weapon doesn't take ammo, then it's its own ammo
    if (!weapon.ammo) {
      return 1;
    }
    const ammoCount = this.items.filter(
      (item) => item.type === "ammunition" && item.name === weapon.ammo
    ).length;
    console.log("weapon:");
    console.log(weapon);
    console.log(`ammoCount: ${ammoCount}`);
    return ammoCount;
  }

  getDisplayForm() {
    // Group unequiped equipment
    const groupable = this.items.filter((item) => !item.equipped);
    const equipped = this.items.filter((item) => item.equipped);
    const grouped = Object.values(utils.groupBy(groupable, "name")).map((group) => {
      const groupedItem = group[0];
      groupedItem.count = group.length;
      return groupedItem;
    });

    // Recombine equipped and unequiped items and sort by name
    return (
      equipped
        .concat(grouped)

        // Attach iem type sort
        .map((item) => {
          switch (item.type) {
            case "rifle":
              item.typeSort = 0;
              break;
            case "automatic rifle":
              item.typeSort = 1;
              break;
            case "sidearm":
              item.typeSort = 2;
              break;
            case "grenade":
              item.typeSort = 3;
              break;
            case "grenade launcher":
              item.typeSort = 4;
              break;
            case "rocket launcher":
              item.typeSort = 5;
              break;
            case "flame thrower":
              item.typeSort = 6;
              break;
            case "ammunition":
              item.typeSort = 7;
              break;
            case "medical equipment":
              item.typeSort = 8;
              break;
            default:
              item.typeSort = 3;
              break;
          }
          return item;
        })
        .sort((l, r) => {
          // First, sort by type
          if (l.typeSort < r.typeSort) {
            return -1;
          }
          if (l.typeSort > r.typeSort) {
            return 1;
          }

          // Then sort by name
          const lName = l.name.toUpperCase(); // ignore upper and lowercase
          const rName = r.name.toUpperCase(); // ignore upper and lowercase
          if (lName < rName) {
            return -1;
          }
          if (lName > rName) {
            return 1;
          }

          // names must be equal
          return 0;
        })
    );
  }
}
