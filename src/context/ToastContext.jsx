import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const showError = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const showWarning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const showInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  const toastThemes = {
    success: {
      bg: '#ffffff',
      border: '#a7f3d0',
      text: '#111827',
      icon: <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0 }} />,
      indicator: '#10b981'
    },
    warning: {
      bg: '#ffffff',
      border: '#fed7aa',
      text: '#111827',
      icon: <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0 }} />,
      indicator: '#f59e0b'
    },
    error: {
      bg: '#ffffff',
      border: '#fecaca',
      text: '#111827',
      icon: <XCircle style={{ width: '18px', height: '18px', color: '#ef4444', flexShrink: 0 }} />,
      indicator: '#ef4444'
    },
    info: {
      bg: '#ffffff',
      border: '#bfdbfe',
      text: '#111827',
      icon: <Info style={{ width: '18px', height: '18px', color: '#3b82f6', flexShrink: 0 }} />,
      indicator: '#3b82f6'
    },
  };

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
      }}>
        {toasts.map((toast) => {
          const theme = toastThemes[toast.type] || toastThemes.info;
          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${theme.border}`,
                borderLeft: `4px solid ${theme.indicator}`,
                backgroundColor: theme.bg,
                color: theme.text,
                fontSize: '14px',
                fontWeight: 500,
                animation: 'slideIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {theme.icon}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
