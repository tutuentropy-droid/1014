import type { FurnitureItem } from '@/types/furniture';

export const aabbOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean => {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

export const canPlaceAt = (
  candidate: { x: number; y: number; width: number; height: number },
  allItems: FurnitureItem[],
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
  return true;
};
