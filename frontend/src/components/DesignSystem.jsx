import React from 'react';

/**
 * AgriButton — Core design system button
 * Variants:
 *  - primary: Forest green filled
 *  - secondary: Soft cream background with crisp border
 *  - ghost: Transparent with hover wash
 *  - accent: Earth gold / amber for actions like calculate / submit
 *  - danger: Muted red for destructive operations
 * Sizes: 'sm', 'md', 'lg'
 */
export function AgriButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7A3A] focus-visible:ring-offset-2 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#5B7A3A] text-white hover:bg-[#48632E] shadow-[0_1px_2px_rgba(34,48,26,0.12)] hover:shadow-[0_4px_12px_rgba(91,122,58,0.24)]',
    secondary:
      'bg-white text-[#22301A] border border-[#E3DEC9] hover:bg-[#FBF9F2] hover:border-[#CFDCB8] shadow-sm',
    ghost:
      'bg-transparent text-[#737D6B] hover:bg-[#EAF1DC] hover:text-[#22301A]',
    accent:
      'bg-[#B08F52] text-white hover:bg-[#977840] shadow-[0_1px_2px_rgba(176,143,82,0.15)] hover:shadow-[0_4px_12px_rgba(176,143,82,0.25)]',
    danger:
      'bg-[#FDF1EE] text-[#B43826] border border-[#F7CCC4] hover:bg-[#FCE3DD]',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
        </>
      )}
    </button>
  );
}

/**
 * AgriCard — Consistent container with subtle natural borders and soft elevation
 */
export function AgriCard({
  children,
  interactive = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-[#EFECE1] p-5 shadow-[0_4px_14px_rgba(34,48,26,0.03)] ${
        interactive
          ? 'hover:border-[#CFDCB8] hover:shadow-[0_10px_24px_rgba(34,48,26,0.07)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * AgriBadge — Context tags (e.g. status, crop type, seasonality)
 */
export function AgriBadge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
}) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    neutral: 'bg-[#F0EDE2] text-[#3E4A35] border border-[#E3DEC9]',
    success: 'bg-[#EDF7EA] text-[#3F7535] border border-[#C8E8BF]',
    warning: 'bg-[#FEF7E9] text-[#9E6B18] border border-[#F7E1B5]',
    danger: 'bg-[#FDF1EE] text-[#B43826] border border-[#F7CCC4]',
    brand: 'bg-[#EAF1DC] text-[#22301A] border border-[#CFDCB8]',
    sky: 'bg-[#EAF3F9] text-[#2B698C] border border-[#CFE2EE]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full select-none ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 11 : 13} />}
      <span>{children}</span>
    </span>
  );
}

const DesignSystem = { AgriButton, AgriCard, AgriBadge };
export default DesignSystem;
