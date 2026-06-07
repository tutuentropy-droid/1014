import type { Room, FurnitureItem, FurnitureType } from '@/types/furniture';
import { FURNITURE_CATALOG, GRID_SIZE } from '@/data/furnitureData';
import { aabbOverlap, canPlaceFurnitureInRoom, generateWallsForRooms } from './collision';

export interface SmartPlacement {
  type: FurnitureType;
  x: number;
  y: number;
}

type PlacementStrategy = (
  room: Room,
  furnitureW: number,
  furnitureH: number,
  occupied: { x: number; y: number; width: number; height: number }[],
  walkway: number
) => { x: number; y: number } | null;

const snapPx = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

const roomPixelBounds = (room: Room) => {
  const rx = room.x * GRID_SIZE;
  const ry = room.y * GRID_SIZE;
  const rw = room.widthGrids * GRID_SIZE;
  const rh = room.heightGrids * GRID_SIZE;
  return { rx, ry, rw, rh };
};

const isPositionValid = (
  pos: { x: number; y: number; width: number; height: number },
  room: Room,
  occupied: { x: number; y: number; width: number; height: number }[],
  walkway: number
): boolean => {
  const { rx, ry, rw, rh } = roomPixelBounds(room);

  if (pos.x < rx + walkway) return false;
  if (pos.y < ry + walkway) return false;
  if (pos.x + pos.width > rx + rw - walkway) return false;
  if (pos.y + pos.height > ry + rh - walkway) return false;

  for (const occ of occupied) {
    if (aabbOverlap(pos, occ)) return false;
    const expanded = {
      x: occ.x - walkway,
      y: occ.y - walkway,
      width: occ.width + walkway * 2,
      height: occ.height + walkway * 2,
    };
    if (aabbOverlap(pos, expanded)) return false;
  }

  return true;
};

const tryCornerPlacement: PlacementStrategy = (room, fw, fh, occupied, walkway) => {
  const { rx, ry, rw, rh } = roomPixelBounds(room);

  const corners = [
    { x: rx + walkway, y: ry + walkway },
    { x: rx + rw - fw - walkway, y: ry + walkway },
    { x: rx + walkway, y: ry + rh - fh - walkway },
    { x: rx + rw - fw - walkway, y: ry + rh - fh - walkway },
  ];

  for (const c of corners) {
    const pos = { x: snapPx(c.x), y: snapPx(c.y), width: fw, height: fh };
    if (isPositionValid(pos, room, occupied, walkway)) return pos;
  }
  return null;
};

const tryWallPlacement = (
  wall: 'top' | 'bottom' | 'left' | 'right',
  room: Room,
  fw: number,
  fh: number,
  occupied: { x: number; y: number; width: number; height: number }[],
  walkway: number,
  preferSide?: 'left' | 'right' | 'center'
): { x: number; y: number } | null => {
  const { rx, ry, rw, rh } = roomPixelBounds(room);

  let baseX = rx + walkway;
  let baseY = ry + walkway;

  if (wall === 'top') baseY = ry + walkway;
  if (wall === 'bottom') baseY = ry + rh - fh - walkway;
  if (wall === 'left') baseX = rx + walkway;
  if (wall === 'right') baseX = rx + rw - fw - walkway;

  if (preferSide === 'center') {
    if (wall === 'top' || wall === 'bottom') {
      baseX = rx + Math.floor((rw - fw) / 2);
    } else {
      baseY = ry + Math.floor((rh - fh) / 2);
    }
  } else if (preferSide === 'right' && (wall === 'top' || wall === 'bottom')) {
    baseX = rx + rw - fw - walkway;
  }

  const positions: { x: number; y: number }[] = [];
  positions.push({ x: snapPx(baseX), y: snapPx(baseY) });

  if (wall === 'top' || wall === 'bottom') {
    for (let ox = walkway; ox + fw + walkway <= rw; ox += GRID_SIZE) {
      positions.push({ x: snapPx(rx + ox), y: snapPx(baseY) });
    }
  } else {
    for (let oy = walkway; oy + fh + walkway <= rh; oy += GRID_SIZE) {
      positions.push({ x: snapPx(baseX), y: snapPx(ry + oy) });
    }
  }

  for (const p of positions) {
    const pos = { x: p.x, y: p.y, width: fw, height: fh };
    if (isPositionValid(pos, room, occupied, walkway)) return p;
  }
  return null;
};

const tryOppositeWall = (
  reference: { x: number; y: number; width: number; height: number },
  room: Room,
  fw: number,
  fh: number,
  occupied: { x: number; y: number; width: number; height: number }[],
  walkway: number
): { x: number; y: number } | null => {
  const { rx, ry, rw, rh } = roomPixelBounds(room);
  const refCenterX = reference.x + reference.width / 2;
  const refCenterY = reference.y + reference.height / 2;
  const roomCenterX = rx + rw / 2;
  const roomCenterY = ry + rh / 2;

  const isHorizontal = Math.abs(refCenterY - roomCenterY) < Math.abs(refCenterX - roomCenterX);
  let targetWall: 'top' | 'bottom' | 'left' | 'right';

  if (isHorizontal) {
    targetWall = refCenterY < roomCenterY ? 'bottom' : 'top';
  } else {
    targetWall = refCenterX < roomCenterX ? 'right' : 'left';
  }

  const alignX = isHorizontal ? snapPx(Math.max(rx + walkway, refCenterX - fw / 2)) : undefined;
  const alignY = !isHorizontal ? snapPx(Math.max(ry + walkway, refCenterY - fh / 2)) : undefined;

  if (isHorizontal && alignX !== undefined) {
    const y = targetWall === 'top' ? ry + walkway : ry + rh - fh - walkway;
    const pos = { x: snapPx(alignX), y: snapPx(y), width: fw, height: fh };
    if (isPositionValid(pos, room, occupied, walkway)) return { x: pos.x, y: pos.y };
  }
  if (!isHorizontal && alignY !== undefined) {
    const x = targetWall === 'left' ? rx + walkway : rx + rw - fw - walkway;
    const pos = { x: snapPx(x), y: snapPx(alignY), width: fw, height: fh };
    if (isPositionValid(pos, room, occupied, walkway)) return { x: pos.x, y: pos.y };
  }

  return tryWallPlacement(targetWall, room, fw, fh, occupied, walkway, 'center');
};

const tryCenterPlacement: PlacementStrategy = (room, fw, fh, occupied, walkway) => {
  const { rx, ry, rw, rh } = roomPixelBounds(room);
  const cx = rx + (rw - fw) / 2;
  const cy = ry + (rh - fh) / 2;

  const offsets = [
    { dx: 0, dy: 0 },
    { dx: -GRID_SIZE, dy: 0 },
    { dx: GRID_SIZE, dy: 0 },
    { dx: 0, dy: -GRID_SIZE },
    { dx: 0, dy: GRID_SIZE },
    { dx: -GRID_SIZE, dy: -GRID_SIZE },
    { dx: GRID_SIZE, dy: -GRID_SIZE },
    { dx: -GRID_SIZE, dy: GRID_SIZE },
    { dx: GRID_SIZE, dy: GRID_SIZE },
  ];

  for (const off of offsets) {
    const pos = { x: snapPx(cx + off.dx), y: snapPx(cy + off.dy), width: fw, height: fh };
    if (isPositionValid(pos, room, occupied, walkway)) return pos;
  }
  return null;
};

const tryAnyPlacement: PlacementStrategy = (room, fw, fh, occupied, walkway) => {
  const { rx, ry, rw, rh } = roomPixelBounds(room);
  for (let y = ry + walkway; y + fh + walkway <= ry + rh; y += GRID_SIZE) {
    for (let x = rx + walkway; x + fw + walkway <= rx + rw; x += GRID_SIZE) {
      const pos = { x: snapPx(x), y: snapPx(y), width: fw, height: fh };
      if (isPositionValid(pos, room, occupied, walkway)) return pos;
    }
  }
  return null;
};

const getRoomFurniturePlan = (room: Room): { type: FurnitureType; count: number }[] => {
  const area = room.widthGrids * room.heightGrids;
  const w = room.widthGrids;
  const h = room.heightGrids;
  const name = room.name;
  const nameLower = name.toLowerCase();

  if (name.includes('卧') || nameLower.includes('bed')) {
    const plan: { type: FurnitureType; count: number }[] = [
      { type: 'bed', count: 1 },
      { type: 'wardrobe', count: 1 },
    ];
    if (area >= 80) plan.push({ type: 'table', count: 1 }, { type: 'chair', count: 1 });
    if (area >= 100) plan.push({ type: 'bookshelf', count: 1 });
    plan.push({ type: 'plant', count: Math.min(2, Math.floor(area / 60)) });
    return plan;
  }

  if (name.includes('客') || nameLower.includes('living')) {
    const plan: { type: FurnitureType; count: number }[] = [
      { type: 'sofa', count: 1 },
      { type: 'tvcabinet', count: 1 },
      { type: 'table', count: 1 },
    ];
    const chairCount = Math.min(4, Math.max(2, Math.floor(area / 40)));
    plan.push({ type: 'chair', count: chairCount });
    if (area >= 120) plan.push({ type: 'bookshelf', count: 1 });
    plan.push({ type: 'plant', count: Math.min(3, Math.floor(area / 50)) });
    return plan;
  }

  if (name.includes('厨') || nameLower.includes('kitchen')) {
    const plan: { type: FurnitureType; count: number }[] = [
      { type: 'table', count: 1 },
    ];
    const chairCount = Math.min(4, Math.max(2, Math.floor(area / 15)));
    plan.push({ type: 'chair', count: chairCount });
    plan.push({ type: 'plant', count: Math.min(1, Math.floor(area / 80)) });
    return plan;
  }

  if (name.includes('书') || nameLower.includes('study') || name.includes('书房')) {
    const plan: { type: FurnitureType; count: number }[] = [
      { type: 'table', count: 1 },
      { type: 'chair', count: 1 },
      { type: 'bookshelf', count: Math.min(2, Math.floor(area / 30)) },
    ];
    plan.push({ type: 'plant', count: Math.min(2, Math.floor(area / 40)) });
    return plan;
  }

  if (name.includes('餐') || nameLower.includes('dining')) {
    const plan: { type: FurnitureType; count: number }[] = [
      { type: 'table', count: 1 },
      { type: 'chair', count: Math.min(6, Math.max(4, Math.floor(area / 15))) },
    ];
    plan.push({ type: 'plant', count: Math.min(2, Math.floor(area / 50)) });
    return plan;
  }

  if (name.includes('卫生') || nameLower.includes('bath') || nameLower.includes('toilet')) {
    const plan: { type: FurnitureType; count: number }[] = [];
    if (area >= 30) plan.push({ type: 'plant', count: 1 });
    return plan;
  }

  const plan: { type: FurnitureType; count: number }[] = [];
  if (w >= 6 && h >= 6) plan.push({ type: 'sofa', count: 1 }, { type: 'tvcabinet', count: 1 });
  if (w >= 4 && h >= 4) plan.push({ type: 'table', count: 1 });
  const chairCount = Math.min(4, Math.max(2, Math.floor(area / 40)));
  if (area >= 30) plan.push({ type: 'chair', count: chairCount });
  if (w >= 5) plan.push({ type: 'bookshelf', count: 1 });
  plan.push({ type: 'plant', count: Math.min(2, Math.floor(area / 60)) });
  return plan;
};

export const generateSmartLayout = (
  room: Room,
  existingFurniture: FurnitureItem[],
  allRooms: Room[],
  options: { clearExisting?: boolean } = {}
): SmartPlacement[] => {
  const walkway = GRID_SIZE;
  const placements: SmartPlacement[] = [];
  const occupied: { x: number; y: number; width: number; height: number }[] = [];
  const placedTypes = new Set<FurnitureType>();

  if (!options.clearExisting) {
    for (const f of existingFurniture) {
      occupied.push({ x: f.x, y: f.y, width: f.width, height: f.height });
      placedTypes.add(f.type);
    }
  }

  const autoWalls = generateWallsForRooms(allRooms);
  const allFurnitureContext = allRooms.flatMap((r) => r.furniture);

  const plan = getRoomFurniturePlan(room);
  const prioritized = plan.slice().sort((a, b) => {
    const ca = FURNITURE_CATALOG[a.type as keyof typeof FURNITURE_CATALOG];
    const cb = FURNITURE_CATALOG[b.type as keyof typeof FURNITURE_CATALOG];
    return (cb?.width || 0) * (cb?.height || 0) - (ca?.width || 0) * (ca?.height || 0);
  });

  for (const item of prioritized) {
    const catalog = FURNITURE_CATALOG[item.type as keyof typeof FURNITURE_CATALOG];
    if (!catalog) continue;
    const fw = catalog.width;
    const fh = catalog.height;

    for (let i = 0; i < item.count; i++) {
      let result: { x: number; y: number } | null = null;

      switch (item.type) {
        case 'bed': {
          result = tryCornerPlacement(room, fw, fh, occupied, walkway);
          break;
        }
        case 'sofa': {
          result = tryWallPlacement('top', room, fw, fh, occupied, walkway, 'center')
            || tryWallPlacement('bottom', room, fw, fh, occupied, walkway, 'center')
            || tryWallPlacement('left', room, fw, fh, occupied, walkway, 'center')
            || tryWallPlacement('right', room, fw, fh, occupied, walkway, 'center');
          break;
        }
        case 'tvcabinet': {
          const sofa = occupied.find((_, idx) => {
            const p = placements[idx];
            return p && p.type === 'sofa';
          });
          if (sofa) {
            result = tryOppositeWall(sofa, room, fw, fh, occupied, walkway);
          }
          if (!result) {
            result = tryWallPlacement('top', room, fw, fh, occupied, walkway, 'center')
              || tryWallPlacement('bottom', room, fw, fh, occupied, walkway, 'center');
          }
          break;
        }
        case 'wardrobe':
        case 'bookshelf': {
          result = tryWallPlacement('left', room, fw, fh, occupied, walkway)
            || tryWallPlacement('right', room, fw, fh, occupied, walkway)
            || tryWallPlacement('top', room, fw, fh, occupied, walkway)
            || tryWallPlacement('bottom', room, fw, fh, occupied, walkway);
          break;
        }
        case 'table': {
          result = tryCenterPlacement(room, fw, fh, occupied, walkway)
            || tryAnyPlacement(room, fw, fh, occupied, walkway);
          break;
        }
        case 'chair': {
          const tableEntry = occupied.find((_, idx) => {
            const p = placements[idx];
            return p && p.type === 'table';
          });
          if (tableEntry) {
            const candidates = [
              { x: tableEntry.x, y: tableEntry.y - fh - walkway },
              { x: tableEntry.x + tableEntry.width - fw, y: tableEntry.y - fh - walkway },
              { x: tableEntry.x, y: tableEntry.y + tableEntry.height + walkway },
              { x: tableEntry.x + tableEntry.width - fw, y: tableEntry.y + tableEntry.height + walkway },
              { x: tableEntry.x - fw - walkway, y: tableEntry.y + (tableEntry.height - fh) / 2 },
              { x: tableEntry.x + tableEntry.width + walkway, y: tableEntry.y + (tableEntry.height - fh) / 2 },
            ];
            for (const c of candidates) {
              const pos = { x: snapPx(c.x), y: snapPx(c.y), width: fw, height: fh };
              const candidateCheck = { x: pos.x, y: pos.y, width: fw, height: fh };
              const wallsForCheck = generateWallsForRooms(allRooms) as unknown as { x: number; y: number; width: number; height: number; id: string }[];
              if (
                isPositionValid(candidateCheck, room, occupied, walkway)
                && canPlaceFurnitureInRoom(candidateCheck, room, allFurnitureContext, wallsForCheck)
              ) {
                result = { x: pos.x, y: pos.y };
                break;
              }
            }
          }
          if (!result) {
            result = tryAnyPlacement(room, fw, fh, occupied, walkway);
          }
          break;
        }
        case 'plant': {
          result = tryCornerPlacement(room, fw, fh, occupied, walkway);
          if (!result) {
            result = tryWallPlacement('left', room, fw, fh, occupied, walkway)
              || tryWallPlacement('right', room, fw, fh, occupied, walkway)
              || tryWallPlacement('top', room, fw, fh, occupied, walkway)
              || tryWallPlacement('bottom', room, fw, fh, occupied, walkway);
          }
          break;
        }
        default: {
          result = tryAnyPlacement(room, fw, fh, occupied, walkway);
          break;
        }
      }

      if (result) {
        const candidate = { x: result.x, y: result.y, width: fw, height: fh };
        const wallsForCheck = autoWalls as unknown as { x: number; y: number; width: number; height: number; id: string }[];
        if (canPlaceFurnitureInRoom(candidate, room, allFurnitureContext, wallsForCheck)) {
          placements.push({ type: item.type, x: result.x, y: result.y });
          occupied.push(candidate);
          placedTypes.add(item.type);
        }
      }
    }
  }

  return placements;
};
