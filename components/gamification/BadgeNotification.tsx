import React, { useEffect, useState } from 'react';
import { Badge } from '../../types';
import BadgeIcon from './BadgeIcon';

interface BadgeNotificationProps {
  badge: Badge | null;
  onDismiss: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badge, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Allow time for fade-out animation before dismissing
        setTimeout(onDismiss, 500);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [badge, onDismiss]);

  if (!badge) {
    return null;
  }

  return (
    <div
      className={`fixed top-5 right-5 w-80 bg-white rounded-xl shadow-2xl p-4 transform transition-all duration-500 ease-in-out z-50 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="mr-4">
          <BadgeIcon badge={badge} size="medium" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-500 text-sm">BADGE UNLOCKED!</p>
          <h3 className="text-lg font-extrabold text-slate-800">{badge.name}</h3>
          <p className="text-slate-600 mt-1">{badge.description}</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
      </div>
    </div>
  );
};

export default BadgeNotification;
