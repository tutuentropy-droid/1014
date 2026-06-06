import type { FurnitureType } from '@/types/furniture';

interface FurnitureIconProps {
  type: FurnitureType;
  size?: number;
  color?: string;
  iconUrl?: string;
}

export const FurnitureIcon = ({ type, size = 48, color = '#5c4a3d', iconUrl }: FurnitureIconProps) => {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={String(type)}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        draggable={false}
      />
    );
  }

  switch (type) {
    case 'bed':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="6" y="16" width="52" height="36" rx="4" fill={color} opacity="0.2" />
          <rect x="6" y="36" width="52" height="6" rx="2" fill={color} opacity="0.5" />
          <rect x="6" y="24" width="52" height="14" rx="3" fill={color} />
          <rect x="6" y="16" width="14" height="22" rx="3" fill={color} opacity="0.85" />
        </svg>
      );
    case 'sofa':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="6" y="22" width="52" height="28" rx="5" fill={color} opacity="0.25" />
          <rect x="6" y="28" width="52" height="18" rx="4" fill={color} />
          <rect x="6" y="22" width="10" height="24" rx="4" fill={color} opacity="0.85" />
          <rect x="48" y="22" width="10" height="24" rx="4" fill={color} opacity="0.85" />
        </svg>
      );
    case 'table':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="6" y="20" width="52" height="8" rx="2" fill={color} />
          <rect x="10" y="28" width="6" height="22" rx="2" fill={color} opacity="0.7" />
          <rect x="48" y="28" width="6" height="22" rx="2" fill={color} opacity="0.7" />
        </svg>
      );
    case 'plant':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="20" y="44" width="24" height="14" rx="3" fill="#8B6F47" />
          <ellipse cx="32" cy="38" rx="16" ry="18" fill={color} opacity="0.85" />
          <ellipse cx="24" cy="34" rx="8" ry="10" fill={color} />
          <ellipse cx="40" cy="34" rx="8" ry="10" fill={color} />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="10" y="10" width="44" height="44" rx="6" fill={color} opacity="0.85" />
        </svg>
      );
  }
};
