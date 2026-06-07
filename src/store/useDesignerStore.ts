import { create } from 'zustand';
import type {
  FurnitureItem,
  ViewMode,
  FurnitureType,
  WallItem,
  DrawMode,
  CustomFurnitureCatalogEntry,
  Room,
  WindowItem,
  CurtainItem,
  WallOrientation,
  Floor,
  StaircaseArea,
  SelectedWall,
} from '@/types/furniture';
import {
  FURNITURE_CATALOG,
  DEFAULT_ROOM_WIDTH_GRIDS,
  DEFAULT_ROOM_HEIGHT_GRIDS,
  MIN_ROOM_GRIDS,
  MAX_ROOM_GRIDS,
  GRID_SIZE,
  CANVAS_WIDTH_GRIDS,
  CANVAS_HEIGHT_GRIDS,
  ROOM_COLORS,
  DEFAULT_FURNITURE_TYPES,
  MAX_FLOORS,
  FLOOR_HEIGHT,
} from '@/data/furnitureData';
import { canPlaceFurnitureInRoom, canPlaceRoom, generateWallsForRooms, type GeneratedWall } from '@/utils/collision';
import { generateSmartLayout } from '@/utils/smartLayout';

interface PersistedState {
  floors: Floor[];
  currentFloor: number;
  currentRoomId: string;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;
  viewMode: ViewMode;
  seeThroughMode: boolean;
}

interface DesignState {
  floors: Floor[];
  currentFloor: number;
  currentRoomId: string;
  furniture: FurnitureItem[];
  walls: WallItem[];
  selectedId: string | null;
  selectedRoomId: string | null;
  selectedWindowId: string | null;
  selectedCurtainId: string | null;
  selectedWall: SelectedWall | null;
  viewMode: ViewMode;
  seeThroughMode: boolean;
  drawMode: DrawMode;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;
  roomWidthGrids: number;
  roomHeightGrids: number;

  getCurrentFloor: () => Floor | undefined;
  getFloorByLevel: (level: number) => Floor | undefined;
  getCurrentRoom: () => Room | undefined;
  getRoomById: (id: string) => Room | undefined;
  getCanvasWidth: () => number;
  getCanvasHeight: () => number;
  getRoomWidth: () => number;
  getRoomHeight: () => number;
  getCatalogEntry: (type: FurnitureType) => CustomFurnitureCatalogEntry;
  getAllFurnitureTypes: () => FurnitureType[];
  getAllFurniture: () => FurnitureItem[];
  getAllFurnitureForFloor: (level: number) => FurnitureItem[];
  getAutoWalls: () => GeneratedWall[];
  getAutoWallsForFloor: (level: number) => GeneratedWall[];
  getAllWindows: () => WindowItem[];
  getAllWindowsForFloor: (level: number) => WindowItem[];
  getAllCurtains: () => CurtainItem[];
  getAllCurtainsForFloor: (level: number) => CurtainItem[];
  getWindowById: (id: string) => WindowItem | undefined;
  getCurtainById: (id: string) => CurtainItem | undefined;
  getStaircaseArea: () => StaircaseArea | null;
  getStaircaseAreaForFloor: (level: number) => StaircaseArea | null;
  findFloorForRoomId: (roomId: string) => number | undefined;

  setRoomWidthGrids: (grids: number) => void;
  setRoomHeightGrids: (grids: number) => void;

  setDrawMode: (mode: DrawMode) => void;
  setSeeThroughMode: (enabled: boolean) => void;

  addFurniture: (type: FurnitureType, x: number, y: number, roomId: string) => boolean;
  moveFurniture: (id: string, x: number, y: number) => boolean;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  updateFurnitureWidth: (id: string, widthGrids: number) => boolean;
  updateFurnitureHeight: (id: string, heightGrids: number) => boolean;
  updateFurnitureColor: (id: string, color: string) => void;
  updateFurnitureLabel: (id: string, label: string) => void;
  updateFurnitureMaterial: (id: string, materialId: string) => void;

  addWindow: (roomId: string, x: number, y: number, width: number, height: number, wallOrientation: WallOrientation, wallOffset: number, windowWidth: number, windowHeight: number) => boolean;
  removeWindow: (windowId: string) => void;
  selectWindow: (id: string | null) => void;

  addCurtain: (windowId: string, roomId: string) => boolean;
  removeCurtain: (curtainId: string) => void;
  toggleCurtain: (curtainId: string) => void;
  selectCurtain: (id: string | null) => void;

  selectWall: (wall: SelectedWall | null) => void;
  updateWallMaterial: (roomId: string, orientation: WallOrientation, materialId: string, applyToAllWalls?: boolean) => void;

  addCustomFurnitureType: (
    typeId: string,
    entry: CustomFurnitureCatalogEntry
  ) => void;

  setViewMode: (mode: ViewMode) => void;
  clearAll: () => void;
  saveLayout: () => void;
  loadLayout: () => void;

  switchRoom: (roomId: string) => void;
  switchFloor: (level: number) => void;
  selectRoom: (roomId: string | null) => void;
  addRoom: (name?: string, x?: number, y?: number, widthGrids?: number, heightGrids?: number) => void;
  removeRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;
  moveRoom: (roomId: string, xGrids: number, yGrids: number) => boolean;
  resizeRoom: (roomId: string, widthGrids: number, heightGrids: number) => boolean;

  setStaircaseArea: (area: StaircaseArea | null) => void;

  clearRoomFurniture: (roomId: string) => void;
  applySmartLayout: (roomId: string, mode: 'clear' | 'preserve') => number;

  syncRoomFurniture: () => void;
}

const STORAGE_KEY = 'interior-designer-layout-v5-multifloor';

let counter = 0;
const generateId = (prefix: string) => {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
};

const hexToNumber = (hex: string): number => {
  try {
    return parseInt(hex.replace('#', ''), 16) || 0x888888;
  } catch {
    return 0x888888;
  }
};

const clampRoomGrids = (g: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(g)));

let colorIndex = 0;
const nextRoomColor = () => {
  const color = ROOM_COLORS[colorIndex % ROOM_COLORS.length];
  colorIndex += 1;
  return color;
};

const collectAllFurniture = (floors: Floor[]): FurnitureItem[] => {
  return floors.flatMap((f) => f.rooms.flatMap((r) => r.furniture));
};

const collectAllFurnitureForFloor = (floor: Floor): FurnitureItem[] => {
  return floor.rooms.flatMap((r) => r.furniture);
};

const collectAllWindowsForFloor = (floor: Floor): WindowItem[] => {
  return floor.rooms.flatMap((r) => r.windows);
};

const collectAllCurtainsForFloor = (floor: Floor): CurtainItem[] => {
  return floor.rooms.flatMap((r) => r.curtains);
};

const findFloorForRoomId = (floors: Floor[], roomId: string): Floor | undefined => {
  return floors.find((f) => f.rooms.some((r) => r.id === roomId));
};

const getDefaultRoomsForFloor = (floorLevel: number): Room[] => {
  colorIndex = 0;
  if (floorLevel === 0) {
    const livingRoom: Room = {
      id: generateId('room'),
      name: '客厅',
      x: 2,
      y: 2,
      widthGrids: 14,
      heightGrids: 10,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 14,
      roomHeightGrids: 10,
      wallMaterials: {},
    };
    const bedroom: Room = {
      id: generateId('room'),
      name: '卧室',
      x: 17,
      y: 2,
      widthGrids: 10,
      heightGrids: 10,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 10,
      roomHeightGrids: 10,
      wallMaterials: {},
    };
    const kitchen: Room = {
      id: generateId('room'),
      name: '厨房',
      x: 2,
      y: 13,
      widthGrids: 10,
      heightGrids: 8,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 10,
      roomHeightGrids: 8,
      wallMaterials: {},
    };
    const bathroom: Room = {
      id: generateId('room'),
      name: '卫生间',
      x: 13,
      y: 13,
      widthGrids: 6,
      heightGrids: 8,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 6,
      roomHeightGrids: 8,
      wallMaterials: {},
    };
    return [livingRoom, bedroom, kitchen, bathroom];
  } else if (floorLevel === 1) {
    const masterBedroom: Room = {
      id: generateId('room'),
      name: '主卧',
      x: 2,
      y: 2,
      widthGrids: 14,
      heightGrids: 10,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 14,
      roomHeightGrids: 10,
      wallMaterials: {},
    };
    const study: Room = {
      id: generateId('room'),
      name: '书房',
      x: 17,
      y: 2,
      widthGrids: 10,
      heightGrids: 10,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 10,
      roomHeightGrids: 10,
      wallMaterials: {},
    };
    const bathroom2: Room = {
      id: generateId('room'),
      name: '卫生间',
      x: 2,
      y: 13,
      widthGrids: 8,
      heightGrids: 6,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 8,
      roomHeightGrids: 6,
      wallMaterials: {},
    };
    return [masterBedroom, study, bathroom2];
  } else {
    const terrace: Room = {
      id: generateId('room'),
      name: '露台',
      x: 2,
      y: 2,
      widthGrids: 14,
      heightGrids: 10,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 14,
      roomHeightGrids: 10,
      wallMaterials: {},
    };
    const recreation: Room = {
      id: generateId('room'),
      name: '娱乐室',
      x: 17,
      y: 2,
      widthGrids: 10,
      heightGrids: 14,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: 10,
      roomHeightGrids: 14,
      wallMaterials: {},
    };
    return [terrace, recreation];
  }
};

const getDefaultFloors = (): Floor[] => {
  const floors: Floor[] = [];
  for (let i = 0; i < MAX_FLOORS; i++) {
    const defaultStaircase: StaircaseArea | null = i < MAX_FLOORS - 1 ? {
      x: 28,
      y: 2,
      widthGrids: 4,
      heightGrids: 4,
    } : null;
    floors.push({
      id: generateId('floor'),
      level: i,
      rooms: getDefaultRoomsForFloor(i),
      staircaseArea: defaultStaircase,
    });
  }
  return floors;
};

export const useDesignerStore = create<DesignState>((set, get) => ({
  floors: [],
  currentFloor: 0,
  currentRoomId: '',
  furniture: [],
  walls: [],
  selectedId: null,
  selectedRoomId: null,
  selectedWindowId: null,
  selectedCurtainId: null,
  selectedWall: null,
  viewMode: '2d',
  seeThroughMode: false,
  drawMode: 'none',
  customCatalog: {},
  roomWidthGrids: DEFAULT_ROOM_WIDTH_GRIDS,
  roomHeightGrids: DEFAULT_ROOM_HEIGHT_GRIDS,

  getCurrentFloor: () => {
    const { floors, currentFloor } = get();
    return floors.find((f) => f.level === currentFloor);
  },

  getFloorByLevel: (level: number) => {
    return get().floors.find((f) => f.level === level);
  },

  getCurrentRoom: () => {
    const { floors, currentRoomId } = get();
    for (const floor of floors) {
      const room = floor.rooms.find((r) => r.id === currentRoomId);
      if (room) return room;
    }
    return undefined;
  },

  getRoomById: (id: string) => {
    for (const floor of get().floors) {
      const room = floor.rooms.find((r) => r.id === id);
      if (room) return room;
    }
    return undefined;
  },

  getCanvasWidth: () => CANVAS_WIDTH_GRIDS * GRID_SIZE,
  getCanvasHeight: () => CANVAS_HEIGHT_GRIDS * GRID_SIZE,

  getRoomWidth: () => get().roomWidthGrids * GRID_SIZE,
  getRoomHeight: () => get().roomHeightGrids * GRID_SIZE,

  getCatalogEntry: (type: FurnitureType) => {
    const { customCatalog } = get();
    if (customCatalog[type]) return customCatalog[type];
    if (type in FURNITURE_CATALOG)
      return FURNITURE_CATALOG[type as keyof typeof FURNITURE_CATALOG];
    return {
      label: type,
      width: GRID_SIZE * 2,
      height: GRID_SIZE * 2,
      color: '#888888',
      color3D: 0x888888,
      depth: 60,
    };
  },

  getAllFurnitureTypes: () => {
    const { customCatalog } = get();
    return [...DEFAULT_FURNITURE_TYPES, ...Object.keys(customCatalog)];
  },

  getAllFurniture: () => collectAllFurniture(get().floors),
  getAllFurnitureForFloor: (level: number) => {
    const floor = get().getFloorByLevel(level);
    return floor ? collectAllFurnitureForFloor(floor) : [];
  },

  getAutoWalls: () => {
    const floor = get().getCurrentFloor();
    return floor ? generateWallsForRooms(floor.rooms) : [];
  },
  getAutoWallsForFloor: (level: number) => {
    const floor = get().getFloorByLevel(level);
    return floor ? generateWallsForRooms(floor.rooms) : [];
  },

  getAllWindows: () => {
    const floor = get().getCurrentFloor();
    return floor ? collectAllWindowsForFloor(floor) : [];
  },
  getAllWindowsForFloor: (level: number) => {
    const floor = get().getFloorByLevel(level);
    return floor ? collectAllWindowsForFloor(floor) : [];
  },

  getAllCurtains: () => {
    const floor = get().getCurrentFloor();
    return floor ? collectAllCurtainsForFloor(floor) : [];
  },
  getAllCurtainsForFloor: (level: number) => {
    const floor = get().getFloorByLevel(level);
    return floor ? collectAllCurtainsForFloor(floor) : [];
  },

  getWindowById: (id: string) => {
    for (const floor of get().floors) {
      const win = collectAllWindowsForFloor(floor).find((w) => w.id === id);
      if (win) return win;
    }
    return undefined;
  },
  getCurtainById: (id: string) => {
    for (const floor of get().floors) {
      const curtain = collectAllCurtainsForFloor(floor).find((c) => c.id === id);
      if (curtain) return curtain;
    }
    return undefined;
  },

  getStaircaseArea: () => {
    const floor = get().getCurrentFloor();
    return floor ? floor.staircaseArea : null;
  },
  getStaircaseAreaForFloor: (level: number) => {
    const floor = get().getFloorByLevel(level);
    return floor ? floor.staircaseArea : null;
  },
  findFloorForRoomId: (roomId: string) => {
    const { floors } = get();
    const found = floors.find((f) => f.rooms.some((r) => r.id === roomId));
    return found ? found.level : undefined;
  },

  setRoomWidthGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);
    set({ roomWidthGrids: clamped });
  },

  setRoomHeightGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);
    set({ roomHeightGrids: clamped });
  },

  setDrawMode: (mode: DrawMode) => set({ drawMode: mode }),
  setSeeThroughMode: (enabled: boolean) => set({ seeThroughMode: enabled }),

  syncRoomFurniture: () => {
    set({ furniture: collectAllFurniture(get().floors) });
  },

  addFurniture: (type: FurnitureType, x: number, y: number, roomId: string) => {
    const catalog = get().getCatalogEntry(type);
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return false;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const candidate = {
      x,
      y,
      width: catalog.width,
      height: catalog.height,
    };
    const allFurniture = collectAllFurnitureForFloor(floor);
    const autoWalls = generateWallsForRooms(floor.rooms) as unknown as WallItem[];

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls)) return false;

    if (floor.staircaseArea) {
      const sx = floor.staircaseArea.x * GRID_SIZE;
      const sy = floor.staircaseArea.y * GRID_SIZE;
      const sw = floor.staircaseArea.widthGrids * GRID_SIZE;
      const sh = floor.staircaseArea.heightGrids * GRID_SIZE;
      if (
        candidate.x < sx + sw &&
        candidate.x + candidate.width > sx &&
        candidate.y < sy + sh &&
        candidate.y + candidate.height > sy
      ) {
        return false;
      }
    }

    const item: FurnitureItem = {
      id: generateId('furniture'),
      type,
      x,
      y,
      width: catalog.width,
      height: catalog.height,
      color: catalog.color,
      label: catalog.label,
      roomId: room.id,
    };

    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === room.id ? { ...r, furniture: [...r.furniture, item] } : r
              ),
            }
          : f
      ),
      selectedId: item.id,
      selectedRoomId: room.id,
    });
    get().syncRoomFurniture();
    return true;
  },

  moveFurniture: (id: string, x: number, y: number) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return false;

    const room = targetFloor.rooms.find((r) => r.id === target!.roomId);
    if (!room) return false;

    const candidate = { x, y, width: target.width, height: target.height };
    const allFurniture = collectAllFurnitureForFloor(targetFloor);
    const autoWalls = generateWallsForRooms(targetFloor.rooms) as unknown as WallItem[];

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls, id)) return false;

    if (targetFloor.staircaseArea) {
      const sx = targetFloor.staircaseArea.x * GRID_SIZE;
      const sy = targetFloor.staircaseArea.y * GRID_SIZE;
      const sw = targetFloor.staircaseArea.widthGrids * GRID_SIZE;
      const sh = targetFloor.staircaseArea.heightGrids * GRID_SIZE;
      if (
        candidate.x < sx + sw &&
        candidate.x + candidate.width > sx &&
        candidate.y < sy + sh &&
        candidate.y + candidate.height > sy
      ) {
        return false;
      }
    }

    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === room.id
                  ? {
                      ...r,
                      furniture: r.furniture.map((f) => (f.id === id ? { ...f, x, y } : f)),
                    }
                  : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  removeFurniture: (id: string) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return;

    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === target!.roomId
                  ? { ...r, furniture: r.furniture.filter((f) => f.id !== id) }
                  : r
              ),
            }
          : f
      ),
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
    get().syncRoomFurniture();
  },

  updateFurnitureWidth: (id: string, widthGrids: number) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return false;

    const room = targetFloor.rooms.find((r) => r.id === target!.roomId);
    if (!room) return false;

    const newWidth = Math.max(1, Math.min(6, Math.round(widthGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: newWidth, height: target.height };
    const autoWalls = generateWallsForRooms(targetFloor.rooms) as unknown as WallItem[];
    const allFurniture = collectAllFurnitureForFloor(targetFloor);

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls, id)) return false;

    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === room.id
                  ? {
                      ...r,
                      furniture: r.furniture.map((f) => (f.id === id ? { ...f, width: newWidth } : f)),
                    }
                  : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  updateFurnitureHeight: (id: string, heightGrids: number) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return false;

    const room = targetFloor.rooms.find((r) => r.id === target!.roomId);
    if (!room) return false;

    const newHeight = Math.max(1, Math.min(6, Math.round(heightGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: target.width, height: newHeight };
    const autoWalls = generateWallsForRooms(targetFloor.rooms) as unknown as WallItem[];
    const allFurniture = collectAllFurnitureForFloor(targetFloor);

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls, id)) return false;

    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === room.id
                  ? {
                      ...r,
                      furniture: r.furniture.map((f) => (f.id === id ? { ...f, height: newHeight } : f)),
                    }
                  : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  updateFurnitureColor: (id: string, color: string) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return;
    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === target!.roomId
                  ? { ...r, furniture: r.furniture.map((f) => (f.id === id ? { ...f, color } : f)) }
                  : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
  },

  updateFurnitureLabel: (id: string, label: string) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return;
    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === target!.roomId
                  ? { ...r, furniture: r.furniture.map((f) => (f.id === id ? { ...f, label } : f)) }
                  : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
  },

  updateFurnitureMaterial: (id: string, materialId: string) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let target: FurnitureItem | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        const found = room.furniture.find((f) => f.id === id);
        if (found) {
          target = found;
          targetFloor = floor;
          break;
        }
      }
      if (target) break;
    }
    if (!target || !targetFloor) return;
    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === target!.roomId
                  ? { ...r, furniture: r.furniture.map((f) => (f.id === id ? { ...f, materialId } : f)) }
                  : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
  },

  selectWall: (wall) => {
    set({
      selectedWall: wall,
      selectedId: null,
      selectedWindowId: null,
      selectedCurtainId: null,
    });
  },

  updateWallMaterial: (roomId: string, orientation: WallOrientation, materialId: string, applyToAllWalls = false) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return;
    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) => {
                if (r.id !== roomId) return r;
                const currentMats = r.wallMaterials ?? {};
                if (applyToAllWalls) {
                  return {
                    ...r,
                    wallMaterials: {
                      top: materialId,
                      bottom: materialId,
                      left: materialId,
                      right: materialId,
                    },
                  };
                }
                return {
                  ...r,
                  wallMaterials: {
                    ...currentMats,
                    [orientation]: materialId,
                  },
                };
              }),
            }
          : f
      ),
    });
  },

  selectFurniture: (id: string | null) => set({ selectedId: id, selectedWindowId: null, selectedCurtainId: null, selectedWall: null }),

  selectWindow: (id) => {
    set({ selectedWindowId: id, selectedId: null, selectedCurtainId: null, selectedWall: null });
  },

  selectCurtain: (id) => {
    set({ selectedCurtainId: id, selectedId: null, selectedWindowId: null, selectedWall: null });
  },

  addWindow: (roomId, x, y, width, height, wallOrientation, wallOffset, windowWidth, windowHeight) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return false;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const newWindow: WindowItem = {
      id: generateId('window'),
      roomId,
      x,
      y,
      width,
      height,
      wallOrientation,
      wallOffset,
      windowWidth,
      windowHeight,
    };

    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId ? { ...r, windows: [...r.windows, newWindow] } : r
              ),
            }
          : f
      ),
      selectedWindowId: newWindow.id,
      selectedRoomId: roomId,
    });
    return true;
  },

  removeWindow: (windowId) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let targetRoom: Room | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        if (room.windows.some((w) => w.id === windowId)) {
          targetFloor = floor;
          targetRoom = room;
          break;
        }
      }
      if (targetFloor) break;
    }
    if (!targetFloor || !targetRoom) return;
    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === targetRoom!.id
                  ? {
                      ...r,
                      windows: r.windows.filter((w) => w.id !== windowId),
                      curtains: r.curtains.filter((c) => c.windowId !== windowId),
                    }
                  : r
              ),
            }
          : f
      ),
      selectedWindowId: get().selectedWindowId === windowId ? null : get().selectedWindowId,
      selectedCurtainId: get().getAllCurtains().find((c) => c.windowId === windowId)?.id === get().selectedCurtainId
        ? null
        : get().selectedCurtainId,
    });
  },

  addCurtain: (windowId, roomId) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return false;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return false;
    if (room.curtains.some((c) => c.windowId === windowId)) return false;

    const newCurtain: CurtainItem = {
      id: generateId('curtain'),
      windowId,
      roomId,
      isOpen: false,
    };

    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId ? { ...r, curtains: [...r.curtains, newCurtain] } : r
              ),
            }
          : f
      ),
      selectedCurtainId: newCurtain.id,
    });
    return true;
  },

  removeCurtain: (curtainId) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let targetRoom: Room | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        if (room.curtains.some((c) => c.id === curtainId)) {
          targetFloor = floor;
          targetRoom = room;
          break;
        }
      }
      if (targetFloor) break;
    }
    if (!targetFloor || !targetRoom) return;
    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === targetRoom!.id ? { ...r, curtains: r.curtains.filter((c) => c.id !== curtainId) } : r
              ),
            }
          : f
      ),
      selectedCurtainId: get().selectedCurtainId === curtainId ? null : get().selectedCurtainId,
    });
  },

  toggleCurtain: (curtainId) => {
    const floors = get().floors;
    let targetFloor: Floor | undefined;
    let targetRoom: Room | undefined;
    for (const floor of floors) {
      for (const room of floor.rooms) {
        if (room.curtains.some((c) => c.id === curtainId)) {
          targetFloor = floor;
          targetRoom = room;
          break;
        }
      }
      if (targetFloor) break;
    }
    if (!targetFloor || !targetRoom) return;
    set({
      floors: floors.map((f) =>
        f.id === targetFloor!.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === targetRoom!.id
                  ? {
                      ...r,
                      curtains: r.curtains.map((c) =>
                        c.id === curtainId ? { ...c, isOpen: !c.isOpen } : c
                      ),
                    }
                  : r
              ),
            }
          : f
      ),
    });
  },

  addCustomFurnitureType: (typeId: string, entry: CustomFurnitureCatalogEntry) => {
    set({
      customCatalog: {
        ...get().customCatalog,
        [typeId]: { ...entry, color3D: hexToNumber(entry.color), isCustom: true },
      },
    });
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  clearAll: () => {
    const floors = get().floors;
    set({
      floors: floors.map((f) => ({
        ...f,
        rooms: f.rooms.map((r) => ({ ...r, furniture: [] })),
      })),
      selectedId: null,
    });
    get().syncRoomFurniture();
  },

  saveLayout: () => {
    const { floors, currentFloor, currentRoomId, customCatalog, viewMode, seeThroughMode } = get();
    const state: PersistedState = {
      floors,
      currentFloor,
      currentRoomId,
      customCatalog,
      viewMode,
      seeThroughMode,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  },

  loadLayout: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const normalizeRooms = (r: Room[]): Room[] =>
        r.map((room) => ({
          ...room,
          windows: room.windows ?? [],
          curtains: room.curtains ?? [],
          wallMaterials: room.wallMaterials ?? {},
        }));
      const normalizeFloors = (floors: Floor[]): Floor[] =>
        floors.map((floor) => ({
          ...floor,
          rooms: normalizeRooms(floor.rooms),
          staircaseArea: floor.staircaseArea ?? null,
        }));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        let floors: Floor[];
        if (parsed.floors && parsed.floors.length > 0) {
          floors = normalizeFloors(parsed.floors as Floor[]);
        } else {
          floors = getDefaultFloors();
        }
        const currentFloor = parsed.currentFloor !== undefined && parsed.currentFloor >= 0 && parsed.currentFloor < floors.length
          ? parsed.currentFloor
          : 0;
        const currentFloorData = floors[currentFloor];
        const rooms = currentFloorData.rooms;
        const currentRoomId = parsed.currentRoomId && rooms.some((r) => r.id === parsed.currentRoomId)
          ? parsed.currentRoomId
          : rooms[0]?.id ?? '';
        const currentRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0];
        set({
          floors,
          currentFloor,
          currentRoomId,
          furniture: collectAllFurniture(floors),
          selectedRoomId: currentRoom?.id ?? null,
          selectedWindowId: null,
          selectedCurtainId: null,
          selectedWall: null,
          roomWidthGrids: currentRoom?.widthGrids ?? DEFAULT_ROOM_WIDTH_GRIDS,
          roomHeightGrids: currentRoom?.heightGrids ?? DEFAULT_ROOM_HEIGHT_GRIDS,
          customCatalog: parsed.customCatalog ?? {},
          viewMode: parsed.viewMode ?? '2d',
          seeThroughMode: parsed.seeThroughMode ?? false,
          selectedId: null,
          drawMode: 'none',
        });
      } else {
        const floors = getDefaultFloors();
        const currentFloor = 0;
        const firstFloor = floors[currentFloor];
        const firstRoom = firstFloor.rooms[0];
        set({
          floors,
          currentFloor,
          currentRoomId: firstRoom.id,
          furniture: collectAllFurniture(floors),
          selectedRoomId: firstRoom.id,
          selectedWindowId: null,
          selectedCurtainId: null,
          selectedWall: null,
          roomWidthGrids: firstRoom.widthGrids,
          roomHeightGrids: firstRoom.heightGrids,
          customCatalog: {},
          viewMode: '2d',
          seeThroughMode: false,
          selectedId: null,
          drawMode: 'none',
        });
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
      const floors = getDefaultFloors();
      const currentFloor = 0;
      const firstFloor = floors[currentFloor];
      const firstRoom = firstFloor.rooms[0];
      set({
        floors,
        currentFloor,
        currentRoomId: firstRoom.id,
        furniture: collectAllFurniture(floors),
        selectedRoomId: firstRoom.id,
        selectedWindowId: null,
        selectedCurtainId: null,
        selectedWall: null,
        roomWidthGrids: firstRoom.widthGrids,
        roomHeightGrids: firstRoom.heightGrids,
        customCatalog: {},
        viewMode: '2d',
        seeThroughMode: false,
        selectedId: null,
        drawMode: 'none',
      });
    }
  },

  switchFloor: (level: number) => {
    const { floors } = get();
    const floor = floors.find((f) => f.level === level);
    if (!floor) return;
    const firstRoom = floor.rooms[0];
    set({
      currentFloor: level,
      currentRoomId: firstRoom?.id ?? '',
      selectedRoomId: firstRoom?.id ?? null,
      selectedId: null,
      selectedWindowId: null,
      selectedCurtainId: null,
      selectedWall: null,
      roomWidthGrids: firstRoom?.widthGrids ?? DEFAULT_ROOM_WIDTH_GRIDS,
      roomHeightGrids: firstRoom?.heightGrids ?? DEFAULT_ROOM_HEIGHT_GRIDS,
    });
  },

  switchRoom: (roomId: string) => {
    const { floors } = get();
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return;
    set({
      currentFloor: floor.level,
      currentRoomId: roomId,
      selectedRoomId: roomId,
      roomWidthGrids: room.widthGrids,
      roomHeightGrids: room.heightGrids,
      selectedId: null,
      selectedWall: null,
    });
  },

  selectRoom: (roomId: string | null) => {
    if (!roomId) {
      set({ selectedRoomId: null });
      return;
    }
    const { floors } = get();
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (room) {
      set({
        selectedRoomId: roomId,
        currentFloor: floor.level,
        currentRoomId: roomId,
        roomWidthGrids: room.widthGrids,
        roomHeightGrids: room.heightGrids,
        selectedWall: null,
      });
    }
  },

  addRoom: (name?: string, x?: number, y?: number, widthGrids?: number, heightGrids?: number) => {
    const floors = get().floors;
    const currentFloor = get().getCurrentFloor();
    if (!currentFloor) return;
    const w = widthGrids ?? DEFAULT_ROOM_WIDTH_GRIDS;
    const h = heightGrids ?? DEFAULT_ROOM_HEIGHT_GRIDS;

    let placedX = x;
    let placedY = y;
    if (placedX === undefined || placedY === undefined) {
      outer: for (let gy = 0; gy <= CANVAS_HEIGHT_GRIDS - h; gy += 2) {
        for (let gx = 0; gx <= CANVAS_WIDTH_GRIDS - w; gx += 2) {
          if (canPlaceRoom({ x: gx, y: gy, widthGrids: w, heightGrids: h }, currentFloor.rooms, undefined, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) {
            placedX = gx;
            placedY = gy;
            break outer;
          }
        }
      }
      if (placedX === undefined) placedX = 2;
      if (placedY === undefined) placedY = 2;
    }

    const roomNames = ['客厅', '卧室', '厨房', '卫生间', '书房', '餐厅', '阳台', '玄关'];
    const usedNames = new Set(currentFloor.rooms.map((r) => r.name));
    let autoName = name?.trim() || '';
    if (!autoName) {
      for (const n of roomNames) {
        if (!usedNames.has(n)) {
          autoName = n;
          break;
        }
      }
      if (!autoName) autoName = `房间 ${currentFloor.rooms.length + 1}`;
    }

    const newRoom: Room = {
      id: generateId('room'),
      name: autoName,
      x: placedX,
      y: placedY,
      widthGrids: w,
      heightGrids: h,
      color: nextRoomColor(),
      furniture: [],
      windows: [],
      curtains: [],
      roomWidthGrids: w,
      roomHeightGrids: h,
      wallMaterials: {},
    };

    if (!canPlaceRoom({ x: newRoom.x, y: newRoom.y, widthGrids: newRoom.widthGrids, heightGrids: newRoom.heightGrids }, currentFloor.rooms, undefined, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) {
      return;
    }

    set({
      floors: floors.map((f) =>
        f.id === currentFloor.id
          ? { ...f, rooms: [...f.rooms, newRoom] }
          : f
      ),
      currentRoomId: newRoom.id,
      selectedRoomId: newRoom.id,
      roomWidthGrids: newRoom.widthGrids,
      roomHeightGrids: newRoom.heightGrids,
      selectedId: null,
      selectedWall: null,
      drawMode: 'none',
    });
    get().syncRoomFurniture();
  },

  removeRoom: (roomId: string) => {
    const { floors, selectedWall } = get();
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return;
    if (floor.rooms.length <= 1) return;
    const remaining = floor.rooms.filter((r) => r.id !== roomId);
    const { currentRoomId } = get();
    const newCurrentId = currentRoomId === roomId
      ? remaining[0].id
      : currentRoomId;
    const newCurrent = remaining.find((r) => r.id === newCurrentId) || remaining[0];
    set({
      floors: floors.map((f) =>
        f.id === floor.id ? { ...f, rooms: remaining } : f
      ),
      currentRoomId: newCurrentId,
      selectedRoomId: newCurrentId,
      roomWidthGrids: newCurrent.widthGrids,
      roomHeightGrids: newCurrent.heightGrids,
      selectedId: null,
      selectedWall: selectedWall?.roomId === roomId ? null : selectedWall,
      drawMode: 'none',
    });
    get().syncRoomFurniture();
  },

  renameRoom: (roomId: string, name: string) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return;
    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId ? { ...r, name: name.trim() || r.name } : r
              ),
            }
          : f
      ),
    });
  },

  moveRoom: (roomId: string, xGrids: number, yGrids: number) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return false;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const candidate = { x: xGrids, y: yGrids, widthGrids: room.widthGrids, heightGrids: room.heightGrids };
    if (!canPlaceRoom(candidate, floor.rooms, roomId, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) return false;

    const rx = xGrids * GRID_SIZE;
    const ry = yGrids * GRID_SIZE;
    const rw = room.widthGrids * GRID_SIZE;
    const rh = room.heightGrids * GRID_SIZE;

    const adjustedFurniture = room.furniture.map((f) => {
      let fx = f.x;
      let fy = f.y;
      if (fx + f.width > rx + rw) fx = rx + rw - f.width;
      if (fy + f.height > ry + rh) fy = ry + rh - f.height;
      if (fx < rx) fx = rx;
      if (fy < ry) fy = ry;
      return { ...f, x: fx, y: fy };
    });

    const deltaX = (xGrids - room.x) * GRID_SIZE;
    const deltaY = (yGrids - room.y) * GRID_SIZE;
    const adjustedWindows = room.windows.map((w) => ({
      ...w,
      x: w.x + deltaX,
      y: w.y + deltaY,
    }));

    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId ? { ...r, x: xGrids, y: yGrids, furniture: adjustedFurniture, windows: adjustedWindows } : r
              ),
            }
          : f
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  resizeRoom: (roomId: string, widthGrids: number, heightGrids: number) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return false;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const w = clampRoomGrids(widthGrids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);
    const h = clampRoomGrids(heightGrids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);

    const candidate = { x: room.x, y: room.y, widthGrids: w, heightGrids: h };
    if (!canPlaceRoom(candidate, floor.rooms, roomId, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) return false;

    const rx = room.x * GRID_SIZE;
    const ry = room.y * GRID_SIZE;
    const rw = w * GRID_SIZE;
    const rh = h * GRID_SIZE;

    const adjustedFurniture = room.furniture.filter((f) => {
      return f.x >= rx && f.y >= ry && f.x + f.width <= rx + rw && f.y + f.height <= ry + rh;
    });

    const adjustedWindows = room.windows.filter((win) => {
      return (
        win.x >= rx - 0.01 &&
        win.y >= ry - 0.01 &&
        win.x + win.width <= rx + rw + 0.01 &&
        win.y + win.height <= ry + rh + 0.01
      );
    });

    const validWindowIds = new Set(adjustedWindows.map((w) => w.id));
    const adjustedCurtains = room.curtains.filter((c) => validWindowIds.has(c.windowId));

    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      widthGrids: w,
                      heightGrids: h,
                      roomWidthGrids: w,
                      roomHeightGrids: h,
                      furniture: adjustedFurniture,
                      windows: adjustedWindows,
                      curtains: adjustedCurtains,
                    }
                  : r
              ),
            }
          : f
      ),
      roomWidthGrids: get().currentRoomId === roomId ? w : get().roomWidthGrids,
      roomHeightGrids: get().currentRoomId === roomId ? h : get().roomHeightGrids,
      selectedWindowId:
        get().selectedWindowId && !validWindowIds.has(get().selectedWindowId!) ? null : get().selectedWindowId,
    });
    get().syncRoomFurniture();
    return true;
  },

  setStaircaseArea: (area: StaircaseArea | null) => {
    const { floors, currentFloor } = get();
    set({
      floors: floors.map((f) =>
        f.level === currentFloor ? { ...f, staircaseArea: area } : f
      ),
    });
  },

  clearRoomFurniture: (roomId: string) => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return;
    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId ? { ...r, furniture: [] } : r
              ),
            }
          : f
      ),
      selectedId: get().selectedId && floor.rooms.find((r) => r.id === roomId)?.furniture.some((f) => f.id === get().selectedId)
        ? null
        : get().selectedId,
    });
    get().syncRoomFurniture();
  },

  applySmartLayout: (roomId: string, mode: 'clear' | 'preserve') => {
    const floors = get().floors;
    const floor = findFloorForRoomId(floors, roomId);
    if (!floor) return 0;
    const room = floor.rooms.find((r) => r.id === roomId);
    if (!room) return 0;

    const clearExisting = mode === 'clear';
    const placements = generateSmartLayout(room, room.furniture, floor.rooms, { clearExisting });

    const newFurniture = clearExisting ? [] : [...room.furniture];
    let placedCount = 0;

    for (const p of placements) {
      const catalog = get().getCatalogEntry(p.type);
      if (floor.staircaseArea) {
        const sx = floor.staircaseArea.x * GRID_SIZE;
        const sy = floor.staircaseArea.y * GRID_SIZE;
        const sw = floor.staircaseArea.widthGrids * GRID_SIZE;
        const sh = floor.staircaseArea.heightGrids * GRID_SIZE;
        if (
          p.x < sx + sw &&
          p.x + catalog.width > sx &&
          p.y < sy + sh &&
          p.y + catalog.height > sy
        ) {
          continue;
        }
      }
      const item: FurnitureItem = {
        id: generateId('furniture'),
        type: p.type,
        x: p.x,
        y: p.y,
        width: catalog.width,
        height: catalog.height,
        color: catalog.color,
        label: catalog.label,
        roomId: room.id,
      };
      newFurniture.push(item);
      placedCount++;
    }

    set({
      floors: floors.map((f) =>
        f.id === floor.id
          ? {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId ? { ...r, furniture: newFurniture } : r
              ),
            }
          : f
      ),
      selectedRoomId: roomId,
      currentRoomId: roomId,
      selectedId: null,
    });
    get().syncRoomFurniture();
    return placedCount;
  },
}));
