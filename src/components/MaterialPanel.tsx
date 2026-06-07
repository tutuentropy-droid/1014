import { useMemo, useState } from 'react';
import { X, Layers } from 'lucide-react';
import { useDesignerStore } from '@/store/useDesignerStore';
import {
  MATERIAL_CATEGORIES,
  getMaterialsByCategory,
  getMaterialPreviewDataUrl,
  getMaterialById,
} from '@/data/materialData';
import type { FurnitureItem, SelectedWall, MaterialCategory, MaterialPreset } from '@/types/furniture';

interface MaterialPanelProps {
  selectedFurniture: FurnitureItem | null;
  selectedWall: SelectedWall | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const MaterialPanel = ({ selectedFurniture, selectedWall, onClose, onToast }: MaterialPanelProps) => {
  const { updateFurnitureMaterial, updateWallMaterial, getRoomById } = useDesignerStore();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('wood');
  const [applyToAllWalls, setApplyToAllWalls] = useState(false);

  const presets = useMemo(() => getMaterialsByCategory(activeCategory), [activeCategory]);

  const targetLabel = selectedFurniture
    ? selectedFurniture.label
    : selectedWall
      ? `${getRoomById(selectedWall.roomId)?.name ?? '房间'} · ${
          selectedWall.orientation === 'top'
            ? '顶部墙'
            : selectedWall.orientation === 'bottom'
              ? '底部墙'
              : selectedWall.orientation === 'left'
                ? '左侧墙'
                : '右侧墙'
        }`
      : '';

  const currentMaterialId: string | undefined = selectedFurniture
    ? selectedFurniture.materialId
    : selectedWall
      ? getRoomById(selectedWall.roomId)?.wallMaterials?.[selectedWall.orientation]
      : undefined;

  const currentPreset = currentMaterialId ? getMaterialById(currentMaterialId) : undefined;

  const handleSelectPreset = (preset: MaterialPreset) => {
    if (selectedFurniture) {
      updateFurnitureMaterial(selectedFurniture.id, preset.id);
      onToast(`已应用材质：${preset.label}`);
    } else if (selectedWall) {
      updateWallMaterial(selectedWall.roomId, selectedWall.orientation, preset.id, applyToAllWalls);
      onToast(
        applyToAllWalls
          ? `已将「${preset.label}」应用到所有墙壁`
          : `已应用材质：${preset.label}`
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.1)] border border-stone-100">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-400 to-orange-600" />
          <h2 className="text-lg font-semibold text-stone-800 tracking-tight">材质换皮</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">当前选中</span>
        <div className="px-3 py-2 rounded-lg bg-amber-50/80 border border-amber-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-800">{targetLabel}</span>
          {currentPreset && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded border border-stone-200 shadow-sm"
                style={{
                  backgroundColor: currentPreset.color,
                }}
              />
              <span className="text-xs text-stone-600">{currentPreset.label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">材质分类</span>
        <div className="grid grid-cols-5 gap-1.5">
          {MATERIAL_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
              }`}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedWall && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 border border-stone-100">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs text-stone-600">应用到四面墙</span>
          </div>
          <button
            onClick={() => setApplyToAllWalls(!applyToAllWalls)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              applyToAllWalls ? 'bg-emerald-500' : 'bg-stone-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                applyToAllWalls ? 'translate-x-4.5 left-0.5' : 'left-0.5'
              }`}
              style={{ transform: applyToAllWalls ? 'translateX(18px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          {MATERIAL_CATEGORIES.find((c) => c.key === activeCategory)?.label}材质
        </span>
        <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {presets.map((preset) => {
            const isActive = currentMaterialId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col gap-1.5 p-2 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                    : 'border-stone-100 bg-stone-50/40 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div
                  className="w-full h-16 rounded-lg border border-stone-200 shadow-inner"
                  style={{
                    backgroundImage: preset.pattern && preset.pattern !== 'none'
                      ? `url(${getMaterialPreviewDataUrl(preset, 64)})`
                      : 'none',
                    backgroundSize: 'cover',
                    backgroundColor: preset.color,
                  }}
                />
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-stone-800 truncate">{preset.label}</span>
                  <div
                    className="w-3 h-3 rounded-full border border-stone-200 flex-shrink-0"
                    style={{ backgroundColor: preset.color }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          提示：在 3D 视图中点击家具或墙壁即可选中，然后在此面板选择新材质即时替换。
        </p>
      </div>
    </div>
  );
};
