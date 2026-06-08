import type { MaterialPreset, MaterialCategory, FloorStylePreset, FloorStyleId } from '@/types/furniture';

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

  { id: 'wallpaper-rose', category: 'wallpaper', label: '玫瑰粉', color: '#fce4ec', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperFloral' },
  { id: 'wallpaper-daisy', category: 'wallpaper', label: '雏菊米', color: '#fff8e1', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperFloral' },
  { id: 'wallpaper-lavender', category: 'wallpaper', label: '薰衣草紫', color: '#f3e5f5', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperFloral' },
  { id: 'wallpaper-stripe-blue', category: 'wallpaper', label: '竖条蓝', color: '#e3f2fd', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperStripe' },
  { id: 'wallpaper-stripe-pink', category: 'wallpaper', label: '竖条粉', color: '#fce4ec', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperStripe' },
  { id: 'wallpaper-damask-gold', category: 'wallpaper', label: '锦缎金', color: '#fff8e1', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperDamask' },
  { id: 'wallpaper-damask-silver', category: 'wallpaper', label: '锦缎银灰', color: '#eceff1', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperDamask' },
  { id: 'wallpaper-dot-cream', category: 'wallpaper', label: '波点米黄', color: '#fff8e1', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperDot' },
  { id: 'wallpaper-dot-sage', category: 'wallpaper', label: '波点鼠尾草', color: '#e8f5e9', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperDot' },
  { id: 'wallpaper-vine-green', category: 'wallpaper', label: '藤蔓绿', color: '#e8f5e9', roughness: 0.95, metalness: 0.0, pattern: 'wallpaperVine' },
  { id: 'wallpaper-plain', category: 'wallpaper', label: '素色米白', color: '#faf0e6', roughness: 0.95, metalness: 0.0, pattern: 'none' },
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

const generateWallpaperFloral = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const darken = (v: number, amt: number) => Math.max(0, Math.min(255, v - Math.round(255 * amt)));
  const lighten = (v: number, amt: number) => Math.max(0, Math.min(255, v + Math.round(255 * amt)));
  const petalColor = `rgba(${darken(r, 0.3)},${darken(g, 0.1)},${darken(b, 0.35)},0.75)`;
  const centerColor = `rgba(${lighten(r, 0.05)},${darken(g, 0.4)},${darken(b, 0.5)},0.9)`;
  const leafColor = `rgba(${darken(r, 0.5)},${darken(g, 0.1)},${darken(b, 0.5)},0.6)`;
  for (let y = 16; y < h; y += 44) {
    for (let x = 16; x < w; x += 44) {
      const offsetX = ((y / 44) | 0) % 2 === 0 ? 0 : 22;
      const cx = x + offsetX;
      const cy = y;
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.ellipse(cx - 12, cy + 8, 5, 3, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 12, cy + 8, 5, 3, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = petalColor;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(angle) * 6;
        const py = cy + Math.sin(angle) * 6;
        ctx.beginPath();
        ctx.ellipse(px, py, 4, 6, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = centerColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const generateWallpaperStripe = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const darken = (v: number, amt: number) => Math.max(0, Math.min(255, v - Math.round(255 * amt)));
  const stripeColor = `rgba(${darken(r, 0.2)},${darken(g, 0.2)},${darken(b, 0.2)},0.45)`;
  ctx.fillStyle = stripeColor;
  const stripeW = 6;
  const gap = 14;
  for (let x = 0; x < w; x += stripeW + gap) {
    ctx.fillRect(x, 0, stripeW, h);
  }
  const thinColor = `rgba(${darken(r, 0.4)},${darken(g, 0.4)},${darken(b, 0.4)},0.3)`;
  ctx.fillStyle = thinColor;
  for (let x = gap / 2; x < w; x += stripeW + gap) {
    ctx.fillRect(x, 0, 1, h);
  }
};

const generateWallpaperDamask = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const darken = (v: number, amt: number) => Math.max(0, Math.min(255, v - Math.round(255 * amt)));
  const patColor = `rgba(${darken(r, 0.25)},${darken(g, 0.2)},${darken(b, 0.3)},0.55)`;
  ctx.strokeStyle = patColor;
  ctx.fillStyle = patColor;
  ctx.lineWidth = 1.2;
  for (let y = 20; y < h; y += 52) {
    for (let x = 20; x < w; x += 52) {
      const offsetX = ((y / 52) | 0) % 2 === 0 ? 0 : 26;
      const cx = x + offsetX;
      const cy = y;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14);
      ctx.bezierCurveTo(cx + 10, cy - 10, cx + 12, cy + 4, cx, cy + 14);
      ctx.bezierCurveTo(cx - 12, cy + 4, cx - 10, cy - 10, cx, cy - 14);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.bezierCurveTo(cx - 8, cy - 10, cx + 8, cy - 10, cx + 12, cy);
      ctx.bezierCurveTo(cx + 8, cy + 10, cx - 8, cy + 10, cx - 12, cy);
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.fillStyle = patColor;
    }
  }
};

const generateWallpaperDot = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const darken = (v: number, amt: number) => Math.max(0, Math.min(255, v - Math.round(255 * amt)));
  const bigDot = `rgba(${darken(r, 0.35)},${darken(g, 0.35)},${darken(b, 0.35)},0.65)`;
  const smallDot = `rgba(${darken(r, 0.2)},${darken(g, 0.2)},${darken(b, 0.2)},0.4)`;
  const spacing = 20;
  for (let y = spacing / 2; y < h; y += spacing) {
    for (let x = spacing / 2; x < w; x += spacing) {
      const offsetX = ((y / spacing) | 0) % 2 === 0 ? 0 : spacing / 2;
      ctx.fillStyle = bigDot;
      ctx.beginPath();
      ctx.arc(x + offsetX, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = smallDot;
      ctx.beginPath();
      ctx.arc(x + offsetX + spacing / 2, y + spacing / 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const generateWallpaperVine = (ctx: CanvasRenderingContext2D, w: number, h: number, baseColor: string) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  const darken = (v: number, amt: number) => Math.max(0, Math.min(255, v - Math.round(255 * amt)));
  const stemColor = `rgba(${darken(r, 0.45)},${darken(g, 0.15)},${darken(b, 0.5)},0.6)`;
  const leafColor = `rgba(${darken(r, 0.55)},${darken(g, 0.05)},${darken(b, 0.6)},0.7)`;
  ctx.strokeStyle = stemColor;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = leafColor;
  const colW = 36;
  for (let x = colW / 2; x < w; x += colW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    let dir = 1;
    for (let y = 0; y < h; y += 18) {
      ctx.bezierCurveTo(x + dir * 8, y + 6, x - dir * 8, y + 12, x, y + 18);
      if (y % 36 === 0) {
        ctx.save();
        ctx.translate(x + dir * 6, y + 9);
        ctx.rotate(dir * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      dir *= -1;
    }
    ctx.stroke();
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
    case 'wallpaperFloral':
      generateWallpaperFloral(ctx, size, size, preset.color);
      break;
    case 'wallpaperStripe':
      generateWallpaperStripe(ctx, size, size, preset.color);
      break;
    case 'wallpaperDamask':
      generateWallpaperDamask(ctx, size, size, preset.color);
      break;
    case 'wallpaperDot':
      generateWallpaperDot(ctx, size, size, preset.color);
      break;
    case 'wallpaperVine':
      generateWallpaperVine(ctx, size, size, preset.color);
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

export const FLOOR_STYLE_PRESETS: FloorStylePreset[] = [
  {
    id: 'lightWood',
    label: '浅色木纹',
    color: '#e8d4b8',
    secondaryColor: '#c9a87c',
    roughness: 0.7,
    metalness: 0.02,
    pattern: 'woodGrain',
    repeat: 6,
  },
  {
    id: 'darkWood',
    label: '深色木纹',
    color: '#5c4033',
    secondaryColor: '#3e2a1f',
    roughness: 0.75,
    metalness: 0.03,
    pattern: 'woodGrain',
    repeat: 6,
  },
  {
    id: 'whiteTile',
    label: '白色瓷砖',
    color: '#f5f5f5',
    secondaryColor: '#e0e0e0',
    roughness: 0.35,
    metalness: 0.02,
    pattern: 'ceramicTile',
    repeat: 10,
  },
  {
    id: 'grayCarpet',
    label: '灰色地毯',
    color: '#9a9a9a',
    secondaryColor: '#7a7a7a',
    roughness: 0.98,
    metalness: 0.0,
    pattern: 'carpet',
    repeat: 20,
  },
  {
    id: 'checkerboard',
    label: '棋盘格',
    color: '#fafafa',
    secondaryColor: '#2a2a2a',
    roughness: 0.4,
    metalness: 0.02,
    pattern: 'checkerboard',
    repeat: 16,
  },
  {
    id: 'marbleTile',
    label: '大理石',
    color: '#f0ead6',
    secondaryColor: '#d4cfc0',
    roughness: 0.25,
    metalness: 0.03,
    pattern: 'stoneTile',
    repeat: 8,
  },
  {
    id: 'beigeCarpet',
    label: '米色地毯',
    color: '#d9c9a8',
    secondaryColor: '#b8a57f',
    roughness: 0.98,
    metalness: 0.0,
    pattern: 'carpet',
    repeat: 20,
  },
];

export const DEFAULT_FLOOR_STYLE_ID: FloorStyleId = 'lightWood';

export const getFloorStyleById = (id: string | undefined): FloorStylePreset => {
  if (!id) return FLOOR_STYLE_PRESETS[0];
  return FLOOR_STYLE_PRESETS.find((s) => s.id === id) ?? FLOOR_STYLE_PRESETS[0];
};

const generateCheckerboard = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseColor: string,
  secondaryColor: string
) => {
  const tileSize = w / 8;
  for (let y = 0; y < h; y += tileSize) {
    for (let x = 0; x < w; x += tileSize) {
      const isDark = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isDark ? secondaryColor : baseColor;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
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

const generateCeramicTile = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseColor: string,
  secondaryColor: string
) => {
  const { r, g, b } = hexToRgb(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 0.3 + Math.random() * 1.5;
    const darkness = 0.02 + Math.random() * 0.08;
    const light = Math.random() > 0.5;
    const adjust = (v: number) =>
      light
        ? Math.max(0, Math.min(255, v + Math.round(255 * darkness)))
        : Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.fillStyle = `rgba(${adjust(r)},${adjust(g)},${adjust(b)},0.6)`;
    ctx.fillRect(x, y, size, size);
  }
  const groutColor = secondaryColor;
  ctx.strokeStyle = groutColor;
  ctx.lineWidth = 2;
  const tileSize = w / 4;
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
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.5;
  for (let x = tileSize / 2; x < w; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = tileSize / 2; y < h; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
};

const generateCarpet = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseColor: string,
  secondaryColor: string
) => {
  const { r, g, b } = hexToRgb(baseColor);
  const { r: sr, g: sg, b: sb } = hexToRgb(secondaryColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const useSecondary = Math.random() > 0.6;
    const pr = useSecondary ? sr : r;
    const pg = useSecondary ? sg : g;
    const pb = useSecondary ? sb : b;
    const darkness = -0.15 + Math.random() * 0.3;
    const adjust = (v: number) => Math.max(0, Math.min(255, v + Math.round(255 * darkness)));
    ctx.fillStyle = `rgba(${adjust(pr)},${adjust(pg)},${adjust(pb)},0.5)`;
    ctx.fillRect(x, y, 0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.8);
  }
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const darkness = 0.1 + Math.random() * 0.2;
    const adjust = (v: number) => Math.max(0, Math.min(255, v - Math.round(255 * darkness)));
    ctx.strokeStyle = `rgba(${adjust(r)},${adjust(g)},${adjust(b)},0.25)`;
    ctx.lineWidth = 0.3 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }
};

const floorTextureCache = new Map<string, HTMLCanvasElement>();

export const generateFloorTextureCanvas = (preset: FloorStylePreset, size: number = 512): HTMLCanvasElement => {
  const cacheKey = `${preset.id}-${size}`;
  if (floorTextureCache.has(cacheKey)) {
    return floorTextureCache.get(cacheKey)!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const secondary = preset.secondaryColor ?? preset.color;
  switch (preset.pattern) {
    case 'woodGrain':
      generateWoodGrain(ctx, size, size, preset.color);
      break;
    case 'ceramicTile':
      generateCeramicTile(ctx, size, size, preset.color, secondary);
      break;
    case 'carpet':
      generateCarpet(ctx, size, size, preset.color, secondary);
      break;
    case 'checkerboard':
      generateCheckerboard(ctx, size, size, preset.color, secondary);
      break;
    case 'stoneTile':
      generateStoneTile(ctx, size, size, preset.color);
      break;
    default:
      ctx.fillStyle = preset.color;
      ctx.fillRect(0, 0, size, size);
  }
  floorTextureCache.set(cacheKey, canvas);
  return canvas;
};

export const getFloorStylePreviewDataUrl = (preset: FloorStylePreset, size: number = 64): string => {
  try {
    const canvas = generateFloorTextureCanvas(preset, size);
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
};
