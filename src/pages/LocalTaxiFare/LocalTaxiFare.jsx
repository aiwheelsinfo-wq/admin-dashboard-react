import React, { useState, useEffect, useMemo } from 'react';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import SliderInput from '../../components/common/SliderInput';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import RevenueSplitBar from '../../components/simulator/RevenueSplitBar';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  Car,
  Zap,
  Clock,
  Moon,
  Percent,
  Building2,
  Save,
  Calculator,
  Flame,
  ShieldCheck,
  Activity,
  Users,
  MapPin,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

const LocalTaxiFare = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hotspots, setHotspots] = useState([]);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    dynamic_pricing_active: true,
    pricing_sensitivity: 50,
    peak_surge_active: true,
    peak_morning_start: '08:00',
    peak_morning_end: '11:00',
    peak_evening_start: '17:30',
    peak_evening_end: '21:00',
    peak_multiplier: 1.25,
    night_surcharge_active: true,
    night_start: '23:00',
    night_end: '05:00',
    night_multiplier: 1.20,
    gst_active: true,
    gst_rate: 5.0,
    company_share_active: true,
    company_share_type: 'percent',
    company_share_value: 10.0,
    today_demand: 0,
    active_drivers: 1020,
    demand_supply_ratio: 1.0,
    current_surge_multiplier: 1.0,
    current_surge_label: 'Balanced Demand (1.0x)',
    is_peak: false,
    is_night: false
  });

  // Vehicle Categories Grid State
  const [vehicles, setVehicles] = useState({
    Hatchback: {
      car_type_id: 1,
      car_type_label: 'Hatchback',
      base_fare: 180.0,
      included_base_km: 4.0,
      per_km_rate: 12.0,
      waiting_charge_per_min: 1.5,
      min_floor_rate: 9.60,
      max_ceiling_rate: 18.0,
      is_active: true,
    },
    Sedan: {
      car_type_id: 2,
      car_type_label: 'Sedan',
      base_fare: 250.0,
      included_base_km: 5.0,
      per_km_rate: 14.0,
      waiting_charge_per_min: 2.0,
      min_floor_rate: 11.20,
      max_ceiling_rate: 21.0,
      is_active: true,
    },
    SUV: {
      car_type_id: 3,
      car_type_label: 'SUV',
      base_fare: 350.0,
      included_base_km: 5.0,
      per_km_rate: 18.0,
      waiting_charge_per_min: 2.5,
      min_floor_rate: 14.40,
      max_ceiling_rate: 27.0,
      is_active: true,
    },
    Crysta: {
      car_type_id: 4,
      car_type_label: 'Crysta',
      base_fare: 450.0,
      included_base_km: 5.0,
      per_km_rate: 22.0,
      waiting_charge_per_min: 3.0,
      min_floor_rate: 17.60,
      max_ceiling_rate: 33.0,
      is_active: true,
    },
  });

  // Simulator Local States
  const [simVehicle, setSimVehicle] = useState('Sedan');
  const [simDistance, setSimDistance] = useState(18);
  const [simTime, setSimTime] = useState('09:30');

  // Fetch settings from AWS
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/get_local_taxi_settings.php`);
      if (res.data && res.data.status === 'success') {
        setGlobalSettings(res.data.global_settings);
        if (res.data.vehicles && Object.keys(res.data.vehicles).length > 0) {
          setVehicles(res.data.vehicles);
        }
        if (res.data.hotspots) {
          setHotspots(res.data.hotspots);
        }
      }
    } catch (err) {
      console.warn("Using default local taxi settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/save_local_taxi_settings.php`, {
        global_settings: globalSettings,
        vehicles: vehicles
      });

      if (res.data && res.data.status === 'success') {
        addToast('Local Taxi Dynamic Fare settings saved to AWS MySQL!', 'success');
      } else {
        addToast(res.data.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      addToast('Network error while saving local taxi settings', 'error');
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

  // Simulator Calculation Logic
  const simCalculation = useMemo(() => {
    const v = vehicles[simVehicle] || vehicles.Sedan;
    const baseFare = v.base_fare || 250.0;
    const includedKm = v.included_base_km || 5.0;
    const baseRate = v.per_km_rate || 14.0;

    const excessKm = Math.max(0, simDistance - includedKm);
    const rawExcessCharge = excessKm * baseRate;
    const subtotalBeforeSurcharge = baseFare + rawExcessCharge;

    // Time Surcharge
    let multiplier = 1.0;
    let surgeLabel = 'Normal Hours (1.0x)';
    
    // Check Peak (08:00 - 11:00 or 17:30 - 21:00)
    const isMorningPeak = simTime >= globalSettings.peak_morning_start && simTime <= globalSettings.peak_morning_end;
    const isEveningPeak = simTime >= globalSettings.peak_evening_start && simTime <= globalSettings.peak_evening_end;
    const isNight = simTime >= globalSettings.night_start || simTime <= globalSettings.night_end;

    if (globalSettings.peak_surge_active && (isMorningPeak || isEveningPeak)) {
      multiplier *= globalSettings.peak_multiplier || 1.25;
      surgeLabel = `Peak City Rush (+${Math.round((globalSettings.peak_multiplier - 1.0) * 100)}%)`;
    } else if (globalSettings.night_surcharge_active && isNight) {
      multiplier *= globalSettings.night_multiplier || 1.20;
      surgeLabel = `Night Surcharge (+${Math.round((globalSettings.night_multiplier - 1.0) * 100)}%)`;
    }

    const subtotalAfterSurcharge = subtotalBeforeSurcharge * multiplier;
    const gstAmount = globalSettings.gst_active ? (subtotalAfterSurcharge * ((globalSettings.gst_rate || 5) / 100)) : 0;
    const finalCustomerFare = subtotalAfterSurcharge + gstAmount;

    // Platform share & Driver Payout (90% Driver / 10% Rentox)
    let companyProfit = 0;
    if (globalSettings.company_share_active) {
      if (globalSettings.company_share_type === 'flat') {
        companyProfit = globalSettings.company_share_value || 40.0;
      } else {
        companyProfit = subtotalAfterSurcharge * ((globalSettings.company_share_value || 10) / 100);
      }
    }
    const driverNetPayout = Math.max(0, subtotalAfterSurcharge - companyProfit);

    return {
      baseFare,
      includedKm,
      baseRate,
      excessKm,
      rawExcessCharge,
      multiplier,
      surgeLabel,
      subtotalAfterSurcharge,
      gstAmount,
      finalCustomerFare,
      companyProfit,
      driverNetPayout
    };
  }, [simVehicle, simDistance, simTime, vehicles, globalSettings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Save Bar */}
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
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Car style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Local Taxi Dynamic Fare & Surge Engine
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            Uber-style live demand & supply elasticity, morning/evening peak rush surcharges, night multipliers, and 90% driver payout telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchSettings}
            className="btn-secondary"
            title="Refresh live telemetry from AWS"
          >
            <RefreshCw style={{ width: '15px', height: '15px' }} />
            <span>Refresh</span>
          </button>

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

      {/* 4 Real-time Telemetry Cards (Uber-Style) */}
      <div className="grid-4">
        <StatCard
          title="Live Demand State"
          value={globalSettings.current_surge_label}
          icon={Flame}
          trend={globalSettings.current_surge_multiplier > 1.0 ? `+${Math.round((globalSettings.current_surge_multiplier - 1.0) * 100)}% Surge` : 'Equilibrium'}
          trendType={globalSettings.current_surge_multiplier > 1.0 ? 'up' : 'neutral'}
          badge="Live Status"
          badgeColor={globalSettings.current_surge_multiplier > 1.0 ? 'amber' : 'green'}
        />

        <StatCard
          title="Active Online Fleet"
          value={`${globalSettings.active_drivers} Drivers`}
          icon={Users}
          trend="Approved Partners"
          trendType="neutral"
          badge="Fleet Supply"
          badgeColor="blue"
        />

        <StatCard
          title="Driver Incentive Share"
          value={`${100 - (globalSettings.company_share_value || 10)}% Net Payout`}
          icon={TrendingUp}
          trend="Maximizes Driver Pickup"
          trendType="up"
          badge="Driver Wallet"
          badgeColor="green"
        />

        <StatCard
          title="Rentox Commission"
          value={`${globalSettings.company_share_value || 10}% Margin`}
          icon={Building2}
          trend="Platform Profit"
          trendType="up"
          badge="Company Share"
          badgeColor="purple"
        />
      </div>

      {/* City Hotspots & Surge Dispatch Heatmap Table */}
      <div className="glass-card">
        <div className="section-header">
          <div>
            <div className="section-title">
              <MapPin style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              <span>City Hotspot Zones & Demand Telemetry</span>
            </div>
            <div className="section-subtitle">
              Real-time booking density by zone. Automatically triggers surge multipliers to pull available drivers into high-demand areas.
            </div>
          </div>
          <Badge variant="amber">🔥 Live Hotspot Dispatch</Badge>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>City / Pickup Zone</th>
                <th>Ride Requests (Demand)</th>
                <th>Available Cars (Supply)</th>
                <th>Demand Ratio</th>
                <th>Dynamic Surge Multiplier</th>
                <th>Dispatch Priority</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((h, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.demand_ratio >= 1.5 ? '#ef4444' : '#10b981' }} />
                      <b style={{ color: '#111827', fontSize: '0.875rem' }}>{h.zone}</b>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{h.demand_count} requests</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>{h.active_cars} cabs nearby</span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: h.demand_ratio >= 1.5 ? '#c2410c' : '#059669',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: h.demand_ratio >= 1.5 ? '#fff7ed' : '#ecfdf5'
                    }}>
                      {h.demand_ratio}x
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: h.surge_multiplier > 1.0 ? '#c2410c' : '#111827' }}>
                      {h.surge_multiplier > 1.0 ? `🔥 +${Math.round((h.surge_multiplier - 1.0) * 100)}% (${h.surge_multiplier}x)` : '1.0x (Standard)'}
                    </span>
                  </td>
                  <td>
                    <Badge variant={h.demand_ratio >= 1.5 ? 'red' : 'green'}>
                      {h.demand_ratio >= 1.5 ? '🔥 High Surge Dispatch' : 'Normal Queue'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Controls Grid */}
      <div className="grid-2">
        {/* Card 1: Peak Rush Surcharges */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#fff7ed', color: '#d97706' }}>
                <Flame style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Peak City Rush Surcharges</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Morning & Evening high traffic hours</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.peak_surge_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, peak_surge_active: checked }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Morning Rush Window</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <input
                  type="time"
                  value={globalSettings.peak_morning_start}
                  onChange={(e) => setGlobalSettings(s => ({ ...s, peak_morning_start: e.target.value }))}
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>to</span>
                <input
                  type="time"
                  value={globalSettings.peak_morning_end}
                  onChange={(e) => setGlobalSettings(s => ({ ...s, peak_morning_end: e.target.value }))}
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Evening Rush Window</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <input
                  type="time"
                  value={globalSettings.peak_evening_start}
                  onChange={(e) => setGlobalSettings(s => ({ ...s, peak_evening_start: e.target.value }))}
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>to</span>
                <input
                  type="time"
                  value={globalSettings.peak_evening_end}
                  onChange={(e) => setGlobalSettings(s => ({ ...s, peak_evening_end: e.target.value }))}
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          <SliderInput
            label="Peak Rush Multiplier"
            value={Math.round((globalSettings.peak_multiplier - 1.0) * 100)}
            onChange={(val) => setGlobalSettings(s => ({ ...s, peak_multiplier: 1.0 + (val / 100) }))}
            min={5}
            max={60}
            step={5}
            unit="%"
            subtext={`Multiplier: ${globalSettings.peak_multiplier}x during peak rush`}
          />
        </div>

        {/* Card 2: Night Surcharge */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8' }}>
                <Moon style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Night Ride Surcharge</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Late night driver compensation (11 PM - 5 AM)</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.night_surcharge_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, night_surcharge_active: checked }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Night Start</label>
              <input
                type="time"
                value={globalSettings.night_start}
                onChange={(e) => setGlobalSettings(s => ({ ...s, night_start: e.target.value }))}
                className="form-input"
                style={{ marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Night End</label>
              <input
                type="time"
                value={globalSettings.night_end}
                onChange={(e) => setGlobalSettings(s => ({ ...s, night_end: e.target.value }))}
                className="form-input"
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>

          <SliderInput
            label="Night Surcharge Multiplier"
            value={Math.round((globalSettings.night_multiplier - 1.0) * 100)}
            onChange={(val) => setGlobalSettings(s => ({ ...s, night_multiplier: 1.0 + (val / 100) }))}
            min={5}
            max={40}
            step={5}
            unit="%"
            subtext={`Multiplier: ${globalSettings.night_multiplier}x late night`}
          />
        </div>

        {/* Card 3: GST Tax */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
                <Percent style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>GST Tax Collection</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>City invoice tax breakdown</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.gst_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, gst_active: checked }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {[5, 12, 18].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setGlobalSettings(s => ({ ...s, gst_rate: r }))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: globalSettings.gst_rate === r ? '1px solid #10b981' : '1px solid var(--border)',
                  background: globalSettings.gst_rate === r ? '#ecfdf5' : '#ffffff',
                  color: globalSettings.gst_rate === r ? '#059669' : '#374151',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {r}% GST
              </button>
            ))}
          </div>
        </div>

        {/* Card 4: Platform Share */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: '#f5f3ff', color: '#6d28d9' }}>
                <Building2 style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Rentox Platform Commission</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Company margin deduction before driver payout</span>
              </div>
            </div>
            <ToggleSwitch
              checked={globalSettings.company_share_active}
              onChange={(checked) => setGlobalSettings(s => ({ ...s, company_share_active: checked }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Commission Type</label>
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
                {globalSettings.company_share_type === 'percent' ? 'Commission Rate (%)' : 'Flat Fee (₹)'}
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

      {/* Vehicle Categories Pricing Table */}
      <div className="glass-card">
        <div className="section-header">
          <div>
            <div className="section-title">
              <Car style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              <span>City Taxi Vehicle Fare Rules</span>
            </div>
            <div className="section-subtitle">
              Configure minimum base fares, included KM, excess per-KM rates, and waiting charges per vehicle category.
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Min Base Fare (₹)</th>
                <th>Included Base KM</th>
                <th>Excess Per KM Rate (₹)</th>
                <th>Waiting Charge (₹/min)</th>
                <th>Floor Bound</th>
                <th>Ceiling Surge</th>
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
                      value={v.base_fare}
                      onChange={(e) => handleVehicleChange(carType, 'base_fare', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '90px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={v.included_base_km}
                      onChange={(e) => handleVehicleChange(carType, 'included_base_km', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '70px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={v.per_km_rate}
                      onChange={(e) => handleVehicleChange(carType, 'per_km_rate', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={v.waiting_charge_per_min}
                      onChange={(e) => handleVehicleChange(carType, 'waiting_charge_per_min', parseFloat(e.target.value) || 0)}
                      className="form-input"
                      style={{ width: '70px' }}
                    />
                  </td>
                  <td>
                    <span style={{ color: '#059669', fontWeight: 600 }}>₹{(v.per_km_rate * 0.8).toFixed(2)}</span>
                  </td>
                  <td>
                    <span style={{ color: '#c2410c', fontWeight: 600 }}>₹{(v.per_km_rate * 1.5).toFixed(2)}</span>
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

      {/* Live Interactive City Ride Simulator */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div>
            <div className="section-title">
              <Calculator style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              <span>Live Local Taxi Fare & Revenue Simulator</span>
            </div>
            <div className="section-subtitle">
              Test real city point-to-point routes, morning/evening rush surcharges, and instant driver revenue splits.
            </div>
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Vehicle Category</label>
            <select
              value={simVehicle}
              onChange={(e) => setSimVehicle(e.target.value)}
              className="form-select"
              style={{ width: '100%', marginTop: '6px', padding: '9px 12px' }}
            >
              {Object.keys(vehicles).map(k => (
                <option key={k} value={k}>{k} (Base: ₹{vehicles[k].base_fare} for first {vehicles[k].included_base_km} KM)</option>
              ))}
            </select>
          </div>

          <SliderInput
            label="Ride Distance (KM)"
            value={simDistance}
            onChange={setSimDistance}
            min={2}
            max={80}
            step={1}
            unit=" KM"
            subtext="e.g. Dadar to BKC (8 KM), Pune Station to Hinjewadi (22 KM)"
          />

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Time of Day</label>
            <input
              type="time"
              value={simTime}
              onChange={(e) => setSimTime(e.target.value)}
              className="form-input"
              style={{ width: '100%', marginTop: '6px', padding: '8px 12px' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
              Status: <b style={{ color: simCalculation.multiplier > 1.0 ? '#c2410c' : '#059669' }}>{simCalculation.surgeLabel}</b>
            </span>
          </div>
        </div>

        {/* Breakdown Card */}
        <div style={{
          background: '#f9fafb',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '14px'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Estimated Local Taxi Customer Fare
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                  ₹{simCalculation.finalCustomerFare.toFixed(2)}
                </span>
                <Badge variant={simCalculation.multiplier > 1.0 ? 'amber' : 'green'}>
                  {simCalculation.multiplier > 1.0 ? `🔥 SURGE ACTIVE (${simCalculation.multiplier}x)` : 'Standard Rate'}
                </Badge>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Formula Breakdown</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                Base: ₹{simCalculation.baseFare} + {simCalculation.excessKm} KM @ ₹{simCalculation.baseRate}/KM
              </div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>GST 5%: ₹{simCalculation.gstAmount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>
              Revenue Distribution
            </span>
            <RevenueSplitBar
              driverPayout={simCalculation.driverNetPayout}
              companyShare={simCalculation.companyProfit}
              gstAmount={simCalculation.gstAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalTaxiFare;
