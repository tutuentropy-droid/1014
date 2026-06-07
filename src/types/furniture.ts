export type DefaultFurnitureType =
  | 'bed'
  | 'sofa'
  | 'table'
  | 'chair'
  | 'plant'
  | 'tvcabinet'
  | 'wardrobe'
  | 'bookshelf';

export type FurnitureType = DefaultFurnitureType | string;

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  roomId: string;
}

export interface WallItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CustomFurnitureCatalogEntry {
  label: string;
  width: number;
  height: number;
  color: string;
  color3D: number;
  depth: number;
  iconUrl?: string;
  modelUrl?: string;
  isCustom?: boolean;
}

export type ViewMode = '2d' | '3d';
export type DrawMode = 'none' | 'wall' | 'room';

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  widthGrids: number;
  heightGrids: number;
  color: string;
  furniture: FurnitureItem[];
  roomWidthGrids: number;
  roomHeightGrids: number;
}
