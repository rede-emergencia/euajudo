import React from 'react';
import { colors, spacing, borderRadius, fontSize, fontWeight, transitions } from '../../styles/designSystem';

export default function Input({
  label = null,
  error = null,
  fullWidth = true,
  icon = null,
  ...props
}) {
  const baseStyles = {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.base,
    border: `1px solid ${error ? colors.error[300] : colors.border.medium}`,
    borderRadius: borderRadius.md,
    width: fullWidth ? '100%' : 'auto',
    transition: transitions.normal,
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.xs,
        }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: spacing.md,
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.text.tertiary,
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}
        
        <input
          {...props}
          style={{
            ...baseStyles,
            paddingLeft: icon ? spacing.xl : spacing.md,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? colors.error[500] : colors.primary[500];
            e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? colors.error[100] : colors.primary[100]}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? colors.error[300] : colors.border.medium;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>
      
      {error && (
        <p style={{
          margin: `${spacing.xs} 0 0 0`,
          fontSize: fontSize.sm,
          color: colors.error[600],
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
