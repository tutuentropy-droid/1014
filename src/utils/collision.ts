import type { FurnitureItem, WallItem, Room } from '@/types/furniture';
import { GRID_SIZE } from '@/data/furnitureData';

export const aabbOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

export const canPlaceFurnitureInRoom = (
  candidate: { x: number; y: number; width: number; height: number },
  room: Room,
  allFurniture: FurnitureItem[],
  allWalls: WallItem[] = [],
  ignoreId?: string
): boolean => {
  const roomX = room.x * GRID_SIZE;
  const roomY = room.y * GRID_SIZE;
  const roomW = room.widthGrids * GRID_SIZE;
  const roomH = room.heightGrids * GRID_SIZE;

  if (candidate.x < roomX) return false;
  if (candidate.y < roomY) return false;
  if (candidate.x + candidate.width > roomX + roomW) return false;
  if (candidate.y + candidate.height > roomY + roomH) return false;

  for (const item of allFurniture) {
    if (ignoreId && item.id === ignoreId) continue;
    if (item.roomId !== room.id) continue;
    if (aabbOverlap(candidate, item)) return false;
  }

  for (const wall of allWalls) {
    if (aabbOverlap(candidate, wall)) return false;
  }

  return true;
};

export const canPlaceRoom = (
  candidate: { x: number; y: number; widthGrids: number; heightGrids: number },
  allRooms: Room[],
  ignoreId: string | undefined,
  canvasWidthGrids: number,
  canvasHeightGrids: number
): boolean => {
  if (candidate.x < 0 || candidate.y < 0) return false;
  if (candidate.x + candidate.widthGrids > canvasWidthGrids) return false;
  if (candidate.y + candidate.heightGrids > canvasHeightGrids) return false;

  const candidateRect = {
    x: candidate.x,
    y: candidate.y,
    width: candidate.widthGrids,
    height: candidate.heightGrids,
  };

  for (const room of allRooms) {
    if (ignoreId && room.id === ignoreId) continue;
    const roomRect = {
      x: room.x,
      y: room.y,
      width: room.widthGrids,
      height: room.heightGrids,
    };
    if (aabbOverlap(candidateRect, roomRect)) return false;
  }

  return true;
};

export const canPlaceAt = (
  candidate: { x: number; y: number; width: number; height: number },
  allItems: FurnitureItem[],
  walls: WallItem[] = [],
  ignoreId?: string,
  roomWidth = 800,
  roomHeight = 600
): boolean => {
  if (candidate.x < 0 || candidate.y < 0) return false;
  if (candidate.x + candidate.width > roomWidth) return false;
  if (candidate.y + candidate.height > roomHeight) return false;
  for (const item of allItems) {
    if (ignoreId && item.id === ignoreId) continue;
    if (aabbOverlap(candidate, item)) return false;
  }
  for (const wall of walls) {
    if (aabbOverlap(candidate, wall)) return false;
  }
  return true;
};

export interface GeneratedWall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const generateWallsForRooms = (rooms: Room[]): GeneratedWall[] => {
  const walls: GeneratedWall[] = [];
  const WALL_THICKNESS = GRID_SIZE * 0.2;

  for (const room of rooms) {
    const rx = room.x * GRID_SIZE;
    const ry = room.y * GRID_SIZE;
    const rw = room.widthGrids * GRID_SIZE;
    const rh = room.heightGrids * GRID_SIZE;

    const adjacent = rooms.filter((other) => {
      if (other.id === room.id) return false;
      const orx = other.x * GRID_SIZE;
      const ory = other.y * GRID_SIZE;
      const orw = other.widthGrids * GRID_SIZE;
      const orh = other.heightGrids * GRID_SIZE;
      const gap = GRID_SIZE * 0.5;
      const overlapX = rx < orx + orw + gap && rx + rw + gap > orx;
      const overlapY = ry < ory + orh + gap && ry + rh + gap > ory;
      return overlapX && overlapY;
    });

    const isLeftAdjacent = adjacent.some((o) => {
      const orx = o.x * GRID_SIZE;
      const ory = o.y * GRID_SIZE;
      const orh = o.heightGrids * GRID_SIZE;
      return (
        Math.abs((orx + o.widthGrids * GRID_SIZE) - rx) < GRID_SIZE * 0.5 &&
        ry < ory + orh &&
        ry + rh > ory
      );
    });
    const isRightAdjacent = adjacent.some((o) => {
      const orx = o.x * GRID_SIZE;
      const ory = o.y * GRID_SIZE;
      const orh = o.heightGrids * GRID_SIZE;
      return (
        Math.abs(orx - (rx + rw)) < GRID_SIZE * 0.5 && ry < ory + orh && ry + rh > ory
      );
    });
    const isTopAdjacent = adjacent.some((o) => {
      const orx = o.x * GRID_SIZE;
      const ory = o.y * GRID_SIZE;
      const orw = o.widthGrids * GRID_SIZE;
      return (
        Math.abs((ory + o.heightGrids * GRID_SIZE) - ry) < GRID_SIZE * 0.5 &&
        rx < orx + orw &&
        rx + rw > orx
      );
    });
    const isBottomAdjacent = adjacent.some((o) => {
      const orx = o.x * GRID_SIZE;
      const ory = o.y * GRID_SIZE;
      const orw = o.widthGrids * GRID_SIZE;
      return (
        Math.abs(ory - (ry + rh)) < GRID_SIZE * 0.5 && rx < orx + orw && rx + rw > orx
      );
    });

    if (!isLeftAdjacent) {
      walls.push({ x: rx, y: ry, width: WALL_THICKNESS, height: rh });
    }
    if (!isRightAdjacent) {
      walls.push({ x: rx + rw - WALL_THICKNESS, y: ry, width: WALL_THICKNESS, height: rh });
    }
    if (!isTopAdjacent) {
      walls.push({ x: rx, y: ry, width: rw, height: WALL_THICKNESS });
    }
    if (!isBottomAdjacent) {
      walls.push({ x: rx, y: ry + rh - WALL_THICKNESS, width: rw, height: WALL_THICKNESS });
    }
  }

  return walls;
};
