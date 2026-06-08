import type { FurnitureType, FurnitureStyleVariant, FurniturePattern, FurnitureIconStyle } from '@/types/furniture';

interface FurnitureIconProps {
  type: FurnitureType;
  size?: number;
  color?: string;
  accentColor?: string;
  iconUrl?: string;
  variant?: FurnitureStyleVariant;
  iconStyle?: FurnitureIconStyle;
  pattern?: FurniturePattern;
}

const applyPattern = (pattern: FurniturePattern | undefined, color: string, id: string) => {
  if (!pattern || pattern === 'solid') return null;
  const accent = color + '33';
  if (pattern === 'striped') {
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="transparent" />
        <line x1="0" y1="0" x2="0" y2="6" stroke={accent} strokeWidth="3" />
      </pattern>
    );
  }
  if (pattern === 'checkered') {
    return (
      <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6">
        <rect width="3" height="3" fill={accent} />
        <rect x="3" y="3" width="3" height="3" fill={accent} />
      </pattern>
    );
  }
  if (pattern === 'gradient') {
    return (
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={accent} />
      </linearGradient>
    );
  }
  return null;
};

const getFill = (pattern: FurniturePattern | undefined, patternId: string, color: string) => {
  if (pattern === 'gradient') return `url(#${patternId})`;
  if (pattern === 'striped' || pattern === 'checkered') return color;
  return color;
};

export const FurnitureIcon = ({
  type,
  size = 40,
  color = '#8B7355',
  accentColor: accentColorProp,
  iconUrl,
  variant,
  iconStyle,
  pattern,
}: FurnitureIconProps) => {
  const mainColor = variant?.color ?? color;
  const accentColor = variant?.accentColor ?? accentColorProp ?? '#D4C4A8';
  const style = variant?.iconStyle ?? iconStyle ?? 'default';
  const activePattern = variant?.pattern ?? pattern;
  const patternId = `pat-${type}-${mainColor.replace('#', '')}`;

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={String(type)}
        style={{ width: size, height: size, objectFit: 'contain' }}
        draggable={false}
      />
    );
  }

  const padding = size * 0.08;
  const vb = size;
  const strokeW = Math.max(1, size * 0.035);

  const patternDef = applyPattern(activePattern, mainColor, patternId);
  const fill = getFill(activePattern, patternId, mainColor);

  const renderShape = () => {
    const hasPattern = activePattern && activePattern !== 'solid' && activePattern !== 'gradient';
    const patternOverlay = hasPattern ? (
      <rect x={padding} y={padding} width={vb - padding * 2} height={vb - padding * 2} fill={`url(#${patternId})`} opacity={0.35} />
    ) : null;

    switch (type) {
      case 'bed': {
        const headboardH = style === 'modern' ? size * 0.28 : style === 'minimal' ? size * 0.15 : style === 'vintage' ? size * 0.35 : size * 0.25;
        const bedW = vb - padding * 2;
        const bedH = vb - padding * 2;
        const mattressY = padding + headboardH * 0.3;
        const mattressH = bedH - headboardH * 0.3 - padding * 0.3;
        const rounded = style === 'modern' ? size * 0.04 : style === 'minimal' ? size * 0.02 : size * 0.06;
        return (
          <>
            <rect
              x={padding}
              y={padding}
              width={size * 0.12}
              height={headboardH}
              rx={rounded * 0.5}
              fill={accentColor}
              stroke={accentColor}
              strokeWidth={strokeW * 0.5}
            />
            <rect
              x={padding}
              y={mattressY}
              width={bedW}
              height={mattressH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            {patternOverlay}
            <rect
              x={padding + bedW * 0.08}
              y={mattressY + mattressH * 0.1}
              width={bedW * 0.32}
              height={mattressH * 0.35}
              rx={rounded * 0.8}
              fill={accentColor}
              opacity={0.75}
            />
            <rect
              x={padding + bedW * 0.45}
              y={mattressY + mattressH * 0.1}
              width={bedW * 0.32}
              height={mattressH * 0.35}
              rx={rounded * 0.8}
              fill={accentColor}
              opacity={0.75}
            />
            {style === 'vintage' && (
              <>
                <circle cx={padding + size * 0.06} cy={padding + size * 0.05} r={size * 0.025} fill={accentColor} />
                <circle cx={padding + size * 0.06} cy={padding + headboardH * 0.5} r={size * 0.025} fill={accentColor} />
              </>
            )}
          </>
        );
      }

      case 'sofa': {
        const rounded = style === 'modern' ? size * 0.08 : style === 'minimal' ? size * 0.03 : size * 0.12;
        const seatH = style === 'modern' ? size * 0.3 : size * 0.35;
        const backH = style === 'minimal' ? size * 0.25 : size * 0.35;
        const armW = size * 0.12;
        const sofaW = vb - padding * 2;
        const sofaH = vb - padding * 2;
        return (
          <>
            <rect
              x={padding}
              y={padding + sofaH - seatH - backH}
              width={sofaW}
              height={backH + seatH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            {patternOverlay}
            <rect
              x={padding}
              y={padding + sofaH - seatH - backH}
              width={armW}
              height={backH + seatH * 0.7}
              rx={rounded}
              fill={accentColor}
              opacity={0.85}
            />
            <rect
              x={padding + sofaW - armW}
              y={padding + sofaH - seatH - backH}
              width={armW}
              height={backH + seatH * 0.7}
              rx={rounded}
              fill={accentColor}
              opacity={0.85}
            />
            <rect
              x={padding + armW * 0.8}
              y={padding + sofaH - seatH * 0.95}
              width={sofaW - armW * 1.6}
              height={seatH * 0.6}
              rx={rounded * 0.7}
              fill={accentColor}
              opacity={0.5}
            />
            {style === 'vintage' && (
              <>
                <circle cx={padding + sofaW * 0.3} cy={padding + sofaH - seatH * 0.6} r={size * 0.02} fill={accentColor} />
                <circle cx={padding + sofaW * 0.5} cy={padding + sofaH - seatH * 0.6} r={size * 0.02} fill={accentColor} />
                <circle cx={padding + sofaW * 0.7} cy={padding + sofaH - seatH * 0.6} r={size * 0.02} fill={accentColor} />
              </>
            )}
          </>
        );
      }

      case 'table': {
        const isRound = style === 'classic';
        const topRounded = style === 'modern' ? size * 0.05 : style === 'minimal' ? size * 0.015 : size * 0.1;
        const topH = size * 0.12;
        const legW = size * 0.08;
        const legH = size * 0.55;
        const tableW = vb - padding * 2;
        const tableTopY = padding + size * 0.15;
        return (
          <>
            {isRound ? (
              <ellipse
                cx={vb / 2}
                cy={tableTopY + topH / 2}
                rx={tableW / 2}
                ry={topH * 1.5}
                fill={fill}
                stroke={mainColor}
                strokeWidth={strokeW * 0.6}
              />
            ) : (
              <rect
                x={padding}
                y={tableTopY}
                width={tableW}
                height={topH}
                rx={topRounded}
                fill={fill}
                stroke={mainColor}
                strokeWidth={strokeW * 0.6}
              />
            )}
            {patternOverlay}
            <rect
              x={padding + tableW * 0.08}
              y={tableTopY + topH}
              width={legW}
              height={legH}
              rx={size * 0.01}
              fill={accentColor}
            />
            <rect
              x={padding + tableW - tableW * 0.08 - legW}
              y={tableTopY + topH}
              width={legW}
              height={legH}
              rx={size * 0.01}
              fill={accentColor}
            />
            {style === 'modern' && (
              <rect
                x={padding + tableW * 0.08}
                y={tableTopY + topH + legH * 0.6}
                width={tableW - tableW * 0.16}
                height={size * 0.04}
                rx={size * 0.01}
                fill={accentColor}
                opacity={0.6}
              />
            )}
          </>
        );
      }

      case 'chair': {
        const rounded = style === 'modern' ? size * 0.05 : size * 0.08;
        const seatW = vb - padding * 2;
        const seatH = size * 0.1;
        const backH = style === 'minimal' ? size * 0.35 : size * 0.45;
        const legH = size * 0.35;
        const legW = size * 0.07;
        const seatY = padding + size * 0.35;
        return (
          <>
            <rect
              x={padding + size * 0.05}
              y={padding}
              width={seatW - size * 0.1}
              height={backH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            {patternOverlay}
            <rect
              x={padding}
              y={seatY}
              width={seatW}
              height={seatH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            <rect
              x={padding + seatW * 0.08}
              y={seatY + seatH}
              width={legW}
              height={legH}
              rx={size * 0.015}
              fill={accentColor}
            />
            <rect
              x={padding + seatW - seatW * 0.08 - legW}
              y={seatY + seatH}
              width={legW}
              height={legH}
              rx={size * 0.015}
              fill={accentColor}
            />
            {style === 'vintage' && (
              <>
                <line x1={padding + size * 0.08} y1={padding + size * 0.08} x2={padding + size * 0.08} y2={padding + backH * 0.85} stroke={accentColor} strokeWidth={strokeW * 0.5} opacity={0.6} />
                <line x1={vb - padding - size * 0.08} y1={padding + size * 0.08} x2={vb - padding - size * 0.08} y2={padding + backH * 0.85} stroke={accentColor} strokeWidth={strokeW * 0.5} opacity={0.6} />
              </>
            )}
          </>
        );
      }

      case 'plant': {
        const potW = vb * 0.45;
        const potH = vb * 0.3;
        const potY = vb - padding - potH;
        const potColor = accentColor;
        const leafStyle = style === 'minimal' ? 'simple' : style === 'modern' ? 'broad' : style === 'vintage' ? 'spiky' : 'full';
        return (
          <>
            <path
              d={`M ${padding + (vb - potW) / 2} ${potY}
                  L ${padding + (vb - potW) / 2 + potW * 0.12} ${potY + potH}
                  L ${padding + (vb + potW) / 2 - potW * 0.12} ${potY + potH}
                  L ${padding + (vb + potW) / 2} ${potY} Z`}
              fill={potColor}
              stroke={potColor}
              strokeWidth={strokeW * 0.5}
            />
            <ellipse
              cx={vb / 2}
              cy={potY}
              rx={potW / 2}
              ry={potH * 0.15}
              fill={potColor}
              opacity={0.7}
            />
            {leafStyle === 'broad' && (
              <>
                <ellipse cx={vb * 0.45} cy={potY - vb * 0.2} rx={vb * 0.18} ry={vb * 0.28} fill={fill} transform={`rotate(-20 ${vb * 0.45} ${potY - vb * 0.2})`} />
                <ellipse cx={vb * 0.55} cy={potY - vb * 0.28} rx={vb * 0.17} ry={vb * 0.3} fill={fill} transform={`rotate(15 ${vb * 0.55} ${potY - vb * 0.28})`} />
                <ellipse cx={vb * 0.5} cy={potY - vb * 0.4} rx={vb * 0.14} ry={vb * 0.25} fill={fill} />
              </>
            )}
            {leafStyle === 'full' && (
              <>
                <circle cx={vb * 0.5} cy={potY - vb * 0.3} r={vb * 0.25} fill={fill} />
                <circle cx={vb * 0.38} cy={potY - vb * 0.22} r={vb * 0.15} fill={fill} opacity={0.85} />
                <circle cx={vb * 0.62} cy={potY - vb * 0.22} r={vb * 0.15} fill={fill} opacity={0.85} />
                <circle cx={vb * 0.5} cy={potY - vb * 0.45} r={vb * 0.13} fill={fill} opacity={0.9} />
              </>
            )}
            {leafStyle === 'simple' && (
              <>
                <ellipse cx={vb * 0.5} cy={potY - vb * 0.3} rx={vb * 0.2} ry={vb * 0.32} fill={fill} />
              </>
            )}
            {leafStyle === 'spiky' && (
              <>
                <polygon points={`${vb * 0.5},${potY - vb * 0.55} ${vb * 0.35},${potY - vb * 0.1} ${vb * 0.65},${potY - vb * 0.1}`} fill={fill} />
                <polygon points={`${vb * 0.35},${potY - vb * 0.4} ${vb * 0.22},${potY - vb * 0.08} ${vb * 0.42},${potY - vb * 0.15}`} fill={fill} opacity={0.8} />
                <polygon points={`${vb * 0.65},${potY - vb * 0.4} ${vb * 0.58},${potY - vb * 0.15} ${vb * 0.78},${potY - vb * 0.08}`} fill={fill} opacity={0.8} />
              </>
            )}
          </>
        );
      }

      case 'tvcabinet': {
        const cabW = vb - padding * 2;
        const cabH = vb * 0.5;
        const cabY = padding + vb * 0.42;
        const rounded = style === 'modern' ? size * 0.02 : size * 0.04;
        const tvW = cabW * 0.85;
        const tvH = vb * 0.38;
        return (
          <>
            <rect
              x={padding}
              y={cabY}
              width={cabW}
              height={cabH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            {patternOverlay}
            <line
              x1={vb / 2}
              y1={cabY + size * 0.04}
              x2={vb / 2}
              y2={cabY + cabH - size * 0.04}
              stroke={accentColor}
              strokeWidth={strokeW * 0.4}
              opacity={0.4}
            />
            <circle cx={padding + cabW * 0.25} cy={cabY + cabH / 2} r={size * 0.018} fill={accentColor} opacity={0.7} />
            <circle cx={padding + cabW * 0.75} cy={cabY + cabH / 2} r={size * 0.018} fill={accentColor} opacity={0.7} />
            <rect
              x={padding + (cabW - tvW) / 2}
              y={padding}
              width={tvW}
              height={tvH}
              rx={size * 0.03}
              fill={accentColor}
              opacity={0.9}
            />
            <rect
              x={padding + (cabW - tvW) / 2 + size * 0.04}
              y={padding + size * 0.04}
              width={tvW - size * 0.08}
              height={tvH - size * 0.08}
              rx={size * 0.015}
              fill="#1a1a2e"
              opacity={0.85}
            />
          </>
        );
      }

      case 'wardrobe': {
        const wdW = vb - padding * 2;
        const wdH = vb - padding * 2;
        const rounded = style === 'modern' ? size * 0.025 : size * 0.05;
        const handleColor = accentColor;
        return (
          <>
            <rect
              x={padding}
              y={padding}
              width={wdW}
              height={wdH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            {patternOverlay}
            <line
              x1={vb / 2}
              y1={padding + size * 0.04}
              x2={vb / 2}
              y2={padding + wdH - size * 0.04}
              stroke={accentColor}
              strokeWidth={strokeW * 0.4}
              opacity={0.35}
            />
            <rect
              x={vb / 2 - size * 0.035}
              y={vb / 2 - size * 0.06}
              width={size * 0.025}
              height={size * 0.12}
              rx={size * 0.01}
              fill={handleColor}
            />
            <rect
              x={vb / 2 + size * 0.01}
              y={vb / 2 - size * 0.06}
              width={size * 0.025}
              height={size * 0.12}
              rx={size * 0.01}
              fill={handleColor}
            />
            {style === 'classic' && (
              <>
                <rect x={padding + size * 0.05} y={padding + size * 0.06} width={wdW - size * 0.1} height={size * 0.015} rx={size * 0.005} fill={accentColor} opacity={0.4} />
                <rect x={padding + size * 0.05} y={padding + wdH - size * 0.075} width={wdW - size * 0.1} height={size * 0.015} rx={size * 0.005} fill={accentColor} opacity={0.4} />
              </>
            )}
            {style === 'vintage' && (
              <circle cx={vb / 2} cy={padding + size * 0.08} r={size * 0.025} fill={handleColor} opacity={0.6} />
            )}
          </>
        );
      }

      case 'bookshelf': {
        const bsW = vb - padding * 2;
        const bsH = vb - padding * 2;
        const shelfCount = style === 'minimal' ? 3 : 4;
        const rounded = style === 'modern' ? size * 0.02 : size * 0.03;
        const bookColors = [accentColor, mainColor, '#E8DCC8', '#8B5A2B', '#CD853F'];
        return (
          <>
            <rect
              x={padding}
              y={padding}
              width={bsW}
              height={bsH}
              rx={rounded}
              fill={fill}
              stroke={mainColor}
              strokeWidth={strokeW * 0.6}
            />
            {patternOverlay}
            {Array.from({ length: shelfCount }).map((_, i) => {
              const shelfY = padding + (bsH / shelfCount) * (i + 1) - size * 0.02;
              const shelfTop = padding + (bsH / shelfCount) * i + size * 0.04;
              return (
                <g key={i}>
                  <line
                    x1={padding + size * 0.03}
                    y1={shelfY}
                    x2={padding + bsW - size * 0.03}
                    y2={shelfY}
                    stroke={accentColor}
                    strokeWidth={strokeW * 0.45}
                    opacity={0.5}
                  />
                  {Array.from({ length: 4 + (i % 2) }).map((_, j) => {
                    const bookW = size * 0.045 + ((j * 7) % 5) * size * 0.006;
                    const bookH = size * 0.14 + ((j * 11) % 4) * size * 0.012;
                    const bookX = padding + size * 0.06 + j * (size * 0.055);
                    return (
                      <rect
                        key={j}
                        x={bookX}
                        y={shelfTop + (size * 0.17 - bookH)}
                        width={bookW}
                        height={bookH}
                        rx={size * 0.006}
                        fill={bookColors[(i + j) % bookColors.length]}
                        opacity={0.85}
                      />
                    );
                  })}
                </g>
              );
            })}
          </>
        );
      }

      default: {
        return (
          <rect
            x={padding}
            y={padding}
            width={vb - padding * 2}
            height={vb - padding * 2}
            rx={size * 0.08}
            fill={fill}
            stroke={mainColor}
            strokeWidth={strokeW * 0.5}
          />
        );
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>{patternDef}</defs>
      {renderShape()}
    </svg>
  );
};
