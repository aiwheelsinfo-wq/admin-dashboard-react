import React from 'react';
import { Search, RefreshCw, ExternalLink, Menu } from 'lucide-react';

const Topbar = ({ onRefresh, isRefreshing, onToggleSidebar }) => {
  return (
    <header style={{
      height: 'var(--topbar-height)',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
    }}>
      {/* Left: Mobile Toggle & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn-secondary"
            style={{ padding: '8px', display: 'none' }}
            title="Toggle Menu"
          >
            <Menu style={{ width: '18px', height: '18px', color: '#374151' }} />
          </button>
        )}

        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Search bookings, drivers, routes..."
            className="form-input"
            style={{
              backgroundColor: '#f9fafb',
              padding: '8px 12px 8px 36px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              fontSize: '0.8125rem'
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live Server Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#059669'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>AWS LIVE (15.207.10.118)</span>
        </div>

        {/* Customer Site Quick Link */}
        <a
          href="https://rentox.co.in"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ fontSize: '0.75rem', padding: '6px 12px', textDecoration: 'none' }}
        >
          <span>Customer Site</span>
          <ExternalLink style={{ width: '13px', height: '13px' }} />
        </a>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-secondary"
          style={{
            padding: '8px',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            justifyContent: 'center'
          }}
          title="Refresh live data"
        >
          <RefreshCw style={{
            width: '16px',
            height: '16px',
            color: isRefreshing ? '#f59e0b' : '#6b7280',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
