import { useRef, useState } from 'react';
import { Plus, Upload, X, ChevronDown, ChevronRight, Palette } from 'lucide-react';
import { FurnitureIcon } from './FurnitureIcon';
import { useDesignerStore } from '@/store/useDesignerStore';
import { GRID_SIZE, MAX_FURNITURE_GRIDS, MIN_FURNITURE_GRIDS } from '@/data/furnitureData';
import type { FurnitureType, CustomFurnitureCatalogEntry, FurnitureStyleVariant } from '@/types/furniture';

interface FurniturePaletteProps {
  onDragStart: (type: FurnitureType) => void;
  onDragEnd: () => void;
}

export const FurniturePalette = ({ onDragStart, onDragEnd }: FurniturePaletteProps) => {
  const { getAllFurnitureTypes, getCatalogEntry, addCustomFurnitureType } = useDesignerStore();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadColor, setUploadColor] = useState('#9ca3af');
  const [uploadWidthGrids, setUploadWidthGrids] = useState(2);
  const [uploadHeightGrids, setUploadHeightGrids] = useState(2);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);
  const [modelDataUrl, setModelDataUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>('');
  const iconInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const furnitureTypes = getAllFurnitureTypes();

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, type: FurnitureType, variantId?: string) => {
    e.dataTransfer.setData('furniture-type', String(type));
    if (variantId) {
      e.dataTransfer.setData('furniture-variant', variantId);
    }
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(type);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setIconDataUrl(result);
      setIconPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModelName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setModelDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setUploadLabel('');
    setUploadColor('#9ca3af');
    setUploadWidthGrids(2);
    setUploadHeightGrids(2);
    setIconPreview(null);
    setIconDataUrl(null);
    setModelDataUrl(null);
    setModelName('');
    if (iconInputRef.current) iconInputRef.current.value = '';
    if (modelInputRef.current) modelInputRef.current.value = '';
  };

  const handleConfirmUpload = () => {
    if (!uploadLabel.trim() || !iconDataUrl) return;
    const typeId = `custom-${Date.now()}`;
    const entry: CustomFurnitureCatalogEntry = {
      label: uploadLabel.trim(),
      width: uploadWidthGrids * GRID_SIZE,
      height: uploadHeightGrids * GRID_SIZE,
      color: uploadColor,
      color3D: parseInt(uploadColor.replace('#', ''), 16) || 0x888888,
      depth: 60,
      iconUrl: iconDataUrl,
      modelUrl: modelDataUrl || undefined,
      isCustom: true,
    };
    addCustomFurnitureType(typeId, entry);
    resetUploadForm();
  };

  const renderVariantItem = (type: FurnitureType, variant: FurnitureStyleVariant, baseEntry: CustomFurnitureCatalogEntry) => {
    const resolvedWidth = variant.width ?? baseEntry.width;
    const resolvedHeight = variant.height ?? baseEntry.height;
    const styleLabelMap: Record<string, { label: string; color: string }> = {
      modern: { label: '现代', color: 'bg-sky-100 text-sky-700 border-sky-200' },
      classic: { label: '经典', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      minimal: { label: '极简', color: 'bg-stone-100 text-stone-700 border-stone-200' },
      vintage: { label: '复古', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    };
    const styleInfo = variant.iconStyle ? styleLabelMap[variant.iconStyle] : null;
    return (
      <div
        key={variant.id}
        draggable
        onDragStart={(e) => handleDragStart(e, type, variant.id)}
        onDragEnd={handleDragEnd}
        className="group relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${variant.color}12 0%, #ffffff 60%, ${variant.accentColor || variant.color}08 100%)`,
          borderColor: 'rgba(214, 211, 209, 0.6)',
        }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${variant.color}25 0%, transparent 60%)`,
          }}
        />
        {styleInfo && (
          <span className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${styleInfo.color}`}>
            {styleInfo.label}
          </span>
        )}
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          <div
            className="absolute -inset-2 rounded-xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-300"
            style={{ backgroundColor: variant.color }}
          />
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border"
            style={{
              background: `linear-gradient(135deg, ${variant.color}20 0%, ${variant.color}08 100%)`,
              borderColor: `${variant.color}40`,
            }}
          >
            <FurnitureIcon
              type={type}
              size={34}
              color={variant.color}
              iconUrl={baseEntry.iconUrl}
              variant={variant}
            />
          </div>
        </div>
        <span className="relative z-10 mt-2 text-xs font-semibold text-stone-800 text-center leading-tight tracking-tight">
          {variant.label}
        </span>
        <span className="relative z-10 mt-0.5 text-[10px] text-stone-400 font-mono">
          {Math.round(resolvedWidth / GRID_SIZE)}×{Math.round(resolvedHeight / GRID_SIZE)} 格
        </span>
        <div className="relative z-10 mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white border border-stone-200 shadow-sm">
            <div
              className="w-3 h-3 rounded-full border border-stone-300"
              style={{ backgroundColor: variant.color }}
              title="主色"
            />
            {variant.accentColor && (
              <div
                className="w-3 h-3 rounded-full border border-stone-300"
                style={{ backgroundColor: variant.accentColor }}
                title="配色"
              />
            )}
          </div>
          {variant.texture && (
            <span className="text-[9px] px-1.5 py-1 rounded-md bg-stone-50 text-stone-500 border border-stone-200 font-medium">
              {variant.texture === 'woodGrain' ? '木纹' :
               variant.texture === 'fabricWeave' ? '布艺' :
               variant.texture === 'metalBrushed' ? '金属' :
               variant.texture === 'leather' ? '皮革' :
               variant.texture === 'marble' ? '大理石' : ''}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderDefaultItem = (type: FurnitureType, item: CustomFurnitureCatalogEntry) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, type)}
      onDragEnd={handleDragEnd}
      className="group flex flex-col items-center justify-center p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-amber-50 hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="transition-transform duration-200 group-hover:scale-110">
        <FurnitureIcon
          type={type}
          size={44}
          color={item.color}
          iconUrl={item.iconUrl}
        />
      </div>
      <span className="mt-2 text-sm font-medium text-stone-700">{item.label}</span>
      <span className="mt-0.5 text-[10px] text-stone-400">
        {item.width}×{item.height}
      </span>
      {item.isCustom && (
        <span className="mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
          自定义
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.08)] border border-stone-100">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/30">
            <div className="absolute inset-0.5 rounded-md bg-gradient-to-br from-amber-300/50 to-transparent" />
            <Palette className="w-4 h-4 text-white relative z-10" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-stone-800 tracking-tight leading-none">家具库</h2>
            <p className="text-[10px] text-stone-400 mt-0.5 font-medium">精选多款设计风格</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            showUpload
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
              : 'bg-stone-100 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 text-stone-600 hover:text-amber-700 border border-stone-200 hover:border-amber-200'
          }`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          上传
        </button>
      </div>

      {showUpload && (
        <div className="flex flex-col gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">添加自定义家具</span>
            <button onClick={resetUploadForm} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-600">名称</label>
            <input
              type="text"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              placeholder="例如：书柜"
              className="px-3 py-1.5 text-sm bg-white rounded-lg border border-stone-200 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600">宽（格）</label>
              <input
                type="number"
                min={MIN_FURNITURE_GRIDS}
                max={MAX_FURNITURE_GRIDS}
                value={uploadWidthGrids}
                onChange={(e) =>
                  setUploadWidthGrids(Math.max(MIN_FURNITURE_GRIDS, Math.min(MAX_FURNITURE_GRIDS, parseInt(e.target.value) || MIN_FURNITURE_GRIDS)))
                }
                className="px-3 py-1.5 text-sm bg-white rounded-lg border border-stone-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600">高（格）</label>
              <input
                type="number"
                min={MIN_FURNITURE_GRIDS}
                max={MAX_FURNITURE_GRIDS}
                value={uploadHeightGrids}
                onChange={(e) =>
                  setUploadHeightGrids(Math.max(MIN_FURNITURE_GRIDS, Math.min(MAX_FURNITURE_GRIDS, parseInt(e.target.value) || MIN_FURNITURE_GRIDS)))
                }
                className="px-3 py-1.5 text-sm bg-white rounded-lg border border-stone-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-600">颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={uploadColor}
                onChange={(e) => setUploadColor(e.target.value)}
                className="w-10 h-8 rounded-lg border border-stone-200 cursor-pointer bg-transparent"
              />
              <span className="text-xs text-stone-500 font-mono">{uploadColor}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-600">2D 图标（图片）</label>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              className="text-xs text-stone-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
            />
            {iconPreview && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200">
                <img src={iconPreview} alt="preview" className="w-10 h-10 object-contain" />
                <span className="text-xs text-stone-500">已上传图标</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-600">
              3D 模型（.gltf / .glb，可选）
            </label>
            <input
              ref={modelInputRef}
              type="file"
              accept=".gltf,.glb"
              onChange={handleModelUpload}
              className="text-xs text-stone-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
            />
            {modelName && <span className="text-xs text-emerald-600">已选：{modelName}</span>}
          </div>

          <button
            onClick={handleConfirmUpload}
            disabled={!uploadLabel.trim() || !iconDataUrl}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-xl shadow-md shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Upload className="w-4 h-4" />
            添加到家具库
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {furnitureTypes.map((type) => {
          const item = getCatalogEntry(type);
          const hasVariants = item.variants && item.variants.length > 0;
          const isExpanded = expandedGroups.has(String(type));

          if (!hasVariants) {
            return (
              <div key={String(type)} className="grid grid-cols-2 gap-3">
                {renderDefaultItem(type, item)}
              </div>
            );
          }

          return (
            <div key={String(type)} className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50/80 to-white overflow-hidden transition-all duration-300 hover:border-stone-300 hover:shadow-md">
              <button
                onClick={() => toggleGroup(String(type))}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-transparent transition-all duration-300 text-left group"
              >
                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border group-hover:shadow-md transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(145deg, ${item.color}18 0%, ${item.color}35 100%)`,
                    borderColor: `${item.color}45`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${item.color}40 0%, transparent 70%)`,
                    }}
                  />
                  <FurnitureIcon
                    type={type}
                    size={30}
                    color={item.color}
                    iconUrl={item.iconUrl}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-bold text-stone-800 tracking-tight">{item.label}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 shadow-sm">
                      <Palette className="w-3 h-3" />
                      {item.variants!.length} 款
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1 block font-medium">
                    尺寸 {Math.round(item.width / GRID_SIZE)}×{Math.round(item.height / GRID_SIZE)} 格 · 深度 {item.depth / 10}m
                  </span>
                  <div className="flex items-center gap-1 mt-1.5">
                    {item.variants!.slice(0, 5).map((v, idx) => (
                      <div
                        key={v.id}
                        className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: v.color, zIndex: 5 - idx }}
                        title={v.label}
                      />
                    ))}
                    {item.variants!.length > 5 && (
                      <span className="text-[9px] text-stone-400 ml-0.5">+{item.variants!.length - 5}</span>
                    )}
                  </div>
                </div>
                <div
                  className={`p-1.5 rounded-lg transition-all duration-300 ${
                    isExpanded
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md rotate-0 scale-110'
                      : 'bg-stone-100 text-stone-500 group-hover:bg-amber-50 group-hover:text-amber-600'
                  }`}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" strokeWidth={2.5} /> : <ChevronRight className="w-4 h-4" strokeWidth={2.5} />}
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-4 pt-1.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {item.variants!.map((variant) =>
                      renderVariantItem(type, variant, item)
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1 p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60">
        <p className="text-[11px] text-stone-600 leading-relaxed">
          <span className="text-amber-600 font-bold mr-1">💡</span>
          点击家具标题展开款式，拖拽家具到右侧房间，选中后按{' '}
          <kbd className="px-1.5 py-0.5 mx-0.5 bg-white rounded-md border border-stone-300 text-[10px] font-mono font-bold text-stone-700 shadow-sm">
            Delete
          </kbd>{' '}
          删除
        </p>
      </div>
    </div>
  );
};
