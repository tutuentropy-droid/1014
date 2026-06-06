import { useRef, useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { FurnitureIcon } from './FurnitureIcon';
import { useDesignerStore } from '@/store/useDesignerStore';
import { GRID_SIZE } from '@/data/furnitureData';
import type { FurnitureType, CustomFurnitureCatalogEntry } from '@/types/furniture';

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

  const furnitureTypes = getAllFurnitureTypes();

  const handleDragStart = (e: React.DragEvent, type: FurnitureType) => {
    e.dataTransfer.setData('furniture-type', String(type));
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

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.08)] border border-stone-100">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
          <h2 className="text-lg font-semibold text-stone-800 tracking-tight">家具库</h2>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            showUpload
              ? 'bg-amber-100 text-amber-700'
              : 'bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-700'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
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
                min={1}
                max={3}
                value={uploadWidthGrids}
                onChange={(e) =>
                  setUploadWidthGrids(Math.max(1, Math.min(3, parseInt(e.target.value) || 1)))
                }
                className="px-3 py-1.5 text-sm bg-white rounded-lg border border-stone-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-600">高（格）</label>
              <input
                type="number"
                min={1}
                max={3}
                value={uploadHeightGrids}
                onChange={(e) =>
                  setUploadHeightGrids(Math.max(1, Math.min(3, parseInt(e.target.value) || 1)))
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

      <div className="grid grid-cols-2 gap-3">
        {furnitureTypes.map((type) => {
          const item = getCatalogEntry(type);
          return (
            <div
              key={String(type)}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              onDragEnd={handleDragEnd}
              className="group flex flex-col items-center justify-center p-4 rounded-xl bg-stone-50 border border-stone-100 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-amber-50 hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5"
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
        })}
      </div>

      <div className="mt-2 p-3 rounded-lg bg-amber-50/70 border border-amber-100">
        <p className="text-xs text-stone-600 leading-relaxed">
          💡 拖拽家具到右侧房间，点击选中后按{' '}
          <kbd className="px-1.5 py-0.5 mx-0.5 bg-white rounded border border-stone-200 text-[10px] font-mono">
            Delete
          </kbd>{' '}
          删除
        </p>
      </div>
    </div>
  );
};
