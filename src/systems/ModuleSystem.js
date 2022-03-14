import properties from "../properties";

import prefabRooms from "../../assets/maps/prefab-rooms.json";
import prefabDoors from "../../assets/maps/prefab-doors.json";

export default class ModuleSystem {
  constructor() {
    this.styles = {};

    this.moduleWidth = 15;
    this.moduleHeight = 15;
    this.doorOffset = {
      horizontal: {
        x: 15 - 3,
        y: 4,
      },
      vertical: {
        x: 4,
        y: 15 - 2,
      },
    };
    this.doorWidth = 6;
    this.doorHeight = 6;

    prefabRooms.layers.forEach((layer) => {
      const { style, room } = this.parseStyleRoomFromLayer(layer);
      if (!(style in this.styles)) {
        this.styles[style] = {};
        this.styles[style].rooms = {};
        this.styles[style].doors = {};
      }
      this.styles[style].rooms[room] = layer;
    });

    prefabDoors.layers.forEach((layer) => {
      const { style, axis, door } = this.parseStyleDoorFromLayer(layer);
      if (!(axis in this.styles[style].doors)) {
        this.styles[style].doors[axis] = {};
      }
      this.styles[style].doors[axis][door] = layer;
    });
  }

  parseStyleRoomFromLayer(layer) {
    const [_, style, __, room] = layer.name.split("-");
    return { style, room };
  }

  parseStyleDoorFromLayer(layer) {
    const [_, style, axis, door] = layer.name.split("-");
    return { style, axis, door };
  }

  getRoom(style, room) {
    return this.styles[style].rooms[room];
  }

  getDoor(style, axis) {
    return this.styles[style].doors[axis]["01"];
  }

  getRandomRoom(style) {
    const roomId = properties.rng.getItem(
      Object.keys(this.styles[style].rooms).filter(
        (roomKey) => !["entrance", "exit"].includes(roomKey)
      )
    );
    return this.getRoom(style, roomId);
  }

  getNumberOfStyles() {
    return Object.keys(this.styles).length;
  }

  getNumberOfRooms(style) {
    return Object.keys(this.styles[style].rooms).length;
  }
}
