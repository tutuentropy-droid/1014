import type { DefaultFurnitureType, CustomFurnitureCatalogEntry } from '@/types/furniture';

export const GRID_SIZE = 40;

export const DEFAULT_ROOM_WIDTH_GRIDS = 10;
export const DEFAULT_ROOM_HEIGHT_GRIDS = 8;
export const MIN_ROOM_GRIDS = 4;
export const MAX_ROOM_GRIDS = 30;

export const CANVAS_WIDTH_GRIDS = 60;
export const CANVAS_HEIGHT_GRIDS = 45;

export const DEFAULT_FURNITURE_WIDTH_GRIDS = 2;
export const DEFAULT_FURNITURE_HEIGHT_GRIDS = 2;
export const MIN_FURNITURE_GRIDS = 1;
export const MAX_FURNITURE_GRIDS = 6;

export const computeRoomWidth = (grids: number) => grids * GRID_SIZE;
export const computeRoomHeight = (grids: number) => grids * GRID_SIZE;
export const computeCanvasWidth = () => CANVAS_WIDTH_GRIDS * GRID_SIZE;
export const computeCanvasHeight = () => CANVAS_HEIGHT_GRIDS * GRID_SIZE;

export const ROOM_COLORS = [
  '#FEF3C7',
  '#DBEAFE',
  '#D1FAE5',
  '#FCE7F3',
  '#FED7AA',
  '#E0E7FF',
  '#FECACA',
  '#CFFAFE',
  '#F3E8FF',
  '#ECFCCB',
];

export const FURNITURE_CATALOG: Record<
  DefaultFurnitureType,
  CustomFurnitureCatalogEntry
> = {
  bed: {
    label: '床',
    width: 160,
    height: 200,
    color: '#B8A99A',
    color3D: 0xb8a99a,
    depth: 60,
  },
  sofa: {
    label: '沙发',
    width: 240,
    height: 90,
    color: '#8B6F5C',
    color3D: 0x8b6f5c,
    depth: 80,
  },
  table: {
    label: '桌子',
    width: 120,
    height: 80,
    color: '#A67B5B',
    color3D: 0xa67b5b,
    depth: 75,
  },
  chair: {
    label: '椅子',
    width: 50,
    height: 50,
    color: '#8B4513',
    color3D: 0x8b4513,
    depth: 90,
  },
  plant: {
    label: '植物',
    width: 50,
    height: 50,
    color: '#6B8E6B',
    color3D: 0x6b8e6b,
    depth: 90,
  },
  tvcabinet: {
    label: '电视柜',
    width: 180,
    height: 45,
    color: '#5D4E37',
    color3D: 0x5d4e37,
    depth: 55,
  },
  wardrobe: {
    label: '衣柜',
    width: 180,
    height: 60,
    color: '#6B4423',
    color3D: 0x6b4423,
    depth: 200,
  },
  bookshelf: {
    label: '书架',
    width: 120,
    height: 35,
    color: '#8B7355',
    color3D: 0x8b7355,
    depth: 180,
  },
};

export const DEFAULT_FURNITURE_TYPES: DefaultFurnitureType[] = [
  'bed',
  'sofa',
  'table',
  'chair',
  'plant',
  'tvcabinet',
  'wardrobe',
  'bookshelf',
];
