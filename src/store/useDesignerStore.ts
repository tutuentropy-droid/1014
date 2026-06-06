import { create } from 'zustand';
import type { FurnitureItem, ViewMode, FurnitureType } from '@/types/furniture';
import { FURNITURE_CATALOG, ROOM_WIDTH, ROOM_HEIGHT } from '@/data/furnitureData';

interface DesignState {
  furniture: FurnitureItem[];
  selectedId: string | null;
  viewMode: ViewMode;
  addFurniture: (type: FurnitureType, x: number, y: number) => boolean;
  moveFurniture: (id: string, x: number, y: number) => boolean;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  clearAll: () => void;
  saveLayout: () => void;
  loadLayout: () => void;
}

const STORAGE_KEY = 'interior-designer-layout';

let furnitureCounter = 0;
const generateId = () => {
  furnitureCounter += 1;
  return `furniture-${Date.now()}-${furnitureCounter}`;
};

const aabbOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

const checkPlacementValid = (
  candidate: { x: number; y: number; width: number; height: number },
  existing: FurnitureItem[],
  ignoreId?: string
) => {
  if (candidate.x < 0 || candidate.y < 0) return false;
  if (candidate.x + candidate.width > ROOM_WIDTH) return false;
  if (candidate.y + candidate.height > ROOM_HEIGHT) return false;
  for (const item of existing) {
    if (ignoreId && item.id === ignoreId) continue;
    if (aabbOverlap(candidate, item)) return false;
  }
  return true;
};

export const useDesignerStore = create<DesignState>((set, get) => ({
  furniture: [],
  selectedId: null,
  viewMode: '2d',

  addFurniture: (type: FurnitureType, x: number, y: number) => {
    const catalog = FURNITURE_CATALOG[type];
    const candidate = {
      x,
      y,
      width: catalog.width,
      height: catalog.height,
    };
    const { furniture } = get();
    if (!checkPlacementValid(candidate, furniture)) return false;
    const item: FurnitureItem = {
      id: generateId(),
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
    const { furniture } = get();
    const target = furniture.find((f) => f.id === id);
    if (!target) return false;
    const candidate = { x, y, width: target.width, height: target.height };
    if (!checkPlacementValid(candidate, furniture, id)) return false;
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

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  clearAll: () => set({ furniture: [], selectedId: null }),

  saveLayout: () => {
    const { furniture } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(furniture));
  },

  loadLayout: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FurnitureItem[];
        set({ furniture: parsed, selectedId: null });
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
    }
  },
}));
