import React from 'react';

const RevenueSplitBar = ({ driverPayout = 0, companyShare = 0, gstAmount = 0 }) => {
  const total = Math.max(driverPayout + companyShare + gstAmount, 1);
  const driverPct = Math.round((driverPayout / total) * 100);
  const companyPct = Math.round((companyShare / total) * 100);
  const gstPct = Math.max(100 - driverPct - companyPct, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 3-Color Distribution Bar */}
      <div style={{
        width: '100%',
        height: '12px',
        borderRadius: '9999px',
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: '#e5e7eb',
      }}>
        <div
          title={`Driver Payout: ₹${driverPayout.toFixed(2)} (${driverPct}%)`}
          style={{
            width: `${driverPct}%`,
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease'
          }}
        />
        <div
          title={`Rentox Profit: ₹${companyShare.toFixed(2)} (${companyPct}%)`}
          style={{
            width: `${companyPct}%`,
            backgroundColor: '#10b981',
            transition: 'width 0.3s ease'
          }}
        />
        <div
          title={`GST Tax: ₹${gstAmount.toFixed(2)} (${gstPct}%)`}
          style={{
            width: `${gstPct}%`,
            backgroundColor: '#f59e0b',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Legend & Breakdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
          <span style={{ color: '#6b7280' }}>Driver Net:</span>
          <b style={{ color: '#111827' }}>₹{driverPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({driverPct}%)</b>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ color: '#6b7280' }}>Rentox Profit:</span>
          <b style={{ color: '#111827' }}>₹{companyShare.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({companyPct}%)</b>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <span style={{ color: '#6b7280' }}>Govt GST:</span>
          <b style={{ color: '#111827' }}>₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({gstPct}%)</b>
        </div>
      </div>
    </div>
  );
};

export default RevenueSplitBar;
