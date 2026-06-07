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
export type DrawMode = 'none' | 'wall' | 'room' | 'window' | 'curtain';

export type WallOrientation = 'top' | 'bottom' | 'left' | 'right';

export interface WindowItem {
  id: string;
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  wallOrientation: WallOrientation;
  wallOffset: number;
  windowWidth: number;
  windowHeight: number;
}

export interface CurtainItem {
  id: string;
  windowId: string;
  roomId: string;
  isOpen: boolean;
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  widthGrids: number;
  heightGrids: number;
  color: string;
  furniture: FurnitureItem[];
  windows: WindowItem[];
  curtains: CurtainItem[];
  roomWidthGrids: number;
  roomHeightGrids: number;
}
