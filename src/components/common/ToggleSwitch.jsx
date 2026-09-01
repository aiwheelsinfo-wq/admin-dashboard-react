import React from 'react';

const ToggleSwitch = ({ checked, onChange, label, sublabel, disabled = false }) => {
  return (
    <label style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      opacity: disabled ? 0.6 : 1
    }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: checked ? '#10b981' : '#d1d5db',
          transition: 'background-color 0.2s ease',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      {(label || sublabel) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{label}</span>}
          {sublabel && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{sublabel}</span>}
        </div>
      )}
    </label>
  );
};

export default ToggleSwitch;
