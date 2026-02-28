import React from 'react';
import { X } from 'lucide-react';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../../styles/designSystem';

export default function Modal({
  show,
  onClose,
  title,
  children,
  footer = null,
  size = 'md', // sm, md, lg, full
  ...props
}) {
  if (!show) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { maxWidth: '400px' };
      case 'lg':
        return { maxWidth: '800px' };
      case 'full':
        return { maxWidth: '100%', height: '95dvh' };
      default:
        return { maxWidth: '600px' };
    }
  };

  return (
    <>
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-sheet {
          animation: modal-in 0.2s ease;
          width: calc(100% - 32px);
          border-radius: 16px;
        }
        /* Em mobile pequeno, vira bottom sheet */
        @media (max-width: 480px) {
          .modal-overlay-inner {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .modal-sheet {
            width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            max-height: 92dvh !important;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}
        className="modal-overlay-inner"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="modal-sheet"
          style={{
            background: colors.bg.primary,
            boxShadow: shadows.xl,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90dvh',
            overflow: 'hidden',
            ...getSizeStyles(),
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border.light}`,
            flexShrink: 0,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: fontWeight.bold,
              color: colors.text.primary,
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: colors.text.secondary,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch',
          }}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div style={{
              padding: '14px 20px',
              borderTop: `1px solid ${colors.border.light}`,
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              flexShrink: 0,
              flexWrap: 'wrap',
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
