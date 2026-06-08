export type DefaultFurnitureType = 'bed' | 'sofa' | 'table' | 'plant' | 'tvcabinet' | 'wardrobe' | 'bookshelf' | 'chair';
export type FurnitureType = DefaultFurnitureType | string;

export type FurnitureIconStyle = 'default' | 'modern' | 'classic' | 'minimal' | 'vintage';
export type FurniturePattern =
  | 'solid'
  | 'striped'
  | 'checkered'
  | 'gradient'
  | 'woodGrain'
  | 'fabricWeave'
  | 'metalBrushed'
  | 'leather'
  | 'marble'
  | 'stoneTile'
  | 'wallpaperFloral'
  | 'wallpaperStripe'
  | 'wallpaperDamask'
  | 'wallpaperDot'
  | 'wallpaperVine'
  | 'ceramicTile'
  | 'carpet'
  | 'checkerboard'
  | 'none';
export type FurnitureTexture = 'woodGrain' | 'fabricWeave' | 'metalBrushed' | 'leather' | 'marble';

export interface StaircaseArea {
  x: number;
  y: number;
  widthGrids: number;
  heightGrids: number;
}

export interface FurnitureStyleVariant {
  id: string;
  label: string;
  color: string;
  color3D: number;
  accentColor?: string;
  accentColor3D?: number;
  width?: number;
  height?: number;
  depth?: number;
  iconStyle?: FurnitureIconStyle;
  pattern?: FurniturePattern;
  texture?: FurnitureTexture;
  roughness?: number;
  metalness?: number;
  scale3D?: number;
}

export interface FurnitureCatalogEntry {
  label: string;
  width: number;
  height: number;
  color: string;
  color3D: number;
  depth: number;
  variants?: FurnitureStyleVariant[];
  defaultVariantId?: string;
}

export interface CustomFurnitureCatalogEntry extends FurnitureCatalogEntry {
  iconUrl?: string;
  modelUrl?: string;
  isCustom?: boolean;
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
  variantId?: string;
  roomId?: string;
  materialId?: string;
}

export interface WallItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  roomId?: string;
}

export type WindowOrientation = 'left' | 'right' | 'top' | 'bottom';

export interface WindowItem {
  id: string;
  wallId: string;
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  wallOrientation: WindowOrientation;
  windowWidth: number;
  windowHeight: number;
}

export interface CurtainItem {
  id: string;
  windowId: string;
  roomId: string;
  isOpen: boolean;
}

export type WallOrientation = 'horizontal' | 'vertical' | 'left' | 'right' | 'top' | 'bottom';

export interface Floor {
  id: string;
  level: number;
  name: string;
  rooms: Room[];
  staircaseArea?: StaircaseArea;
}

export interface FurniturePositionSnapshot {
  id: string;
  x: number;
  y: number;
}

export interface MaterialPreset {
  id: string;
  name?: string;
  label: string;
  category: MaterialCategory;
  color?: string;
  color3D?: number;
  roughness?: number;
  metalness?: number;
  texture?: FurnitureTexture;
  pattern?: FurniturePattern;
}

export interface SelectedWall {
  roomId: string;
  orientation: 'left' | 'right' | 'top' | 'bottom';
}

export interface MaterialKnowledge {
  id: string;
  category: MaterialCategory;
  name: string;
  label: string;
  color?: string;
  description: string;
  features: string[];
  pros: string[];
  cons: string[];
  suitableFor: string[];
  tips?: string[];
  maintenanceTips?: string[];
  priceRange: string;
  priceLevel: 1 | 2 | 3 | 4 | 5;
  durability: 1 | 2 | 3 | 4 | 5;
  maintenance: 1 | 2 | 3 | 4 | 5;
  ecoFriendly: boolean;
  relatedMaterials: string[];
}

export type MaterialCategory = 'wood' | 'fabric' | 'metal' | 'leather' | 'stone' | 'marble' | 'wallpaper';

export interface FloorStylePreset {
  id: FloorStyleId;
  label: string;
  color: string;
  secondaryColor: string;
  roughness: number;
  metalness: number;
  pattern: 'wood' | 'tile' | 'marble' | 'concrete' | 'carpet' | 'woodGrain' | 'ceramicTile' | 'checkerboard' | 'stoneTile';
  repeat?: number;
  description?: string;
}

export type FloorStyleId =
  | 'lightWood'
  | 'darkWood'
  | 'grayWood'
  | 'whiteMarble'
  | 'grayMarble'
  | 'beigeTile'
  | 'grayTile'
  | 'concrete'
  | 'creamCarpet'
  | 'grayCarpet'
  | 'whiteTile'
  | 'checkerboard'
  | 'marbleTile'
  | 'beigeCarpet';

export type ViewMode = '2d' | '3d';
export type DrawMode = 'none' | 'wall' | 'window' | 'curtain';

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  widthGrids: number;
  heightGrids: number;
  furniture: FurnitureItem[];
  walls: WallItem[];
  windows?: WindowItem[];
  curtains?: CurtainItem[];
  roomWidthGrids: number;
  roomHeightGrids: number;
  wallMaterials?: Partial<Record<WindowOrientation, string>>;
  staircaseArea?: StaircaseArea;
}
