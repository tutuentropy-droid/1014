import type { DefaultFurnitureType, CustomFurnitureCatalogEntry } from '@/types/furniture';

export const GRID_SIZE = 40;

export const DEFAULT_ROOM_WIDTH_GRIDS = 20;
export const DEFAULT_ROOM_HEIGHT_GRIDS = 15;
export const MIN_ROOM_GRIDS = 8;
export const MAX_ROOM_GRIDS = 30;

export const DEFAULT_FURNITURE_WIDTH_GRIDS = 2;
export const DEFAULT_FURNITURE_HEIGHT_GRIDS = 2;
export const MIN_FURNITURE_GRIDS = 1;
export const MAX_FURNITURE_GRIDS = 3;

export const computeRoomWidth = (grids: number) => grids * GRID_SIZE;
export const computeRoomHeight = (grids: number) => grids * GRID_SIZE;

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
    width: 200,
    height: 80,
    color: '#8B6F5C',
    color3D: 0x8b6f5c,
    depth: 70,
  },
  table: {
    label: '桌子',
    width: 120,
    height: 80,
    color: '#A67B5B',
    color3D: 0xa67b5b,
    depth: 75,
  },
  plant: {
    label: '植物',
    width: 50,
    height: 50,
    color: '#6B8E6B',
    color3D: 0x6b8e6b,
    depth: 90,
  },
};

export const DEFAULT_FURNITURE_TYPES: DefaultFurnitureType[] = ['bed', 'sofa', 'table', 'plant'];
