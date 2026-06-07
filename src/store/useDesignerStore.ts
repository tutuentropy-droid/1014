import { create } from 'zustand';
import type {
  FurnitureItem,
  ViewMode,
  FurnitureType,
  WallItem,
  DrawMode,
  CustomFurnitureCatalogEntry,
  Room,
} from '@/types/furniture';
import {
  FURNITURE_CATALOG,
  DEFAULT_ROOM_WIDTH_GRIDS,
  DEFAULT_ROOM_HEIGHT_GRIDS,
  computeRoomWidth,
  computeRoomHeight,
  GRID_SIZE,
} from '@/data/furnitureData';
import { canPlaceAt, aabbOverlap } from '@/utils/collision';

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
  roomWidthGrids: number;
  roomHeightGrids: number;
  selectedId: string | null;
  viewMode: ViewMode;
  drawMode: DrawMode;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;

  getCurrentRoom: () => Room | undefined;
  getRoomWidth: () => number;
  getRoomHeight: () => number;
  getCatalogEntry: (type: FurnitureType) => CustomFurnitureCatalogEntry;
  getAllFurnitureTypes: () => FurnitureType[];

  setRoomWidthGrids: (grids: number) => void;
  setRoomHeightGrids: (grids: number) => void;

  setDrawMode: (mode: DrawMode) => void;
  addWall: (x: number, y: number, width: number, height: number) => boolean;
  removeWall: (id: string) => void;
  clearWalls: () => void;

  addFurniture: (type: FurnitureType, x: number, y: number) => boolean;
  moveFurniture: (id: string, x: number, y: number) => boolean;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;

  updateFurnitureWidth: (id: string, widthGrids: number) => boolean;
  updateFurnitureHeight: (id: string, heightGrids: number) => boolean;
  updateFurnitureColor: (id: string, color: string) => void;
  updateFurnitureLabel: (id: string, label: string) => void;

  addCustomFurnitureType: (
    typeId: string,
    entry: CustomFurnitureCatalogEntry
  ) => void;

  setViewMode: (mode: ViewMode) => void;
  clearAll: () => void;
  saveLayout: () => void;
  loadLayout: () => void;

  switchRoom: (roomId: string) => void;
  addRoom: (name: string) => void;
  removeRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;

  syncRoomToState: (roomId: string) => void;
  syncStateToRoom: () => void;
}

const STORAGE_KEY = 'interior-designer-layout-v3';

let furnitureCounter = 0;
const generateId = (prefix: string) => {
  furnitureCounter += 1;
  return `${prefix}-${Date.now()}-${furnitureCounter}`;
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

const createDefaultRoom = (id: string, name: string): Room => ({
  id,
  name,
  furniture: [],
  walls: [],
  roomWidthGrids: DEFAULT_ROOM_WIDTH_GRIDS,
  roomHeightGrids: DEFAULT_ROOM_HEIGHT_GRIDS,
});

const getDefaultRooms = (): Room[] => {
  const livingId = generateId('room');
  const bedroomId = generateId('room');
  const kitchenId = generateId('room');
  return [
    createDefaultRoom(livingId, '客厅'),
    createDefaultRoom(bedroomId, '卧室'),
    createDefaultRoom(kitchenId, '厨房'),
  ];
};

export const useDesignerStore = create<DesignState>((set, get) => ({
  rooms: [],
  currentRoomId: '',
  furniture: [],
  walls: [],
  roomWidthGrids: DEFAULT_ROOM_WIDTH_GRIDS,
  roomHeightGrids: DEFAULT_ROOM_HEIGHT_GRIDS,
  selectedId: null,
  viewMode: '2d',
  drawMode: 'none',
  customCatalog: {},

  getCurrentRoom: () => {
    const { rooms, currentRoomId } = get();
    return rooms.find((r) => r.id === currentRoomId);
  },

  getRoomWidth: () => computeRoomWidth(get().roomWidthGrids),
  getRoomHeight: () => computeRoomHeight(get().roomHeightGrids),

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
    const defaults: FurnitureType[] = ['bed', 'sofa', 'table', 'plant'];
    return [...defaults, ...Object.keys(customCatalog)];
  },

  syncRoomToState: (roomId: string) => {
    const room = get().rooms.find((r) => r.id === roomId);
    if (room) {
      set({
        currentRoomId: room.id,
        furniture: room.furniture,
        walls: room.walls,
        roomWidthGrids: room.roomWidthGrids,
        roomHeightGrids: room.roomHeightGrids,
        selectedId: null,
        drawMode: 'none',
      });
    }
  },

  syncStateToRoom: () => {
    const { currentRoomId, furniture, walls, roomWidthGrids, roomHeightGrids, rooms } = get();
    set({
      rooms: rooms.map((r) =>
        r.id === currentRoomId
          ? { ...r, furniture, walls, roomWidthGrids, roomHeightGrids }
          : r
      ),
    });
  },

  setRoomWidthGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, 8, 30);
    set({ roomWidthGrids: clamped });
    get().syncStateToRoom();
  },

  setRoomHeightGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, 8, 30);
    set({ roomHeightGrids: clamped });
    get().syncStateToRoom();
  },

  setDrawMode: (mode: DrawMode) => set({ drawMode: mode }),

  addWall: (x: number, y: number, width: number, height: number) => {
    const { walls, furniture, getRoomWidth, getRoomHeight } = get();
    const roomW = getRoomWidth();
    const roomH = getRoomHeight();
    if (width < GRID_SIZE / 2 || height < GRID_SIZE / 2) return false;
    if (x < 0 || y < 0) return false;
    if (x + width > roomW || y + height > roomH) return false;
    const rect = { x, y, width, height };
    for (const w of walls) {
      if (aabbOverlap(rect, w)) return false;
    }
    for (const f of furniture) {
      if (aabbOverlap(rect, f)) return false;
    }
    const wall: WallItem = {
      id: generateId('wall'),
      x,
      y,
      width,
      height,
    };
    set({ walls: [...walls, wall] });
    get().syncStateToRoom();
    return true;
  },

  removeWall: (id: string) => {
    set({ walls: get().walls.filter((w) => w.id !== id) });
    get().syncStateToRoom();
  },

  clearWalls: () => {
    set({ walls: [] });
    get().syncStateToRoom();
  },

  addFurniture: (type: FurnitureType, x: number, y: number) => {
    const catalog = get().getCatalogEntry(type);
    const candidate = {
      x,
      y,
      width: catalog.width,
      height: catalog.height,
    };
    const { furniture, walls, getRoomWidth, getRoomHeight } = get();
    const roomW = getRoomWidth();
    const roomH = getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, undefined, roomW, roomH)) return false;
    const item: FurnitureItem = {
      id: generateId('furniture'),
      type,
      x,
      y,
      width: catalog.width,
      height: catalog.height,
      color: catalog.color,
      label: catalog.label,
    };
    set({ furniture: [...furniture, item], selectedId: item.id });
    get().syncStateToRoom();
    return true;
  },

  moveFurniture: (id: string, x: number, y: number) => {
    const { furniture, walls, getRoomWidth, getRoomHeight } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const candidate = { x, y, width: target.width, height: target.height };
    const roomW = getRoomWidth();
    const roomH = getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, id, roomW, roomH)) return false;
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, x, y } : f)),
    });
    get().syncStateToRoom();
    return true;
  },

  removeFurniture: (id: string) => {
    const { furniture, selectedId } = get();
    set({
      furniture: furniture.filter((f) => f.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
    get().syncStateToRoom();
  },

  selectFurniture: (id: string | null) => set({ selectedId: id }),

  updateFurnitureWidth: (id: string, widthGrids: number) => {
    const { furniture, walls, getRoomWidth, getRoomHeight } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const newWidth = Math.max(1, Math.min(3, Math.round(widthGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: newWidth, height: target.height };
    const roomW = getRoomWidth();
    const roomH = getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, id, roomW, roomH)) return false;
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, width: newWidth } : f)),
    });
    get().syncStateToRoom();
    return true;
  },

  updateFurnitureHeight: (id: string, heightGrids: number) => {
    const { furniture, walls, getRoomWidth, getRoomHeight } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const newHeight = Math.max(1, Math.min(3, Math.round(heightGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: target.width, height: newHeight };
    const roomW = getRoomWidth();
    const roomH = getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, id, roomW, roomH)) return false;
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, height: newHeight } : f)),
    });
    get().syncStateToRoom();
    return true;
  },

  updateFurnitureColor: (id: string, color: string) => {
    set({
      furniture: get().furniture.map((f) => (f.id === id ? { ...f, color } : f)),
    });
    get().syncStateToRoom();
  },

  updateFurnitureLabel: (id: string, label: string) => {
    set({
      furniture: get().furniture.map((f) => (f.id === id ? { ...f, label } : f)),
    });
    get().syncStateToRoom();
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
    set({ furniture: [], walls: [], selectedId: null });
    get().syncStateToRoom();
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
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        const rooms = parsed.rooms && parsed.rooms.length > 0
          ? parsed.rooms
          : getDefaultRooms();
        const currentRoomId = parsed.currentRoomId && rooms.some((r) => r.id === parsed.currentRoomId)
          ? parsed.currentRoomId
          : rooms[0].id;
        const currentRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0];
        set({
          rooms,
          currentRoomId,
          furniture: currentRoom.furniture,
          walls: currentRoom.walls,
          roomWidthGrids: currentRoom.roomWidthGrids,
          roomHeightGrids: currentRoom.roomHeightGrids,
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
          furniture: firstRoom.furniture,
          walls: firstRoom.walls,
          roomWidthGrids: firstRoom.roomWidthGrids,
          roomHeightGrids: firstRoom.roomHeightGrids,
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
        furniture: firstRoom.furniture,
        walls: firstRoom.walls,
        roomWidthGrids: firstRoom.roomWidthGrids,
        roomHeightGrids: firstRoom.roomHeightGrids,
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
    get().syncRoomToState(roomId);
  },

  addRoom: (name: string) => {
    const newRoom: Room = {
      id: generateId('room'),
      name: name.trim() || '新房间',
      furniture: [],
      walls: [],
      roomWidthGrids: DEFAULT_ROOM_WIDTH_GRIDS,
      roomHeightGrids: DEFAULT_ROOM_HEIGHT_GRIDS,
    };
    set({
      rooms: [...get().rooms, newRoom],
      currentRoomId: newRoom.id,
      furniture: newRoom.furniture,
      walls: newRoom.walls,
      roomWidthGrids: newRoom.roomWidthGrids,
      roomHeightGrids: newRoom.roomHeightGrids,
      selectedId: null,
      drawMode: 'none',
    });
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
      furniture: newCurrent.furniture,
      walls: newCurrent.walls,
      roomWidthGrids: newCurrent.roomWidthGrids,
      roomHeightGrids: newCurrent.roomHeightGrids,
      selectedId: null,
      drawMode: 'none',
    });
  },

  renameRoom: (roomId: string, name: string) => {
    set({
      rooms: get().rooms.map((r) =>
        r.id === roomId ? { ...r, name: name.trim() || r.name } : r
      ),
    });
  },
}));
