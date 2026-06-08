import { useCallback, useEffect, useRef, useState } from 'react';
import { useDesignerStore } from '@/store/useDesignerStore';
import { FurnitureIcon } from './FurnitureIcon';
import type { FurnitureItem, FurnitureType, Room } from '@/types/furniture';
import { GRID_SIZE, ROOM_COLORS, CANVAS_WIDTH_GRIDS, CANVAS_HEIGHT_GRIDS } from '@/data/furnitureData';
import { generateWallsForRooms } from '@/utils/collision';

const snapToGrid = (value: number, grid: number = GRID_SIZE) => Math.round(value / grid) * grid;

export const RoomView2D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [ghostType, setGhostType] = useState<FurnitureType | null>(null);
  const [ghostVariant, setGhostVariant] = useState<string | undefined>(undefined);
  const [ghostWidth, setGhostWidth] = useState(0);
  const [ghostHeight, setGhostHeight] = useState(0);
  const [hoveredFurniture, setHoveredFurniture] = useState<string | null>(null);

  const rooms = useDesignerStore((s) => s.rooms);
  const currentRoomId = useDesignerStore((s) => s.currentRoomId);
  const furniture = useDesignerStore((s) => s.furniture);
  const walls = useDesignerStore((s) => s.walls);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const addFurniture = useDesignerStore((s) => s.addFurniture);
  const moveFurniture = useDesignerStore((s) => s.moveFurniture);
  const removeFurniture = useDesignerStore((s) => s.removeFurniture);
  const selectFurniture = useDesignerStore((s) => s.selectFurniture);
  const getCatalogEntry = useDesignerStore((s) => s.getCatalogEntry);
  const getVariant = useDesignerStore((s) => s.getVariant);
  const switchRoom = useDesignerStore((s) => s.switchRoom);

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const type = e.dataTransfer.getData('furniture-type') as FurnitureType;
    const variantId = e.dataTransfer.getData('furniture-variant') || undefined;
    if (!type) return;

    const catalog = getCatalogEntry(type);
    const variant = getVariant(type, variantId);
    const effWidth = variant?.width ?? catalog.width;
    const effHeight = variant?.height ?? catalog.height;

    const pos = getSvgPoint(e.clientX, e.clientY);
    const snappedX = snapToGrid(pos.x - effWidth / 2);
    const snappedY = snapToGrid(pos.y - effHeight / 2);

    setGhostType(type);
    setGhostVariant(variantId);
    setGhostWidth(effWidth);
    setGhostHeight(effHeight);
    setGhostPos({ x: snappedX, y: snappedY });
  }, [getCatalogEntry, getVariant, getSvgPoint]);

  const handleDragLeave = useCallback(() => {
    setGhostPos(null);
    setGhostType(null);
    setGhostVariant(undefined);
    setGhostWidth(0);
    setGhostHeight(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('furniture-type') as FurnitureType;
    const variantId = e.dataTransfer.getData('furniture-variant') || undefined;
    if (!type || !ghostPos) {
      handleDragLeave();
      return;
    }
    addFurniture(type, ghostPos.x, ghostPos.y, variantId);
    handleDragLeave();
  }, [addFurniture, ghostPos, handleDragLeave]);

  const handleFurnitureMouseDown = useCallback((e: React.MouseEvent, item: FurnitureItem) => {
    e.stopPropagation();
    const pos = getSvgPoint(e.clientX, e.clientY);
    setDraggingFurnitureId(item.id);
    setDragOffset({ x: pos.x - item.x, y: pos.y - item.y });
    selectFurniture(item.id);
  }, [getSvgPoint, selectFurniture]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingFurnitureId) return;
    const pos = getSvgPoint(e.clientX, e.clientY);
    const target = furniture.find((f) => f.id === draggingFurnitureId);
    if (!target) return;
    const newX = snapToGrid(pos.x - dragOffset.x);
    const newY = snapToGrid(pos.y - dragOffset.y);
    moveFurniture(draggingFurnitureId, newX, newY);
  }, [draggingFurnitureId, dragOffset, furniture, getSvgPoint, moveFurniture]);

  const handleMouseUp = useCallback(() => {
    setDraggingFurnitureId(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      selectFurniture(null);
    }
  }, [selectFurniture]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          removeFurniture(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, removeFurniture]);

  const canvasW = CANVAS_WIDTH_GRIDS * GRID_SIZE;
  const canvasH = CANVAS_HEIGHT_GRIDS * GRID_SIZE;

  const autoWalls = generateWallsForRooms(rooms);

  const renderRoom = (room: Room, idx: number) => {
    const rx = room.x * GRID_SIZE;
    const ry = room.y * GRID_SIZE;
    const rw = room.widthGrids * GRID_SIZE;
    const rh = room.heightGrids * GRID_SIZE;
    const fillColor = ROOM_COLORS[idx % ROOM_COLORS.length];
    const isCurrentRoom = room.id === currentRoomId;

    return (
      <g key={room.id}>
        <rect
          x={rx}
          y={ry}
          width={rw}
          height={rh}
          fill={fillColor}
          fillOpacity={isCurrentRoom ? 0.9 : 0.6}
          stroke={isCurrentRoom ? '#d97706' : '#a8a29e'}
          strokeWidth={isCurrentRoom ? 3 : 1.5}
          strokeDasharray={isCurrentRoom ? 'none' : '6 4'}
          rx={8}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={(e) => {
            e.stopPropagation();
            switchRoom(room.id);
          }}
        />
        {Array.from({ length: Math.ceil(rw / GRID_SIZE) - 1 }).map((_, i) => (
          <line
            key={`vx-${i}`}
            x1={rx + (i + 1) * GRID_SIZE}
            y1={ry}
            x2={rx + (i + 1) * GRID_SIZE}
            y2={ry + rh}
            stroke="rgba(120, 113, 108, 0.12)"
            strokeWidth={1}
            pointerEvents="none"
          />
        ))}
        {Array.from({ length: Math.ceil(rh / GRID_SIZE) - 1 }).map((_, i) => (
          <line
            key={`hy-${i}`}
            x1={rx}
            y1={ry + (i + 1) * GRID_SIZE}
            x2={rx + rw}
            y2={ry + (i + 1) * GRID_SIZE}
            stroke="rgba(120, 113, 108, 0.12)"
            strokeWidth={1}
            pointerEvents="none"
          />
        ))}
        <text
          x={rx + 12}
          y={ry + 28}
          fontSize={15}
          fontWeight={700}
          fill="#57534e"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", pointerEvents: 'none' }}
        >
          {room.name}
        </text>
        <text
          x={rx + rw - 12}
          y={ry + 28}
          fontSize={11}
          fontWeight={500}
          fill="#78716c"
          textAnchor="end"
          style={{ fontFamily: "'Inter', sans-serif", pointerEvents: 'none' }}
        >
          {room.widthGrids}×{room.heightGrids} 格
        </text>
      </g>
    );
  };

  const renderFurniture = (item: FurnitureItem) => {
    const catalog = getCatalogEntry(item.type);
    const variant = getVariant(item.type, item.variantId);
    const color = variant?.color ?? item.color;
    const accentColor = variant?.accentColor ?? '#D4C4A8';
    const isSelected = item.id === selectedId;
    const isHovered = item.id === hoveredFurniture;
    const isDragging = item.id === draggingFurnitureId;

    const padding = 4;
    const iconSize = Math.min(item.width, item.height) - padding * 2;

    return (
      <g
        key={item.id}
        transform={`translate(${item.x}, ${item.y})`}
        onMouseDown={(e) => handleFurnitureMouseDown(e, item)}
        onMouseEnter={() => setHoveredFurniture(item.id)}
        onMouseLeave={() => setHoveredFurniture(null)}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.7 : 1,
        }}
      >
        <rect
          x={-2}
          y={-2}
          width={item.width + 4}
          height={item.height + 4}
          rx={10}
          fill="transparent"
          stroke={isSelected ? '#f59e0b' : isHovered ? '#d6d3d1' : 'transparent'}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={isSelected ? 'none' : '4 3'}
          style={{ transition: 'all 0.15s' }}
        />
        <rect
          x={0}
          y={0}
          width={item.width}
          height={item.height}
          rx={8}
          fill={color}
          fillOpacity={0.88}
          stroke={color}
          strokeWidth={1.5}
          style={{
            filter: isSelected
              ? 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.35))'
              : isHovered
                ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))'
                : 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
            transition: 'filter 0.15s',
          }}
        />
        <rect
          x={0}
          y={0}
          width={item.width}
          height={item.height * 0.08}
          rx={8}
          fill={accentColor}
          fillOpacity={0.5}
        />
        <foreignObject
          x={item.width / 2 - iconSize / 2}
          y={item.height / 2 - iconSize / 2}
          width={iconSize}
          height={iconSize}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FurnitureIcon
              type={item.type}
              size={iconSize}
              color="#ffffff"
              accentColor={accentColor}
              variant={variant}
              iconUrl={catalog.iconUrl}
            />
          </div>
        </foreignObject>
        <text
          x={item.width / 2}
          y={item.height - 6}
          fontSize={10}
          fontWeight={600}
          fill="rgba(255,255,255,0.95)"
          textAnchor="middle"
          style={{ fontFamily: "'Inter', sans-serif", pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {item.label}
        </text>
        {isSelected && (
          <>
            <circle cx={-2} cy={-2} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
            <circle cx={item.width + 2} cy={-2} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
            <circle cx={-2} cy={item.height + 2} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
            <circle cx={item.width + 2} cy={item.height + 2} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
          </>
        )}
      </g>
    );
  };

  const renderGhost = () => {
    if (!ghostPos || !ghostType || ghostWidth === 0 || ghostHeight === 0) return null;
    const catalog = getCatalogEntry(ghostType);
    const variant = getVariant(ghostType, ghostVariant);
    const color = variant?.color ?? catalog.color;
    const accentColor = variant?.accentColor ?? '#D4C4A8';
    const iconSize = Math.min(ghostWidth, ghostHeight) - 8;

    return (
      <g transform={`translate(${ghostPos.x}, ${ghostPos.y})`} style={{ pointerEvents: 'none' }}>
        <rect
          x={0}
          y={0}
          width={ghostWidth}
          height={ghostHeight}
          rx={8}
          fill={color}
          fillOpacity={0.35}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        <foreignObject
          x={ghostWidth / 2 - iconSize / 2}
          y={ghostHeight / 2 - iconSize / 2}
          width={iconSize}
          height={iconSize}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
            <FurnitureIcon
              type={ghostType}
              size={iconSize}
              color={color}
              accentColor={accentColor}
              variant={variant}
              iconUrl={catalog.iconUrl}
            />
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full overflow-auto bg-stone-100 rounded-2xl border border-stone-200 shadow-inner"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(168, 162, 158, 0.25) 1px, transparent 0)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    >
      <div style={{ padding: GRID_SIZE, minWidth: canvasW + GRID_SIZE * 2, minHeight: canvasH + GRID_SIZE * 2 }}>
        <svg
          ref={svgRef}
          width={canvasW}
          height={canvasH}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #fefcf8 0%, #faf6ef 100%)',
            borderRadius: 16,
            boxShadow: 'inset 0 2px 8px rgba(120, 113, 108, 0.08), 0 4px 20px rgba(120, 113, 108, 0.06)',
          }}
        >
          <defs>
            <pattern id="fineGrid" width={GRID_SIZE / 2} height={GRID_SIZE / 2} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE / 2} 0 L 0 0 0 ${GRID_SIZE / 2}`} fill="none" stroke="rgba(168, 162, 158, 0.08)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={canvasW} height={canvasH} fill="url(#fineGrid)" />

          {rooms.map((room, idx) => renderRoom(room, idx))}

          {autoWalls.map((w, i) => (
            <rect
              key={`aw-${i}`}
              x={w.x}
              y={w.y}
              width={w.width}
              height={w.height}
              fill="#78716c"
              fillOpacity={0.7}
              rx={2}
              pointerEvents="none"
            />
          ))}

          {walls.map((w) => (
            <rect
              key={w.id}
              x={w.x}
              y={w.y}
              width={w.width}
              height={w.height}
              fill="#57534e"
              rx={2}
              pointerEvents="none"
            />
          ))}

          {furniture.map((item) => renderFurniture(item))}

          {renderGhost()}
        </svg>
      </div>
    </div>
  );
};
