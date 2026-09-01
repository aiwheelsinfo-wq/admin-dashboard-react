import React from 'react';

const SliderInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  subtext,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{label}</span>
        <span style={{
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: '#c2410c',
          background: '#fff7ed',
          padding: '2px 8px',
          borderRadius: '6px',
          border: '1px solid #fed7aa'
        }}>
          {value}{unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#f59e0b',
          cursor: 'pointer',
          height: '6px',
          borderRadius: '3px',
          background: '#e5e7eb',
          outline: 'none'
        }}
      />

      {subtext && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{subtext}</span>}
    </div>
  );
};

export default SliderInput;
