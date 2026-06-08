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

export type MaterialCategory = 'wood' | 'fabric' | 'metal' | 'stone' | 'wallpaper';

export interface MaterialProsCons {
  pros: string[];
  cons: string[];
}

export interface MaterialKnowledge {
  id: string;
  category: MaterialCategory;
  name: string;
  label: string;
  description: string;
  features: string[];
  pros: string[];
  cons: string[];
  priceRange: string;
  priceLevel: 1 | 2 | 3 | 4 | 5;
  durability: 1 | 2 | 3 | 4 | 5;
  maintenance: 1 | 2 | 3 | 4 | 5;
  ecoFriendly?: boolean;
  suitableFor: string[];
  tips?: string[];
  relatedMaterials?: string[];
  color?: string;
}

export interface MaterialPreset {
  id: string;
  category: MaterialCategory;
  label: string;
  color: string;
  roughness: number;
  metalness: number;
  pattern?:
    | 'woodGrain'
    | 'fabricWeave'
    | 'metalBrushed'
    | 'stoneTile'
    | 'wallpaperFloral'
    | 'wallpaperStripe'
    | 'wallpaperDamask'
    | 'wallpaperDot'
    | 'wallpaperVine'
    | 'checkerboard'
    | 'ceramicTile'
    | 'carpet'
    | 'none';
}

export type FloorStyleId =
  | 'lightWood'
  | 'darkWood'
  | 'whiteTile'
  | 'grayCarpet'
  | 'checkerboard'
  | 'marbleTile'
  | 'beigeCarpet';

export interface FloorStylePreset {
  id: FloorStyleId;
  label: string;
  color: string;
  secondaryColor?: string;
  roughness: number;
  metalness: number;
  pattern: 'woodGrain' | 'ceramicTile' | 'carpet' | 'checkerboard' | 'stoneTile';
  repeat?: number;
}

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
  materialId?: string;
}

export interface WallMaterialOverride {
  roomId: string;
  orientation: WallOrientation;
  materialId: string;
}

export interface SelectedWall {
  roomId: string;
  orientation: WallOrientation;
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
  wallMaterials?: Partial<Record<WallOrientation, string>>;
}

export interface StaircaseArea {
  x: number;
  y: number;
  widthGrids: number;
  heightGrids: number;
}

export interface Floor {
  id: string;
  level: number;
  rooms: Room[];
  staircaseArea: StaircaseArea | null;
  floorStyleId?: FloorStyleId;
}

export interface FurniturePositionSnapshot {
  id: string;
  x: number;
  y: number;
}
