/**
 * ShinyText inspired by React Bits:
 * Renders shimmering animated gradient text.
 */
export default function ShinyText({
  text,
  className = '',
  speed = 4, // seconds
}) {
  return (
    <span
      className={`shiny-text font-bold inline-block ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
}
