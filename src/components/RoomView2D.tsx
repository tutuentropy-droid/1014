import { useEffect, useRef, useState } from 'react';
import { FurnitureIcon } from './FurnitureIcon';
import { useDesignerStore } from '@/store/useDesignerStore';
import { GRID_SIZE } from '@/data/furnitureData';
import type { FurnitureItem, FurnitureType } from '@/types/furniture';
import { canPlaceAt } from '@/utils/collision';

interface DragState {
  type: 'move' | 'new';
  furnitureType?: FurnitureType;
  id?: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface WallDrawState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const RoomView2D = () => {
  const {
    furniture,
    walls,
    selectedId,
    drawMode,
    addFurniture,
    moveFurniture,
    selectFurniture,
    removeFurniture,
    removeWall,
    addWall,
    getRoomWidth,
    getRoomHeight,
    getCatalogEntry,
    setDrawMode,
  } = useDesignerStore();

  const roomWidth = getRoomWidth();
  const roomHeight = getRoomHeight();

  const roomRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number; valid: boolean } | null>(null);
  const [wallDraw, setWallDraw] = useState<WallDrawState | null>(null);

  const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        removeFurniture(selectedId);
      }
      if (e.key === 'Escape') {
        selectFurniture(null);
        if (drawMode === 'wall') setDrawMode('none');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, removeFurniture, selectFurniture, drawMode, setDrawMode]);

  const getRoomCoords = (e: React.DragEvent | React.MouseEvent | MouseEvent) => {
    const room = roomRef.current;
    if (!room) return { x: 0, y: 0 };
    const rect = room.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('furniture-type') as FurnitureType | undefined;
    if (!type) {
      setDrag(null);
      setGhostPos(null);
      return;
    }
    const catalog = getCatalogEntry(type);
    const { x, y } = getRoomCoords(e);
    const finalX = snapToGrid(x - catalog.width / 2);
    const finalY = snapToGrid(y - catalog.height / 2);
    addFurniture(type, finalX, finalY);
    setDrag(null);
    setGhostPos(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (drawMode === 'wall') return;
    e.dataTransfer.dropEffect = 'copy';
    const type = e.dataTransfer.types.includes('furniture-type')
      ? ((e as unknown as { furnitureType?: FurnitureType }).furnitureType ??
        (drag?.type === 'new' ? drag.furnitureType : undefined))
      : undefined;

    if (!drag && type) {
      const catalog = getCatalogEntry(type);
      setDrag({
        type: 'new',
        furnitureType: type,
        offsetX: catalog.width / 2,
        offsetY: catalog.height / 2,
        width: catalog.width,
        height: catalog.height,
      });
    }

    if (drag) {
      const { x, y } = getRoomCoords(e);
      const finalX = snapToGrid(x - drag.offsetX);
      const finalY = snapToGrid(y - drag.offsetY);
      const valid = canPlaceAt(
        { x: finalX, y: finalY, width: drag.width, height: drag.height },
        furniture,
        walls,
        drag.type === 'move' ? drag.id : undefined,
        roomWidth,
        roomHeight
      );
      setGhostPos({ x: finalX, y: finalY, valid });
    }
  };

  const handleDragLeave = () => {
    setGhostPos(null);
  };

  const handleMouseDown = (e: React.MouseEvent, item: FurnitureItem) => {
    if (e.button !== 0) return;
    if (drawMode === 'wall') return;
    e.stopPropagation();
    selectFurniture(item.id);
    const { x, y } = getRoomCoords(e);
    setDrag({
      type: 'move',
      id: item.id,
      offsetX: x - item.x,
      offsetY: y - item.y,
      width: item.width,
      height: item.height,
    });
  };

  const handleWallClick = (e: React.MouseEvent, wallId: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      removeWall(wallId);
    }
  };

  useEffect(() => {
    if (!drag || drag.type !== 'move') return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getRoomCoords(e as unknown as React.MouseEvent);
      const finalX = snapToGrid(x - drag.offsetX);
      const finalY = snapToGrid(y - drag.offsetY);
      const valid = canPlaceAt(
        { x: finalX, y: finalY, width: drag.width, height: drag.height },
        furniture,
        walls,
        drag.id,
        roomWidth,
        roomHeight
      );
      setGhostPos({ x: finalX, y: finalY, valid });
    };

    const handleMouseUp = () => {
      if (ghostPos && ghostPos.valid) {
        moveFurniture(drag.id!, ghostPos.x, ghostPos.y);
      }
      setDrag(null);
      setGhostPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, furniture, walls, moveFurniture, ghostPos, roomWidth, roomHeight]);

  const handleRoomMouseDown = (e: React.MouseEvent) => {
    if (drawMode !== 'wall') return;
    if (e.button !== 0) return;
    const { x, y } = getRoomCoords(e);
    const sx = snapToGrid(x);
    const sy = snapToGrid(y);
    setWallDraw({ startX: sx, startY: sy, currentX: sx, currentY: sy });
  };

  useEffect(() => {
    if (!wallDraw) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getRoomCoords(e as unknown as React.MouseEvent);
      setWallDraw((prev) =>
        prev ? { ...prev, currentX: snapToGrid(x), currentY: snapToGrid(y) } : prev
      );
    };

    const handleMouseUp = () => {
      if (wallDraw) {
        const x = Math.min(wallDraw.startX, wallDraw.currentX);
        const y = Math.min(wallDraw.startY, wallDraw.currentY);
        const width = Math.abs(wallDraw.currentX - wallDraw.startX);
        const height = Math.abs(wallDraw.currentY - wallDraw.startY);
        addWall(x, y, width, height);
      }
      setWallDraw(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [wallDraw, addWall]);

  const handleRoomClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) selectFurniture(null);
  };

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= roomWidth; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={roomHeight}
          stroke="#e7e0d5"
          strokeWidth={x % (GRID_SIZE * 2) === 0 ? 1 : 0.5}
        />
      );
    }
    for (let y = 0; y <= roomHeight; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={roomWidth}
          y2={y}
          stroke="#e7e0d5"
          strokeWidth={y % (GRID_SIZE * 2) === 0 ? 1 : 0.5}
        />
      );
    }
    return lines;
  };

  const getWallRect = () => {
    if (!wallDraw) return null;
    const x = Math.min(wallDraw.startX, wallDraw.currentX);
    const y = Math.min(wallDraw.startY, wallDraw.currentY);
    const width = Math.abs(wallDraw.currentX - wallDraw.startX);
    const height = Math.abs(wallDraw.currentY - wallDraw.startY);
    return { x, y, width, height };
  };

  const previewRect = getWallRect();

  return (
    <div
      ref={roomRef}
      onClick={handleRoomClick}
      onMouseDown={handleRoomMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative rounded-2xl shadow-[0_8px_40px_rgba(92,74,61,0.12)] border-2 overflow-hidden select-none transition-all ${
        drawMode === 'wall'
          ? 'border-sky-400 cursor-crosshair'
          : 'border-stone-200'
      }`}
      style={{
        width: roomWidth,
        height: roomHeight,
        background:
          'radial-gradient(ellipse at 30% 20%, #faf6f0 0%, #f3ece0 100%)',
      }}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width={roomWidth}
        height={roomHeight}
      >
        {renderGrid()}
      </svg>

      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="px-2.5 py-1 bg-white/80 backdrop-blur rounded-md text-[10px] text-stone-500 font-mono border border-stone-200">
          {roomWidth} × {roomHeight}
        </div>
        {drawMode === 'wall' && (
          <div className="px-2.5 py-1 bg-sky-500/90 text-white rounded-md text-[10px] font-medium backdrop-blur">
            画墙模式 · 拖拽绘制 · Shift+点击删除
          </div>
        )}
      </div>

      {walls.map((wall) => (
        <div
          key={wall.id}
          onMouseDown={(e) => handleWallClick(e, wall.id)}
          onClick={(e) => e.stopPropagation()}
          className="absolute rounded-sm border border-stone-400/40 cursor-pointer hover:border-sky-400 transition-colors"
          style={{
            left: wall.x,
            top: wall.y,
            width: wall.width,
            height: wall.height,
            backgroundColor: 'rgba(156, 163, 175, 0.5)',
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(107,114,128,0.2) 0px, rgba(107,114,128,0.2) 4px, transparent 4px, transparent 8px)',
          }}
          title="墙体（Shift+点击删除）"
        />
      ))}

      {previewRect && previewRect.width > 0 && previewRect.height > 0 && (
        <div
          className="absolute rounded-sm border-2 border-dashed border-sky-500 pointer-events-none"
          style={{
            left: previewRect.x,
            top: previewRect.y,
            width: previewRect.width,
            height: previewRect.height,
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
          }}
        />
      )}

      {furniture.map((item) => {
        const isSelected = selectedId === item.id;
        const isDragging = drag?.type === 'move' && drag.id === item.id;
        const catalog = getCatalogEntry(item.type);
        return (
          <div
            key={item.id}
            onMouseDown={(e) => handleMouseDown(e, item)}
            className={`absolute rounded-lg cursor-move transition-shadow duration-150 ${
              isSelected
                ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-100 shadow-lg z-20'
                : 'shadow-md hover:shadow-lg z-10'
            } ${isDragging ? 'opacity-40' : ''}`}
            style={{
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
              backgroundColor: item.color,
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <FurnitureIcon
                type={item.type}
                size={Math.min(item.width, item.height) * 0.55}
                color="rgba(255,255,255,0.9)"
                iconUrl={catalog.iconUrl}
              />
            </div>
            {isSelected && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-medium whitespace-nowrap">
                {item.label}
              </div>
            )}
          </div>
        );
      })}

      {ghostPos && drag && (
        <div
          className={`absolute rounded-lg pointer-events-none border-2 border-dashed ${
            ghostPos.valid ? 'border-emerald-500 bg-emerald-500/15' : 'border-red-500 bg-red-500/15'
          }`}
          style={{
            left: ghostPos.x,
            top: ghostPos.y,
            width: drag.width,
            height: drag.height,
          }}
        />
      )}
    </div>
  );
};
