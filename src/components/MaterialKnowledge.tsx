import { useMemo, useState } from 'react';
import {
  BookOpen,
  X,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Shield,
  Wrench,
  Leaf,
  ChevronRight,
  Sparkles,
  Lightbulb,
  Info,
} from 'lucide-react';
import {
  MATERIAL_KNOWLEDGE_CATEGORIES,
  getMaterialKnowledgeByCategory,
  getMaterialKnowledgeById,
} from '@/data/materialKnowledgeData';
import { getMaterialPreviewDataUrl } from '@/data/materialData';
import { getMaterialById } from '@/data/materialData';
import type { MaterialCategory, MaterialKnowledge as MaterialKnowledgeType } from '@/types/furniture';

interface MaterialKnowledgeProps {
  onClose: () => void;
}

const StarRating = ({ level, max = 5 }: { level: number; max?: number }) => (
  <span className="text-amber-500 text-sm tracking-tight">
    {'★'.repeat(level)}
    <span className="text-stone-300">{'★'.repeat(max - level)}</span>
  </span>
);

export const MaterialKnowledge = ({ onClose }: MaterialKnowledgeProps) => {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('wood');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialKnowledgeType | null>(null);

  const materials = useMemo(
    () => getMaterialKnowledgeByCategory(activeCategory),
    [activeCategory]
  );

  const activeCategoryInfo = MATERIAL_KNOWLEDGE_CATEGORIES.find(
    (c) => c.key === activeCategory
  );

  const handleSelectMaterial = (material: MaterialKnowledgeType) => {
    setSelectedMaterial(material);
  };

  const handleBack = () => {
    setSelectedMaterial(null);
  };

  if (selectedMaterial) {
    const relatedMaterials = selectedMaterial.relatedMaterials
      ?.map((id) => getMaterialKnowledgeById(id))
      .filter(Boolean) as MaterialKnowledgeType[];

    const previewPreset = getMaterialById(selectedMaterial.id);

    return (
      <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.1)] border border-stone-100 max-h-[75vh] overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1 -ml-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-violet-400 to-purple-600" />
            <h2 className="text-lg font-semibold text-stone-800 tracking-tight">
              {selectedMaterial.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 -mr-1 flex-1">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div
                className="w-20 h-20 rounded-xl border border-stone-200 shadow-inner flex-shrink-0"
                style={{
                  backgroundImage:
                    previewPreset && previewPreset.pattern && previewPreset.pattern !== 'none'
                      ? `url(${getMaterialPreviewDataUrl(previewPreset, 64)})`
                      : 'none',
                  backgroundSize: 'cover',
                  backgroundColor: selectedMaterial.color || '#ccc',
                }}
              />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                    {MATERIAL_KNOWLEDGE_CATEGORIES.find(
                      (c) => c.key === selectedMaterial.category
                    )?.label}
                  </span>
                  {selectedMaterial.ecoFriendly && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-0.5">
                      <Leaf className="w-3 h-3" />
                      环保
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {selectedMaterial.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] text-stone-500">价格</span>
                <StarRating level={selectedMaterial.priceLevel} />
                <span className="text-[10px] text-stone-500 font-mono">
                  {selectedMaterial.priceRange}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-stone-200">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-stone-500">耐用性</span>
                <StarRating level={selectedMaterial.durability} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Wrench className="w-4 h-4 text-sky-500" />
                <span className="text-[10px] text-stone-500">维护难度</span>
                <StarRating level={selectedMaterial.maintenance} />
                <span className="text-[10px] text-stone-400">越高越难</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                  核心特点
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedMaterial.features.map((f, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-emerald-700">优点</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1">
                  {selectedMaterial.pros.map((p, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-emerald-500 font-bold leading-5">·</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <div className="flex items-center gap-1.5">
                  <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[11px] font-semibold text-rose-700">缺点</span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1">
                  {selectedMaterial.cons.map((c, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-rose-500 font-bold leading-5">·</span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                  适用场景
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedMaterial.suitableFor.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {selectedMaterial.tips && selectedMaterial.tips.length > 0 && (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
                    保养与选购建议
                  </span>
                </div>
                <ul className="text-xs text-stone-600 space-y-1">
                  {selectedMaterial.tips.map((t, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-amber-500 font-bold leading-5">💡</span>
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {relatedMaterials && relatedMaterials.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                  <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                    相关材质
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {relatedMaterials.map((rm) => {
                    const rp = getMaterialById(rm.id);
                    return (
                      <button
                        key={rm.id}
                        onClick={() => handleSelectMaterial(rm)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100 hover:border-stone-300 hover:bg-stone-50/80 transition-all text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-lg border border-stone-200 flex-shrink-0"
                          style={{
                            backgroundImage:
                              rp && rp.pattern && rp.pattern !== 'none'
                                ? `url(${getMaterialPreviewDataUrl(rp, 32)})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundColor: rm.color || '#ccc',
                          }}
                        />
                        <span className="text-xs font-medium text-stone-700 truncate">
                          {rm.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.1)] border border-stone-100 max-h-[75vh] overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-violet-400 to-purple-600" />
          <h2 className="text-lg font-semibold text-stone-800 tracking-tight">材质知识</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          材质分类
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {MATERIAL_KNOWLEDGE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
              }`}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeCategoryInfo && (
        <div className="p-3 rounded-lg bg-violet-50/70 border border-violet-100 flex-shrink-0">
          <p className="text-xs text-stone-600 leading-relaxed">
            <span className="font-semibold text-violet-700">{activeCategoryInfo.icon} {activeCategoryInfo.label}：</span>
            {activeCategoryInfo.description}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 flex-shrink-0">
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          {activeCategoryInfo?.label}材质一览（点击查看详情）
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 -mr-1">
        {materials.map((material) => {
          const previewPreset = getMaterialById(material.id);
          return (
            <button
              key={material.id}
              onClick={() => handleSelectMaterial(material)}
              className="group flex flex-col gap-1.5 p-2 rounded-xl border border-stone-100 bg-stone-50/40 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left"
            >
              <div className="flex gap-2 items-start">
                <div
                  className="w-10 h-10 rounded-lg border border-stone-200 shadow-inner flex-shrink-0"
                  style={{
                    backgroundImage:
                      previewPreset && previewPreset.pattern && previewPreset.pattern !== 'none'
                        ? `url(${getMaterialPreviewDataUrl(previewPreset, 32)})`
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundColor: material.color || '#ccc',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-stone-800 truncate">
                      {material.label}
                    </span>
                    {material.ecoFriendly && (
                      <Leaf className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <StarRating level={material.priceLevel} max={5} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                {material.description}
              </p>
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                <span>耐用 <StarRating level={material.durability} max={5} /></span>
                <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-stone-100 flex-shrink-0">
        <p className="text-[10px] text-stone-400 leading-relaxed">
          提示：点击材质卡片可查看详细介绍，包括优缺点、价格、保养建议等。
        </p>
      </div>
    </div>
  );
};
