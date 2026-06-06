import { useEffect, useState } from 'react';
import { LayoutGrid, Box, Save, Trash2, Sparkles } from 'lucide-react';
import { FurniturePalette } from '@/components/FurniturePalette';
import { RoomView2D } from '@/components/RoomView2D';
import { RoomView3D } from '@/components/RoomView3D';
import { useDesignerStore } from '@/store/useDesignerStore';
import type { FurnitureType } from '@/types/furniture';

export default function Home() {
  const { viewMode, setViewMode, furniture, saveLayout, clearAll, loadLayout } = useDesignerStore();
  const [toast, setToast] = useState<string | null>(null);
  const [paletteDrag, setPaletteDrag] = useState<FurnitureType | null>(null);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const handleSave = () => {
    saveLayout();
    showToast(`✓ 布局已保存（${furniture.length} 件家具）`);
  };

  const handleClear = () => {
    if (furniture.length === 0) {
      showToast('房间已经是空的啦');
      return;
    }
    clearAll();
    showToast('房间已清空');
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-800 tracking-tight leading-none">
                Interior Studio
              </h1>
              <p className="text-sm text-stone-500 mt-1">极简室内设计工具 · 轻松规划你的空间</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-stone-200">
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === '2d'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              2D 俯视图
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Box className="w-4 h-4" />
              3D 视图
            </button>
          </div>
        </header>

        <div className="flex gap-6">
          <aside className="w-[240px] flex-shrink-0">
            <FurniturePalette onDragStart={setPaletteDrag} />
          </aside>

          <main className="flex-1 flex flex-col items-center gap-5">
            <div className="relative">
              {viewMode === '2d' ? <RoomView2D /> : <RoomView3D />}
              {paletteDrag && viewMode === '3d' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] rounded-2xl z-30">
                  <div className="px-5 py-3 bg-white rounded-xl shadow-xl">
                    <p className="text-sm text-stone-700">请先切换到 2D 视图放置家具</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 text-white rounded-xl font-medium shadow-lg shadow-stone-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Save className="w-4 h-4" />
                保存布局
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-stone-700 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4" />
                清空房间
              </button>
              <div className="ml-2 px-3 py-2 bg-white/60 backdrop-blur rounded-xl border border-stone-200 text-sm text-stone-600">
                当前放置：<span className="font-semibold text-stone-800">{furniture.length}</span> 件家具
              </div>
            </div>
          </main>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_.2s_ease-out,slideUp_.3s_ease-out]">
          <div className="px-5 py-3 bg-stone-900 text-white rounded-xl shadow-2xl text-sm font-medium">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
