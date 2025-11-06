import React from 'react';
import { Badge } from '../../types';
import { BADGE_DEFS } from './BadgeDefs';

interface BadgeIconProps {
  badge: Badge | string;
  size?: 'small' | 'medium' | 'large';
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ badge, size = 'medium' }) => {
  const badgeData = typeof badge === 'string' ? BADGE_DEFS[badge] : badge;

  if (!badgeData) {
    return null;
  }

  const sizeClasses = {
    small: 'w-10 h-10 text-xl',
    medium: 'w-16 h-16 text-4xl',
    large: 'w-24 h-24 text-6xl',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full bg-slate-100 shadow-inner group transition-transform transform hover:scale-110`}
      title={`${badgeData.name}: ${badgeData.description}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-400 ${sizeClasses[size]}`}
      >
        <span role="img" aria-label={badgeData.name}>{badgeData.icon}</span>
      </div>
    </div>
  );
};

export default BadgeIcon;
