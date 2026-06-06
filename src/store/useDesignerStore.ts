import { create } from 'zustand';
import type {
  FurnitureItem,
  ViewMode,
  FurnitureType,
  WallItem,
  DrawMode,
  CustomFurnitureCatalogEntry,
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
  furniture: FurnitureItem[];
  walls: WallItem[];
  roomWidthGrids: number;
  roomHeightGrids: number;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;
}

interface DesignState {
  furniture: FurnitureItem[];
  walls: WallItem[];
  selectedId: string | null;
  viewMode: ViewMode;
  drawMode: DrawMode;
  roomWidthGrids: number;
  roomHeightGrids: number;
  customCatalog: Record<string, CustomFurnitureCatalogEntry>;

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
}

const STORAGE_KEY = 'interior-designer-layout-v2';

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

export const useDesignerStore = create<DesignState>((set, get) => ({
  furniture: [],
  walls: [],
  selectedId: null,
  viewMode: '2d',
  drawMode: 'none',
  roomWidthGrids: DEFAULT_ROOM_WIDTH_GRIDS,
  roomHeightGrids: DEFAULT_ROOM_HEIGHT_GRIDS,
  customCatalog: {},

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

  setRoomWidthGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, 8, 30);
    set({ roomWidthGrids: clamped });
  },

  setRoomHeightGrids: (grids: number) => {
    const clamped = clampRoomGrids(grids, 8, 30);
    set({ roomHeightGrids: clamped });
  },

  setDrawMode: (mode: DrawMode) => set({ drawMode: mode }),

  addWall: (x: number, y: number, width: number, height: number) => {
    const { walls, furniture } = get();
    const roomW = get().getRoomWidth();
    const roomH = get().getRoomHeight();
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
    return true;
  },

  removeWall: (id: string) => {
    set({ walls: get().walls.filter((w) => w.id !== id) });
  },

  clearWalls: () => set({ walls: [] }),

  addFurniture: (type: FurnitureType, x: number, y: number) => {
    const catalog = get().getCatalogEntry(type);
    const candidate = {
      x,
      y,
      width: catalog.width,
      height: catalog.height,
    };
    const { furniture, walls } = get();
    const roomW = get().getRoomWidth();
    const roomH = get().getRoomHeight();
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
    return true;
  },

  moveFurniture: (id: string, x: number, y: number) => {
    const { furniture, walls } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const candidate = { x, y, width: target.width, height: target.height };
    const roomW = get().getRoomWidth();
    const roomH = get().getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, id, roomW, roomH)) return false;
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, x, y } : f)),
    });
    return true;
  },

  removeFurniture: (id: string) => {
    const { furniture, selectedId } = get();
    set({
      furniture: furniture.filter((f) => f.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  selectFurniture: (id: string | null) => set({ selectedId: id }),

  updateFurnitureWidth: (id: string, widthGrids: number) => {
    const { furniture, walls } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const newWidth = Math.max(1, Math.min(3, Math.round(widthGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: newWidth, height: target.height };
    const roomW = get().getRoomWidth();
    const roomH = get().getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, id, roomW, roomH)) return false;
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, width: newWidth } : f)),
    });
    return true;
  },

  updateFurnitureHeight: (id: string, heightGrids: number) => {
    const { furniture, walls } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const newHeight = Math.max(1, Math.min(3, Math.round(heightGrids))) * GRID_SIZE;
    const candidate = { x: target.x, y: target.y, width: target.width, height: newHeight };
    const roomW = get().getRoomWidth();
    const roomH = get().getRoomHeight();
    if (!canPlaceAt(candidate, furniture, walls, id, roomW, roomH)) return false;
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, height: newHeight } : f)),
    });
    return true;
  },

  updateFurnitureColor: (id: string, color: string) => {
    set({
      furniture: get().furniture.map((f) => (f.id === id ? { ...f, color } : f)),
    });
  },

  updateFurnitureLabel: (id: string, label: string) => {
    set({
      furniture: get().furniture.map((f) => (f.id === id ? { ...f, label } : f)),
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

  clearAll: () => set({ furniture: [], walls: [], selectedId: null }),

  saveLayout: () => {
    const { furniture, walls, roomWidthGrids, roomHeightGrids, customCatalog } = get();
    const state: PersistedState = {
      furniture,
      walls,
      roomWidthGrids,
      roomHeightGrids,
      customCatalog,
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
        set({
          furniture: parsed.furniture ?? [],
          walls: parsed.walls ?? [],
          roomWidthGrids: parsed.roomWidthGrids ?? DEFAULT_ROOM_WIDTH_GRIDS,
          roomHeightGrids: parsed.roomHeightGrids ?? DEFAULT_ROOM_HEIGHT_GRIDS,
          customCatalog: parsed.customCatalog ?? {},
          selectedId: null,
        });
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
    }
  },
}));
