import properties from "../properties";

import tileDefinitions from "../definitions/tileDefinitions";

import utils from "../utils/utils";
import AStar from "../utils/AStar2";

import MapGenerationSystem from "../systems/MapGenerationSystem";
import TileMath from "../utils/TileMath";

const CLEAR_HIGHLIGHT = 0xffffff;
const PATH_HIGHLIGHT = 0x00ffff;

const ROOM_POINT = { x: 12, y: 13 };

export default class GameMap {
  constructor(scene, widthInModules, heightInModules, style, moduleSystem) {
    this.scene = scene;
    this.style = style;
    this.moduleSystem = moduleSystem;

    this.spawn = {
      x: 7,
      y: this.moduleSystem.moduleHeight * (heightInModules - 1) + 4,
    };
    this.goal = {
      x: this.moduleSystem.moduleWidth * (widthInModules - 1) + 7,
      y: 3,
    };

    this.metaMap = {
      rooms: [],
      doors: null,
    };

    this.createTilemap(widthInModules, heightInModules);

    this.metaMap.rooms = MapGenerationSystem.populateRooms(
      this.moduleSystem,
      this.style,
      widthInModules,
      heightInModules,
      this.mapLayers.background
    );

    this.aStar = new AStar(this);

    do {
      this.metaMap.doors = MapGenerationSystem.populateDoors(
        this.moduleSystem,
        this.metaMap.doors,
        this.style,
        widthInModules,
        heightInModules,
        this.mapLayers.background
      );
      this.aStar.recreateGraph();
    } while (!this.allRoomsConnected());

    this.highlightPaths = {};
  }

  createTilemap(widthInModules, heightInModules) {
    const { tileWidth, tileHeight } = properties;
    const width = this.moduleSystem.moduleWidth * widthInModules;
    const height = this.moduleSystem.moduleHeight * heightInModules;
    this.tilemap = this.scene.make.tilemap({ tileWidth, tileHeight, width, height });
    this.tileset = this.tilemap.addTilesetImage("tileset", "tileset");
    this.mapLayers = {};

    this.mapLayers.background = this.tilemap.createBlankLayer("background", this.tileset);
    this.mapLayers.collision = this.tilemap.createBlankLayer("collision", this.tileset);
    this.mapLayers.foreground = this.tilemap.createBlankLayer("foreground", this.tileset);
  }

  allRoomsConnected() {
    const notConnected = this.metaMap.rooms
      .map((roomRow, moduleY) =>
        roomRow.map((room, moduleX) => {
          // console.log(`module: ${moduleX}, ${moduleY}`);
          const roomPoint = MapGenerationSystem.localToGlobal(
            moduleX,
            moduleY,
            this.moduleSystem.moduleWidth,
            this.moduleSystem.moduleHeight,
            ROOM_POINT.x,
            ROOM_POINT.y
          );
          const path = this.aStar.findPath(this.spawn, roomPoint);
          // console.log(`from: ${this.spawn.x}, ${this.spawn.y} to: ${roomPoint.x}, ${roomPoint.y} -> ${path.length}`);
          return path;
        })
      )
      .flat()
      .some((path) => path.length === 0);
    // console.log(`allRoomsConnected: notConnected: ${notConnected}`);
    return !notConnected;
  }

  getEnemySpawnCandidates(numCandidates) {
    const candidates = this.mapLayers.background.layer.data
      .map((row, y) =>
        row.map((tile, x) => {
          const passable = tileDefinitions.passable.includes(tile.index);
          const roll = properties.rng.getUniform();
          const distanceToSpawn = TileMath.distance(this.spawn, { x, y });
          return { x, y, roll, distanceToSpawn, passable };
        })
      )
      .flat()
      .filter((position) => position.passable)
      .filter((position) => position.distanceToSpawn > 15)
      .sort((l, r) => l.roll - r.roll)
      .slice(0, numCandidates);
    return candidates;
  }

  putTile(tile) {
    this.mapLayers.background.putTileAt(tile.id, tile.x, tile.y);
  }

  toGraphMatrix() {
    return this.mapLayers.background.layer.data.map((row) =>
      row.map((tile) => {
        const passable = tileDefinitions.passable.includes(tile.index);
        return passable ? 1 : 0;
      })
    );
  }

  tileIsPassable(tilePosition) {
    const tile = this.mapLayers.background.getTileAt(tilePosition.x, tilePosition.y);
    if (tile) {
      return tileDefinitions.passable.includes(tile.index);
    }
    return false;
  }

  tileStoppingPower(tilePosition) {
    const tile = this.mapLayers.background.getTileAt(tilePosition.x, tilePosition.y);
    if (tileDefinitions.passable.includes(tile.index)) {
      return 0;
    }
    if (tileDefinitions.low.includes(tile.index)) {
      return 0;
    }
    return 99;
  }

  tileIsViewable(tilePosition) {
    return this.tileIsPassable(tilePosition);
  }

  setTileHighlight(tilePosition, tint) {
    const tile = this.mapLayers.background.getTileAt(tilePosition.x, tilePosition.y);
    // console.log("Setting tint:");
    // console.log(tilePosition);
    // console.log(tile);
    if (tile) {
      tile.tint = tint;
    }
  }

  setHighlighting(path, tint) {
    path.forEach((tilePosition) => this.setTileHighlight(tilePosition, tint));
  }

  clearHighlighting(path) {
    this.setHighlighting(path, CLEAR_HIGHLIGHT);
  }

  highlightPath(id, path) {
    // console.log('tint path');
    // console.log(path);
    if (!(id in this.highlightPaths)) {
      this.highlightPaths[id] = [];
    }
    this.clearHighlighting(this.highlightPaths[id]);
    this.highlightPaths[id] = path;
    this.setHighlighting(this.highlightPaths[id], PATH_HIGHLIGHT);
  }
}
