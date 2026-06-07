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
    case 'chair':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="16" y="28" width="32" height="6" rx="2" fill={color} />
          <rect x="16" y="8" width="6" height="26" rx="2" fill={color} />
          <rect x="42" y="8" width="6" height="26" rx="2" fill={color} />
          <rect x="18" y="34" width="4" height="20" rx="2" fill={color} opacity="0.7" />
          <rect x="42" y="34" width="4" height="20" rx="2" fill={color} opacity="0.7" />
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
    case 'tvcabinet':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="4" y="26" width="56" height="22" rx="3" fill={color} opacity="0.85" />
          <rect x="10" y="30" width="20" height="14" rx="2" fill={color} opacity="0.5" />
          <rect x="34" y="30" width="20" height="14" rx="2" fill={color} opacity="0.5" />
          <rect x="4" y="48" width="56" height="4" rx="2" fill={color} />
        </svg>
      );
    case 'wardrobe':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="8" y="6" width="48" height="52" rx="3" fill={color} opacity="0.85" />
          <rect x="12" y="10" width="18" height="44" rx="2" fill={color} opacity="0.4" />
          <rect x="34" y="10" width="18" height="44" rx="2" fill={color} opacity="0.4" />
          <circle cx="28" cy="32" r="2" fill="#fff" opacity="0.7" />
          <circle cx="36" cy="32" r="2" fill="#fff" opacity="0.7" />
        </svg>
      );
    case 'bookshelf':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <rect x="8" y="6" width="48" height="52" rx="3" fill={color} opacity="0.85" />
          <rect x="12" y="12" width="40" height="12" rx="1" fill={color} opacity="0.3" />
          <rect x="12" y="28" width="40" height="12" rx="1" fill={color} opacity="0.3" />
          <rect x="12" y="44" width="40" height="10" rx="1" fill={color} opacity="0.3" />
          <rect x="14" y="14" width="6" height="8" rx="1" fill="#8B4513" />
          <rect x="22" y="14" width="5" height="8" rx="1" fill="#A0522D" />
          <rect x="29" y="14" width="7" height="8" rx="1" fill="#654321" />
          <rect x="38" y="14" width="5" height="8" rx="1" fill="#8B4513" />
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
