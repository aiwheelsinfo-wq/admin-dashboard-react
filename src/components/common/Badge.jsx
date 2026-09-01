import React from 'react';

const Badge = ({ children, variant = 'blue', size = 'sm' }) => {
  const variants = {
    blue: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    green: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    amber: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    rose: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    purple: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
    slate: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' },
  };

  const style = variants[variant] || variants.blue;
  const isSm = size === 'sm';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: isSm ? '0.75rem' : '0.8125rem',
      fontWeight: 600,
      padding: isSm ? '2px 8px' : '4px 10px',
      borderRadius: '9999px',
      backgroundColor: style.bg,
      color: style.text,
      border: `1px solid ${style.border}`,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
};

export default Badge;
