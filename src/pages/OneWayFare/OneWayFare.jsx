import React, { useState } from 'react';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import SliderInput from '../../components/common/SliderInput';
import Badge from '../../components/common/Badge';
import LiveSimulator from '../../components/simulator/LiveSimulator';
import { useToast } from '../../context/ToastContext';
import {
  Zap,
  Percent,
  Coffee,
  Building2,
  Save,
  Car
} from 'lucide-react';

const OneWayFare = () => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    dynamic_pricing_active: true,
    pricing_sensitivity: 50,
    outlier_threshold_pct: 50.0,
    lookback_days: 14,
    lookback_reference_demand: 6.0,
    today_demand: 10,
    
    gst_active: true,
    gst_rate: 5,

    driver_allowance_active: true,
    driver_allowance_default: 250,

    toll_charges_active: true,
    toll_calculation_method: 'auto',
    toll_rate_per_100km: 225,

    parking_charges_active: false,
    parking_charge_amount: 150,

    company_share_active: true,
    company_share_type: 'percent',
    company_share_value: 10.0,
  });

  // Vehicle Categories Grid State
  const [vehicles, setVehicles] = useState({
    Sedan: {
      car_type: 'Sedan',
      base_rate: 14.0,
      min_distance: 100,
      min_floor_rate: 11.20,
      max_ceiling_rate: 19.60,
      driver_allowance: 250,
      is_active: true,
    },
    SUV: {
      car_type: 'SUV',
      base_rate: 17.0,
      min_distance: 100,
      min_floor_rate: 13.60,
      max_ceiling_rate: 23.80,
      driver_allowance: 300,
      is_active: true,
    },
    Ertiga: {
      car_type: 'Ertiga',
      base_rate: 17.0,
      min_distance: 100,
      min_floor_rate: 13.60,
      max_ceiling_rate: 23.80,
      driver_allowance: 300,
      is_active: true,
    },
    Innova: {
      car_type: 'Innova',
      base_rate: 20.0,
      min_distance: 100,
      min_floor_rate: 16.00,
      max_ceiling_rate: 28.00,
      driver_allowance: 300,
      is_active: true,
    },
    Crysta: {
      car_type: 'Crysta',
      base_rate: 23.0,
      min_distance: 100,
      min_floor_rate: 18.40,
      max_ceiling_rate: 32.20,
      driver_allowance: 300,
      is_active: true,
    },
  });

  // Save Settings Handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      addToast('All One-Way Dynamic Pricing settings saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save settings to AWS backend', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVehicleChange = (carType, field, value) => {
    setVehicles(prev => ({
      ...prev,
      [carType]: {
        ...prev[carType],
        [field]: value
      }
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Action Bar */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#fff7ed',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              One-Way Dynamic Fare & Commission Engine
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            Configure real-time supply/demand elasticity, GST tax rates, toll estimates, driver allowances, and platform share.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="btn-primary"
          >
            <Save style={{ width: '16px', height: '16px' }} />
            <span>{isSaving ? 'Saving to AWS...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* Global Master Toggles Grid */}
      <div className="grid-2">
        {/* Card 1: Dynamic Pricing */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
                <Zap style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>One-Way Dynamic Pricing</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Supply-Demand Automatic Elasticity</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.dynamic_pricing_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, dynamic_pricing_active: checked }))}
            />
          </div>

          <SliderInput
            label="Pricing Sensitivity"
            value={globalSettings.pricing_sensitivity}
            onChange={(val) => setGlobalSettings(s => ({ ...s, pricing_sensitivity: val }))}
            min={0}
            max={100}
            step={5}
            unit="%"
            subtext="50% sensitivity dampens rapid market fluctuations smoothly."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Outlier Threshold (%)</label>
              <input
                type="number"
                value={globalSettings.outlier_threshold_pct}
                onChange={(e) => setGlobalSettings(s => ({ ...s, outlier_threshold_pct: parseFloat(e.target.value) || 50 }))}
                className="form-input"
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Lookback Window</label>
              <input
                type="number"
                value={globalSettings.lookback_days}
                onChange={(e) => setGlobalSettings(s => ({ ...s, lookback_days: parseInt(e.target.value) || 14 }))}
                className="form-input"
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: GST Taxes */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                <Percent style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>GST Tax Settings</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Customer Invoice Tax Collection</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.gst_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, gst_active: checked }))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Select GST Rate</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[5, 10, 12, 18].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setGlobalSettings(s => ({ ...s, gst_rate: rate }))}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: globalSettings.gst_rate === rate ? '1px solid #10b981' : '1px solid var(--border)',
                    background: globalSettings.gst_rate === rate ? '#ecfdf5' : '#ffffff',
                    color: globalSettings.gst_rate === rate ? '#059669' : '#374151',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8125rem'
                  }}
                >
                  {rate}% GST
                </button>
              ))}
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Invoices automatically itemize equal CGST ({globalSettings.gst_rate / 2}%) and SGST ({globalSettings.gst_rate / 2}%).
          </span>
        </div>

        {/* Card 3: Driver Allowance */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#fff7ed', color: '#d97706' }}>
                <Coffee style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Driver Daily Allowance</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Outstation food & daily allowance</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.driver_allowance_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, driver_allowance_active: checked }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Default Daily Allowance (₹)</label>
            <input
              type="number"
              value={globalSettings.driver_allowance_default}
              onChange={(e) => setGlobalSettings(s => ({ ...s, driver_allowance_default: parseFloat(e.target.value) || 250 }))}
              className="form-input"
              style={{ marginTop: '4px' }}
            />
          </div>
        </div>

        {/* Card 4: Company Share */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#f5f3ff', color: '#6d28d9' }}>
                <Building2 style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Rentox Company Share / Commission</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Platform profit deduction before driver payout</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.company_share_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, company_share_active: checked }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Share Type</label>
              <select
                value={globalSettings.company_share_type}
                onChange={(e) => setGlobalSettings(s => ({ ...s, company_share_type: e.target.value }))}
                className="form-select"
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Fixed (₹)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>
                {globalSettings.company_share_type === 'percent' ? 'Commission Rate (%)' : 'Flat Fee Amount (₹)'}
              </label>
              <input
                type="number"
                value={globalSettings.company_share_value}
                onChange={(e) => setGlobalSettings(s => ({ ...s, company_share_value: parseFloat(e.target.value) || 10 }))}
                className="form-input"
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Categories Table */}
      <div className="glass-card">
        <div className="section-header">
          <div>
            <div className="section-title">
              <Car style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              <span>Vehicle Pricing & Protection Boundaries</span>
            </div>
            <div className="section-subtitle">
              Manage base per-KM rates, minimum billable distance, and floor/ceiling surge caps per vehicle.
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Base Rate (₹/KM)</th>
                <th>Min Distance (KM)</th>
                <th>Min Floor Rate (₹/KM)</th>
                <th>Max Ceiling Rate (₹/KM)</th>
                <th>Driver Allowance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(vehicles).map(([carType, v]) => (
                <tr key={carType}>
                  <td>
                    <b style={{ color: '#111827', fontSize: '0.875rem' }}>{carType}</b>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={v.base_rate}
                      onChange={(e) => handleVehicleChange(carType, 'base_rate', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '90px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={v.min_distance}
                      onChange={(e) => handleVehicleChange(carType, 'min_distance', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ₹{(v.base_rate * 0.8).toFixed(2)} (-20%)
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#c2410c', fontWeight: 600 }}>
                      ₹{(v.base_rate * 1.4).toFixed(2)} (+40%)
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={v.driver_allowance}
                      onChange={(e) => handleVehicleChange(carType, 'driver_allowance', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '90px' }}
                    />
                  </td>
                  <td>
                    <Badge variant={v.is_active ? 'green' : 'slate'}>
                      {v.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Interactive Simulator Section */}
      <LiveSimulator globalSettings={globalSettings} vehicles={vehicles} />
    </div>
  );
};

export default OneWayFare;
