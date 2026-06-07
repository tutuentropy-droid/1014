import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useDesignerStore } from '@/store/useDesignerStore';
import type { FurnitureItem, Room, WindowItem, CurtainItem } from '@/types/furniture';
import { GRID_SIZE, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS } from '@/data/furnitureData';
import { generateWallsForRooms } from '@/utils/collision';

const SCALE = 0.01;
const WALL_HEIGHT = 2.8;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.25;
const MOVE_SPEED = 3.5;
const MOUSE_SENSITIVITY = 0.002;
const CURTAIN_ANIM_DURATION = 800;

const hexToThreeColor = (hex: string): number => {
  try {
    return parseInt(hex.replace('#', ''), 16) || 0x888888;
  } catch {
    return 0x888888;
  }
};

const hexToThreeColorLighten = (hex: string, amount: number = 0.3): number => {
  const c = hexToThreeColor(hex);
  const r = Math.min(255, ((c >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((c >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (c & 0xff) + Math.round(255 * amount));
  return (r << 16) | (g << 8) | b;
};

const createBedMesh = (w: number, d: number, h: number, color: number) => {
  const bedGroup = new THREE.Group();
  const mattressGeo = new THREE.BoxGeometry(w * 0.95, h * 0.4, d * 0.95);
  const mattressMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
  const mattress = new THREE.Mesh(mattressGeo, mattressMat);
  mattress.position.y = h * 0.4;
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);
  const baseGeo = new THREE.BoxGeometry(w * 0.95, h * 0.25, d * 0.95);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8, metalness: 0.05 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = h * 0.125;
  base.castShadow = true;
  base.receiveShadow = true;
  bedGroup.add(base);
  const headboardGeo = new THREE.BoxGeometry(w * 0.95, h * 0.7, d * 0.1);
  const headboard = new THREE.Mesh(headboardGeo, baseMat);
  headboard.position.set(0, h * 0.45, -d * 0.42);
  headboard.castShadow = true;
  headboard.receiveShadow = true;
  bedGroup.add(headboard);
  const pillowGeo = new THREE.BoxGeometry(w * 0.25, h * 0.15, d * 0.2);
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d6, roughness: 0.5, metalness: 0.02 });
  const pillow1 = new THREE.Mesh(pillowGeo, pillowMat);
  pillow1.position.set(-w * 0.2, h * 0.57, -d * 0.25);
  pillow1.castShadow = true;
  const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
  pillow2.position.set(w * 0.2, h * 0.57, -d * 0.25);
  pillow2.castShadow = true;
  bedGroup.add(pillow1);
  bedGroup.add(pillow2);
  return bedGroup;
};

const createSofaMesh = (w: number, d: number, h: number, color: number) => {
  const sofaGroup = new THREE.Group();
  const seatGeo = new THREE.BoxGeometry(w * 0.9, h * 0.35, d * 0.75);
  const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.y = h * 0.3;
  seat.castShadow = true;
  seat.receiveShadow = true;
  sofaGroup.add(seat);
  const backGeo = new THREE.BoxGeometry(w * 0.9, h * 0.5, d * 0.15);
  const back = new THREE.Mesh(backGeo, seatMat);
  back.position.set(0, h * 0.55, -d * 0.27);
  back.castShadow = true;
  back.receiveShadow = true;
  sofaGroup.add(back);
  const armGeo = new THREE.BoxGeometry(w * 0.08, h * 0.45, d * 0.75);
  const arm1 = new THREE.Mesh(armGeo, seatMat);
  arm1.position.set(-w * 0.41, h * 0.35, 0);
  arm1.castShadow = true;
  arm1.receiveShadow = true;
  sofaGroup.add(arm1);
  const arm2 = new THREE.Mesh(armGeo, seatMat);
  arm2.position.set(w * 0.41, h * 0.35, 0);
  arm2.castShadow = true;
  arm2.receiveShadow = true;
  sofaGroup.add(arm2);
  return sofaGroup;
};

const createTableMesh = (w: number, d: number, h: number, color: number) => {
  const tableGroup = new THREE.Group();
  const tabletopGeo = new THREE.BoxGeometry(w * 0.95, h * 0.1, d * 0.95);
  const tabletopMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const tabletop = new THREE.Mesh(tabletopGeo, tabletopMat);
  tabletop.position.y = h * 0.75;
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  tableGroup.add(tabletop);
  const legGeo = new THREE.BoxGeometry(w * 0.08, h * 0.7, d * 0.08);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.75, metalness: 0.05 });
  const positions = [
    [-w * 0.35, -d * 0.35],
    [w * 0.35, -d * 0.35],
    [-w * 0.35, d * 0.35],
    [w * 0.35, d * 0.35],
  ];
  positions.forEach(([px, pz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(px, h * 0.35, pz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tableGroup.add(leg);
  });
  return tableGroup;
};

const createChairMesh = (w: number, d: number, h: number, color: number) => {
  const chairGroup = new THREE.Group();
  const seatGeo = new THREE.BoxGeometry(w * 0.8, h * 0.1, d * 0.8);
  const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.y = h * 0.5;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chairGroup.add(seat);
  const backGeo = new THREE.BoxGeometry(w * 0.8, h * 0.5, d * 0.08);
  const back = new THREE.Mesh(backGeo, seatMat);
  back.position.set(0, h * 0.8, -d * 0.35);
  back.castShadow = true;
  back.receiveShadow = true;
  chairGroup.add(back);
  const legGeo = new THREE.BoxGeometry(w * 0.08, h * 0.5, d * 0.08);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.75, metalness: 0.05 });
  const positions = [
    [-w * 0.3, -d * 0.3],
    [w * 0.3, -d * 0.3],
    [-w * 0.3, d * 0.3],
    [w * 0.3, d * 0.3],
  ];
  positions.forEach(([px, pz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(px, h * 0.25, pz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    chairGroup.add(leg);
  });
  return chairGroup;
};

const createPlantMesh = (w: number, d: number, h: number, color: number) => {
  const plantGroup = new THREE.Group();
  const potGeo = new THREE.CylinderGeometry(w * 0.35, w * 0.3, h * 0.25, 16);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.7, metalness: 0.05 });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = h * 0.125;
  pot.castShadow = true;
  pot.receiveShadow = true;
  plantGroup.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02 });
  const topLeafGeo = new THREE.SphereGeometry(w * 0.38, 16, 16);
  const topLeaf = new THREE.Mesh(topLeafGeo, leafMat);
  topLeaf.position.set(0, h * 0.65, 0);
  topLeaf.castShadow = true;
  plantGroup.add(topLeaf);
  return plantGroup;
};

const createTvCabinetMesh = (w: number, d: number, h: number, color: number) => {
  const g = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(w * 0.95, h * 0.8, d * 0.9);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.08 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = h * 0.4;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const tvGeo = new THREE.BoxGeometry(w * 0.85, h * 1.2, d * 0.05);
  const tvMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 });
  const tv = new THREE.Mesh(tvGeo, tvMat);
  tv.position.set(0, h * 1.3, -d * 0.35);
  tv.castShadow = true;
  g.add(tv);
  return g;
};

const createWardrobeMesh = (w: number, d: number, h: number, color: number) => {
  const g = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(w * 0.95, h * 0.95, d * 0.9);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.03 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = h * 0.475;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const dividerGeo = new THREE.BoxGeometry(w * 0.02, h * 0.9, d * 0.92);
  const divider = new THREE.Mesh(dividerGeo, bodyMat);
  divider.position.y = h * 0.475;
  g.add(divider);
  const handleGeo = new THREE.BoxGeometry(w * 0.03, h * 0.08, d * 0.04);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xc9a96a, roughness: 0.3, metalness: 0.7 });
  const h1 = new THREE.Mesh(handleGeo, handleMat);
  h1.position.set(-w * 0.2, h * 0.5, d * 0.42);
  g.add(h1);
  const h2 = new THREE.Mesh(handleGeo, handleMat);
  h2.position.set(w * 0.2, h * 0.5, d * 0.42);
  g.add(h2);
  return g;
};

const createBookshelfMesh = (w: number, d: number, h: number, color: number) => {
  const g = new THREE.Group();
  const frameGeo = new THREE.BoxGeometry(w * 0.95, h * 0.95, d * 0.9);
  const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.03 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = h * 0.475;
  frame.castShadow = true;
  frame.receiveShadow = true;
  g.add(frame);
  const shelfColors = [0x8b4513, 0xa0522d, 0x654321, 0x8b5a2b, 0x5c3317];
  for (let i = 0; i < 4; i++) {
    const shelfGeo = new THREE.BoxGeometry(w * 0.04, h * 0.15, d * 0.8);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: shelfColors[i % shelfColors.length],
      roughness: 0.6,
      metalness: 0.05,
    });
    const bookCount = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < bookCount; j++) {
      const book = new THREE.Mesh(shelfGeo, shelfMat);
      const xOffset = -w * 0.35 + (j / (bookCount - 1)) * w * 0.7;
      book.position.set(xOffset, h * (0.15 + i * 0.2), 0);
      book.rotation.y = (Math.random() - 0.5) * 0.1;
      g.add(book);
    }
  }
  return g;
};

const createFallbackMesh = (w: number, d: number, h: number, color: number) => {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
};

const createWindowMesh = (win: WindowItem) => {
  const group = new THREE.Group();
  const wx = win.x * SCALE;
  const wy = win.y * SCALE;
  const ww = win.width * SCALE;
  const wh = win.height * SCALE;
  const winW = win.windowWidth * SCALE;
  const winH = win.windowHeight * SCALE;

  const windowBottom = 0.5;

  let frameW = ww;
  let frameD = wh;
  let glassW = ww;
  let glassD = wh;

  if (win.wallOrientation === 'top' || win.wallOrientation === 'bottom') {
    frameW = winW;
    frameD = 0.04;
    glassW = winW - 0.04;
    glassD = 0.03;
  } else {
    frameW = 0.04;
    frameD = winW;
    glassW = 0.03;
    glassD = winW - 0.04;
  }

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.8,
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(frameW, winH, frameD), frameMat);
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xadd8e6,
    transparent: true,
    opacity: 0.25,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    thickness: 0.02,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(glassW, winH - 0.06, glassD), glassMat);
  glass.castShadow = false;
  glass.receiveShadow = true;
  group.add(glass);

  const crossMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.8,
  });
  if (win.wallOrientation === 'top' || win.wallOrientation === 'bottom') {
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.03, winH - 0.06, 0.05), crossMat);
    group.add(crossH);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(frameW - 0.06, 0.03, 0.05), crossMat);
    group.add(crossV);
  } else {
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.05, winH - 0.06, 0.03), crossMat);
    group.add(crossH);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, frameD - 0.06), crossMat);
    group.add(crossV);
  }

  let posX = wx + ww / 2;
  let posZ = wy + wh / 2;

  const WALL_OFFSET = 0.025;
  switch (win.wallOrientation) {
    case 'left':
      posX += WALL_OFFSET;
      break;
    case 'right':
      posX -= WALL_OFFSET;
      break;
    case 'top':
      posZ += WALL_OFFSET;
      break;
    case 'bottom':
      posZ -= WALL_OFFSET;
      break;
  }

  group.position.set(posX, windowBottom + winH / 2, posZ);

  return group;
};

type CurtainGroup = THREE.Group & {
  panels?: Array<{ mesh: THREE.Mesh; originalX: number; originalZ: number; isLeft: boolean }>;
  progress?: number;
  targetProgress?: number;
  curtainW?: number;
  isVerticalWall?: boolean;
};

const createCurtainMesh = (curtain: CurtainItem, win: WindowItem) => {
  const group = new THREE.Group() as CurtainGroup;
  const winW = win.windowWidth * SCALE;
  const winH = win.windowHeight * SCALE;
  const windowBottom = 0.5;

  const curtainW = winW * 1.05;
  const curtainH = winH + 0.1;
  const panelCount = 12;
  const panelWidth = curtainW / panelCount;

  const curtainColor = 0x8b5cf6;
  const panelMat = new THREE.MeshStandardMaterial({
    color: curtainColor,
    transparent: true,
    opacity: 0.75,
    roughness: 0.8,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const panels: Array<{ mesh: THREE.Mesh; originalX: number; originalZ: number; isLeft: boolean }> = [];

  const isVerticalWall = win.wallOrientation === 'left' || win.wallOrientation === 'right';

  for (let i = 0; i < panelCount; i++) {
    const waveOffset = Math.sin(i * 0.8) * 0.015;
    const panelGeo = new THREE.PlaneGeometry(panelWidth * 0.95, curtainH);
    const panel = new THREE.Mesh(panelGeo, panelMat);

    const isLeft = i < panelCount / 2;
    const originalOffset = -curtainW / 2 + panelWidth / 2 + i * panelWidth;

    panel.position.y = windowBottom + curtainH / 2 - 0.02;

    if (isVerticalWall) {
      panel.rotation.y = Math.PI / 2;
      panel.position.z = originalOffset;
      panel.position.x = waveOffset;
    } else {
      panel.position.x = originalOffset;
      panel.position.z = waveOffset;
    }

    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    panels.push({
      mesh: panel,
      originalX: panel.position.x,
      originalZ: panel.position.z,
      isLeft,
    });
  }

  group.panels = panels;
  group.progress = curtain.isOpen ? 1 : 0;
  group.targetProgress = curtain.isOpen ? 1 : 0;
  group.curtainW = curtainW;
  group.isVerticalWall = isVerticalWall;

  const wx = win.x * SCALE;
  const wy = win.y * SCALE;
  const ww = win.width * SCALE;
  const wh = win.height * SCALE;

  let posX = wx + ww / 2;
  let posZ = wy + wh / 2;
  const CURTAIN_OFFSET = 0.08;
  switch (win.wallOrientation) {
    case 'left':
      posX += CURTAIN_OFFSET;
      break;
    case 'right':
      posX -= CURTAIN_OFFSET;
      break;
    case 'top':
      posZ += CURTAIN_OFFSET;
      break;
    case 'bottom':
      posZ -= CURTAIN_OFFSET;
      break;
  }

  group.position.set(posX, 0, posZ);

  return group;
};

interface RoomView3DProps {
  onScreenshotReady?: (dataUrl: string) => void;
}

export const RoomView3D = ({ onScreenshotReady }: RoomView3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorsGroupRef = useRef<THREE.Group | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const windowsGroupRef = useRef<THREE.Group | null>(null);
  const curtainsGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const windowMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const curtainMeshesRef = useRef<Map<string, CurtainGroup>>(new Map());
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);
  const frameRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const isFirstPersonRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const playerPosRef = useRef(new THREE.Vector3(0, PLAYER_HEIGHT, 0));
  const keysRef = useRef<Record<string, boolean>>({});
  const defaultCameraPosRef = useRef(new THREE.Vector3());
  const defaultCameraTargetRef = useRef(new THREE.Vector3());
  const [isFirstPerson, setIsFirstPerson] = useState(false);

  const rooms = useDesignerStore((s) => s.rooms);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const selectedWindowId = useDesignerStore((s) => s.selectedWindowId);
  const selectedCurtainId = useDesignerStore((s) => s.selectedCurtainId);
  const selectedRoomId = useDesignerStore((s) => s.selectedRoomId);
  const getCatalogEntry = useDesignerStore((s) => s.getCatalogEntry);
  const getRoomById = useDesignerStore((s) => s.getRoomById);

  const allFurniture = rooms.flatMap((r) => r.furniture);
  const allWindows = rooms.flatMap((r) => r.windows);
  const allCurtains = rooms.flatMap((r) => r.curtains);

  const CANVAS_W = CANVAS_WIDTH_GRIDS * GRID_SIZE * SCALE;
  const CANVAS_H = CANVAS_HEIGHT_GRIDS * GRID_SIZE * SCALE;

  const captureScreenshot = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    if (onScreenshotReady) onScreenshotReady(dataUrl);
    return dataUrl;
  }, [onScreenshotReady]);

  (window as unknown as { capture3DScreenshot?: () => string | undefined }).capture3DScreenshot =
    captureScreenshot;

  const checkCollision = useCallback(
    (pos: THREE.Vector3): boolean => {
      for (const room of rooms) {
        const rx = room.x * GRID_SIZE * SCALE;
        const ry = room.y * GRID_SIZE * SCALE;
        const rw = room.widthGrids * GRID_SIZE * SCALE;
        const rh = room.heightGrids * GRID_SIZE * SCALE;
        for (const item of room.furniture) {
          const ix = item.x * SCALE;
          const iy = item.y * SCALE;
          const iw = item.width * SCALE;
          const ih = item.height * SCALE;
          const closestX = Math.max(ix, Math.min(pos.x, ix + iw));
          const closestZ = Math.max(iy, Math.min(pos.z, iy + ih));
          const dx = pos.x - closestX;
          const dz = pos.z - closestZ;
          if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
        }
        const autoWalls = generateWallsForRooms(rooms);
        for (const wall of autoWalls) {
          const wx = wall.x * SCALE;
          const wy = wall.y * SCALE;
          const ww = wall.width * SCALE;
          const wh = wall.height * SCALE;
          const closestX = Math.max(wx, Math.min(pos.x, wx + ww));
          const closestZ = Math.max(wy, Math.min(pos.z, wy + wh));
          const dx = pos.x - closestX;
          const dz = pos.z - closestZ;
          if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
        }
        if (
          pos.x - PLAYER_RADIUS < rx ||
          pos.x + PLAYER_RADIUS > rx + rw ||
          pos.z - PLAYER_RADIUS < ry ||
          pos.z + PLAYER_RADIUS > ry + rh
        ) {
          let insideAnyRoom = false;
          for (const or of rooms) {
            const orx = or.x * GRID_SIZE * SCALE;
            const ory = or.y * GRID_SIZE * SCALE;
            const orw = or.widthGrids * GRID_SIZE * SCALE;
            const orh = or.heightGrids * GRID_SIZE * SCALE;
            if (
              pos.x - PLAYER_RADIUS >= orx &&
              pos.x + PLAYER_RADIUS <= orx + orw &&
              pos.z - PLAYER_RADIUS >= ory &&
              pos.z + PLAYER_RADIUS <= ory + orh
            ) {
              insideAnyRoom = true;
              break;
            }
          }
          if (!insideAnyRoom) return true;
        }
      }
      return false;
    },
    [rooms]
  );

  const updateFurnitureMesh = useCallback(
    (item: FurnitureItem) => {
      const group = furnitureGroupRef.current;
      if (!group) return;
      const catalog = getCatalogEntry(item.type);
      const w = item.width * SCALE;
      const d = item.height * SCALE;
      const h = catalog.depth * SCALE;
      const itemColor = hexToThreeColor(item.color);
      const existingItem = furnitureMeshesRef.current.get(item.id);
      if (existingItem) {
        group.remove(existingItem);
        existingItem.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      const buildAndRegister = (furnitureGroup: THREE.Group) => {
        furnitureGroup.position.set(item.x * SCALE + w / 2, 0, item.y * SCALE + d / 2);
        furnitureMeshesRef.current.set(item.id, furnitureGroup);
        group.add(furnitureGroup);
      };
      if (catalog.modelUrl && gltfLoaderRef.current) {
        const fallback = createFallbackMesh(w, d, h, itemColor);
        buildAndRegister(fallback);
        gltfLoaderRef.current.load(
          catalog.modelUrl,
          (gltf) => {
            if (!furnitureMeshesRef.current.has(item.id)) return;
            const currentGroup = furnitureMeshesRef.current.get(item.id);
            if (currentGroup) {
              group.remove(currentGroup);
              currentGroup.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.geometry.dispose();
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                  } else {
                    child.material.dispose();
                  }
                }
              });
            }
            const gltfGroup = gltf.scene.clone();
            const bbox = new THREE.Box3().setFromObject(gltfGroup);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
              const targetMax = Math.max(w, h, d);
              const s = targetMax / maxDim;
              gltfGroup.scale.setScalar(s);
            }
            gltfGroup.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            gltfGroup.position.set(item.x * SCALE + w / 2, 0, item.y * SCALE + d / 2);
            furnitureMeshesRef.current.set(item.id, gltfGroup);
            group.add(gltfGroup);
          },
          undefined,
          () => {}
        );
        return;
      }
      let furnitureGroup: THREE.Group;
      switch (item.type) {
        case 'bed':
          furnitureGroup = createBedMesh(w, d, h, itemColor);
          break;
        case 'sofa':
          furnitureGroup = createSofaMesh(w, d, h, itemColor);
          break;
        case 'table':
          furnitureGroup = createTableMesh(w, d, h, itemColor);
          break;
        case 'chair':
          furnitureGroup = createChairMesh(w, d, h, itemColor);
          break;
        case 'plant':
          furnitureGroup = createPlantMesh(w, d, h, itemColor);
          break;
        case 'tvcabinet':
          furnitureGroup = createTvCabinetMesh(w, d, h, itemColor);
          break;
        case 'wardrobe':
          furnitureGroup = createWardrobeMesh(w, d, h, itemColor);
          break;
        case 'bookshelf':
          furnitureGroup = createBookshelfMesh(w, d, h, itemColor);
          break;
        default:
          furnitureGroup = createFallbackMesh(w, d, h, itemColor);
      }
      buildAndRegister(furnitureGroup);
    },
    [getCatalogEntry]
  );

  const updateWindowMesh = useCallback(
    (win: WindowItem) => {
      const group = windowsGroupRef.current;
      if (!group) return;
      const existing = windowMeshesRef.current.get(win.id);
      if (existing) {
        group.remove(existing);
        existing.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      const winMesh = createWindowMesh(win);
      windowMeshesRef.current.set(win.id, winMesh);
      group.add(winMesh);
    },
    []
  );

  const updateCurtainMesh = useCallback(
    (curtain: CurtainItem) => {
      const group = curtainsGroupRef.current;
      if (!group) return;
      const win = allWindows.find((w) => w.id === curtain.windowId);
      if (!win) return;

      const existing = curtainMeshesRef.current.get(curtain.id);
      if (existing) {
        if (existing.targetProgress !== undefined) {
          existing.targetProgress = curtain.isOpen ? 1 : 0;
        }
        return;
      }

      const curtainMesh = createCurtainMesh(curtain, win);
      curtainMeshesRef.current.set(curtain.id, curtainMesh);
      group.add(curtainMesh);
    },
    [allWindows]
  );

  const clearGroup = (group: THREE.Group) => {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      } else if (child instanceof THREE.Group) {
        clearGroup(child);
      }
    }
  };

  const buildFloors = useCallback(() => {
    const group = floorsGroupRef.current;
    if (!group) return;
    clearGroup(group);
    rooms.forEach((room: Room) => {
      const rx = room.x * GRID_SIZE * SCALE;
      const ry = room.y * GRID_SIZE * SCALE;
      const rw = room.widthGrids * GRID_SIZE * SCALE;
      const rh = room.heightGrids * GRID_SIZE * SCALE;
      const floorColor = hexToThreeColorLighten(room.color, 0.15);
      const floorMat = new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: 0.6,
        metalness: 0.05,
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(rx + rw / 2, 0, ry + rh / 2);
      floor.receiveShadow = true;
      group.add(floor);
    });
  }, [rooms]);

  const buildWalls = useCallback(() => {
    const group = wallsGroupRef.current;
    if (!group) return;
    clearGroup(group);
    const autoWalls = generateWallsForRooms(rooms);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xd9cfc2,
      roughness: 0.85,
      metalness: 0.02,
    });
    autoWalls.forEach((wall) => {
      const wx = wall.x * SCALE;
      const wy = wall.y * SCALE;
      const ww = Math.max(wall.width * SCALE, 0.04);
      const wh = Math.max(wall.height * SCALE, 0.04);
      let wallMesh: THREE.Mesh;
      if (ww > wh) {
        wallMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, WALL_HEIGHT, wh), wallMat);
      } else {
        wallMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, WALL_HEIGHT, wh), wallMat);
      }
      wallMesh.position.set(wx + ww / 2, WALL_HEIGHT / 2, wy + wh / 2);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      group.add(wallMesh);
    });
  }, [rooms]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new THREE.Scene();

    const skyGeo = new THREE.SphereGeometry(80, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xe0f6ff) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    scene.fog = new THREE.Fog(0xc9e8f7, 20, 70);
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0xd9c7a8, 0.5);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff5e1, 1.0);
    dir.position.set(CANVAS_W * 0.3, 20, CANVAS_H * 0.3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -CANVAS_W;
    dir.shadow.camera.right = CANVAS_W * 2;
    dir.shadow.camera.top = CANVAS_H * 2;
    dir.shadow.camera.bottom = -CANVAS_H;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.bias = -0.0005;
    scene.add(dir);
    const bgGeo = new THREE.PlaneGeometry(CANVAS_W * 1.5, CANVAS_H * 1.5);
    const bgMat = new THREE.MeshStandardMaterial({
      color: 0x7cb342,
      roughness: 0.95,
      metalness: 0,
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.rotation.x = -Math.PI / 2;
    bg.position.set(CANVAS_W / 2, -0.01, CANVAS_H / 2);
    bg.receiveShadow = true;
    scene.add(bg);
    const floorsGroup = new THREE.Group();
    scene.add(floorsGroup);
    floorsGroupRef.current = floorsGroup;
    const wallsGroup = new THREE.Group();
    scene.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;
    const windowsGroup = new THREE.Group();
    scene.add(windowsGroup);
    windowsGroupRef.current = windowsGroup;
    const curtainsGroup = new THREE.Group();
    scene.add(curtainsGroup);
    curtainsGroupRef.current = curtainsGroup;
    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;
    gltfLoaderRef.current = new GLTFLoader();
    let lastTime = performance.now();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      curtainMeshesRef.current.forEach((curtainGroup) => {
        if (
          curtainGroup.progress !== undefined &&
          curtainGroup.targetProgress !== undefined &&
          curtainGroup.panels &&
          curtainGroup.curtainW !== undefined
        ) {
          const diff = curtainGroup.targetProgress - curtainGroup.progress;
          if (Math.abs(diff) > 0.001) {
            curtainGroup.progress += diff * Math.min(1, delta * 4);
            const p = curtainGroup.progress;
            const halfW = curtainGroup.curtainW / 2;
            const isVertical = curtainGroup.isVerticalWall === true;
            curtainGroup.panels.forEach(({ mesh, originalX, originalZ, isLeft }) => {
              if (isVertical) {
                if (isLeft) {
                  mesh.position.z = originalZ - p * (originalZ + halfW);
                } else {
                  mesh.position.z = originalZ + p * (halfW - originalZ);
                }
              } else {
                if (isLeft) {
                  mesh.position.x = originalX - p * (originalX + halfW);
                } else {
                  mesh.position.x = originalX + p * (halfW - originalX);
                }
              }
            });
          }
        }
      });

      if (isFirstPersonRef.current && camera) {
        const forward = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        const move = new THREE.Vector3();
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) move.add(forward);
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) move.sub(forward);
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) move.add(right);
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) move.sub(right);
        if (move.lengthSq() > 0) {
          move.normalize().multiplyScalar(MOVE_SPEED * delta);
          const newPos = playerPosRef.current.clone().add(move);
          if (!checkCollision(newPos)) {
            playerPosRef.current.copy(newPos);
          } else {
            const tryX = playerPosRef.current.clone();
            tryX.x = newPos.x;
            if (!checkCollision(tryX)) playerPosRef.current.x = newPos.x;
            const tryZ = playerPosRef.current.clone();
            tryZ.z = newPos.z;
            if (!checkCollision(tryZ)) playerPosRef.current.z = newPos.z;
          }
        }
        camera.position.copy(playerPosRef.current);
        const lookDir = new THREE.Vector3(
          -Math.sin(yawRef.current) * Math.cos(pitchRef.current),
          Math.sin(pitchRef.current),
          -Math.cos(yawRef.current) * Math.cos(pitchRef.current)
        );
        camera.lookAt(camera.position.clone().add(lookDir));
      } else if (controls) {
        controls.update();
      }
      renderer.render(scene, camera);
    };
    animate();
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyF') {
        if (!isFirstPersonRef.current) {
          const room = selectedRoomId ? getRoomById(selectedRoomId) : undefined;
          let startRoom: Room | undefined = room;
          if (!startRoom && rooms.length > 0) startRoom = rooms[0];
          if (startRoom) {
            const rx = startRoom.x * GRID_SIZE * SCALE;
            const ry = startRoom.y * GRID_SIZE * SCALE;
            const rw = startRoom.widthGrids * GRID_SIZE * SCALE;
            const rh = startRoom.heightGrids * GRID_SIZE * SCALE;
            playerPosRef.current.set(rx + rw / 2, PLAYER_HEIGHT, ry + rh / 2);
            yawRef.current = 0;
            pitchRef.current = 0;
            if (controls) {
              defaultCameraPosRef.current.copy(camera.position);
              defaultCameraTargetRef.current.copy(controls.target);
            }
            controls.enabled = false;
            isFirstPersonRef.current = true;
            setIsFirstPerson(true);
            renderer.domElement.requestPointerLock();
          }
        } else {
          controls.enabled = true;
          isFirstPersonRef.current = false;
          setIsFirstPerson(false);
          if (document.pointerLockElement) document.exitPointerLock();
          camera.position.copy(defaultCameraPosRef.current);
          controls.target.copy(defaultCameraTargetRef.current);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isFirstPersonRef.current) return;
      if (document.pointerLockElement !== renderer.domElement) return;
      yawRef.current -= e.movementX * MOUSE_SENSITIVITY;
      pitchRef.current -= e.movementY * MOUSE_SENSITIVITY;
      const maxPitch = Math.PI / 2 - 0.01;
      pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));
    };
    const handlePointerLockChange = () => {
      if (isFirstPersonRef.current && document.pointerLockElement !== renderer.domElement) {
        controls.enabled = true;
        isFirstPersonRef.current = false;
        setIsFirstPerson(false);
        camera.position.copy(defaultCameraPosRef.current);
        controls.target.copy(defaultCameraTargetRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    initializedRef.current = true;
    return () => {
      initializedRef.current = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    };
  }, [checkCollision, rooms, selectedRoomId, getRoomById, CANVAS_W, CANVAS_H]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(CANVAS_W * 0.6, 18, CANVAS_H * 1.1);
      defaultCameraPosRef.current.copy(camera.position);
      controls.target.set(CANVAS_W / 2, 0, CANVAS_H / 2);
      defaultCameraTargetRef.current.copy(controls.target);
    }
    buildFloors();
    buildWalls();
  }, [buildFloors, buildWalls, CANVAS_W, CANVAS_H]);

  useEffect(() => {
    const group = furnitureGroupRef.current;
    if (!group) return;
    const existingIds = new Set(furnitureMeshesRef.current.keys());
    const currentIds = new Set(allFurniture.map((f) => f.id));
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const furnitureGroup = furnitureMeshesRef.current.get(id);
        if (furnitureGroup) {
          group.remove(furnitureGroup);
          furnitureGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
        furnitureMeshesRef.current.delete(id);
      }
    });
    allFurniture.forEach((item) => updateFurnitureMesh(item));
  }, [allFurniture, updateFurnitureMesh]);

  useEffect(() => {
    const group = windowsGroupRef.current;
    if (!group) return;
    const existingIds = new Set(windowMeshesRef.current.keys());
    const currentIds = new Set(allWindows.map((w) => w.id));
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const winMesh = windowMeshesRef.current.get(id);
        if (winMesh) {
          group.remove(winMesh);
          winMesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
        windowMeshesRef.current.delete(id);
      }
    });
    allWindows.forEach((win) => updateWindowMesh(win));
  }, [allWindows, updateWindowMesh]);

  useEffect(() => {
    const group = curtainsGroupRef.current;
    if (!group) return;
    const existingIds = new Set(curtainMeshesRef.current.keys());
    const currentIds = new Set(allCurtains.map((c) => c.id));
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const curtainMesh = curtainMeshesRef.current.get(id);
        if (curtainMesh) {
          group.remove(curtainMesh);
          curtainMesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }
        curtainMeshesRef.current.delete(id);
      }
    });
    allCurtains.forEach((curtain) => updateCurtainMesh(curtain));
  }, [allCurtains, updateCurtainMesh]);

  useEffect(() => {
    furnitureMeshesRef.current.forEach((group, id) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (id === selectedId) {
            mat.emissive = new THREE.Color(0xf59e0b);
            mat.emissiveIntensity = 0.35;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    });

    windowMeshesRef.current.forEach((group, id) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
          if ('emissive' in mat) {
            if (id === selectedWindowId) {
              mat.emissive = new THREE.Color(0x3b82f6);
              mat.emissiveIntensity = 0.4;
            } else {
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        }
      });
    });

    curtainMeshesRef.current.forEach((group, id) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (id === selectedCurtainId) {
            mat.emissive = new THREE.Color(0x8b5cf6);
            mat.emissiveIntensity = 0.35;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    });
  }, [selectedId, selectedWindowId, selectedCurtainId]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl shadow-[0_8px_40px_rgba(92,74,61,0.12)] border-2 border-stone-300 overflow-hidden"
      style={{
        width: Math.min(1100, window.innerWidth - 600),
        height: 700,
      }}
    >
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        <div className="px-2.5 py-1 bg-white/85 backdrop-blur rounded-md text-[10px] text-stone-600 font-mono border border-stone-200 shadow-sm">
          3D 户型视图 · 拖拽旋转 / 滚轮缩放
        </div>
        {isFirstPerson && (
          <div className="px-2.5 py-1 bg-emerald-500/90 text-white rounded-md text-[10px] font-medium backdrop-blur shadow-sm">
            第一人称漫游 · WASD 移动 · 鼠标视角 · 再按 F 退出
          </div>
        )}
        {!isFirstPerson && (
          <div className="px-2.5 py-1 bg-sky-500/90 text-white rounded-md text-[10px] font-medium backdrop-blur shadow-sm">
            {selectedRoomId ? '按 F 进入选中房间' : '选中房间后按 F 进入漫游'}
          </div>
        )}
      </div>
    </div>
  );
};
