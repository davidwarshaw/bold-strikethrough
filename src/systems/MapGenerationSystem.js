import * as ROT from "rot-js";

import properties from "../properties";

import MapProcedures from "../utils/MapProcedures";

const DOOR_CHANCE = 0.2;

function populateRooms(ms, style, widthInModules, heightInModules, layer) {
  const rooms = [...Array(heightInModules)].map((_) => Array(widthInModules));
  for (let moduleX = 0; moduleX < widthInModules; moduleX++) {
    for (let moduleY = 0; moduleY < heightInModules; moduleY++) {
      let room;
      if (moduleX === 0 && moduleY === heightInModules - 1) {
        room = ms.getRoom(style, "entrance");
      } else if (moduleX === widthInModules - 1 && moduleY === 0) {
        room = ms.getRoom(style, "exit");
      } else {
        room = ms.getRandomRoom(style);
      }
      rooms[moduleY][moduleX] = room;

      const pointX = moduleX * ms.moduleWidth;
      const pointY = moduleY * ms.moduleHeight;
      // console.log(`module: ${moduleX}, ${moduleY} -> ${room.name}`);
      copyModuleToLayer(room, layer, pointX, pointY);
    }
  }
  return rooms;
}

function populateDoors(ms, existingDoors, style, widthInModules, heightInModules, layer) {
  let doors;
  if (existingDoors) {
    doors = existingDoors;
  } else {
    doors = {
      horizontal: [...Array(heightInModules)].map((_) => Array(widthInModules - 1)),
      vertical: [...Array(heightInModules - 1)].map((_) => Array(widthInModules)),
    };
  }
  // console.log(doors);

  for (let moduleX = 0; moduleX < widthInModules; moduleX++) {
    for (let moduleY = 0; moduleY < heightInModules; moduleY++) {
      if (moduleX < widthInModules - 1) {
        const existingHorizontalDoor = doors["horizontal"][moduleY][moduleX];
        if (properties.rng.getUniform() < DOOR_CHANCE && !existingHorizontalDoor) {
          const door = ms.getDoor(style, "horizontal");
          doors["horizontal"][moduleY][moduleX] = door;

          const pointX = moduleX * ms.moduleWidth + ms.doorOffset["horizontal"].x;
          const pointY = moduleY * ms.moduleHeight + ms.doorOffset["horizontal"].y;
          // console.log(`module: ${moduleX}, ${moduleY} -> ${door.name}`);
          copyModuleToLayer(door, layer, pointX, pointY);
        }
      }

      if (moduleY < heightInModules - 1) {
        const existingVerticalDoor = doors["vertical"][moduleY][moduleX];
        if (
          properties.rng.getUniform() < DOOR_CHANCE &&
          !(
            // No vertical door above the entrance
            (moduleX === 0 && moduleY === heightInModules - 2)
          ) &&
          !existingVerticalDoor
        ) {
          const door = ms.getDoor(style, "vertical");
          doors["vertical"][moduleY][moduleX] = door;

          const pointX = moduleX * ms.moduleWidth + ms.doorOffset["vertical"].x;
          const pointY = moduleY * ms.moduleHeight + ms.doorOffset["vertical"].y;
          // console.log(`module: ${moduleX}, ${moduleY} -> ${door.name}`);
          copyModuleToLayer(door, layer, pointX, pointY);
        }
      }
    }
  }
  return doors;
}

function copyModuleToLayer(module, layer, pointX, pointY) {
  for (let moduleX = 0; moduleX < module.width; moduleX++) {
    for (let moduleY = 0; moduleY < module.height; moduleY++) {
      const dataIndex = indexFromXY(moduleX, moduleY, module.width);
      const tileIndex = module.data[dataIndex] - 1; // Subtract 1 because of that tiled thing
      // Don't copy blank tiles
      if (tileIndex < 0) {
        continue;
      }
      const layerX = pointX + moduleX;
      const layerY = pointY + moduleY;
      // console.log(`${layerX}, ${layerY} -> ${tileIndex}`);
      layer.putTileAt(tileIndex, layerX, layerY);
    }
  }
}

function indexFromXY(x, y, width) {
  return y * width + x;
}

function localToGlobal(moduleX, moduleY, moduleWidth, moduleHeight, offsetX, offsetY) {
  const x = offsetX + moduleX * moduleWidth;
  const y = offsetY + moduleY * moduleHeight;
  return { x, y };
}

function populateBackground(layer) {
  layer.randomize(0, 0, properties.mapWidthTiles, properties.mapHeightTiles, 11);
}

function populateCollision(widthInRooms, layer) {
  const hieghtInRooms = 3;

  const width = widthInRooms * (10 + 5) + 5;
  const height = hieghtInRooms * (10 + 5) + 5;

  let baseMap = MapProcedures.generateBaseMap(width, height);

  baseMap = baseMap.map((tileRow, y) =>
    tileRow.map((tile, x) => {
      const row = y % 15;
      switch (row) {
        case 0:
          return "background";
        case 1:
          return "top";
        case 2:
          return "upper-wall";
        case 3:
          return "lower-wall";
        case 4:
          return "top";
        case 14:
          return "wall-top";
      }
      return "floor";
    })
  );

  const wallMap = JSON.parse(JSON.stringify(baseMap));
  baseMap.forEach((tileRow, y) => {
    tileRow.forEach((tile, x) => {
      if (tile === "impassable" && MapProcedures.getFromMap(baseMap, x, y + 1) === "passable") {
        wallMap[y][x] = "lower-wall";
      }
    });
  });
  baseMap.forEach((tileRow, y) => {
    tileRow.forEach((tile, x) => {
      if (tile === "impassable" && MapProcedures.getFromMap(wallMap, x, y + 1) === "lower-wall") {
        wallMap[y][x] = "upper-wall";
      }
    });
  });

  const ceilingMap = JSON.parse(JSON.stringify(wallMap));
  wallMap.forEach((tileRow, y) => {
    tileRow.forEach((tile, x) => {
      const impassableCount = MapProcedures.countNeighbors(wallMap, x, y, "impassable");
      if (tile === "impassable" && impassableCount < 8) {
        const bitArray = MapProcedures.getBitArray(wallMap, x, y, "impassable");
        const autoTile = MapProcedures.getAutoTileFromBitArray(bitArray);
        ceilingMap[y][x] = autoTile;
      }
    });
  });

  ceilingMap.forEach((tileRow, y) => {
    tileRow.forEach((tile, x) => {
      if (tile !== "passable") {
        const tileIndex = wall[tile] != null ? wall[tile] : wall["default"];
        //const tileIndex = wall[tile] || wall['default'];
        layer.putTileAt(tileIndex, x, y);
      }
    });
  });
  // console.log(ceilingMap);
}

export default {
  populateRooms,
  populateDoors,
  localToGlobal,
  populateBackground,
  populateCollision,
};
