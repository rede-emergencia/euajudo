import React from 'react';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, transitions } from '../../styles/designSystem';

export default function Button({
  children,
  variant = 'primary', // primary, secondary, success, error, ghost
  size = 'md', // sm, md, lg
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  type = 'button',
  ...props
}) {
  const getVariantStyles = () => {
    const baseStyles = {
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: transitions.normal,
      fontWeight: fontWeight.medium,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      opacity: disabled ? '0.6' : '1',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          background: colors.primary[600],
          color: colors.text.inverse,
          boxShadow: shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyles,
          background: colors.neutral[100],
          color: colors.text.primary,
          border: `1px solid ${colors.border.light}`,
        };
      case 'success':
        return {
          ...baseStyles,
          background: colors.success[600],
          color: colors.text.inverse,
          boxShadow: shadows.sm,
        };
      case 'error':
        return {
          ...baseStyles,
          background: colors.error[600],
          color: colors.text.inverse,
          boxShadow: shadows.sm,
        };
      case 'ghost':
        return {
          ...baseStyles,
          background: 'transparent',
          color: colors.text.secondary,
        };
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${spacing.xs} ${spacing.md}`,
          fontSize: fontSize.sm,
          borderRadius: borderRadius.md,
        };
      case 'lg':
        return {
          padding: `${spacing.md} ${spacing.xl}`,
          fontSize: fontSize.lg,
          borderRadius: borderRadius.lg,
        };
      default: // md
        return {
          padding: `${spacing.sm} ${spacing.lg}`,
          fontSize: fontSize.base,
          borderRadius: borderRadius.md,
        };
    }
  };

  const hoverStyles = {
    primary: { background: colors.primary[700] },
    secondary: { background: colors.neutral[200] },
    success: { background: colors.success[700] },
    error: { background: colors.error[700] },
    ghost: { background: colors.neutral[100] },
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        width: fullWidth ? '100%' : 'auto',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, getVariantStyles());
        }
      }}
      {...props}
    >
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
}
