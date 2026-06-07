import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, Home } from 'lucide-react';
import { useDesignerStore } from '@/store/useDesignerStore';
import { GRID_SIZE } from '@/data/furnitureData';

interface RoomTabsProps {
  onToast?: (msg: string) => void;
}

export const RoomTabs = ({ onToast }: RoomTabsProps) => {
  const {
    rooms,
    currentRoomId,
    switchRoom,
    addRoom,
    removeRoom,
    renameRoom,
  } = useDesignerStore();

  const [showAddInput, setShowAddInput] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleAddRoom = () => {
    const name = newRoomName.trim() || `房间 ${rooms.length + 1}`;
    addRoom(name);
    setNewRoomName('');
    setShowAddInput(false);
    onToast?.(`✓ 已创建房间「${name}」`);
  };

  const handleRemoveRoom = (roomId: string, roomName: string) => {
    if (rooms.length <= 1) {
      onToast?.('⚠️ 至少需要保留一个房间');
      return;
    }
    if (confirm(`确定要删除房间「${roomName}」吗？此操作不可撤销。`)) {
      removeRoom(roomId);
      onToast?.(`✓ 已删除房间「${roomName}」`);
    }
  };

  const startRename = (roomId: string, currentName: string) => {
    setEditingId(roomId);
    setEditingName(currentName);
  };

  const confirmRename = () => {
    if (editingId && editingName.trim()) {
      renameRoom(editingId, editingName);
      onToast?.(`✓ 房间已重命名为「${editingName.trim()}」`);
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddRoom();
    if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewRoomName('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') cancelRename();
  };

  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-rose-400 to-rose-600" />
        <h2 className="text-lg font-semibold text-stone-800 tracking-tight">房间管理</h2>
      </div>

      <div className="flex flex-col gap-2">
        {rooms.map((room) => {
          const isActive = room.id === currentRoomId;
          const isEditing = editingId === room.id;

          return (
            <div
              key={room.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
              onClick={() => !isEditing && switchRoom(room.id)}
            >
              <Home className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/90' : 'text-stone-400'}`} />

              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={confirmRename}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 px-2 py-0.5 text-sm bg-white rounded border border-amber-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              ) : (
                <span className="flex-1 min-w-0 text-sm font-medium truncate">{room.name}</span>
              )}

              {isEditing ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmRename();
                    }}
                    className="p-1 rounded-md hover:bg-white/20 transition-colors"
                    title="确认"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelRename();
                    }}
                    className="p-1 rounded-md hover:bg-white/20 transition-colors"
                    title="取消"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(room.id, room.name);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isActive ? 'hover:bg-white/20' : 'hover:bg-stone-200 text-stone-500'
                    }`}
                    title="重命名"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRoom(room.id, room.name);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isActive
                        ? 'hover:bg-white/20'
                        : 'hover:bg-red-100 text-stone-500 hover:text-red-600'
                    } ${rooms.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={rooms.length <= 1 ? '至少保留一个房间' : '删除房间'}
                    disabled={rooms.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {showAddInput ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200">
            <Plus className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <input
              ref={addInputRef}
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={handleAddKeyDown}
              onBlur={() => {
                if (newRoomName.trim()) handleAddRoom();
                else {
                  setShowAddInput(false);
                  setNewRoomName('');
                }
              }}
              placeholder="输入房间名称..."
              className="flex-1 min-w-0 px-2 py-0.5 text-sm bg-white rounded border border-sky-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={handleAddRoom}
              className="p-1 rounded-md hover:bg-sky-200 text-sky-600 transition-colors"
              title="确认添加"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewRoomName('');
              }}
              className="p-1 rounded-md hover:bg-sky-200 text-sky-600 transition-colors"
              title="取消"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddInput(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-amber-50 border border-dashed border-stone-300 hover:border-amber-300 text-stone-500 hover:text-amber-700 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            新建房间
          </button>
        )}
      </div>

      {currentRoom && (
        <div className="pt-3 mt-1 border-t border-stone-100">
          <div className="px-3 py-2 rounded-lg bg-amber-50/70 border border-amber-100">
            <p className="text-xs text-stone-600">
              当前：<span className="font-semibold text-stone-800">{currentRoom.name}</span>
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              {currentRoom.furniture.length} 件家具 · {currentRoom.widthGrids}×{currentRoom.heightGrids}格
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              位置({currentRoom.x}, {currentRoom.y}) · {currentRoom.widthGrids * GRID_SIZE}×{currentRoom.heightGrids * GRID_SIZE}px
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
