import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter inspired by React Bits / CountUp:
 * Smoothly animates numbers using requestAnimationFrame and easeOutCubic interpolation.
 * Supports decimal places, prefix, suffix, and respects prefers-reduced-motion.
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const targetNum = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(targetNum);
  const currentValRef = useRef(targetNum);
  const startTimestampRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      currentValRef.current = targetNum;
      rafIdRef.current = requestAnimationFrame(() => {
        setDisplayValue(targetNum);
      });
      return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      };
    }

    const startNum = currentValRef.current;
    startTimestampRef.current = null;

    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

    const step = (timestamp) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const progress = Math.min((timestamp - startTimestampRef.current) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const current = startNum + (targetNum - startNum) * easedProgress;
      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        currentValRef.current = targetNum;
        setDisplayValue(targetNum);
      }
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [targetNum, duration]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
