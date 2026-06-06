import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Box,
  Save,
  Trash2,
  Sparkles,
  Square,
  Eraser,
  X,
  Palette,
  Tag,
  Maximize2,
} from 'lucide-react';
import { FurniturePalette } from '@/components/FurniturePalette';
import { RoomView2D } from '@/components/RoomView2D';
import { RoomView3D } from '@/components/RoomView3D';
import { useDesignerStore } from '@/store/useDesignerStore';
import type { FurnitureType } from '@/types/furniture';
import {
  GRID_SIZE,
  MIN_ROOM_GRIDS,
  MAX_ROOM_GRIDS,
  MIN_FURNITURE_GRIDS,
  MAX_FURNITURE_GRIDS,
} from '@/data/furnitureData';

export default function Home() {
  const {
    viewMode,
    setViewMode,
    furniture,
    walls,
    selectedId,
    drawMode,
    roomWidthGrids,
    roomHeightGrids,
    setRoomWidthGrids,
    setRoomHeightGrids,
    setDrawMode,
    saveLayout,
    clearAll,
    clearWalls,
    loadLayout,
    selectFurniture,
    removeFurniture,
    updateFurnitureWidth,
    updateFurnitureHeight,
    updateFurnitureColor,
    updateFurnitureLabel,
  } = useDesignerStore();

  const [toast, setToast] = useState<string | null>(null);
  const [paletteDrag, setPaletteDrag] = useState<FurnitureType | null>(null);

  const selectedFurniture = furniture.find((f) => f.id === selectedId) || null;

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const handleSave = () => {
    saveLayout();
    showToast(`✓ 布局已保存（${furniture.length} 件家具，${walls.length} 面墙）`);
  };

  const handleClear = () => {
    if (furniture.length === 0 && walls.length === 0) {
      showToast('房间已经是空的啦');
      return;
    }
    clearAll();
    showToast('房间已清空');
  };

  const handleToggleWallMode = () => {
    if (drawMode === 'wall') {
      setDrawMode('none');
      showToast('已退出画墙模式');
    } else {
      setDrawMode('wall');
      selectFurniture(null);
      showToast('进入画墙模式 · 拖拽绘制墙体');
    }
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
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

        <div className="flex gap-6 items-start">
          <aside className="w-[240px] flex-shrink-0 flex flex-col gap-4">
            <FurniturePalette
              onDragStart={setPaletteDrag}
              onDragEnd={() => setPaletteDrag(null)}
            />

            {viewMode === '2d' && (
              <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.08)] border border-stone-100">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
                  <h2 className="text-lg font-semibold text-stone-800 tracking-tight">房间设置</h2>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-stone-600">房间宽度</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={MIN_ROOM_GRIDS}
                          max={MAX_ROOM_GRIDS}
                          value={roomWidthGrids}
                          onChange={(e) =>
                            setRoomWidthGrids(parseInt(e.target.value) || MIN_ROOM_GRIDS)
                          }
                          className="w-14 px-2 py-1 text-xs text-right bg-stone-50 rounded border border-stone-200 focus:border-amber-400 focus:outline-none font-mono"
                        />
                        <span className="text-[10px] text-stone-400">格</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={MIN_ROOM_GRIDS}
                      max={MAX_ROOM_GRIDS}
                      value={roomWidthGrids}
                      onChange={(e) => setRoomWidthGrids(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-stone-600">房间高度</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={MIN_ROOM_GRIDS}
                          max={MAX_ROOM_GRIDS}
                          value={roomHeightGrids}
                          onChange={(e) =>
                            setRoomHeightGrids(parseInt(e.target.value) || MIN_ROOM_GRIDS)
                          }
                          className="w-14 px-2 py-1 text-xs text-right bg-stone-50 rounded border border-stone-200 focus:border-amber-400 focus:outline-none font-mono"
                        />
                        <span className="text-[10px] text-stone-400">格</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={MIN_ROOM_GRIDS}
                      max={MAX_ROOM_GRIDS}
                      value={roomHeightGrids}
                      onChange={(e) => setRoomHeightGrids(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <p className="text-[10px] text-stone-400 text-center">
                      实际尺寸：{roomWidthGrids * GRID_SIZE} × {roomHeightGrids * GRID_SIZE} px
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                  <button
                    onClick={handleToggleWallMode}
                    className={`flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl transition-all ${
                      drawMode === 'wall'
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                        : 'bg-stone-100 hover:bg-sky-50 text-stone-700 hover:text-sky-700'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    {drawMode === 'wall' ? '画墙中（点击退出）' : '画墙模式'}
                  </button>

                  {walls.length > 0 && (
                    <button
                      onClick={() => {
                        clearWalls();
                        showToast('已清除所有墙体');
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl bg-stone-50 hover:bg-red-50 text-stone-600 hover:text-red-600 border border-stone-200 transition-all"
                    >
                      <Eraser className="w-4 h-4" />
                      清除墙体（{walls.length}）
                    </button>
                  )}
                </div>
              </div>
            )}
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

            <div className="flex items-center gap-3 flex-wrap justify-center">
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
                当前放置：
                <span className="font-semibold text-stone-800">{furniture.length}</span> 件家具
                {walls.length > 0 && (
                  <>
                    {' · '}
                    <span className="font-semibold text-sky-700">{walls.length}</span> 面墙
                  </>
                )}
              </div>
            </div>
          </main>

          {selectedFurniture && (
            <aside className="w-[260px] flex-shrink-0">
              <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.1)] border border-stone-100">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                    <h2 className="text-lg font-semibold text-stone-800 tracking-tight">属性面板</h2>
                  </div>
                  <button
                    onClick={() => selectFurniture(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className="w-full h-20 rounded-xl flex items-center justify-center text-white text-sm font-medium shadow-inner"
                  style={{
                    backgroundColor: selectedFurniture.color,
                    backgroundImage:
                      'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%)',
                  }}
                >
                  {selectedFurniture.label}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    名称
                  </label>
                  <input
                    type="text"
                    value={selectedFurniture.label}
                    onChange={(e) => updateFurnitureLabel(selectedFurniture.id, e.target.value)}
                    className="px-3 py-1.5 text-sm bg-stone-50 rounded-lg border border-stone-200 focus:border-amber-400 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    颜色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedFurniture.color}
                      onChange={(e) => updateFurnitureColor(selectedFurniture.id, e.target.value)}
                      className="w-10 h-9 rounded-lg border border-stone-200 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedFurniture.color}
                      onChange={(e) => updateFurnitureColor(selectedFurniture.id, e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm font-mono bg-stone-50 rounded-lg border border-stone-200 focus:border-amber-400 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    尺寸（以格为单位）
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-stone-500">宽度</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={MIN_FURNITURE_GRIDS}
                          max={MAX_FURNITURE_GRIDS}
                          value={Math.round(selectedFurniture.width / GRID_SIZE)}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) updateFurnitureWidth(selectedFurniture.id, v);
                          }}
                          className="w-full px-2 py-1 text-sm text-center bg-stone-50 rounded border border-stone-200 focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <input
                        type="range"
                        min={MIN_FURNITURE_GRIDS}
                        max={MAX_FURNITURE_GRIDS}
                        value={Math.round(selectedFurniture.width / GRID_SIZE)}
                        onChange={(e) =>
                          updateFurnitureWidth(selectedFurniture.id, parseInt(e.target.value))
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-stone-500">高度</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={MIN_FURNITURE_GRIDS}
                          max={MAX_FURNITURE_GRIDS}
                          value={Math.round(selectedFurniture.height / GRID_SIZE)}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) updateFurnitureHeight(selectedFurniture.id, v);
                          }}
                          className="w-full px-2 py-1 text-sm text-center bg-stone-50 rounded border border-stone-200 focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <input
                        type="range"
                        min={MIN_FURNITURE_GRIDS}
                        max={MAX_FURNITURE_GRIDS}
                        value={Math.round(selectedFurniture.height / GRID_SIZE)}
                        onChange={(e) =>
                          updateFurnitureHeight(selectedFurniture.id, parseInt(e.target.value))
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 text-center pt-1">
                    实际：{selectedFurniture.width} × {selectedFurniture.height} px
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <button
                    onClick={() => {
                      removeFurniture(selectedFurniture.id);
                      showToast('家具已删除');
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除此家具
                  </button>
                </div>
              </div>
            </aside>
          )}
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
