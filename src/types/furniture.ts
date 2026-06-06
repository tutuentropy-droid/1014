export type FurnitureType = 'bed' | 'sofa' | 'table' | 'plant';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
}

export type ViewMode = '2d' | '3d';
