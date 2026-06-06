import { FurnitureIcon } from './FurnitureIcon';
import { FURNITURE_CATALOG } from '@/data/furnitureData';
import type { FurnitureType } from '@/types/furniture';

const FURNITURE_TYPES: FurnitureType[] = ['bed', 'sofa', 'table', 'plant'];

interface FurniturePaletteProps {
  onDragStart: (type: FurnitureType) => void;
}

export const FurniturePalette = ({ onDragStart }: FurniturePaletteProps) => {
  const handleDragStart = (e: React.DragEvent, type: FurnitureType) => {
    e.dataTransfer.setData('furniture-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(type);
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.08)] border border-stone-100">
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
        <h2 className="text-lg font-semibold text-stone-800 tracking-tight">家具库</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FURNITURE_TYPES.map((type) => {
          const item = FURNITURE_CATALOG[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="group flex flex-col items-center justify-center p-4 rounded-xl bg-stone-50 border border-stone-100 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-amber-50 hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                <FurnitureIcon type={type} size={44} color={item.color} />
              </div>
              <span className="mt-2 text-sm font-medium text-stone-700">{item.label}</span>
              <span className="mt-0.5 text-[10px] text-stone-400">
                {item.width}×{item.height}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 p-3 rounded-lg bg-amber-50/70 border border-amber-100">
        <p className="text-xs text-stone-600 leading-relaxed">
          💡 拖拽家具到右侧房间，点击选中后按 <kbd className="px-1.5 py-0.5 mx-0.5 bg-white rounded border border-stone-200 text-[10px] font-mono">Delete</kbd> 删除
        </p>
      </div>
    </div>
  );
};
