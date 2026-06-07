import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useDesignerStore } from '@/store/useDesignerStore';
import type { FurnitureItem, Room, WindowItem, CurtainItem, Floor, StaircaseArea } from '@/types/furniture';
import { GRID_SIZE, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS, FLOOR_HEIGHT, SLAB_THICKNESS } from '@/data/furnitureData';


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

const floorYOffset = (level: number): number => level * FLOOR_HEIGHT;

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

const createWindowMesh = (win: WindowItem, baseY: number) => {
  const group = new THREE.Group();
  (group as any).userData = {
    type: 'window',
    id: win.id,
    roomId: win.roomId,
  };
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

  group.position.set(posX, baseY + windowBottom + winH / 2, posZ);

  return group;
};

type CurtainGroup = THREE.Group & {
  panels?: Array<{ mesh: THREE.Mesh; originalX: number; originalZ: number; isLeft: boolean }>;
  progress?: number;
  targetProgress?: number;
  curtainW?: number;
  isVerticalWall?: boolean;
};

const createCurtainMesh = (curtain: CurtainItem, win: WindowItem, baseY: number) => {
  const group = new THREE.Group() as CurtainGroup;
  (group as any).userData = {
    type: 'curtain',
    id: curtain.id,
    roomId: curtain.roomId,
    windowId: curtain.windowId,
  };
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

  group.position.set(posX, baseY, posZ);

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
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const floorsGroupRef = useRef<THREE.Group | null>(null);
  const slabsGroupRef = useRef<THREE.Group | null>(null);
  const staircaseGroupRef = useRef<THREE.Group | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const windowsGroupRef = useRef<THREE.Group | null>(null);
  const curtainsGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const windowMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const curtainMeshesRef = useRef<Map<string, CurtainGroup>>(new Map());
  const slabMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);
  const frameRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef(new THREE.Vector2());

  const isFirstPersonRef = useRef(false);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const playerPosRef = useRef(new THREE.Vector3(0, PLAYER_HEIGHT, 0));
  const firstPersonFloorRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const defaultCameraPosRef = useRef(new THREE.Vector3());
  const defaultCameraTargetRef = useRef(new THREE.Vector3());
  const [isFirstPerson, setIsFirstPerson] = useState(false);

  const floors = useDesignerStore((s) => s.floors);
  const currentFloor = useDesignerStore((s) => s.currentFloor);
  const seeThroughMode = useDesignerStore((s) => s.seeThroughMode);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const selectedWindowId = useDesignerStore((s) => s.selectedWindowId);
  const selectedCurtainId = useDesignerStore((s) => s.selectedCurtainId);
  const selectedRoomId = useDesignerStore((s) => s.selectedRoomId);
  const selectFurniture = useDesignerStore((s) => s.selectFurniture);
  const selectWindow = useDesignerStore((s) => s.selectWindow);
  const selectCurtain = useDesignerStore((s) => s.selectCurtain);
  const getCatalogEntry = useDesignerStore((s) => s.getCatalogEntry);
  const getRoomById = useDesignerStore((s) => s.getRoomById);
  const findFloorForRoomId = useDesignerStore((s) => s.findFloorForRoomId);
  const getAllFurnitureForFloor = useDesignerStore((s) => s.getAllFurnitureForFloor);
  const getAutoWallsForFloor = useDesignerStore((s) => s.getAutoWallsForFloor);
  const getAllWindowsForFloor = useDesignerStore((s) => s.getAllWindowsForFloor);
  const getAllCurtainsForFloor = useDesignerStore((s) => s.getAllCurtainsForFloor);
  const getStaircaseAreaForFloor = useDesignerStore((s) => s.getStaircaseAreaForFloor);

  const allFurniture = floors.flatMap((f) => getAllFurnitureForFloor(f.level));
  const allWindows = floors.flatMap((f) => getAllWindowsForFloor(f.level));
  const allCurtains = floors.flatMap((f) => getAllCurtainsForFloor(f.level));

  const CANVAS_W = CANVAS_WIDTH_GRIDS * GRID_SIZE * SCALE;
  const CANVAS_H = CANVAS_HEIGHT_GRIDS * GRID_SIZE * SCALE;
  const BUILDING_HEIGHT = floors.length * FLOOR_HEIGHT;

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
    (pos: THREE.Vector3, floorLevel: number): boolean => {
      const floor = floors.find((f) => f.level === floorLevel);
      if (!floor) return true;
      const rooms = floor.rooms;
      const baseY = floorYOffset(floorLevel);

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
        const autoWalls = getAutoWallsForFloor(floorLevel);
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
    [floors, getAutoWallsForFloor]
  );

  const updateFurnitureMesh = useCallback(
    (item: FurnitureItem, floorLevel: number) => {
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
      const baseY = floorYOffset(floorLevel);
      const buildAndRegister = (furnitureGroup: THREE.Group) => {
        (furnitureGroup as any).userData = {
          type: 'furniture',
          id: item.id,
          roomId: item.roomId,
          floorLevel,
        };
        furnitureGroup.position.set(item.x * SCALE + w / 2, baseY, item.y * SCALE + d / 2);
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
            gltfGroup.position.set(item.x * SCALE + w / 2, baseY, item.y * SCALE + d / 2);
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
    (win: WindowItem, floorLevel: number) => {
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
      const baseY = floorYOffset(floorLevel);
      const winMesh = createWindowMesh(win, baseY);
      windowMeshesRef.current.set(win.id, winMesh);
      group.add(winMesh);
    },
    []
  );

  const updateCurtainMesh = useCallback(
    (curtain: CurtainItem, floorLevel: number) => {
      const group = curtainsGroupRef.current;
      if (!group) return;
      const win = allWindows.find((w) => w.id === curtain.windowId);
      if (!win) return;

      const existing = curtainMeshesRef.current.get(curtain.id);
      if (existing) {
        existing.targetProgress = curtain.isOpen ? 1 : 0;
        return;
      }

      const baseY = floorYOffset(floorLevel);
      const curtainMesh = createCurtainMesh(curtain, win, baseY);
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
    floors.forEach((floor: Floor) => {
      const baseY = floorYOffset(floor.level);
      floor.rooms.forEach((room: Room) => {
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
        const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set(rx + rw / 2, baseY, ry + rh / 2);
        floorMesh.receiveShadow = true;
        floorMesh.userData = { type: 'roomFloor', floorLevel: floor.level };
        group.add(floorMesh);
      });
    });
  }, [floors]);

  const buildSlabs = useCallback(() => {
    const group = slabsGroupRef.current;
    if (!group) return;
    clearGroup(group);
    slabMeshesRef.current.clear();

    const slabW = CANVAS_W;
    const slabD = CANVAS_H;

    for (let i = 0; i <= floors.length; i++) {
      const isCeiling = i === floors.length;
      const isGround = i === 0;
      const slabGeo = new THREE.BoxGeometry(slabW, SLAB_THICKNESS, slabD);
      let slabMat: THREE.MeshStandardMaterial;
      if (isCeiling) {
        slabMat = new THREE.MeshStandardMaterial({
          color: 0xe8e0d0,
          roughness: 0.9,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
      } else if (isGround) {
        slabMat = new THREE.MeshStandardMaterial({
          color: 0x5a4a3a,
          roughness: 0.9,
          metalness: 0.02,
        });
      } else {
        slabMat = new THREE.MeshStandardMaterial({
          color: 0x887766,
          roughness: 0.85,
          metalness: 0.02,
        });
      }
      const slab = new THREE.Mesh(slabGeo, slabMat);
      const slabY = i * FLOOR_HEIGHT - SLAB_THICKNESS / 2;
      slab.position.set(slabW / 2, slabY, slabD / 2);
      slab.receiveShadow = true;
      slab.castShadow = true;
      slab.userData = { type: isCeiling ? 'ceiling' : 'slab', floorLevel: i, isCeiling };
      group.add(slab);
      slabMeshesRef.current.set(i, slab);
    }
  }, [floors.length, CANVAS_W, CANVAS_H]);

  const buildStaircase = useCallback(() => {
    const group = staircaseGroupRef.current;
    if (!group) return;
    clearGroup(group);

    const stairMat = new THREE.MeshStandardMaterial({
      color: 0x6b5344,
      roughness: 0.75,
      metalness: 0.05,
    });

    floors.forEach((floor) => {
      if (!floor.staircaseArea) return;
      const { x, y, widthGrids, heightGrids } = floor.staircaseArea;
      const baseY = floorYOffset(floor.level);
      const sx = x * GRID_SIZE * SCALE;
      const sz = y * GRID_SIZE * SCALE;
      const sw = widthGrids * GRID_SIZE * SCALE;
      const sd = heightGrids * GRID_SIZE * SCALE;

      const stairH = WALL_HEIGHT;
      const stairGeo = new THREE.BoxGeometry(sw, stairH, sd);
      const stair = new THREE.Mesh(stairGeo, stairMat.clone());
      stair.position.set(sx + sw / 2, baseY + stairH / 2, sz + sd / 2);
      stair.castShadow = true;
      stair.receiveShadow = true;
      (stair as any).userData = { type: 'staircase', floorLevel: floor.level };

      const stepCount = Math.floor(FLOOR_HEIGHT / 0.18);
      for (let s = 0; s < stepCount; s++) {
        const stepH = 0.18;
        const stepGeo = new THREE.BoxGeometry(sw * 0.6, stepH * 0.95, sd * 0.9);
        const stepMat = new THREE.MeshStandardMaterial({
          color: 0x8b6f47,
          roughness: 0.7,
          metalness: 0.05,
        });
        const step = new THREE.Mesh(stepGeo, stepMat);
        const t = s / (stepCount - 1);
        const stepY = baseY + t * (FLOOR_HEIGHT - stepH);
        const stepZ = sz + sd * 0.1 + t * sd * 0.8;
        step.position.set(sx + sw / 2, stepY + stepH / 2, stepZ);
        step.castShadow = true;
        step.receiveShadow = true;
        step.userData = { type: 'staircaseStep', floorLevel: floor.level };
        group.add(step);
      }

      group.add(stair);
    });
  }, [floors]);

  const updateSeeThroughVisibility = useCallback(() => {
    slabMeshesRef.current.forEach((slab, level) => {
      if (!seeThroughMode) {
        slab.visible = true;
        (slab.material as THREE.MeshStandardMaterial).opacity = 1;
        (slab.material as THREE.MeshStandardMaterial).transparent = false;
      } else {
        if (level > currentFloor + 1) {
          slab.visible = false;
        } else if (level === currentFloor + 1) {
          slab.visible = false;
        } else {
          slab.visible = true;
          (slab.material as THREE.MeshStandardMaterial).opacity = 1;
          (slab.material as THREE.MeshStandardMaterial).transparent = false;
        }
      }
    });

    const setFloorContentVisibility = (group: THREE.Group | null, visibleFn: (level: number) => boolean) => {
      if (!group) return;
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
          const ud = (obj as any).userData;
          if (ud && typeof ud.floorLevel === 'number') {
            obj.visible = visibleFn(ud.floorLevel);
          }
        }
      });
    };

    const visibleFn = (level: number) => !seeThroughMode || level <= currentFloor;

    setFloorContentVisibility(wallsGroupRef.current, visibleFn);
    setFloorContentVisibility(furnitureGroupRef.current, visibleFn);
    setFloorContentVisibility(windowsGroupRef.current, visibleFn);
    setFloorContentVisibility(curtainsGroupRef.current, visibleFn);
    setFloorContentVisibility(staircaseGroupRef.current, visibleFn);
    setFloorContentVisibility(floorsGroupRef.current, visibleFn);
  }, [seeThroughMode, currentFloor]);

  const buildWalls = useCallback(() => {
    const group = wallsGroupRef.current;
    if (!group) return;
    clearGroup(group);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xd9cfc2,
      roughness: 0.85,
      metalness: 0.02,
    });
    floors.forEach((floor) => {
      const baseY = floorYOffset(floor.level);
      const autoWalls = getAutoWallsForFloor(floor.level);
      autoWalls.forEach((wall) => {
        const wx = wall.x * SCALE;
        const wy = wall.y * SCALE;
        const ww = Math.max(wall.width * SCALE, 0.04);
        const wh = Math.max(wall.height * SCALE, 0.04);
        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, WALL_HEIGHT, wh), wallMat);
        wallMesh.position.set(wx + ww / 2, baseY + WALL_HEIGHT / 2, wy + wh / 2);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        wallMesh.userData = { type: 'wall', floorLevel: floor.level };
        group.add(wallMesh);
      });
    });
  }, [floors, getAutoWallsForFloor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new THREE.Scene();

    const skyGeo = new THREE.SphereGeometry(200, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xe0f6ff) },
        offset: { value: 30 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelMatrix * vec4(position, 1.0);
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

    scene.fog = new THREE.Fog(0xc9e8f7, 30, 120);
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 400);
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
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0xd9c7a8, 0.5);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff5e1, 1.0);
    dir.position.set(CANVAS_W * 0.3, 30 + BUILDING_HEIGHT, CANVAS_H * 0.3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -CANVAS_W * 2;
    dir.shadow.camera.right = CANVAS_W * 3;
    dir.shadow.camera.top = CANVAS_H * 3;
    dir.shadow.camera.bottom = -CANVAS_H * 2;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 200;
    dir.shadow.bias = -0.0005;
    scene.add(dir);
    const bgGeo = new THREE.PlaneGeometry(CANVAS_W * 3, CANVAS_H * 3);
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

    raycasterRef.current = new THREE.Raycaster();

    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    const floorsGroup = new THREE.Group();
    buildingGroup.add(floorsGroup);
    floorsGroupRef.current = floorsGroup;

    const slabsGroup = new THREE.Group();
    buildingGroup.add(slabsGroup);
    slabsGroupRef.current = slabsGroup;

    const staircaseGroup = new THREE.Group();
    buildingGroup.add(staircaseGroup);
    staircaseGroupRef.current = staircaseGroup;

    const wallsGroup = new THREE.Group();
    buildingGroup.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    const windowsGroup = new THREE.Group();
    buildingGroup.add(windowsGroup);
    windowsGroupRef.current = windowsGroup;

    const curtainsGroup = new THREE.Group();
    buildingGroup.add(curtainsGroup);
    curtainsGroupRef.current = curtainsGroup;

    const furnitureGroup = new THREE.Group();
    buildingGroup.add(furnitureGroup);
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
          if (!checkCollision(newPos, firstPersonFloorRef.current)) {
            playerPosRef.current.copy(newPos);
          } else {
            const tryX = playerPosRef.current.clone();
            tryX.x = newPos.x;
            if (!checkCollision(tryX, firstPersonFloorRef.current)) playerPosRef.current.x = newPos.x;
            const tryZ = playerPosRef.current.clone();
            tryZ.z = newPos.z;
            if (!checkCollision(tryZ, firstPersonFloorRef.current)) playerPosRef.current.z = newPos.z;
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

    const handleClick = (event: MouseEvent) => {
      if (!renderer || !scene || !camera) return;
      
      if (isFirstPersonRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current?.setFromCamera(mouseRef.current, camera);

      const clickableObjects: THREE.Object3D[] = [];
      
      furnitureMeshesRef.current.forEach((mesh) => clickableObjects.push(mesh));
      
      windowMeshesRef.current.forEach((mesh) => clickableObjects.push(mesh));
      
      curtainMeshesRef.current.forEach((mesh) => clickableObjects.push(mesh));

      const intersects = raycasterRef.current?.intersectObjects(clickableObjects, true) || [];

      if (intersects.length > 0) {
        let selectedObject: THREE.Object3D | null = null;
        for (const intersect of intersects) {
          let obj: THREE.Object3D | null = intersect.object;
          while (obj) {
            if ((obj as any).userData && (obj as any).userData.type) {
              selectedObject = obj;
              break;
            }
            obj = obj.parent;
          }
          if (selectedObject) break;
        }

        if (selectedObject) {
          const userData = (selectedObject as any).userData;
          if (userData.type === 'furniture') {
            selectFurniture(userData.id);
          } else if (userData.type === 'window') {
            selectWindow(userData.id);
          } else if (userData.type === 'curtain') {
            selectCurtain(userData.id);
          }
        }
      }
    };
    renderer.domElement.addEventListener('click', handleClick);
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyF') {
        if (!isFirstPersonRef.current) {
          const room = selectedRoomId ? getRoomById(selectedRoomId) : undefined;
          let startRoom: Room | undefined = room;
          let startFloor = currentFloor;
          if (room) {
            const f = findFloorForRoomId(room.id);
            if (f !== undefined) startFloor = f;
          }
          if (!startRoom) {
            const currentFloorData = floors.find((f) => f.level === currentFloor);
            if (currentFloorData && currentFloorData.rooms.length > 0) {
              startRoom = currentFloorData.rooms[0];
            }
          }
          if (startRoom) {
            const baseY = floorYOffset(startFloor);
            const rx = startRoom.x * GRID_SIZE * SCALE;
            const ry = startRoom.y * GRID_SIZE * SCALE;
            const rw = startRoom.widthGrids * GRID_SIZE * SCALE;
            const rh = startRoom.heightGrids * GRID_SIZE * SCALE;
            playerPosRef.current.set(rx + rw / 2, baseY + PLAYER_HEIGHT, ry + rh / 2);
            firstPersonFloorRef.current = startFloor;
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
      renderer.domElement.removeEventListener('click', handleClick);
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
  }, [checkCollision, floors, selectedRoomId, getRoomById, CANVAS_W, CANVAS_H, BUILDING_HEIGHT, selectFurniture, selectWindow, selectCurtain, findFloorForRoomId, currentFloor]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      const centerY = BUILDING_HEIGHT / 2;
      camera.position.set(CANVAS_W * 0.8, centerY + 18, CANVAS_H * 1.6);
      defaultCameraPosRef.current.copy(camera.position);
      controls.target.set(CANVAS_W / 2, centerY, CANVAS_H / 2);
      defaultCameraTargetRef.current.copy(controls.target);
    }
    buildFloors();
    buildSlabs();
    buildStaircase();
    buildWalls();
    updateSeeThroughVisibility();
  }, [buildFloors, buildSlabs, buildStaircase, buildWalls, updateSeeThroughVisibility, CANVAS_W, CANVAS_H, BUILDING_HEIGHT]);

  useEffect(() => {
    updateSeeThroughVisibility();
  }, [updateSeeThroughVisibility]);

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
    allFurniture.forEach((item) => {
      const floorIdx = findFloorForRoomId(item.roomId);
      if (floorIdx !== undefined) {
        updateFurnitureMesh(item, floorIdx);
      }
    });
  }, [allFurniture, updateFurnitureMesh, findFloorForRoomId]);

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
    allWindows.forEach((win) => {
      const floorIdx = findFloorForRoomId(win.roomId);
      if (floorIdx !== undefined) {
        updateWindowMesh(win, floorIdx);
      }
    });
  }, [allWindows, updateWindowMesh, findFloorForRoomId]);

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
    allCurtains.forEach((curtain) => {
      const floorIdx = findFloorForRoomId(curtain.roomId);
      if (floorIdx !== undefined) {
        updateCurtainMesh(curtain, floorIdx);
      }
    });
  }, [allCurtains, updateCurtainMesh, findFloorForRoomId]);

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
          3D 多层户型视图 · 共 {floors.length} 层 · 拖拽旋转 / 滚轮缩放
        </div>
        {seeThroughMode && (
          <div className="px-2.5 py-1 bg-cyan-500/90 text-white rounded-md text-[10px] font-medium backdrop-blur shadow-sm">
            透视模式 · 隐藏 {currentFloor + 2}F 及以上所有内容
          </div>
        )}
        {isFirstPerson && (
          <div className="px-2.5 py-1 bg-emerald-500/90 text-white rounded-md text-[10px] font-medium backdrop-blur shadow-sm">
            第一人称漫游 · {firstPersonFloorRef.current + 1}F · WASD 移动 · 再按 F 退出
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