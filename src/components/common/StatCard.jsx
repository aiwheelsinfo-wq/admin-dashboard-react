import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendType = 'up', color = 'blue' }) => {
  const colorStyles = {
    blue: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    amber: { bg: '#FFF7ED', text: '#D97706', border: '#FED7AA' },
    emerald: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    purple: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
    rose: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="glass-card glass-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6B7280' }}>{title}</span>
        {Icon && (
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: style.bg,
            color: style.text,
            border: `1px solid ${style.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon style={{ width: '18px', height: '18px' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: trendType === 'up' ? '#059669' : '#dc2626',
            background: trendType === 'up' ? '#ecfdf5' : '#fef2f2',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{subtitle}</span>}
    </div>
  );
};

export default StatCard;
