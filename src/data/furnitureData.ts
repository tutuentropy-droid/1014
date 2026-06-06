import type { FurnitureType } from '@/types/furniture';

export const ROOM_WIDTH = 800;
export const ROOM_HEIGHT = 600;
export const GRID_SIZE = 40;

export const FURNITURE_CATALOG: Record<
  FurnitureType,
  {
    label: string;
    width: number;
    height: number;
    color: string;
    color3D: number;
    depth: number;
  }
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
