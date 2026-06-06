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
  const furnitureMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
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
        const mesh = furnitureMeshesRef.current.get(id);
        if (mesh) {
          group.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        }
        furnitureMeshesRef.current.delete(id);
      }
    });

    furniture.forEach((item) => {
      updateFurnitureMesh(item);
    });
  }, [furniture]);

  useEffect(() => {
    furnitureMeshesRef.current.forEach((mesh, id) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (id === selectedId) {
        mat.emissive = new THREE.Color(0xf59e0b);
        mat.emissiveIntensity = 0.35;
      } else {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [selectedId]);

  const updateFurnitureMesh = (item: FurnitureItem) => {
    const group = furnitureGroupRef.current;
    if (!group) return;

    const catalog = FURNITURE_CATALOG[item.type];
    const w = item.width * SCALE;
    const d = item.height * SCALE;
    const h = catalog.depth * SCALE;

    let mesh = furnitureMeshesRef.current.get(item.id);
    if (!mesh) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: catalog.color3D,
        roughness: 0.55,
        metalness: 0.08,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      furnitureMeshesRef.current.set(item.id, mesh);
      group.add(mesh);
    } else {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.BoxGeometry(w, h, d);
    }

    mesh.position.set(item.x * SCALE + w / 2, h / 2, item.y * SCALE + d / 2);
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
