import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useDesignerStore } from '@/store/useDesignerStore';
import { FURNITURE_CATALOG, ROOM_HEIGHT, ROOM_WIDTH } from '@/data/furnitureData';
import type { FurnitureItem } from '@/types/furniture';

const SCALE = 0.01;
const ROOM_W = ROOM_WIDTH * SCALE;
const ROOM_H = ROOM_HEIGHT * SCALE;
const WALL_HEIGHT = 2.5;

export const RoomView3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const frameRef = useRef<number>(0);

  const furniture = useDesignerStore((s) => s.furniture);
  const selectedId = useDesignerStore((s) => s.selectedId);

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
    camera.position.set(ROOM_W * 0.8, 5, ROOM_H * 1.1);
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
    controls.target.set(ROOM_W / 2, 0, ROOM_H / 2);
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

    const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_H);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcc4,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(ROOM_W / 2, 0, ROOM_H / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(Math.max(ROOM_W, ROOM_H), 20, 0xc9b897, 0xdcc8a6);
    gridHelper.position.set(ROOM_W / 2, 0.002, ROOM_H / 2);
    (gridHelper.material as THREE.Material).opacity = 0.35;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf7f0e4,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, WALL_HEIGHT), wallMat);
    backWall.position.set(ROOM_W / 2, WALL_HEIGHT / 2, 0);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_H, WALL_HEIGHT), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(0, WALL_HEIGHT / 2, ROOM_H / 2);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

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

    return () => {
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
    const group = furnitureGroupRef.current;
    if (!group) return;

    const existingIds = new Set(furnitureMeshesRef.current.keys());
    const currentIds = new Set(furniture.map((f) => f.id));

    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const furnitureGroup = furnitureMeshesRef.current.get(id);
        if (furnitureGroup) {
          group.remove(furnitureGroup);
          // 递归清理所有子对象的几何体和材质
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
  }, [furniture]);

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

  const createBedMesh = (w: number, d: number, h: number, color: number) => {
    const bedGroup = new THREE.Group();

    // 床垫主体
    const mattressGeo = new THREE.BoxGeometry(w * 0.95, h * 0.4, d * 0.95);
    const mattressMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.y = h * 0.4;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);

    // 床架底座
    const baseGeo = new THREE.BoxGeometry(w * 0.95, h * 0.25, d * 0.95);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8, metalness: 0.05 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = h * 0.125;
    base.castShadow = true;
    base.receiveShadow = true;
    bedGroup.add(base);

    // 床头板
    const headboardGeo = new THREE.BoxGeometry(w * 0.95, h * 0.7, d * 0.1);
    const headboard = new THREE.Mesh(headboardGeo, baseMat);
    headboard.position.set(0, h * 0.45, -d * 0.42);
    headboard.castShadow = true;
    headboard.receiveShadow = true;
    bedGroup.add(headboard);

    // 枕头
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

    // 座位
    const seatGeo = new THREE.BoxGeometry(w * 0.9, h * 0.35, d * 0.75);
    const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = h * 0.3;
    seat.castShadow = true;
    seat.receiveShadow = true;
    sofaGroup.add(seat);

    // 靠背
    const backGeo = new THREE.BoxGeometry(w * 0.9, h * 0.5, d * 0.15);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, h * 0.55, -d * 0.27);
    back.castShadow = true;
    back.receiveShadow = true;
    sofaGroup.add(back);

    // 左扶手
    const armGeo = new THREE.BoxGeometry(w * 0.08, h * 0.45, d * 0.75);
    const arm1 = new THREE.Mesh(armGeo, seatMat);
    arm1.position.set(-w * 0.41, h * 0.35, 0);
    arm1.castShadow = true;
    arm1.receiveShadow = true;
    sofaGroup.add(arm1);

    // 右扶手
    const arm2 = new THREE.Mesh(armGeo, seatMat);
    arm2.position.set(w * 0.41, h * 0.35, 0);
    arm2.castShadow = true;
    arm2.receiveShadow = true;
    sofaGroup.add(arm2);

    // 靠垫
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

    // 桌面
    const tabletopGeo = new THREE.BoxGeometry(w * 0.95, h * 0.1, d * 0.95);
    const tabletopMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
    const tabletop = new THREE.Mesh(tabletopGeo, tabletopMat);
    tabletop.position.y = h * 0.65;
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    tableGroup.add(tabletop);

    // 桌腿
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

    // 花盆
    const potGeo = new THREE.CylinderGeometry(w * 0.35, w * 0.3, h * 0.25, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.7, metalness: 0.05 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = h * 0.125;
    pot.castShadow = true;
    pot.receiveShadow = true;
    plantGroup.add(pot);

    // 泥土
    const soilGeo = new THREE.CylinderGeometry(w * 0.32, w * 0.32, h * 0.08, 16);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9, metalness: 0 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = h * 0.27;
    soil.castShadow = true;
    plantGroup.add(soil);

    // 叶子簇
    const leafMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02 });
    
    // 中心主茎
    const stemGeo = new THREE.CylinderGeometry(w * 0.04, w * 0.06, h * 0.35, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x5d8a4d, roughness: 0.7, metalness: 0.02 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = h * 0.48;
    stem.castShadow = true;
    plantGroup.add(stem);

    // 叶子 1
    const leaf1Geo = new THREE.SphereGeometry(w * 0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const leaf1 = new THREE.Mesh(leaf1Geo, leafMat);
    leaf1.position.set(-w * 0.12, h * 0.6, 0);
    leaf1.rotation.z = -0.3;
    leaf1.castShadow = true;
    plantGroup.add(leaf1);

    // 叶子 2
    const leaf2 = new THREE.Mesh(leaf1Geo, leafMat);
    leaf2.position.set(w * 0.12, h * 0.62, 0);
    leaf2.rotation.z = 0.3;
    leaf2.castShadow = true;
    plantGroup.add(leaf2);

    // 叶子 3
    const leaf3 = new THREE.Mesh(leaf1Geo, leafMat);
    leaf3.position.set(0, h * 0.65, -d * 0.1);
    leaf3.rotation.x = 0.2;
    leaf3.castShadow = true;
    plantGroup.add(leaf3);

    // 顶部叶子
    const topLeafGeo = new THREE.SphereGeometry(w * 0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const topLeaf = new THREE.Mesh(topLeafGeo, leafMat);
    topLeaf.position.set(0, h * 0.8, 0);
    topLeaf.castShadow = true;
    plantGroup.add(topLeaf);

    return plantGroup;
  };

  const updateFurnitureMesh = (item: FurnitureItem) => {
    const group = furnitureGroupRef.current;
    if (!group) return;

    const catalog = FURNITURE_CATALOG[item.type];
    const w = item.width * SCALE;
    const d = item.height * SCALE;
    const h = catalog.depth * SCALE;

    // 移除旧的网格
    const existingItem = furnitureMeshesRef.current.get(item.id);
    if (existingItem) {
      group.remove(existingItem);
      // 递归清理所有子对象的几何体和材质
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

    // 根据家具类型创建不同的造型
    let furnitureGroup: THREE.Group;
    switch (item.type) {
      case 'bed':
        furnitureGroup = createBedMesh(w, d, h, catalog.color3D);
        break;
      case 'sofa':
        furnitureGroup = createSofaMesh(w, d, h, catalog.color3D);
        break;
      case 'table':
        furnitureGroup = createTableMesh(w, d, h, catalog.color3D);
        break;
      case 'plant':
        furnitureGroup = createPlantMesh(w, d, h, catalog.color3D);
        break;
      default:
        // 备用：简单方块
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
          color: catalog.color3D,
          roughness: 0.55,
          metalness: 0.08,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        furnitureGroup = new THREE.Group();
        furnitureGroup.add(mesh);
    }

    // 设置位置并保存
    furnitureGroup.position.set(item.x * SCALE + w / 2, 0, item.y * SCALE + d / 2);
    furnitureMeshesRef.current.set(item.id, furnitureGroup);
    group.add(furnitureGroup);
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl shadow-[0_8px_40px_rgba(92,74,61,0.12)] border-2 border-stone-200 overflow-hidden"
      style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}
    >
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-white/80 backdrop-blur rounded-md text-[10px] text-stone-500 font-mono border border-stone-200">
        3D 视图 · 拖拽旋转 / 滚轮缩放
      </div>
    </div>
  );
};
