import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function AlertModal({ 
  show, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'error', 'warning'
  autoClose = false,
  autoCloseDelay = 3000
}) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} color="#10b981" />;
      case 'error':
        return <AlertCircle size={24} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={24} color="#f59e0b" />;
      default:
        return <Info size={24} color="#3b82f6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: '#f0fdf4',
          border: '#bbf7d0',
          title: '#166534',
          message: '#15803d'
        };
      case 'error':
        return {
          background: '#fef2f2',
          border: '#fecaca',
          title: '#991b1b',
          message: '#dc2626'
        };
      case 'warning':
        return {
          background: '#fffbeb',
          border: '#fed7aa',
          title: '#92400e',
          message: '#ea580c'
        };
      default:
        return {
          background: '#eff6ff',
          border: '#dbeafe',
          title: '#1e40af',
          message: '#2563eb'
        };
    }
  };

  const colors = getColors();

  // Auto close functionality
  React.useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [show, autoClose, autoCloseDelay, onClose]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: colors.background,
          border: `1px solid ${colors.border}`,
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {getIcon()}
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600', 
            color: colors.title 
          }}>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            lineHeight: '1.5',
            color: colors.message,
            whiteSpace: 'pre-line'
          }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: type === 'success' ? '#10b981' : '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = type === 'success' ? '#059669' : '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = type === 'success' ? '#10b981' : '#3b82f6';
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to show alerts
export const showAlert = ({ title, message, type = 'info', autoClose = false }) => {
  // This will be used to create a global alert system
  // For now, we'll use console.log as fallback
  console.log(`${type.toUpperCase()}: ${title} - ${message}`);
};
