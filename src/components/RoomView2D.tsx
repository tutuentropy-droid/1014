import { useEffect, useRef, useState, useCallback } from 'react';
import { FurnitureIcon } from './FurnitureIcon';
import { useDesignerStore } from '@/store/useDesignerStore';
import { GRID_SIZE, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS } from '@/data/furnitureData';
import type { FurnitureItem, FurnitureType, Room, WindowItem, CurtainItem } from '@/types/furniture';
import { canPlaceFurnitureInRoom, generateWallsForRooms, canPlaceRoom, snapWindowToWall, findWallAtPoint } from '@/utils/collision';

type RoomResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

interface DragState {
  type: 'move-furniture' | 'new-furniture' | 'move-room' | 'resize-room' | 'draw-window';
  furnitureType?: FurnitureType;
  id?: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  roomId?: string;
  resizeHandle?: RoomResizeHandle;
  roomOrigX?: number;
  roomOrigY?: number;
  roomOrigW?: number;
  roomOrigH?: number;
  startX?: number;
  startY?: number;
}

interface PanState {
  startX: number;
  startY: number;
  originOffsetX: number;
  originOffsetY: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;

export const RoomView2D = () => {
  const {
    rooms,
    selectedId,
    selectedRoomId,
    selectedWindowId,
    selectedCurtainId,
    drawMode,
    addFurniture,
    moveFurniture,
    selectFurniture,
    removeFurniture,
    selectRoom,
    moveRoom,
    resizeRoom,
    getCanvasWidth,
    getCanvasHeight,
    getCatalogEntry,
    setDrawMode,
    addWindow,
    removeWindow,
    selectWindow,
    addCurtain,
    removeCurtain,
    toggleCurtain,
    selectCurtain,
  } = useDesignerStore();

  const canvasWidth = getCanvasWidth();
  const canvasHeight = getCanvasHeight();

  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number; valid: boolean; width: number; height: number } | null>(null);
  const [roomGhost, setRoomGhost] = useState<{ x: number; y: number; w: number; h: number; valid: boolean } | null>(null);
  const [windowGhost, setWindowGhost] = useState<{ x: number; y: number; w: number; h: number; valid: boolean; windowWidth: number; windowHeight: number } | null>(null);
  const [scale, setScale] = useState(0.75);
  const [offsetX, setOffsetX] = useState(20);
  const [offsetY, setOffsetY] = useState(20);
  const panRef = useRef<PanState | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;
  const snapGrids = (v: number) => Math.round(v);

  const findRoomAt = useCallback((x: number, y: number): Room | undefined => {
    for (const room of rooms) {
      const rx = room.x * GRID_SIZE;
      const ry = room.y * GRID_SIZE;
      const rw = room.widthGrids * GRID_SIZE;
      const rh = room.heightGrids * GRID_SIZE;
      if (x >= rx && x < rx + rw && y >= ry && y < ry + rh) {
        return room;
      }
    }
    return undefined;
  }, [rooms]);

  const findWindowAt = useCallback((x: number, y: number): WindowItem | null => {
    for (const room of rooms) {
      for (const win of room.windows) {
        if (x >= win.x && x <= win.x + win.width && y >= win.y && y <= win.y + win.height) {
          return win;
        }
      }
    }
    return null;
  }, [rooms]);

  const findCurtainAt = useCallback((x: number, y: number): CurtainItem | null => {
    for (const room of rooms) {
      for (const curtain of room.curtains) {
        const win = room.windows.find((w) => w.id === curtain.windowId);
        if (win) {
          if (x >= win.x && x <= win.x + win.width && y >= win.y && y <= win.y + win.height) {
            return curtain;
          }
        }
      }
    }
    return null;
  }, [rooms]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      return {
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale,
      };
    },
    [offsetX, offsetY, scale]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        if (selectedId) {
          removeFurniture(selectedId);
        } else if (selectedWindowId) {
          removeWindow(selectedWindowId);
        } else if (selectedCurtainId) {
          removeCurtain(selectedCurtainId);
        }
      }
      if (e.key === 'Escape') {
        selectFurniture(null);
        selectRoom(null);
        selectWindow(null);
        selectCurtain(null);
        setDrawMode('none');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, selectedWindowId, selectedCurtainId, removeFurniture, removeWindow, removeCurtain, selectFurniture, selectRoom, selectWindow, selectCurtain, setDrawMode]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * zoomFactor));
      const actualZoomFactor = newScale / scale;

      const newOffsetX = mouseX - (mouseX - offsetX) * actualZoomFactor;
      const newOffsetY = mouseY - (mouseY - offsetY) * actualZoomFactor;

      setScale(newScale);
      setOffsetX(newOffsetX);
      setOffsetY(newOffsetY);
    },
    [scale, offsetX, offsetY]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleMiddleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originOffsetX: offsetX,
      originOffsetY: offsetY,
    };
    setIsPanning(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panRef.current) return;
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setOffsetX(panRef.current.originOffsetX + dx);
      setOffsetY(panRef.current.originOffsetY + dy);
    };
    const handleMouseUp = () => {
      panRef.current = null;
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('furniture-type') as FurnitureType | undefined;
    if (!type) {
      setDrag(null);
      setGhostPos(null);
      return;
    }
    const catalog = getCatalogEntry(type);
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const room = findRoomAt(x, y);
    if (!room) {
      setDrag(null);
      setGhostPos(null);
      return;
    }
    const finalX = snapToGrid(x - catalog.width / 2);
    const finalY = snapToGrid(y - catalog.height / 2);
    addFurniture(type, finalX, finalY, room.id);
    setDrag(null);
    setGhostPos(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const type = e.dataTransfer.types.includes('furniture-type')
      ? ((e as unknown as { furnitureType?: FurnitureType }).furnitureType ??
        (drag?.type === 'new-furniture' ? drag.furnitureType : undefined))
      : undefined;

    if (!drag && type) {
      const catalog = getCatalogEntry(type);
      setDrag({
        type: 'new-furniture',
        furnitureType: type,
        offsetX: catalog.width / 2,
        offsetY: catalog.height / 2,
        width: catalog.width,
        height: catalog.height,
      });
    }

    if (drag && drag.type === 'new-furniture') {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const room = findRoomAt(x, y);
      if (!room) {
        setGhostPos({ x: x - drag.offsetX, y: y - drag.offsetY, valid: false, width: drag.width, height: drag.height });
        return;
      }
      const finalX = snapToGrid(x - drag.offsetX);
      const finalY = snapToGrid(y - drag.offsetY);
      const allFurniture = rooms.flatMap((r) => r.furniture);
      const autoWalls = generateWallsForRooms(rooms) as unknown as { x: number; y: number; width: number; height: number; id: string }[];
      const valid = canPlaceFurnitureInRoom(
        { x: finalX, y: finalY, width: drag.width, height: drag.height },
        room,
        allFurniture,
        autoWalls
      );
      setGhostPos({ x: finalX, y: finalY, valid, width: drag.width, height: drag.height });
    }
  };

  const handleDragLeave = () => {
    setGhostPos(null);
  };

  const handleFurnitureMouseDown = (e: React.MouseEvent, item: FurnitureItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectFurniture(item.id);
    selectRoom(item.roomId);
    selectWindow(null);
    selectCurtain(null);
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setDrag({
      type: 'move-furniture',
      id: item.id,
      offsetX: x - item.x,
      offsetY: y - item.y,
      width: item.width,
      height: item.height,
      roomId: item.roomId,
    });
  };

  const handleWindowMouseDown = (e: React.MouseEvent, win: WindowItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (drawMode === 'curtain') {
      addCurtain(win.id, win.roomId);
      setDrawMode('none');
      return;
    }

    selectWindow(win.id);
    selectRoom(win.roomId);
    selectFurniture(null);
    selectCurtain(null);
  };

  const handleCurtainMouseDown = (e: React.MouseEvent, curtain: CurtainItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectCurtain(curtain.id);
    selectWindow(null);
    selectFurniture(null);
    selectRoom(curtain.roomId);
  };

  const handleRoomMouseDown = (e: React.MouseEvent, room: Room) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectRoom(room.id);
    selectFurniture(null);
    selectWindow(null);
    selectCurtain(null);
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const rx = room.x * GRID_SIZE;
    const ry = room.y * GRID_SIZE;
    setDrag({
      type: 'move-room',
      id: room.id,
      offsetX: x - rx,
      offsetY: y - ry,
      width: room.widthGrids * GRID_SIZE,
      height: room.heightGrids * GRID_SIZE,
      roomId: room.id,
      roomOrigX: room.x,
      roomOrigY: room.y,
      roomOrigW: room.widthGrids,
      roomOrigH: room.heightGrids,
    });
  };

  const handleRoomResizeMouseDown = (e: React.MouseEvent, room: Room, handle: RoomResizeHandle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectRoom(room.id);
    setDrag({
      type: 'resize-room',
      id: room.id,
      offsetX: 0,
      offsetY: 0,
      width: room.widthGrids * GRID_SIZE,
      height: room.heightGrids * GRID_SIZE,
      roomId: room.id,
      resizeHandle: handle,
      roomOrigX: room.x,
      roomOrigY: room.y,
      roomOrigW: room.widthGrids,
      roomOrigH: room.heightGrids,
    });
  };

  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);

      if (drag.type === 'move-furniture') {
        const room = rooms.find((r) => r.id === drag.roomId);
        if (!room) return;
        const finalX = snapToGrid(x - drag.offsetX);
        const finalY = snapToGrid(y - drag.offsetY);
        const allFurniture = rooms.flatMap((r) => r.furniture);
        const autoWalls = generateWallsForRooms(rooms) as unknown as { x: number; y: number; width: number; height: number; id: string }[];
        const valid = canPlaceFurnitureInRoom(
          { x: finalX, y: finalY, width: drag.width, height: drag.height },
          room,
          allFurniture,
          autoWalls,
          drag.id
        );
        setGhostPos({ x: finalX, y: finalY, valid, width: drag.width, height: drag.height });
      } else if (drag.type === 'move-room') {
        const finalXGrids = snapGrids((x - drag.offsetX) / GRID_SIZE);
        const finalYGrids = snapGrids((y - drag.offsetY) / GRID_SIZE);
        const w = drag.roomOrigW!;
        const h = drag.roomOrigH!;
        const valid = canPlaceRoom(
          { x: finalXGrids, y: finalYGrids, widthGrids: w, heightGrids: h },
          rooms,
          drag.roomId,
          CANVAS_WIDTH_GRIDS,
          CANVAS_HEIGHT_GRIDS
        );
        setRoomGhost({ x: finalXGrids, y: finalYGrids, w, h, valid });
      } else if (drag.type === 'resize-room') {
        const handle = drag.resizeHandle!;
        let newX = drag.roomOrigX!;
        let newY = drag.roomOrigY!;
        let newW = drag.roomOrigW!;
        let newH = drag.roomOrigH!;

        const cursorXGrids = snapGrids(x / GRID_SIZE);
        const cursorYGrids = snapGrids(y / GRID_SIZE);

        if (handle.includes('e')) {
          newW = Math.max(4, cursorXGrids - drag.roomOrigX!);
        }
        if (handle.includes('w')) {
          const diff = drag.roomOrigX! - cursorXGrids;
          newW = Math.max(4, drag.roomOrigW! + diff);
          newX = cursorXGrids;
        }
        if (handle.includes('s')) {
          newH = Math.max(4, cursorYGrids - drag.roomOrigY!);
        }
        if (handle.includes('n')) {
          const diff = drag.roomOrigY! - cursorYGrids;
          newH = Math.max(4, drag.roomOrigH! + diff);
          newY = cursorYGrids;
        }

        const valid = canPlaceRoom(
          { x: newX, y: newY, widthGrids: newW, heightGrids: newH },
          rooms,
          drag.roomId,
          CANVAS_WIDTH_GRIDS,
          CANVAS_HEIGHT_GRIDS
        );
        setRoomGhost({ x: newX, y: newY, w: newW, h: newH, valid });
      } else if (drag.type === 'draw-window') {
        const result = snapWindowToWall(drag.startX!, drag.startY!, x, y, rooms);
        if (result.valid) {
          setWindowGhost({
            x: result.x!,
            y: result.y!,
            w: result.width!,
            h: result.height!,
            valid: true,
            windowWidth: result.windowWidth!,
            windowHeight: result.windowHeight!,
          });
        } else if (windowGhost) {
          setWindowGhost({ ...windowGhost, valid: false });
        }
      }
    };

    const handleMouseUp = () => {
      if (drag.type === 'move-furniture' && ghostPos && ghostPos.valid) {
        moveFurniture(drag.id!, ghostPos.x, ghostPos.y);
      } else if (drag.type === 'move-room' && roomGhost && roomGhost.valid) {
        moveRoom(drag.roomId!, roomGhost.x, roomGhost.y);
      } else if (drag.type === 'resize-room' && roomGhost && roomGhost.valid) {
        resizeRoom(drag.roomId!, roomGhost.w, roomGhost.h);
      } else if (drag.type === 'draw-window' && windowGhost && windowGhost.valid) {
        const startWall = findWallAtPoint(drag.startX!, drag.startY!, rooms);
        if (startWall) {
          addWindow(
            startWall.roomId,
            windowGhost.x,
            windowGhost.y,
            windowGhost.w,
            windowGhost.h,
            startWall.wallOrientation,
            startWall.wallOrientation === 'top' || startWall.wallOrientation === 'bottom'
              ? windowGhost.x - startWall.room.x * GRID_SIZE
              : windowGhost.y - startWall.room.y * GRID_SIZE,
            windowGhost.windowWidth,
            windowGhost.windowHeight
          );
        }
      }
      setDrag(null);
      setGhostPos(null);
      setRoomGhost(null);
      setWindowGhost(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, ghostPos, roomGhost, windowGhost, rooms, screenToCanvas, moveFurniture, moveRoom, resizeRoom, addWindow]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      handleMiddleMouseDown(e);
      return;
    }
    if (e.button !== 0) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    if (drawMode === 'window') {
      const wallHit = findWallAtPoint(x, y, rooms);
      if (wallHit) {
        e.stopPropagation();
        setDrag({
          type: 'draw-window',
          offsetX: 0,
          offsetY: 0,
          width: 0,
          height: 0,
          startX: x,
          startY: y,
          roomId: wallHit.roomId,
        });
        return;
      }
    }

    if (drawMode === 'curtain') {
      const win = findWindowAt(x, y);
      if (win) {
        e.stopPropagation();
        addCurtain(win.id, win.roomId);
        setDrawMode('none');
        return;
      }
    }

    if (e.target === e.currentTarget) {
      selectFurniture(null);
      selectRoom(null);
      selectWindow(null);
      selectCurtain(null);
    }
  };

  const renderGrid = () => {
    const lines = [];
    for (let gx = 0; gx <= CANVAS_WIDTH_GRIDS; gx++) {
      const x = gx * GRID_SIZE;
      lines.push(
        <line
          key={`v-${gx}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="#d4cfc7"
          strokeWidth={gx % 5 === 0 ? 1 : 0.5}
          opacity={gx % 5 === 0 ? 0.6 : 0.3}
        />
      );
    }
    for (let gy = 0; gy <= CANVAS_HEIGHT_GRIDS; gy++) {
      const y = gy * GRID_SIZE;
      lines.push(
        <line
          key={`h-${gy}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="#d4cfc7"
          strokeWidth={gy % 5 === 0 ? 1 : 0.5}
          opacity={gy % 5 === 0 ? 0.6 : 0.3}
        />
      );
    }
    return lines;
  };

  const autoWalls = generateWallsForRooms(rooms);

  const selectedCurtain = selectedCurtainId
    ? rooms.flatMap((r) => r.curtains).find((c) => c.id === selectedCurtainId)
    : null;
  const selectedWindow = selectedWindowId
    ? rooms.flatMap((r) => r.windows).find((w) => w.id === selectedWindowId)
    : null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative rounded-2xl shadow-[0_8px_40px_rgba(92,74,61,0.12)] border-2 overflow-hidden select-none transition-all ${
        isPanning
          ? 'border-stone-400 cursor-grabbing'
          : drawMode === 'window'
            ? 'border-sky-400 cursor-crosshair'
            : drawMode === 'curtain'
              ? 'border-violet-400 cursor-pointer'
              : 'border-stone-300 cursor-grab'
      }`}
      style={{
        width: Math.min(1100, window.innerWidth - 600),
        height: 700,
        background: '#f5efe6',
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, #faf6f0 0%, #ede4d3 100%)',
            border: '2px solid #c9b897',
            boxShadow: 'inset 0 0 60px rgba(139, 115, 85, 0.1)',
          }}
        />

        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
        >
          {renderGrid()}
        </svg>

        {rooms.map((room) => {
          const isSelected = selectedRoomId === room.id;
          const rx = room.x * GRID_SIZE;
          const ry = room.y * GRID_SIZE;
          const rw = room.widthGrids * GRID_SIZE;
          const rh = room.heightGrids * GRID_SIZE;
          const isMoving = drag?.type === 'move-room' && drag.roomId === room.id;
          const isResizing = drag?.type === 'resize-room' && drag.roomId === room.id;
          const showGhost = (isMoving || isResizing) && roomGhost;

          return (
            <div key={room.id}>
              <div
                onMouseDown={(e) => handleRoomMouseDown(e, room)}
                className={`absolute rounded-md cursor-move transition-all ${
                  isSelected
                    ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-transparent z-10'
                    : 'hover:ring-2 hover:ring-amber-400/50 z-[1]'
                } ${isMoving || isResizing ? 'opacity-50' : ''}`}
                style={{
                  left: rx,
                  top: ry,
                  width: rw,
                  height: rh,
                  backgroundColor: room.color,
                  boxShadow: isSelected
                    ? '0 4px 20px rgba(245, 158, 11, 0.25), inset 0 0 40px rgba(0,0,0,0.04)'
                    : 'inset 0 0 40px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(107, 90, 68, 0.25)',
                }}
              >
                <div
                  className="absolute top-2 left-3 px-2 py-0.5 rounded-md backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: '#5c4a3d' }}
                  >
                    {room.name}
                  </span>
                  <span className="text-[10px] text-stone-500 ml-1.5 font-mono">
                    {room.widthGrids}×{room.heightGrids}
                  </span>
                </div>

                {room.furniture.map((item) => {
                  const isItemSelected = selectedId === item.id;
                  const isDragging = drag?.type === 'move-furniture' && drag.id === item.id;
                  const catalog = getCatalogEntry(item.type);
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => handleFurnitureMouseDown(e, item)}
                      className={`absolute rounded-lg cursor-move transition-shadow duration-150 ${
                        isItemSelected
                          ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-stone-100 shadow-xl z-30'
                          : 'shadow-md hover:shadow-lg z-20'
                      } ${isDragging ? 'opacity-30' : ''}`}
                      style={{
                        left: item.x - rx,
                        top: item.y - ry,
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
                          size={Math.min(item.width, item.height) * 0.5}
                          color="rgba(255,255,255,0.9)"
                          iconUrl={catalog.iconUrl}
                        />
                      </div>
                      {isItemSelected && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-medium whitespace-nowrap shadow">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}

                {room.windows.map((win) => {
                  const isWinSelected = selectedWindowId === win.id;
                  const curtain = room.curtains.find((c) => c.windowId === win.id);
                  const isCurtainSelected = curtain && selectedCurtainId === curtain.id;
                  const isHWall = win.wallOrientation === 'top' || win.wallOrientation === 'bottom';
                  const hitPad = 8;
                  return (
                    <div
                      key={win.id}
                      className="absolute"
                      style={{
                        left: win.x - rx - (isHWall ? 0 : hitPad),
                        top: win.y - ry - (isHWall ? hitPad : 0),
                        width: win.width + (isHWall ? 0 : hitPad * 2),
                        height: win.height + (isHWall ? hitPad * 2 : 0),
                        zIndex: 25,
                      }}
                    >
                      <div
                        onMouseDown={(e) => handleWindowMouseDown(e, win)}
                        className={`absolute inset-0 cursor-pointer transition-all ${
                          isWinSelected || isCurtainSelected
                            ? 'ring-2 ring-sky-500 ring-offset-1'
                            : 'hover:ring-2 hover:ring-sky-400'
                        }`}
                        style={{
                          backgroundColor: isWinSelected ? 'rgba(135, 206, 250, 0.15)' : 'rgba(135, 206, 250, 0.05)',
                        }}
                      >
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: isHWall ? 0 : hitPad,
                            top: isHWall ? hitPad : 0,
                            right: isHWall ? 0 : hitPad,
                            bottom: isHWall ? hitPad : 0,
                            backgroundColor: 'rgba(135, 206, 250, 0.6)',
                            border: '2px solid #4a90d9',
                            borderRadius: 2,
                          }}
                        />
                        <div
                          className="absolute whitespace-nowrap text-[9px] font-mono font-bold pointer-events-none"
                          style={{
                            color: '#1e40af',
                            bottom: win.wallOrientation === 'top' ? -14 : 'auto',
                            top: win.wallOrientation === 'bottom' ? -14 : win.wallOrientation === 'left' || win.wallOrientation === 'right' ? '50%' : 'auto',
                            left: win.wallOrientation === 'left' ? -14 : win.wallOrientation === 'right' ? 'auto' : '50%',
                            right: win.wallOrientation === 'right' ? -14 : 'auto',
                            transform:
                              win.wallOrientation === 'top' || win.wallOrientation === 'bottom'
                                ? 'translateX(-50%)'
                                : 'translateY(-50%) rotate(90deg)',
                          }}
                        >
                          {Math.round(win.windowWidth)}×{Math.round(win.windowHeight)}
                        </div>
                      </div>
                      {curtain && (
                        <div
                          onMouseDown={(e) => handleCurtainMouseDown(e, curtain)}
                          className={`absolute cursor-pointer transition-all ${
                            isCurtainSelected
                              ? 'ring-2 ring-violet-500 ring-offset-1'
                              : 'hover:ring-2 hover:ring-violet-400'
                          }`}
                          style={{
                            left: isHWall ? 0 : (win.wallOrientation === 'left' ? 8 : win.wallOrientation === 'right' ? 'auto' : 0),
                            right: isHWall ? 0 : (win.wallOrientation === 'right' ? 8 : 'auto'),
                            top: isHWall ? (win.wallOrientation === 'top' ? 8 : 'auto') : 0,
                            bottom: isHWall ? (win.wallOrientation === 'bottom' ? 8 : 'auto') : 0,
                            width: isHWall ? '100%' : 12,
                            height: isHWall ? 12 : '100%',
                            zIndex: 35,
                            background: `repeating-linear-gradient(
                              ${isHWall ? '90deg' : '0deg'},
                              rgba(139, 92, 246, 0.7),
                              rgba(139, 92, 246, 0.7) 4px,
                              rgba(167, 139, 250, 0.7) 4px,
                              rgba(167, 139, 250, 0.7) 8px
                            )`,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}

                {isSelected && !isMoving && !isResizing && (
                  <>
                    {(['nw', 'ne', 'sw', 'se'] as RoomResizeHandle[]).map((handle) => {
                      const pos = {
                        nw: { left: -6, top: -6, cursor: 'nwse-resize' },
                        ne: { right: -6, top: -6, cursor: 'nesw-resize' },
                        sw: { left: -6, bottom: -6, cursor: 'nesw-resize' },
                        se: { right: -6, bottom: -6, cursor: 'nwse-resize' },
                      }[handle];
                      return (
                        <div
                          key={handle}
                          onMouseDown={(e) => handleRoomResizeMouseDown(e, room, handle)}
                          className="absolute w-3 h-3 bg-white border-2 border-amber-500 rounded-sm shadow-md hover:bg-amber-500 hover:scale-125 transition-all z-40"
                          style={pos}
                        />
                      );
                    })}
                  </>
                )}
              </div>

              {showGhost && (
                <div
                  className={`absolute rounded-md pointer-events-none border-2 border-dashed z-50 ${
                    roomGhost!.valid ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'
                  }`}
                  style={{
                    left: roomGhost!.x * GRID_SIZE,
                    top: roomGhost!.y * GRID_SIZE,
                    width: roomGhost!.w * GRID_SIZE,
                    height: roomGhost!.h * GRID_SIZE,
                  }}
                />
              )}
            </div>
          );
        })}

        {autoWalls.map((wall, idx) => (
          <div
            key={`aw-${idx}`}
            className="absolute pointer-events-none"
            style={{
              left: wall.x,
              top: wall.y,
              width: wall.width,
              height: wall.height,
              backgroundColor: 'rgba(90, 75, 60, 0.85)',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        ))}

        {ghostPos && drag && drag.type !== 'move-room' && drag.type !== 'resize-room' && drag.type !== 'draw-window' && (
          <div
            className={`absolute rounded-lg pointer-events-none border-2 border-dashed z-50 ${
              ghostPos.valid ? 'border-emerald-500 bg-emerald-500/15' : 'border-red-500 bg-red-500/15'
            }`}
            style={{
              left: ghostPos.x,
              top: ghostPos.y,
              width: ghostPos.width,
              height: ghostPos.height,
            }}
          />
        )}

        {windowGhost && drag?.type === 'draw-window' && (
          <div
            className={`absolute pointer-events-none border-2 border-dashed z-50 ${
              windowGhost.valid ? 'border-sky-500 bg-sky-400/40' : 'border-red-500 bg-red-500/15'
            }`}
            style={{
              left: windowGhost.x,
              top: windowGhost.y,
              width: windowGhost.w,
              height: windowGhost.h,
            }}
          />
        )}
      </div>

      {(selectedWindow || selectedCurtain) && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-stone-200">
          {selectedWindow && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600 font-medium">窗户</span>
              <button
                onClick={() => {
                  if (!rooms.flatMap((r) => r.curtains).some((c) => c.windowId === selectedWindow.id)) {
                    addCurtain(selectedWindow.id, selectedWindow.roomId);
                  }
                }}
                disabled={rooms.flatMap((r) => r.curtains).some((c) => c.windowId === selectedWindow.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
              >
                {rooms.flatMap((r) => r.curtains).some((c) => c.windowId === selectedWindow.id) ? '已有窗帘' : '添加窗帘'}
              </button>
              <button
                onClick={() => removeWindow(selectedWindow.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
              >
                删除窗户
              </button>
            </div>
          )}
          {selectedCurtain && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600 font-medium">窗帘</span>
              <button
                onClick={() => toggleCurtain(selectedCurtain.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                {selectedCurtain.isOpen ? '关闭窗帘' : '打开窗帘'}
              </button>
              <button
                onClick={() => removeCurtain(selectedCurtain.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
              >
                删除窗帘
              </button>
            </div>
          )}
        </div>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-2 z-20 flex-wrap">
        <div className="px-2.5 py-1 bg-white/90 backdrop-blur rounded-md text-[10px] text-stone-600 font-mono border border-stone-200 shadow-sm">
          画布 {CANVAS_WIDTH_GRIDS}×{CANVAS_HEIGHT_GRIDS} 格
        </div>
        <div className="px-2.5 py-1 bg-white/90 backdrop-blur rounded-md text-[10px] text-stone-600 font-mono border border-stone-200 shadow-sm">
          缩放 {Math.round(scale * 100)}%
        </div>
        <div className="px-2.5 py-1 bg-white/90 backdrop-blur rounded-md text-[10px] text-stone-600 border border-stone-200 shadow-sm">
          {rooms.length} 个房间 · {rooms.reduce((s, r) => s + r.furniture.length, 0)} 件家具 · {rooms.reduce((s, r) => s + r.windows.length, 0)} 个窗户
        </div>
        {drawMode === 'window' && (
          <div className="px-2.5 py-1 bg-sky-500/90 backdrop-blur rounded-md text-[10px] text-white font-medium border border-sky-400 shadow-sm">
            添加窗户模式 · 在墙壁上拖拽绘制
          </div>
        )}
        {drawMode === 'curtain' && (
          <div className="px-2.5 py-1 bg-violet-500/90 backdrop-blur rounded-md text-[10px] text-white font-medium border border-violet-400 shadow-sm">
            添加窗帘模式 · 点击窗户添加窗帘
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 bg-white/90 backdrop-blur rounded-md text-[10px] text-stone-600 font-mono border border-stone-200 shadow-sm">
        滚轮缩放 · 中键拖拽平移 · 拖拽房间移动 · 四角缩放 · 拖家具到房间内
      </div>
    </div>
  );
};
