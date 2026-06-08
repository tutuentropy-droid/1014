import { useEffect, useState } from 'react';
import { FurniturePalette } from '@/components/FurniturePalette';
import { RoomView2D } from '@/components/RoomView2D';
import { RoomView3D } from '@/components/RoomView3D';
import { useDesignerStore } from '@/store/useDesignerStore';
import {
  Layers,
  Eye,
  Trash2,
  Plus,
  Save,
  Undo2,
  LayoutGrid,
  Box,
  Home as HomeIcon,
  ChevronDown,
  Pencil,
} from 'lucide-react';

export default function Home() {
  const loadLayout = useDesignerStore((s) => s.loadLayout);
  const saveLayout = useDesignerStore((s) => s.saveLayout);
  const viewMode = useDesignerStore((s) => s.viewMode);
  const setViewMode = useDesignerStore((s) => s.setViewMode);
  const seeThroughMode = useDesignerStore((s) => s.seeThroughMode);
  const setSeeThroughMode = useDesignerStore((s) => s.setSeeThroughMode);
  const floors = useDesignerStore((s) => s.floors);
  const currentFloor = useDesignerStore((s) => s.currentFloor);
  const switchFloor = useDesignerStore((s) => s.switchFloor);
  const currentRoomId = useDesignerStore((s) => s.currentRoomId);
  const rooms = useDesignerStore((s) => s.rooms);
  const switchRoom = useDesignerStore((s) => s.switchRoom);
  const addRoom = useDesignerStore((s) => s.addRoom);
  const renameRoom = useDesignerStore((s) => s.renameRoom);
  const removeRoom = useDesignerStore((s) => s.removeRoom);
  const clearAll = useDesignerStore((s) => s.clearAll);
  const storeFurniturePositions = useDesignerStore((s) => s.storeFurniturePositions);
  const restoreFurniturePositions = useDesignerStore((s) => s.restoreFurniturePositions);
  const setFloorStyle = useDesignerStore((s) => s.setFloorStyle);
  const floorStyleId = useDesignerStore((s) => s.floorStyleId);

  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showRoomMenu, setShowRoomMenu] = useState(false);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  const handleDragStart = (type: string) => {
    setDraggingType(type);
  };

  const handleDragEnd = () => {
    setDraggingType(null);
  };

  const startRename = (roomId: string, currentName: string) => {
    setEditingRoomId(roomId);
    setEditingName(currentName);
    setShowRoomMenu(false);
  };

  const confirmRename = () => {
    if (editingRoomId && editingName.trim()) {
      renameRoom(editingRoomId, editingName.trim());
    }
    setEditingRoomId(null);
    setEditingName('');
  };

  const handleSave = () => {
    saveLayout();
  };

  const handleUndo = () => {
    restoreFurniturePositions();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-stone-200 shadow-[0_1px_12px_rgba(120,100,80,0.06)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <HomeIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="absolute inset-0.5 rounded-xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800 tracking-tight font-display leading-none">
              室内设计师
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">专业家装布局工具 · 多风格家具库</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === '2d'
                  ? 'bg-white text-amber-700 shadow-md shadow-amber-500/10 ring-1 ring-amber-200'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={2.2} />
              2D 平面图
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === '3d'
                  ? 'bg-white text-amber-700 shadow-md shadow-amber-500/10 ring-1 ring-amber-200'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <Box className="w-4 h-4" strokeWidth={2.2} />
              3D 预览
            </button>
          </div>

          {viewMode === '3d' && (
            <button
              onClick={() => setSeeThroughMode(!seeThroughMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                seeThroughMode
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white border-sky-400 shadow-md shadow-sky-500/25'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-sky-200 hover:text-sky-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={2.3} />
              透视模式
            </button>
          )}

          <div className="w-px h-7 bg-stone-200 mx-1" />

          <button
            onClick={handleUndo}
            onMouseDown={storeFurniturePositions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-stone-600 border border-stone-200 text-xs font-bold hover:bg-stone-50 hover:border-stone-300 transition-all"
            title="拖拽前按住，松开后撤销"
          >
            <Undo2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            撤销
          </button>

          <button
            onClick={() => clearAll()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-rose-600 border border-stone-200 text-xs font-bold hover:bg-rose-50 hover:border-rose-200 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            清空
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" strokeWidth={2.3} />
            保存布局
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="flex-shrink-0 w-80 p-4 border-r border-stone-200/70 bg-gradient-to-b from-white/60 to-stone-50/40 backdrop-blur-sm overflow-y-auto">
          <FurniturePalette onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/60 backdrop-blur-sm border-b border-stone-200/60">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-stone-100 to-stone-50 border border-stone-200">
                <Layers className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.3} />
                <span className="text-xs font-bold text-stone-600">楼层</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200">
                {floors.map((floor) => (
                  <button
                    key={floor.id}
                    onClick={() => switchFloor(floor.level)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                      currentFloor === floor.level
                        ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-200'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-500 mr-1">当前房间：</span>
              <button
                onClick={() => setShowRoomMenu(!showRoomMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition-all group"
              >
                <HomeIcon className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.2} />
                <span className="text-sm font-bold text-amber-800">
                  {currentRoom?.name ?? '未选择'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-amber-600 transition-transform duration-200 ${
                    showRoomMenu ? 'rotate-180' : ''
                  }`}
                  strokeWidth={2.3}
                />
              </button>

              {showRoomMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-56 bg-white rounded-xl border border-stone-200 shadow-xl shadow-stone-300/30 overflow-hidden z-50">
                  <div className="p-1.5">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                          room.id === currentRoomId
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        {editingRoomId === room.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={confirmRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmRename();
                              if (e.key === 'Escape') {
                                setEditingRoomId(null);
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-0.5 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200"
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => switchRoom(room.id)}
                              className="flex-1 text-left"
                            >
                              <span
                                className={`text-sm font-semibold ${
                                  room.id === currentRoomId ? 'text-amber-700' : 'text-stone-700'
                                }`}
                              >
                                {room.name}
                              </span>
                              <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                {room.widthGrids}×{room.heightGrids} 格
                              </div>
                            </button>
                            <button
                              onClick={() => startRename(room.id, room.name)}
                              className="p-1 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="重命名"
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                            </button>
                            {rooms.length > 1 && (
                              <button
                                onClick={() => {
                                  removeRoom(room.id);
                                  setShowRoomMenu(false);
                                }}
                                className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="删除房间"
                              >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-100 p-1.5">
                    <button
                      onClick={() => {
                        const name = `房间${rooms.length + 1}`;
                        addRoom(name);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 transition-all"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.3} />
                      新建房间
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-stone-500 mr-1">地板风格：</span>
              <select
                value={floorStyleId}
                onChange={(e) => setFloorStyle(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all cursor-pointer"
              >
                <option value="lightWood">浅色木纹</option>
                <option value="darkWood">深色木纹</option>
                <option value="whiteTile">白色瓷砖</option>
                <option value="marbleTile">大理石</option>
                <option value="grayCarpet">灰色地毯</option>
                <option value="beigeCarpet">米色地毯</option>
                <option value="checkerboard">棋盘格</option>
              </select>
            </div>
          </div>

          <div
            className={`flex-1 overflow-hidden p-4 transition-all duration-300 ${
              draggingType ? 'bg-amber-50/40' : ''
            }`}
          >
            {viewMode === '2d' ? <RoomView2D /> : <RoomView3D />}
          </div>
        </main>
      </div>

      {showRoomMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRoomMenu(false)}
        />
      )}
    </div>
  );
}
