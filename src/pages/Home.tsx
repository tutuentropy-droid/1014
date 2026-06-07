import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Box,
  Save,
  Trash2,
  Sparkles,
  X,
  Palette,
  Tag,
  Maximize2,
  Image,
  Camera,
  Wand2,
  Square,
  Blinds,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FurniturePalette } from '@/components/FurniturePalette';
import { MaterialPanel } from '@/components/MaterialPanel';
import { RoomView2D } from '@/components/RoomView2D';
import { RoomView3D } from '@/components/RoomView3D';
import { RoomTabs } from '@/components/RoomTabs';
import { useDesignerStore } from '@/store/useDesignerStore';
import type { FurnitureType } from '@/types/furniture';
import {
  GRID_SIZE,
  MIN_FURNITURE_GRIDS,
  MAX_FURNITURE_GRIDS,
  MAX_FLOORS,
} from '@/data/furnitureData';

export default function Home() {
  const {
    viewMode,
    setViewMode,
    getAllFurniture,
    getAutoWalls,
    selectedId,
    selectedWindowId,
    selectedCurtainId,
    selectedWall,
    drawMode,
    setDrawMode,
    getAllWindows,
    getAllCurtains,
    floors,
    currentFloor,
    currentRoomId,
    seeThroughMode,
    setSeeThroughMode,
    switchFloor,
    getStaircaseArea,
    setStaircaseArea,
    saveLayout,
    clearAll,
    loadLayout,
    selectFurniture,
    selectWindow,
    selectCurtain,
    selectWall,
    removeFurniture,
    removeWindow,
    removeCurtain,
    toggleCurtain,
    updateFurnitureWidth,
    updateFurnitureHeight,
    updateFurnitureColor,
    updateFurnitureLabel,
    clearRoomFurniture,
    applySmartLayout,
  } = useDesignerStore();

  const currentFloorData = floors.find((f) => f.level === currentFloor);
  const rooms = currentFloorData?.rooms ?? [];
  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  const totalFurniture = floors.reduce((sum, f) => sum + f.rooms.reduce((s, r) => s + r.furniture.length, 0), 0);
  const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);

  const [toast, setToast] = useState<string | null>(null);
  const [paletteDrag, setPaletteDrag] = useState<FurnitureType | null>(null);
  const [showSmartLayoutDialog, setShowSmartLayoutDialog] = useState(false);

  const allFurniture = getAllFurniture();
  const allWindows = getAllWindows();
  const allCurtains = getAllCurtains();
  const autoWalls = getAutoWalls();
  const selectedFurniture = allFurniture.find((f) => f.id === selectedId) || null;
  const selectedWindow = allWindows.find((w) => w.id === selectedWindowId) || null;
  const selectedCurtain = allCurtains.find((c) => c.id === selectedCurtainId) || null;

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const handleSave = () => {
    saveLayout();
    showToast(`✓ 已保存 ${floors.length} 层楼（共 ${totalRooms} 个房间，${totalFurniture} 件家具）`);
  };

  const handleExport2D = () => {
    const capture = (window as unknown as { capture2DLayout?: () => string | undefined }).capture2DLayout;
    if (capture) {
      const dataUrl = capture();
      if (dataUrl) {
        const link = document.createElement('a');
        const roomName = currentRoom?.name || 'room';
        link.download = `${roomName}-layout-2d-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        showToast(`✓ 「${roomName}」2D 布局图已导出`);
        return;
      }
    }
    showToast('导出失败，请重试');
  };

  const handleExport3D = () => {
    const capture = (window as unknown as { capture3DScreenshot?: () => string | undefined }).capture3DScreenshot;
    if (capture) {
      const dataUrl = capture();
      if (dataUrl) {
        const link = document.createElement('a');
        const roomName = currentRoom?.name || 'room';
        link.download = `${roomName}-screenshot-3d-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        showToast(`✓ 「${roomName}」3D 截图已导出`);
        return;
      }
    }
    showToast('导出失败，请重试');
  };

  const handleClear = () => {
    if (allFurniture.length === 0) {
      showToast(`所有房间已经是空的啦`);
      return;
    }
    clearAll();
    showToast(`已清空所有房间的家具`);
  };

  const handleSmartLayoutAction = (mode: 'clear' | 'preserve') => {
    if (!currentRoom) {
      showToast('请先选择一个房间');
      setShowSmartLayoutDialog(false);
      return;
    }
    if (mode === 'clear') {
      clearRoomFurniture(currentRoom.id);
    }
    const count = applySmartLayout(currentRoom.id, mode);
    setShowSmartLayoutDialog(false);
    if (count === 0) {
      showToast(`「${currentRoom.name}」未能生成布局，请尝试更大的房间`);
    } else {
      showToast(`✓ 「${currentRoom.name}」已智能布局 ${count} 件家具`);
    }
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Building2 className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-800 tracking-tight leading-none">
                Interior Studio
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                多层楼房设计工具 · 共 {totalRooms} 个房间 / {totalFurniture} 件家具，当前 {currentFloor + 1}F：
                <span className="font-semibold text-amber-600">
                  {currentRoom?.name || '—'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-sm border border-stone-200">
              {Array.from({ length: MAX_FLOORS }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => switchFloor(i)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentFloor === i
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {i + 1}F
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-stone-200">
              <button
                onClick={() => setSeeThroughMode(!seeThroughMode)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  seeThroughMode
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md shadow-sky-500/25'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
                title={seeThroughMode ? '关闭透视模式' : '开启透视模式（隐藏当前楼层以上所有内容）'}
              >
                {seeThroughMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                透视模式
              </button>
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
            {viewMode === '2d' && (
              <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-stone-200">
                <button
                  onClick={() => setDrawMode(drawMode === 'window' ? 'none' : 'window')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    drawMode === 'window'
                      ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  添加窗户
                </button>
                <button
                  onClick={() => setDrawMode(drawMode === 'curtain' ? 'none' : 'curtain')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    drawMode === 'curtain'
                      ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Blinds className="w-4 h-4" />
                  添加窗帘
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex gap-6 items-start">
          <aside className="w-[240px] flex-shrink-0 flex flex-col gap-4">
            <div className="p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.08)] border border-stone-100">
              <RoomTabs onToast={showToast} />
            </div>

            <FurniturePalette
              onDragStart={setPaletteDrag}
              onDragEnd={() => setPaletteDrag(null)}
            />

            <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.08)] border border-stone-100">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
                <h2 className="text-lg font-semibold text-stone-800 tracking-tight">操作提示</h2>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">·</span>
                  <span>拖拽房间区域可<span className="font-semibold text-stone-800">移动位置</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">·</span>
                  <span>拖拽房间四角可<span className="font-semibold text-stone-800">调整大小</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">·</span>
                  <span>点击房间可<span className="font-semibold text-stone-800">选中</span>，F键进入第一人称</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">·</span>
                  <span>家具只能在<span className="font-semibold text-stone-800">所属房间</span>内放置</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">·</span>
                  <span>滚轮缩放画布，中键拖拽<span className="font-semibold text-stone-800">平移画布</span></span>
                </li>
              </ul>
              {currentRoom && (
                <div className="pt-3 mt-1 border-t border-stone-100">
                  <div className="px-3 py-2 rounded-lg bg-sky-50/70 border border-sky-100">
                    <p className="text-xs text-stone-600">
                      选中：<span className="font-semibold text-stone-800">{currentRoom.name}</span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      尺寸 {currentRoom.widthGrids}×{currentRoom.heightGrids} 格 · {currentRoom.widthGrids * GRID_SIZE}×{currentRoom.heightGrids * GRID_SIZE} px
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {currentRoom.furniture.length} 件家具
                    </p>
                  </div>
                </div>
              )}
            </div>
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
                onClick={() => setShowSmartLayoutDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Wand2 className="w-4 h-4" />
                智能布局
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 text-white rounded-xl font-medium shadow-lg shadow-stone-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Save className="w-4 h-4" />
                保存布局
              </button>
              <button
                onClick={handleExport2D}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-xl font-medium shadow-lg shadow-sky-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Image className="w-4 h-4" />
                导出 2D 图
              </button>
              <button
                onClick={handleExport3D}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Camera className="w-4 h-4" />
                导出 3D 截图
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-stone-700 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4" />
                清空所有家具
              </button>
              <div className="ml-2 px-3 py-2 bg-white/60 backdrop-blur rounded-xl border border-stone-200 text-sm text-stone-600">
                <span className="font-semibold text-orange-700">{currentFloor + 1}F</span> · 
                <span className="font-semibold text-amber-700 ml-1">{rooms.length}</span> 房间
                {' · '}
                <span className="font-semibold text-stone-800">{allFurniture.length}</span> 家具
                {' · '}
                <span className="font-semibold text-sky-700">{allWindows.length}</span> 窗户
                {' · '}
                <span className="font-semibold text-violet-700">{allCurtains.length}</span> 窗帘
                {' · '}
                <span className="font-semibold text-stone-500">{autoWalls.length}</span> 墙
                {' · '}
                <span className="text-stone-400">总计 {totalRooms} 房间 / {totalFurniture} 家具</span>
              </div>
            </div>
          </main>

          {(selectedFurniture || selectedWindow || selectedCurtain || selectedWall) && (
            <aside className="w-[260px] flex-shrink-0 flex flex-col gap-4">
              {selectedFurniture && (
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
              )}

              {selectedWindow && (
                <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.1)] border border-stone-100">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
                      <h2 className="text-lg font-semibold text-stone-800 tracking-tight">窗户属性</h2>
                    </div>
                    <button
                      onClick={() => selectWindow(null)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    className="w-full h-20 rounded-xl flex items-center justify-center text-white text-sm font-medium shadow-inner border-2 border-sky-400"
                    style={{
                      backgroundColor: 'rgba(135, 206, 250, 0.5)',
                    }}
                  >
                    窗户
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-sky-50 rounded-lg border border-sky-100">
                      <span className="text-xs text-stone-600">墙面朝向</span>
                      <span className="text-xs font-semibold text-sky-700">
                        {selectedWindow.wallOrientation === 'top' ? '顶部墙' :
                         selectedWindow.wallOrientation === 'bottom' ? '底部墙' :
                         selectedWindow.wallOrientation === 'left' ? '左侧墙' : '右侧墙'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-sky-50 rounded-lg border border-sky-100">
                      <span className="text-xs text-stone-600">窗户宽度</span>
                      <span className="text-xs font-semibold text-sky-700">{Math.round(selectedWindow.windowWidth)} px</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-sky-50 rounded-lg border border-sky-100">
                      <span className="text-xs text-stone-600">窗户高度</span>
                      <span className="text-xs font-semibold text-sky-700">{Math.round(selectedWindow.windowHeight)} px</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                    {!allCurtains.some((c) => c.windowId === selectedWindow.id) && (
                      <button
                        onClick={() => {
                          const success = useDesignerStore.getState().addCurtain(selectedWindow.id, selectedWindow.roomId);
                          if (success) showToast('窗帘已添加');
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl bg-violet-500 hover:bg-violet-600 text-white transition-all"
                      >
                        <Blinds className="w-4 h-4" />
                        添加窗帘
                      </button>
                    )}
                    <button
                      onClick={() => {
                        removeWindow(selectedWindow.id);
                        showToast('窗户已删除');
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除此窗户
                    </button>
                  </div>
                </div>
              )}

              {selectedCurtain && (
                <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-[0_4px_24px_rgba(92,74,61,0.1)] border border-stone-100">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-violet-400 to-violet-600" />
                      <h2 className="text-lg font-semibold text-stone-800 tracking-tight">窗帘属性</h2>
                    </div>
                    <button
                      onClick={() => selectCurtain(null)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    className="w-full h-20 rounded-xl flex items-center justify-center text-white text-sm font-medium shadow-inner"
                    style={{
                      background: 'repeating-linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.8) 8px, rgba(167, 139, 250, 0.8) 8px, rgba(167, 139, 250, 0.8) 16px)',
                    }}
                  >
                    窗帘
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-violet-50 rounded-lg border border-violet-100">
                      <span className="text-xs text-stone-600">状态</span>
                      <span className="text-xs font-semibold text-violet-700">
                        {selectedCurtain.isOpen ? '已打开' : '已关闭'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        toggleCurtain(selectedCurtain.id);
                        showToast(selectedCurtain.isOpen ? '窗帘已关闭' : '窗帘已打开');
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
                    >
                      {selectedCurtain.isOpen ? '关闭窗帘' : '打开窗帘'}
                    </button>
                    <button
                      onClick={() => {
                        removeCurtain(selectedCurtain.id);
                        showToast('窗帘已删除');
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除此窗帘
                    </button>
                  </div>
                </div>
              )}

              {(selectedFurniture || selectedWall) && (
                <MaterialPanel
                  selectedFurniture={selectedFurniture}
                  selectedWall={selectedWall}
                  onClose={() => {
                    if (selectedFurniture) selectFurniture(null);
                    if (selectedWall) selectWall(null);
                  }}
                  onToast={showToast}
                />
              )}
            </aside>
          )}
        </div>
      </div>

      {showSmartLayoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden animate-[slideUp_.3s_ease-out]">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-800 tracking-tight">智能布局</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    当前房间：<span className="font-medium text-stone-700">{currentRoom?.name || '未选择'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSmartLayoutDialog(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-stone-600 leading-relaxed mb-4">
                根据房间类型和尺寸，自动为您生成合理的家具摆放方案。请选择布局方式：
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSmartLayoutAction('clear')}
                  className="group flex items-start gap-3 p-4 rounded-xl border-2 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-stone-800">清空后重新布局</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      删除当前房间所有家具，然后生成全新的布局方案
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSmartLayoutAction('preserve')}
                  className="group flex items-start gap-3 p-4 rounded-xl border-2 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-stone-800">保留现有家具</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      保留当前已放置的家具，仅补充智能推荐的缺失家具
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-600 leading-relaxed">
                  <span className="font-semibold text-stone-700">💡 布局规则：</span>
                  床与衣柜靠墙放置，沙发与电视柜相对摆放，桌椅居中，植物点缀角落，每件家具之间自动留出至少 1 格过道空间。
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => setShowSmartLayoutDialog(false)}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

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
