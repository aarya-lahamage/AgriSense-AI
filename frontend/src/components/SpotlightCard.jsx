import { useRef, useState } from 'react';

/**
 * SpotlightCard inspired by React Bits:
 * Creates an interactive radial gradient spotlight following mouse position
 * on hover for dark obsidian glass cards.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(132, 204, 22, 0.14)',
  borderColor = 'rgba(132, 204, 22, 0.35)',
  ...props
}) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden agri-glass-card transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {/* Dynamic Border Highlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: isHovered ? 1 : 0,
          border: `1px solid ${borderColor}`,
        }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
