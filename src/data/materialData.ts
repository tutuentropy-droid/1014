import type { MaterialPreset, MaterialCategory } from '@/types/furniture';

export const MATERIAL_CATEGORIES: { key: MaterialCategory; label: string; icon: string }[] = [
  { key: 'wood', label: '木材', icon: '🪵' },
  { key: 'fabric', label: '布料', icon: '🧵' },
  { key: 'metal', label: '金属', icon: '🔩' },
  { key: 'stone', label: '石材', icon: '🪨' },
  { key: 'wallpaper', label: '墙纸', icon: '🎨' },
];

export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: 'wood-oak', category: 'wood', label: '橡木', color: '#c19a6b', roughness: 0.75, metalness: 0.02, pattern: 'woodGrain' },
  { id: 'wood-walnut', category: 'wood', label: '胡桃木', color: '#5c4033', roughness: 0.7, metalness: 0.03, pattern: 'woodGrain' },
  { id: 'wood-maple', category: 'wood', label: '枫木', color: '#e8d4b8', roughness: 0.65, metalness: 0.02, pattern: 'woodGrain' },
  { id: 'wood-cherry', category: 'wood', label: '樱桃木', color: '#8b4513', roughness: 0.7, metalness: 0.02, pattern: 'woodGrain' },
  { id: 'wood-teak', category: 'wood', label: '柚木', color: '#a0522d', roughness: 0.75, metalness: 0.03, pattern: 'woodGrain' },

  { id: 'fabric-velvet', category: 'fabric', label: '丝绒蓝', color: '#4a5568', roughness: 0.95, metalness: 0.0, pattern: 'fabricWeave' },
  { id: 'fabric-linen', category: 'fabric', label: '亚麻米', color: '#e8e0d0', roughness: 0.95, metalness: 0.0, pattern: 'fabricWeave' },
  { id: 'fabric-wool', category: 'fabric', label: '羊毛灰', color: '#708090', roughness: 0.98, metalness: 0.0, pattern: 'fabricWeave' },
  { id: 'fabric-leather', category: 'fabric', label: '皮革棕', color: '#8b4513', roughness: 0.55, metalness: 0.05, pattern: 'fabricWeave' },
  { id: 'fabric-cotton', category: 'fabric', label: '棉米白', color: '#f5f5dc', roughness: 0.95, metalness: 0.0, pattern: 'fabricWeave' },

  { id: 'metal-steel', category: 'metal', label: '不锈钢', color: '#b8b8b8', roughness: 0.25, metalness: 0.9, pattern: 'metalBrushed' },
  { id: 'metal-brass', category: 'metal', label: '黄铜', color: '#cd9b1d', roughness: 0.35, metalness: 0.85, pattern: 'metalBrushed' },
  { id: 'metal-copper', category: 'metal', label: '紫铜', color: '#b87333', roughness: 0.4, metalness: 0.85, pattern: 'metalBrushed' },
  { id: 'metal-iron', category: 'metal', label: '黑铁', color: '#2f2f2f', roughness: 0.6, metalness: 0.8, pattern: 'metalBrushed' },
  { id: 'metal-gold', category: 'metal', label: '哑光金', color: '#d4af37', roughness: 0.3, metalness: 0.95, pattern: 'metalBrushed' },

  { id: 'stone-marble', category: 'stone', label: '大理石', color: '#f0ead6', roughness: 0.3, metalness: 0.02, pattern: 'stoneTile' },
  { id: 'stone-granite', category: 'stone', label: '花岗岩', color: '#696969', roughness: 0.85, metalness: 0.02, pattern: 'stoneTile' },
  { id: 'stone-slate', category: 'stone', label: '板岩灰', color: '#36454f', roughness: 0.9, metalness: 0.02, pattern: 'stoneTile' },
  { id: 'stone-travertine', category: 'stone', label: '洞石米', color: '#d2b48c', roughness: 0.8, metalness: 0.02, pattern: 'stoneTile' },
  { id: 'stone-concrete', category: 'stone', label: '清水混凝土', color: '#808080', roughness: 0.95, metalness: 0.0, pattern: 'stoneTile' },

  { id: 'wallpaper-floral', category: 'wallpaper', label: '碎花米', color: '#fdf5e6', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperPattern' },
  { id: 'wallpaper-stripe', category: 'wallpaper', label: '条纹蓝', color: '#b0c4de', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperPattern' },
  { id: 'wallpaper-geometric', category: 'wallpaper', label: '几何灰', color: '#d3d3d3', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperPattern' },
  { id: 'wallpaper-plain', category: 'wallpaper', label: '素色米白', color: '#faf0e6', roughness: 0.95, metalness: 0.0, pattern: 'none' },
  { id: 'wallpaper-mint', category: 'wallpaper', label: '薄荷绿', color: '#98fb98', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperPattern' },
];

export const DEFAULT_WALL_MATERIAL_ID = 'wallpaper-plain';

export const getMaterialById = (id: string): MaterialPreset | undefined => {
  return MATERIAL_PRESETS.find((m) => m.id === id);
};

export const getMaterialsByCategory = (category: MaterialCategory): MaterialPreset[] => {
  return MATERIAL_PRESETS.filter((m) => m.category === category);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 128, g: 128, b: 128 };
};

const generateWoodGrain = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * h;
    const lineH = 1 + Math.random() * 3;
    const darkness = 0.08 + Math.random() * 0.15;
    const darken = (v: number) => Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.fillStyle = `rgb(${darken(r)},${darken(g)},${darken(b)})`;
    ctx.fillRect(0, y, w, lineH);
  }
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const rad = 3 + Math.random() * 8;
    const darkness = 0.05 + Math.random() * 0.1;
    const darken = (v: number) => Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.strokeStyle = `rgb(${darken(r)},${darken(g)},${darken(b)})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
};

const generateFabricWeave = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const size = 2;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      const isDark = ((x / size) + (y / size)) % 2 === 0;
      const darkness = isDark ? 0.05 : -0.03;
      const adjust = (v: number) => Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
      ctx.fillStyle = `rgb(${adjust(r)},${adjust(g)},${adjust(b)})`;
      ctx.fillRect(x, y, size, size);
    }
  }
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const darkness = 0.02 + Math.random() * 0.05;
    const darken = (v: number) => Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.fillStyle = `rgb(${darken(r)},${darken(g)},${darken(b)})`;
    ctx.fillRect(x, y, 1, 1);
  }
};

const generateMetalBrushed = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) {
    const y = Math.random() * h;
    const lineH = 0.3 + Math.random() * 0.8;
    const darkness = 0.03 + Math.random() * 0.12;
    const light = Math.random() > 0.5;
    const adjust = (v: number) =>
      light
        ? Math.max(0, Math.min(255, v + Math.round(255 * darkness)))
        : Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.fillStyle = `rgb(${adjust(r)},${adjust(g)},${adjust(b)})`;
    ctx.fillRect(0, y, w, lineH);
  }
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, `rgba(255,255,255,0.08)`);
  grad.addColorStop(0.5, `rgba(255,255,255,0)`);
  grad.addColorStop(1, `rgba(0,0,0,0.08)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
};

const generateStoneTile = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 0.5 + Math.random() * 2;
    const darkness = 0.02 + Math.random() * 0.15;
    const light = Math.random() > 0.5;
    const adjust = (v: number) =>
      light
        ? Math.max(0, Math.min(255, v + Math.round(255 * darkness)))
        : Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.fillStyle = `rgb(${adjust(r)},${adjust(g)},${adjust(b)})`;
    ctx.fillRect(x, y, size, size);
  }
  ctx.strokeStyle = `rgba(0,0,0,0.15)`;
  ctx.lineWidth = 1;
  const tileSize = w / 2;
  for (let x = 0; x <= w; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
};

const generateWallpaperPattern = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const darken = (v: number, amt: number) => Math.max(0, Math.min(255, v - Math.round(255 * amt)));
  const patternColor = `rgba(${darken(r, 0.25)},${darken(g, 0.25)},${darken(b, 0.25)},0.5)`;
  ctx.fillStyle = patternColor;
  for (let y = 10; y < h; y += 24) {
    for (let x = 10; x < w; x += 24) {
      const offsetX = (y / 24) % 2 === 0 ? 0 : 12;
      const cx = x + offsetX;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = i % 2 === 0 ? 5 : 2.5;
        const px = cx + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
};

export const generateTextureCanvas = (preset: MaterialPreset, size: number = 256): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  switch (preset.pattern) {
    case 'woodGrain':
      generateWoodGrain(ctx, size, size, preset.color);
      break;
    case 'fabricWeave':
      generateFabricWeave(ctx, size, size, preset.color);
      break;
    case 'metalBrushed':
      generateMetalBrushed(ctx, size, size, preset.color);
      break;
    case 'stoneTile':
      generateStoneTile(ctx, size, size, preset.color);
      break;
    case 'wallpaperPattern':
      generateWallpaperPattern(ctx, size, size, preset.color);
      break;
    default:
      ctx.fillStyle = preset.color;
      ctx.fillRect(0, 0, size, size);
  }
  return canvas;
};

export const getMaterialPreviewDataUrl = (preset: MaterialPreset, size: number = 64): string => {
  try {
    const canvas = generateTextureCanvas(preset, size);
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
};
