import React, { useEffect, useState } from 'react';

/**
 * Simple toast notification.
 * Props: message (string), type ('success'|'error'), onClose (fn)
 */
export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // allow animation
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const style = type === 'error'
    ? 'bg-[#2A0F0D]/90 border-[#EF4444]/40 text-[#FCA5A5] shadow-[0_8px_32px_rgba(239,68,68,0.25)]'
    : 'bg-[#0F2913]/90 border-[#22C55E]/40 text-[#BEF264] shadow-[0_8px_32px_rgba(34,197,94,0.25)]';

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-semibold backdrop-blur-md border transition-opacity duration-300 ${style}`}
    >
      {message}
    </div>
  );
}
