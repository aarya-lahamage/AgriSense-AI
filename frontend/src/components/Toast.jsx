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

  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600';

  return (
    <div
      className={`fixed top-4 right-4 px-4 py-2 text-white rounded shadow-md transition-opacity duration-300 ${bgColor}`}
    >
      {message}
    </div>
  );
}
