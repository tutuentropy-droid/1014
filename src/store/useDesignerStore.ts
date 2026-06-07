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
} from '@/data/furnitureData';
import { canPlaceFurnitureInRoom, canPlaceRoom, generateWallsForRooms, type GeneratedWall } from '@/utils/collision';
import { generateSmartLayout } from '@/utils/smartLayout';

interface PersistedState {
  rooms: Room[];
  currentRoomId: string;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;
  viewMode: ViewMode;
}

interface DesignState {
  rooms: Room[];
  currentRoomId: string;
  furniture: FurnitureItem[];
  walls: WallItem[];
  selectedId: string | null;
  selectedRoomId: string | null;
  selectedWindowId: string | null;
  selectedCurtainId: string | null;
  viewMode: ViewMode;
  drawMode: DrawMode;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;
  roomWidthGrids: number;
  roomHeightGrids: number;

  getCurrentRoom: () => Room | undefined;
  getRoomById: (id: string) => Room | undefined;
  getCanvasWidth: () => number;
  getCanvasHeight: () => number;
  getRoomWidth: () => number;
  getRoomHeight: () => number;
  getCatalogEntry: (type: FurnitureType) => CustomFurnitureCatalogEntry;
  getAllFurnitureTypes: () => FurnitureType[];
  getAllFurniture: () => FurnitureItem[];
  getAutoWalls: () => GeneratedWall[];
  getAllWindows: () => WindowItem[];
  getAllCurtains: () => CurtainItem[];
  getWindowById: (id: string) => WindowItem | undefined;
  getCurtainById: (id: string) => CurtainItem | undefined;

  setRoomWidthGrids: (grids: number) => void;
  setRoomHeightGrids: (grids: number) => void;

  setDrawMode: (mode: DrawMode) => void;

  addFurniture: (type: FurnitureType, x: number, y: number, roomId: string) => boolean;
  moveFurniture: (id: string, x: number, y: number) => boolean;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  updateFurnitureWidth: (id: string, widthGrids: number) => boolean;
  updateFurnitureHeight: (id: string, heightGrids: number) => boolean;
  updateFurnitureColor: (id: string, color: string) => void;
  updateFurnitureLabel: (id: string, label: string) => void;

  addWindow: (roomId: string, x: number, y: number, width: number, height: number, wallOrientation: WallOrientation, wallOffset: number, windowWidth: number, windowHeight: number) => boolean;
  removeWindow: (windowId: string) => void;
  selectWindow: (id: string | null) => void;

  addCurtain: (windowId: string, roomId: string) => boolean;
  removeCurtain: (curtainId: string) => void;
  toggleCurtain: (curtainId: string) => void;
  selectCurtain: (id: string | null) => void;

  addCustomFurnitureType: (
    typeId: string,
    entry: CustomFurnitureCatalogEntry
  ) => void;

  setViewMode: (mode: ViewMode) => void;
  clearAll: () => void;
  saveLayout: () => void;
  loadLayout: () => void;

  switchRoom: (roomId: string) => void;
  selectRoom: (roomId: string | null) => void;
  addRoom: (name?: string, x?: number, y?: number, widthGrids?: number, heightGrids?: number) => void;
  removeRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;
  moveRoom: (roomId: string, xGrids: number, yGrids: number) => boolean;
  resizeRoom: (roomId: string, widthGrids: number, heightGrids: number) => boolean;

  clearRoomFurniture: (roomId: string) => void;
  applySmartLayout: (roomId: string, mode: 'clear' | 'preserve') => number;

  syncRoomFurniture: () => void;
}

const STORAGE_KEY = 'interior-designer-layout-v4';

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

const collectAllFurniture = (rooms: Room[]): FurnitureItem[] => {
  return rooms.flatMap((r) => r.furniture);
};

const getDefaultRooms = (): Room[] => {
  colorIndex = 0;
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
  };
  return [livingRoom, bedroom, kitchen, bathroom];
};

export const useDesignerStore = create<DesignState>((set, get) => ({
  rooms: [],
  currentRoomId: '',
  furniture: [],
  walls: [],
  selectedId: null,
  selectedRoomId: null,
  selectedWindowId: null,
  selectedCurtainId: null,
  viewMode: '2d',
  drawMode: 'none',
  customCatalog: {},
  roomWidthGrids: DEFAULT_ROOM_WIDTH_GRIDS,
  roomHeightGrids: DEFAULT_ROOM_HEIGHT_GRIDS,

  getCurrentRoom: () => {
    const { rooms, currentRoomId } = get();
    return rooms.find((r) => r.id === currentRoomId);
  },

  getRoomById: (id: string) => {
    return get().rooms.find((r) => r.id === id);
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

  getAllFurniture: () => collectAllFurniture(get().rooms),

  getAutoWalls: () => generateWallsForRooms(get().rooms),
  getAllWindows: () => get().rooms.flatMap((r) => r.windows),
  getAllCurtains: () => get().rooms.flatMap((r) => r.curtains),
  getWindowById: (id: string) => get().rooms.flatMap((r) => r.windows).find((w) => w.id === id),
  getCurtainById: (id: string) => get().rooms.flatMap((r) => r.curtains).find((c) => c.id === id),

  setRoomWidthGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);
    set({ roomWidthGrids: clamped });
  },

  setRoomHeightGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);
    set({ roomHeightGrids: clamped });
  },

  setDrawMode: (mode: DrawMode) => set({ drawMode: mode }),

  syncRoomFurniture: () => {
    set({ furniture: collectAllFurniture(get().rooms) });
  },

  addFurniture: (type: FurnitureType, x: number, y: number, roomId: string) => {
    const catalog = get().getCatalogEntry(type);
    const rooms = get().rooms;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const candidate = {
      x,
      y,
      width: catalog.width,
      height: catalog.height,
    };
    const allFurniture = collectAllFurniture(rooms);
    const autoWalls = generateWallsForRooms(rooms) as unknown as WallItem[];

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls)) return false;

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
      rooms: rooms.map((r) =>
        r.id === room.id ? { ...r, furniture: [...r.furniture, item] } : r
      ),
      selectedId: item.id,
      selectedRoomId: room.id,
    });
    get().syncRoomFurniture();
    return true;
  },

  moveFurniture: (id: string, x: number, y: number) => {
    const rooms = get().rooms;
    const allFurniture = collectAllFurniture(rooms);
    const target = allFurniture.find((f) => f.id === id);
    if (!target) return false;

    const room = rooms.find((r) => r.id === target.roomId);
    if (!room) return false;

    const candidate = { x, y, width: target.width, height: target.height };
    const autoWalls = generateWallsForRooms(rooms) as unknown as WallItem[];

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls, id)) return false;

    set({
      rooms: rooms.map((r) =>
        r.id === room.id
          ? {
              ...r,
              furniture: r.furniture.map((f) => (f.id === id ? { ...f, x, y } : f)),
            }
          : r
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  removeFurniture: (id: string) => {
    const rooms = get().rooms;
    const target = collectAllFurniture(rooms).find((f) => f.id === id);
    if (!target) return;

    set({
      rooms: rooms.map((r) =>
        r.id === target.roomId
          ? { ...r, furniture: r.furniture.filter((f) => f.id !== id) }
          : r
      ),
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
    get().syncRoomFurniture();
  },

  selectFurniture: (id: string | null) => set({ selectedId: id, selectedWindowId: null, selectedCurtainId: null }),

  updateFurnitureWidth: (id: string, widthGrids: number) => {
    const rooms = get().rooms;
    const allFurniture = collectAllFurniture(rooms);
    const target = allFurniture.find((f) => f.id === id);
    if (!target) return false;

    const room = rooms.find((r) => r.id === target.roomId);
    if (!room) return false;

    const newWidth = Math.max(1, Math.min(6, Math.round(widthGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: newWidth, height: target.height };
    const autoWalls = generateWallsForRooms(rooms) as unknown as WallItem[];

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls, id)) return false;

    set({
      rooms: rooms.map((r) =>
        r.id === room.id
          ? {
              ...r,
              furniture: r.furniture.map((f) => (f.id === id ? { ...f, width: newWidth } : f)),
            }
          : r
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  updateFurnitureHeight: (id: string, heightGrids: number) => {
    const rooms = get().rooms;
    const allFurniture = collectAllFurniture(rooms);
    const target = allFurniture.find((f) => f.id === id);
    if (!target) return false;

    const room = rooms.find((r) => r.id === target.roomId);
    if (!room) return false;

    const newHeight = Math.max(1, Math.min(6, Math.round(heightGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: target.width, height: newHeight };
    const autoWalls = generateWallsForRooms(rooms) as unknown as WallItem[];

    if (!canPlaceFurnitureInRoom(candidate, room, allFurniture, autoWalls, id)) return false;

    set({
      rooms: rooms.map((r) =>
        r.id === room.id
          ? {
              ...r,
              furniture: r.furniture.map((f) => (f.id === id ? { ...f, height: newHeight } : f)),
            }
          : r
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  updateFurnitureColor: (id: string, color: string) => {
    const rooms = get().rooms;
    const target = collectAllFurniture(rooms).find((f) => f.id === id);
    if (!target) return;
    set({
      rooms: rooms.map((r) =>
        r.id === target.roomId
          ? { ...r, furniture: r.furniture.map((f) => (f.id === id ? { ...f, color } : f)) }
          : r
      ),
    });
    get().syncRoomFurniture();
  },

  updateFurnitureLabel: (id: string, label: string) => {
    const rooms = get().rooms;
    const target = collectAllFurniture(rooms).find((f) => f.id === id);
    if (!target) return;
    set({
      rooms: rooms.map((r) =>
        r.id === target.roomId
          ? { ...r, furniture: r.furniture.map((f) => (f.id === id ? { ...f, label } : f)) }
          : r
      ),
    });
    get().syncRoomFurniture();
  },

  addWindow: (roomId, x, y, width, height, wallOrientation, wallOffset, windowWidth, windowHeight) => {
    const rooms = get().rooms;
    const room = rooms.find((r) => r.id === roomId);
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
      rooms: rooms.map((r) =>
        r.id === roomId ? { ...r, windows: [...r.windows, newWindow] } : r
      ),
      selectedWindowId: newWindow.id,
      selectedRoomId: roomId,
    });
    return true;
  },

  removeWindow: (windowId) => {
    const rooms = get().rooms;
    const targetRoom = rooms.find((r) => r.windows.some((w) => w.id === windowId));
    if (!targetRoom) return;
    set({
      rooms: rooms.map((r) =>
        r.id === targetRoom.id
          ? {
              ...r,
              windows: r.windows.filter((w) => w.id !== windowId),
              curtains: r.curtains.filter((c) => c.windowId !== windowId),
            }
          : r
      ),
      selectedWindowId: get().selectedWindowId === windowId ? null : get().selectedWindowId,
      selectedCurtainId: get().getAllCurtains().find((c) => c.windowId === windowId)?.id === get().selectedCurtainId
        ? null
        : get().selectedCurtainId,
    });
  },

  selectWindow: (id) => {
    set({ selectedWindowId: id, selectedId: null, selectedCurtainId: null });
  },

  addCurtain: (windowId, roomId) => {
    const rooms = get().rooms;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;
    if (room.curtains.some((c) => c.windowId === windowId)) return false;

    const newCurtain: CurtainItem = {
      id: generateId('curtain'),
      windowId,
      roomId,
      isOpen: false,
    };

    set({
      rooms: rooms.map((r) =>
        r.id === roomId ? { ...r, curtains: [...r.curtains, newCurtain] } : r
      ),
      selectedCurtainId: newCurtain.id,
    });
    return true;
  },

  removeCurtain: (curtainId) => {
    const rooms = get().rooms;
    const targetRoom = rooms.find((r) => r.curtains.some((c) => c.id === curtainId));
    if (!targetRoom) return;
    set({
      rooms: rooms.map((r) =>
        r.id === targetRoom.id ? { ...r, curtains: r.curtains.filter((c) => c.id !== curtainId) } : r
      ),
      selectedCurtainId: get().selectedCurtainId === curtainId ? null : get().selectedCurtainId,
    });
  },

  toggleCurtain: (curtainId) => {
    const rooms = get().rooms;
    const targetRoom = rooms.find((r) => r.curtains.some((c) => c.id === curtainId));
    if (!targetRoom) return;
    set({
      rooms: rooms.map((r) =>
        r.id === targetRoom.id
          ? {
              ...r,
              curtains: r.curtains.map((c) =>
                c.id === curtainId ? { ...c, isOpen: !c.isOpen } : c
              ),
            }
          : r
      ),
    });
  },

  selectCurtain: (id) => {
    set({ selectedCurtainId: id, selectedId: null, selectedWindowId: null });
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
    const rooms = get().rooms;
    set({
      rooms: rooms.map((r) => ({ ...r, furniture: [] })),
      selectedId: null,
    });
    get().syncRoomFurniture();
  },

  saveLayout: () => {
    const { rooms, currentRoomId, customCatalog, viewMode } = get();
    const state: PersistedState = {
      rooms,
      currentRoomId,
      customCatalog,
      viewMode,
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
        }));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        const rooms = parsed.rooms && parsed.rooms.length > 0
          ? normalizeRooms(parsed.rooms as Room[])
          : getDefaultRooms();
        const currentRoomId = parsed.currentRoomId && rooms.some((r) => r.id === parsed.currentRoomId)
          ? parsed.currentRoomId
          : rooms[0].id;
        const currentRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0];
        set({
          rooms,
          currentRoomId,
          furniture: collectAllFurniture(rooms),
          selectedRoomId: currentRoom.id,
          selectedWindowId: null,
          selectedCurtainId: null,
          roomWidthGrids: currentRoom.widthGrids,
          roomHeightGrids: currentRoom.heightGrids,
          customCatalog: parsed.customCatalog ?? {},
          viewMode: parsed.viewMode ?? '2d',
          selectedId: null,
          drawMode: 'none',
        });
      } else {
        const rooms = getDefaultRooms();
        const firstRoom = rooms[0];
        set({
          rooms,
          currentRoomId: firstRoom.id,
          furniture: collectAllFurniture(rooms),
          selectedRoomId: firstRoom.id,
          selectedWindowId: null,
          selectedCurtainId: null,
          roomWidthGrids: firstRoom.widthGrids,
          roomHeightGrids: firstRoom.heightGrids,
          customCatalog: {},
          viewMode: '2d',
          selectedId: null,
          drawMode: 'none',
        });
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
      const rooms = getDefaultRooms();
      const firstRoom = rooms[0];
      set({
        rooms,
        currentRoomId: firstRoom.id,
        furniture: collectAllFurniture(rooms),
        selectedRoomId: firstRoom.id,
        selectedWindowId: null,
        selectedCurtainId: null,
        roomWidthGrids: firstRoom.widthGrids,
        roomHeightGrids: firstRoom.heightGrids,
        customCatalog: {},
        viewMode: '2d',
        selectedId: null,
        drawMode: 'none',
      });
    }
  },

  switchRoom: (roomId: string) => {
    const { rooms } = get();
    if (!rooms.some((r) => r.id === roomId)) return;
    const room = rooms.find((r) => r.id === roomId)!;
    set({
      currentRoomId: roomId,
      selectedRoomId: roomId,
      roomWidthGrids: room.widthGrids,
      roomHeightGrids: room.heightGrids,
      selectedId: null,
    });
  },

  selectRoom: (roomId: string | null) => {
    if (!roomId) {
      set({ selectedRoomId: null });
      return;
    }
    const room = get().rooms.find((r) => r.id === roomId);
    if (room) {
      set({
        selectedRoomId: roomId,
        currentRoomId: roomId,
        roomWidthGrids: room.widthGrids,
        roomHeightGrids: room.heightGrids,
      });
    }
  },

  addRoom: (name?: string, x?: number, y?: number, widthGrids?: number, heightGrids?: number) => {
    const rooms = get().rooms;
    const w = widthGrids ?? DEFAULT_ROOM_WIDTH_GRIDS;
    const h = heightGrids ?? DEFAULT_ROOM_HEIGHT_GRIDS;

    let placedX = x;
    let placedY = y;
    if (placedX === undefined || placedY === undefined) {
      outer: for (let gy = 0; gy <= CANVAS_HEIGHT_GRIDS - h; gy += 2) {
        for (let gx = 0; gx <= CANVAS_WIDTH_GRIDS - w; gx += 2) {
          if (canPlaceRoom({ x: gx, y: gy, widthGrids: w, heightGrids: h }, rooms, undefined, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) {
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
    const usedNames = new Set(rooms.map((r) => r.name));
    let autoName = name?.trim() || '';
    if (!autoName) {
      for (const n of roomNames) {
        if (!usedNames.has(n)) {
          autoName = n;
          break;
        }
      }
      if (!autoName) autoName = `房间 ${rooms.length + 1}`;
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
    };

    if (!canPlaceRoom({ x: newRoom.x, y: newRoom.y, widthGrids: newRoom.widthGrids, heightGrids: newRoom.heightGrids }, rooms, undefined, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) {
      return;
    }

    set({
      rooms: [...rooms, newRoom],
      currentRoomId: newRoom.id,
      selectedRoomId: newRoom.id,
      roomWidthGrids: newRoom.widthGrids,
      roomHeightGrids: newRoom.heightGrids,
      selectedId: null,
      drawMode: 'none',
    });
    get().syncRoomFurniture();
  },

  removeRoom: (roomId: string) => {
    const { rooms } = get();
    if (rooms.length <= 1) return;
    const remaining = rooms.filter((r) => r.id !== roomId);
    const { currentRoomId } = get();
    const newCurrentId = currentRoomId === roomId
      ? remaining[0].id
      : currentRoomId;
    const newCurrent = remaining.find((r) => r.id === newCurrentId) || remaining[0];
    set({
      rooms: remaining,
      currentRoomId: newCurrentId,
      selectedRoomId: newCurrentId,
      roomWidthGrids: newCurrent.widthGrids,
      roomHeightGrids: newCurrent.heightGrids,
      selectedId: null,
      drawMode: 'none',
    });
    get().syncRoomFurniture();
  },

  renameRoom: (roomId: string, name: string) => {
    set({
      rooms: get().rooms.map((r) =>
        r.id === roomId ? { ...r, name: name.trim() || r.name } : r
      ),
    });
  },

  moveRoom: (roomId: string, xGrids: number, yGrids: number) => {
    const rooms = get().rooms;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const candidate = { x: xGrids, y: yGrids, widthGrids: room.widthGrids, heightGrids: room.heightGrids };
    if (!canPlaceRoom(candidate, rooms, roomId, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) return false;

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

    set({
      rooms: rooms.map((r) =>
        r.id === roomId ? { ...r, x: xGrids, y: yGrids, furniture: adjustedFurniture } : r
      ),
    });
    get().syncRoomFurniture();
    return true;
  },

  resizeRoom: (roomId: string, widthGrids: number, heightGrids: number) => {
    const rooms = get().rooms;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const w = clampRoomGrids(widthGrids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);
    const h = clampRoomGrids(heightGrids, MIN_ROOM_GRIDS, MAX_ROOM_GRIDS);

    const candidate = { x: room.x, y: room.y, widthGrids: w, heightGrids: h };
    if (!canPlaceRoom(candidate, rooms, roomId, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS)) return false;

    const rx = room.x * GRID_SIZE;
    const ry = room.y * GRID_SIZE;
    const rw = w * GRID_SIZE;
    const rh = h * GRID_SIZE;

    const adjustedFurniture = room.furniture.filter((f) => {
      return f.x >= rx && f.y >= ry && f.x + f.width <= rx + rw && f.y + f.height <= ry + rh;
    });

    set({
      rooms: rooms.map((r) =>
        r.id === roomId
          ? { ...r, widthGrids: w, heightGrids: h, roomWidthGrids: w, roomHeightGrids: h, furniture: adjustedFurniture }
          : r
      ),
      roomWidthGrids: get().currentRoomId === roomId ? w : get().roomWidthGrids,
      roomHeightGrids: get().currentRoomId === roomId ? h : get().roomHeightGrids,
    });
    get().syncRoomFurniture();
    return true;
  },

  clearRoomFurniture: (roomId: string) => {
    const rooms = get().rooms;
    set({
      rooms: rooms.map((r) =>
        r.id === roomId ? { ...r, furniture: [] } : r
      ),
      selectedId: get().selectedId && rooms.find((r) => r.id === roomId)?.furniture.some((f) => f.id === get().selectedId)
        ? null
        : get().selectedId,
    });
    get().syncRoomFurniture();
  },

  applySmartLayout: (roomId: string, mode: 'clear' | 'preserve') => {
    const rooms = get().rooms;
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return 0;

    const clearExisting = mode === 'clear';
    const placements = generateSmartLayout(room, room.furniture, rooms, { clearExisting });

    const newFurniture = clearExisting ? [] : [...room.furniture];
    let placedCount = 0;

    for (const p of placements) {
      const catalog = get().getCatalogEntry(p.type);
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
      rooms: rooms.map((r) =>
        r.id === roomId ? { ...r, furniture: newFurniture } : r
      ),
      selectedRoomId: roomId,
      currentRoomId: roomId,
      selectedId: null,
    });
    get().syncRoomFurniture();
    return placedCount;
  },
}));
