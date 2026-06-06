import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useDesignerStore } from '@/store/useDesignerStore';
import type { FurnitureItem, WallItem } from '@/types/furniture';

const SCALE = 0.01;
const WALL_HEIGHT = 2.5;
const WALL_3D_THICKNESS = 0.08;

const hexToThreeColor = (hex: string): number => {
  try {
    return parseInt(hex.replace('#', ''), 16) || 0x888888;
  } catch {
    return 0x888888;
  }
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

  const cushionGeo = new THREE.BoxGeometry(w * 0.25, h * 0.25, d * 0.12);
  const cushion1 = new THREE.Mesh(cushionGeo, seatMat);
  cushion1.position.set(-w * 0.22, h * 0.52, -d * 0.2);
  cushion1.castShadow = true;
  sofaGroup.add(cushion1);

  const cushion2 = new THREE.Mesh(cushionGeo, seatMat);
  cushion2.position.set(0, h * 0.52, -d * 0.2);
  cushion2.castShadow = true;
  sofaGroup.add(cushion2);

  const cushion3 = new THREE.Mesh(cushionGeo, seatMat);
  cushion3.position.set(w * 0.22, h * 0.52, -d * 0.2);
  cushion3.castShadow = true;
  sofaGroup.add(cushion3);

  return sofaGroup;
};

const createTableMesh = (w: number, d: number, h: number, color: number) => {
  const tableGroup = new THREE.Group();

  const tabletopGeo = new THREE.BoxGeometry(w * 0.95, h * 0.1, d * 0.95);
  const tabletopMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const tabletop = new THREE.Mesh(tabletopGeo, tabletopMat);
  tabletop.position.y = h * 0.65;
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  tableGroup.add(tabletop);

  const legGeo = new THREE.BoxGeometry(w * 0.08, h * 0.6, d * 0.08);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.75, metalness: 0.05 });

  const leg1 = new THREE.Mesh(legGeo, legMat);
  leg1.position.set(-w * 0.35, h * 0.3, -d * 0.35);
  leg1.castShadow = true;
  leg1.receiveShadow = true;
  tableGroup.add(leg1);

  const leg2 = new THREE.Mesh(legGeo, legMat);
  leg2.position.set(w * 0.35, h * 0.3, -d * 0.35);
  leg2.castShadow = true;
  leg2.receiveShadow = true;
  tableGroup.add(leg2);

  const leg3 = new THREE.Mesh(legGeo, legMat);
  leg3.position.set(-w * 0.35, h * 0.3, d * 0.35);
  leg3.castShadow = true;
  leg3.receiveShadow = true;
  tableGroup.add(leg3);

  const leg4 = new THREE.Mesh(legGeo, legMat);
  leg4.position.set(w * 0.35, h * 0.3, d * 0.35);
  leg4.castShadow = true;
  leg4.receiveShadow = true;
  tableGroup.add(leg4);

  return tableGroup;
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

  const soilGeo = new THREE.CylinderGeometry(w * 0.32, w * 0.32, h * 0.08, 16);
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9, metalness: 0 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = h * 0.27;
  soil.castShadow = true;
  plantGroup.add(soil);

  const leafMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02 });

  const stemGeo = new THREE.CylinderGeometry(w * 0.04, w * 0.06, h * 0.35, 8);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5d8a4d, roughness: 0.7, metalness: 0.02 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = h * 0.48;
  stem.castShadow = true;
  plantGroup.add(stem);

  const leaf1Geo = new THREE.SphereGeometry(w * 0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const leaf1 = new THREE.Mesh(leaf1Geo, leafMat);
  leaf1.position.set(-w * 0.12, h * 0.6, 0);
  leaf1.rotation.z = -0.3;
  leaf1.castShadow = true;
  plantGroup.add(leaf1);

  const leaf2 = new THREE.Mesh(leaf1Geo, leafMat);
  leaf2.position.set(w * 0.12, h * 0.62, 0);
  leaf2.rotation.z = 0.3;
  leaf2.castShadow = true;
  plantGroup.add(leaf2);

  const leaf3 = new THREE.Mesh(leaf1Geo, leafMat);
  leaf3.position.set(0, h * 0.65, -d * 0.1);
  leaf3.rotation.x = 0.2;
  leaf3.castShadow = true;
  plantGroup.add(leaf3);

  const topLeafGeo = new THREE.SphereGeometry(w * 0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
  const topLeaf = new THREE.Mesh(topLeafGeo, leafMat);
  topLeaf.position.set(0, h * 0.8, 0);
  topLeaf.castShadow = true;
  plantGroup.add(topLeaf);

  return plantGroup;
};

const createFallbackMesh = (w: number, d: number, h: number, color: number) => {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
};

export const RoomView3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const backWallRef = useRef<THREE.Mesh | null>(null);
  const leftWallRef = useRef<THREE.Mesh | null>(null);
  const innerWallsGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);
  const frameRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const furniture = useDesignerStore((s) => s.furniture);
  const walls = useDesignerStore((s) => s.walls);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const roomWidth = useDesignerStore((s) => s.getRoomWidth());
  const roomHeight = useDesignerStore((s) => s.getRoomHeight());
  const getCatalogEntry = useDesignerStore((s) => s.getCatalogEntry);

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
        case 'plant':
          furnitureGroup = createPlantMesh(w, d, h, itemColor);
          break;
        default:
          furnitureGroup = createFallbackMesh(w, d, h, itemColor);
      }
      buildAndRegister(furnitureGroup);
    },
    [getCatalogEntry]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5efe6);
    scene.fog = new THREE.Fog(0xf5efe6, 8, 25);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
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
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xfff1dd, 0xd9c7a8, 0.5);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfff5e1, 0.9);
    dir.position.set(5, 8, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -8;
    dir.shadow.camera.right = 8;
    dir.shadow.camera.top = 8;
    dir.shadow.camera.bottom = -8;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 25;
    dir.shadow.bias = -0.0005;
    scene.add(dir);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcc4,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    floorRef.current = floor;

    const gridHelper = new THREE.GridHelper(1, 20, 0xc9b897, 0xdcc8a6);
    (gridHelper.material as THREE.Material).opacity = 0.35;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf7f0e4,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(1, WALL_HEIGHT), wallMat);
    backWall.receiveShadow = true;
    scene.add(backWall);
    backWallRef.current = backWall;

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(1, WALL_HEIGHT), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    leftWallRef.current = leftWall;

    const innerWallsGroup = new THREE.Group();
    scene.add(innerWallsGroup);
    innerWallsGroupRef.current = innerWallsGroup;

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    gltfLoaderRef.current = new GLTFLoader();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
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

    initializedRef.current = true;

    return () => {
      initializedRef.current = false;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    const ROOM_W = roomWidth * SCALE;
    const ROOM_H = roomHeight * SCALE;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const floor = floorRef.current;
    const gridHelper = gridHelperRef.current;
    const backWall = backWallRef.current;
    const leftWall = leftWallRef.current;

    if (camera) {
      camera.position.set(ROOM_W * 0.8, 5, ROOM_H * 1.1);
    }
    if (controls) {
      controls.target.set(ROOM_W / 2, 0, ROOM_H / 2);
    }
    if (floor) {
      floor.geometry.dispose();
      floor.geometry = new THREE.PlaneGeometry(ROOM_W, ROOM_H);
      floor.position.set(ROOM_W / 2, 0, ROOM_H / 2);
    }
    if (gridHelper) {
      const scene = sceneRef.current;
      if (scene) scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      const newGrid = new THREE.GridHelper(Math.max(ROOM_W, ROOM_H), 20, 0xc9b897, 0xdcc8a6);
      newGrid.position.set(ROOM_W / 2, 0.002, ROOM_H / 2);
      (newGrid.material as THREE.Material).opacity = 0.35;
      (newGrid.material as THREE.Material).transparent = true;
      sceneRef.current?.add(newGrid);
      gridHelperRef.current = newGrid;
    }
    if (backWall) {
      backWall.geometry.dispose();
      backWall.geometry = new THREE.PlaneGeometry(ROOM_W, WALL_HEIGHT);
      backWall.position.set(ROOM_W / 2, WALL_HEIGHT / 2, 0);
    }
    if (leftWall) {
      leftWall.geometry.dispose();
      leftWall.geometry = new THREE.PlaneGeometry(ROOM_H, WALL_HEIGHT);
      leftWall.position.set(0, WALL_HEIGHT / 2, ROOM_H / 2);
    }
  }, [roomWidth, roomHeight]);

  useEffect(() => {
    const group = innerWallsGroupRef.current;
    const scene = sceneRef.current;
    if (!group || !scene) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.7,
    });

    walls.forEach((wall: WallItem) => {
      const w = wall.width * SCALE;
      const h = wall.height * SCALE;
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, WALL_HEIGHT * 0.25, Math.max(h, WALL_3D_THICKNESS)),
        wallMat
      );
      wallMesh.position.set(
        wall.x * SCALE + w / 2,
        WALL_HEIGHT * 0.125,
        wall.y * SCALE + h / 2
      );
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      group.add(wallMesh);
    });
  }, [walls]);

  useEffect(() => {
    const group = furnitureGroupRef.current;
    if (!group) return;

    const existingIds = new Set(furnitureMeshesRef.current.keys());
    const currentIds = new Set(furniture.map((f) => f.id));

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

    furniture.forEach((item) => {
      updateFurnitureMesh(item);
    });
  }, [furniture, updateFurnitureMesh]);

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
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl shadow-[0_8px_40px_rgba(92,74,61,0.12)] border-2 border-stone-200 overflow-hidden"
      style={{ width: roomWidth, height: roomHeight }}
    >
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-white/80 backdrop-blur rounded-md text-[10px] text-stone-500 font-mono border border-stone-200">
        3D 视图 · 拖拽旋转 / 滚轮缩放
      </div>
    </div>
  );
};
