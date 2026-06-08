import { useMemo, useState } from 'react';
import {
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
  ArrowLeft,
  BookOpen,
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

const StarRating = ({ level, max = 5, size = 'sm' }: { level: number; max?: number; size?: 'sm' | 'xs' }) => {
  const textSize = size === 'sm' ? 'text-sm' : 'text-[10px]';
  return (
    <span className={`text-amber-500 ${textSize} tracking-tight leading-none`}>
      {'★'.repeat(level)}
      <span className="text-stone-300">{'★'.repeat(max - level)}</span>
    </span>
  );
};

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]">
        <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-w-[92vw] max-h-[88vh] overflow-hidden animate-[slideUp_.3s_ease-out] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-700 hover:bg-white transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-medium">返回列表</span>
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-800 tracking-tight">
                  {selectedMaterial.label}
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {MATERIAL_KNOWLEDGE_CATEGORIES.find(
                    (c) => c.key === selectedMaterial.category
                  )?.label}材质 · 详细资料
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5 flex-1">
            <div className="flex flex-col gap-5">
              <div className="flex gap-4 items-start">
                <div
                  className="w-28 h-28 rounded-2xl border border-stone-200 shadow-lg flex-shrink-0"
                  style={{
                    backgroundImage:
                      previewPreset && previewPreset.pattern && previewPreset.pattern !== 'none'
                        ? `url(${getMaterialPreviewDataUrl(previewPreset, 96)})`
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundColor: selectedMaterial.color || '#ccc',
                  }}
                />
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">
                      {MATERIAL_KNOWLEDGE_CATEGORIES.find(
                        (c) => c.key === selectedMaterial.category
                      )?.icon} {MATERIAL_KNOWLEDGE_CATEGORIES.find(
                        (c) => c.key === selectedMaterial.category
                      )?.label}
                    </span>
                    {selectedMaterial.ecoFriendly && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        环保材质
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {selectedMaterial.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                    <DollarSign className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">价格等级</span>
                  <StarRating level={selectedMaterial.priceLevel} />
                  <span className="text-[10px] text-stone-500 font-mono">
                    {selectedMaterial.priceRange}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 border-x border-stone-200">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">耐用性</span>
                  <StarRating level={selectedMaterial.durability} />
                  <span className="text-[10px] text-stone-400">越高越耐用</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Wrench className="w-4.5 h-4.5 text-sky-600" />
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">维护难度</span>
                  <StarRating level={selectedMaterial.maintenance} />
                  <span className="text-[10px] text-stone-400">越高越难维护</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    核心特点
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMaterial.features.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      优点
                    </span>
                  </div>
                  <ul className="text-xs text-stone-600 space-y-1.5">
                    {selectedMaterial.pros.map((p, i) => (
                      <li key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-emerald-500 font-bold leading-5 flex-shrink-0">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                      缺点
                    </span>
                  </div>
                  <ul className="text-xs text-stone-600 space-y-1.5">
                    {selectedMaterial.cons.map((c, i) => (
                      <li key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-rose-500 font-bold leading-5 flex-shrink-0">✗</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    适用场景
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMaterial.suitableFor.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {selectedMaterial.tips && selectedMaterial.tips.length > 0 && (
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      保养与选购建议
                    </span>
                  </div>
                  <ul className="text-xs text-stone-600 space-y-1.5">
                    {selectedMaterial.tips.map((t, i) => (
                      <li key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-amber-500 font-bold leading-5 flex-shrink-0">💡</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {relatedMaterials && relatedMaterials.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      相关材质推荐
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {relatedMaterials.map((rm) => {
                      const rp = getMaterialById(rm.id);
                      return (
                        <button
                          key={rm.id}
                          onClick={() => handleSelectMaterial(rm)}
                          className="group flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left"
                        >
                          <div
                            className="w-10 h-10 rounded-xl border border-stone-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                            style={{
                              backgroundImage:
                                rp && rp.pattern && rp.pattern !== 'none'
                                  ? `url(${getMaterialPreviewDataUrl(rp, 40)})`
                                  : 'none',
                              backgroundSize: 'cover',
                              backgroundColor: rm.color || '#ccc',
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-stone-800 block truncate">
                              {rm.label}
                            </span>
                            <StarRating level={rm.priceLevel} size="xs" />
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-w-[92vw] max-h-[88vh] overflow-hidden animate-[slideUp_.3s_ease-out] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800 tracking-tight">材质知识库</h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                了解各类家具材料的特性、优缺点与价格
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 flex-shrink-0 border-b border-stone-50">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            材质分类
          </span>
          <div className="grid grid-cols-5 gap-2">
            {MATERIAL_KNOWLEDGE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat.key
                    ? 'bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
                }`}
              >
                <span className="text-lg leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          {activeCategoryInfo && (
            <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-100">
              <p className="text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-violet-700">
                  {activeCategoryInfo.icon} {activeCategoryInfo.label}：
                </span>
                {activeCategoryInfo.description}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-1 pt-3 flex-shrink-0">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {activeCategoryInfo?.label}材质 · 共 {materials.length} 种
          </span>
        </div>

        <div className="px-6 pb-5 pt-2 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            {materials.map((material) => {
              const previewPreset = getMaterialById(material.id);
              return (
                <button
                  key={material.id}
                  onClick={() => handleSelectMaterial(material)}
                  className="group flex flex-col gap-3 p-4 rounded-2xl border border-stone-100 bg-stone-50/40 hover:border-violet-300 hover:bg-gradient-to-br hover:from-violet-50/60 hover:to-purple-50/40 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                >
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-14 h-14 rounded-xl border border-stone-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{
                        backgroundImage:
                          previewPreset && previewPreset.pattern && previewPreset.pattern !== 'none'
                            ? `url(${getMaterialPreviewDataUrl(previewPreset, 56)})`
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundColor: material.color || '#ccc',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-800 truncate">
                          {material.label}
                        </span>
                        {material.ecoFriendly && (
                          <Leaf className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-stone-500">价格</span>
                        <StarRating level={material.priceLevel} size="xs" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-stone-500">耐用</span>
                        <StarRating level={material.durability} size="xs" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                    {material.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100/60">
                    <div className="flex flex-wrap gap-1">
                      {material.features.slice(0, 2).map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-violet-600 group-hover:text-violet-700 flex items-center gap-0.5">
                      详情
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
