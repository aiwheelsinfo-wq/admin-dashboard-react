import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import { useToast } from '../../context/ToastContext';
import {
  Zap,
  Percent,
  Building2,
  Save,
  Car,
  Clock,
  Plus,
  Edit2,
  Ban,
  Check,
  X,
  Calculator,
  Activity,
  Receipt,
  Layers,
  TrendingUp,
  MapPin,
  RefreshCw,
  Sliders,
  ShieldCheck,
  HelpCircle,
  Users
} from 'lucide-react';

const ONEWAY_API_URL = 'https://agnicarrental.com/admin2025/oneway_fare_management.php';

const OneWayFare = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    master_engine_active: 1,
    dynamic_pricing_active: 1,
    oneway_pricing_sensitivity: 50,
    outlier_threshold_pct: 50.0,
    historical_lookback_days: 14,
    company_share_active: 1,
    company_share_type: 'percentage',
    company_share_value: 15.0,
    company_share_basis: 'subtotal',
    driver_allowance_active: 1,
    toll_auto_estimate: 1,
    toll_per_km_rate: 2.25,
    parking_active: 0,
    default_parking_amount: 0.0,
    gst_active: 1,
    gst_mode: 'split',
    gst_percent: 5.0,
    discount_active: 0,
    discount_type: 'percentage',
    discount_value: 0.0,
    row_version: 1
  });

  // Vehicle Rules & Categories
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [liveDemandMetrics, setLiveDemandMetrics] = useState({
    reference_demand: 1.0,
    today_demand: 1.0,
    demand_change_pct: 0.0,
    demand_ratio: 1.0,
    price_adjustment_pct: 0.0,
    pricing_sensitivity: 50,
    explanation_text: 'Demand is balanced with historical clean average.'
  });

  // Modals & Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleModalIsEdit, setVehicleModalIsEdit] = useState(false);
  const [vehicleModalData, setVehicleModalData] = useState({
    id: 0,
    car_type_id: 1,
    car_type_label: '',
    km_rate: 13.0,
    min_distance_km: 100,
    min_rate: 0,
    max_rate: 0,
    driver_allowance_short: 300,
    driver_allowance_long: 400,
    distance_threshold_km: 200,
    company_share_percent: 0,
    display_order: 1,
    row_version: 1
  });

  // Simulator State
  const [simCarType, setSimCarType] = useState('');
  const [simDistance, setSimDistance] = useState(200);
  const [simRefDemand, setSimRefDemand] = useState('1.00');
  const [simTodayDemand, setSimTodayDemand] = useState('1.00');
  const [simPickup, setSimPickup] = useState('Mumbai, Maharashtra, India');
  const [simDrop, setSimDrop] = useState('Pune, Maharashtra, India');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState('');

  // Initial Data Fetching from existing backend
  const fetchOneWayData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${ONEWAY_API_URL}?api=1`);
      if (res.data && res.data.success) {
        const s = res.data.settings || {};
        setGlobalSettings({
          master_engine_active: parseInt(s.master_engine_active ?? 1, 10),
          dynamic_pricing_active: parseInt(s.dynamic_pricing_active ?? 1, 10),
          oneway_pricing_sensitivity: parseFloat(s.oneway_pricing_sensitivity ?? 50),
          outlier_threshold_pct: parseFloat(s.outlier_threshold_pct ?? 50),
          historical_lookback_days: parseInt(s.historical_lookback_days ?? 14, 10),
          company_share_active: parseInt(s.company_share_active ?? 1, 10),
          company_share_type: s.company_share_type ?? 'percentage',
          company_share_value: parseFloat(s.company_share_value ?? 15),
          company_share_basis: s.company_share_basis ?? 'subtotal',
          driver_allowance_active: parseInt(s.driver_allowance_active ?? 1, 10),
          toll_auto_estimate: parseInt(s.toll_auto_estimate ?? 1, 10),
          toll_per_km_rate: parseFloat(s.toll_per_km_rate ?? 2.25),
          parking_active: parseInt(s.parking_active ?? 0, 10),
          default_parking_amount: parseFloat(s.default_parking_amount ?? 0),
          gst_active: parseInt(s.gst_active ?? 1, 10),
          gst_mode: s.gst_mode ?? 'split',
          gst_percent: parseFloat(s.gst_percent ?? 5.0),
          discount_active: parseInt(s.discount_active ?? 0, 10),
          discount_type: s.discount_type ?? 'percentage',
          discount_value: parseFloat(s.discount_value ?? 0),
          row_version: parseInt(s.row_version ?? 1, 10)
        });

        const r = res.data.rules || [];
        setRules(r);
        if (r.length > 0 && !simCarType) {
          setSimCarType(r[0].car_type_id);
        }

        const cats = res.data.categories || [];
        setCategories(cats);

        if (res.data.audit_logs) {
          setAuditLogs(res.data.audit_logs);
        }

        if (res.data.live_demand_metrics) {
          setLiveDemandMetrics(res.data.live_demand_metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching OneWay data:', err);
      addToast('Failed to load One-Way data from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOneWayData();
  }, []);

  // Save Global Settings
  const handleSaveGlobalSettings = async (e, customSettings = null, customToast = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    const target = customSettings || globalSettings;
    try {
      const formData = new FormData();
      formData.append('action', 'update_global_settings');
      formData.append('api', '1');
      formData.append('row_version', target.row_version || 1);
      formData.append('master_engine_active', target.master_engine_active ? '1' : '0');
      formData.append('driver_allowance_active', target.driver_allowance_active ? '1' : '0');
      formData.append('discount_active', target.discount_active ? '1' : '0');
      formData.append('discount_type', target.discount_type);
      formData.append('discount_value', target.discount_value);
      formData.append('gst_active', target.gst_active ? '1' : '0');
      formData.append('gst_mode', target.gst_mode);
      formData.append('gst_percent', target.gst_percent);
      formData.append('parking_active', target.parking_active ? '1' : '0');
      formData.append('default_parking_amount', target.default_parking_amount);
      formData.append('toll_auto_estimate', target.toll_auto_estimate ? '1' : '0');
      formData.append('toll_per_km_rate', target.toll_per_km_rate);
      formData.append('dynamic_pricing_active', target.dynamic_pricing_active ? '1' : '0');
      formData.append('oneway_pricing_sensitivity', target.oneway_pricing_sensitivity);
      formData.append('outlier_threshold_pct', target.outlier_threshold_pct);
      formData.append('historical_lookback_days', target.historical_lookback_days);
      formData.append('company_share_active', target.company_share_active ? '1' : '0');
      formData.append('company_share_type', target.company_share_type);
      formData.append('company_share_value', target.company_share_value);
      formData.append('company_share_basis', target.company_share_basis);

      const res = await axios.post(ONEWAY_API_URL, formData);
      if (res.data && res.data.success) {
        const nextVersion = res.data.settings?.row_version 
          ? parseInt(res.data.settings.row_version, 10) 
          : (parseInt(target.row_version, 10) + 1);
        setGlobalSettings(prev => ({
          ...prev,
          ...target,
          row_version: nextVersion
        }));
        addToast(customToast || res.data.message || 'One-Way settings updated successfully!', 'success');
      } else {
        addToast(res.data?.message || 'Error updating settings', 'error');
        fetchOneWayData();
      }
    } catch (err) {
      addToast(err.message || 'Network error updating settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (field, val, label) => {
    const updated = {
      ...globalSettings,
      [field]: val ? 1 : 0
    };
    setGlobalSettings(updated);
    handleSaveGlobalSettings(null, updated, `${label} ${val ? 'enabled' : 'disabled'}`);
  };

  // Open Add/Edit Vehicle Modal
  const openAddVehicleModal = () => {
    const firstCat = categories[0] || {};
    setVehicleModalIsEdit(false);
    setVehicleModalData({
      id: 0,
      car_type_id: firstCat.id || 1,
      car_type_label: firstCat.car_type || 'Sedan',
      km_rate: 13.0,
      min_distance_km: 100,
      min_rate: 0,
      max_rate: 0,
      driver_allowance_short: 300,
      driver_allowance_long: 400,
      distance_threshold_km: 200,
      company_share_percent: 0,
      display_order: (rules.length + 1),
      row_version: 1
    });
    setShowVehicleModal(true);
  };

  const openEditVehicleModal = (r) => {
    setVehicleModalIsEdit(true);
    setVehicleModalData({
      id: r.id,
      car_type_id: r.car_type_id,
      car_type_label: r.car_type_label,
      km_rate: r.km_rate,
      min_distance_km: r.min_distance_km,
      min_rate: r.min_rate,
      max_rate: r.max_rate,
      driver_allowance_short: r.driver_allowance_short,
      driver_allowance_long: r.driver_allowance_long,
      distance_threshold_km: r.distance_threshold_km,
      company_share_percent: r.company_share_percent,
      display_order: r.display_order,
      row_version: r.row_version
    });
    setShowVehicleModal(true);
  };

  // Save Vehicle Rule
  const handleSaveVehicleRule = async (e) => {
    if (e) e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('action', vehicleModalIsEdit ? 'edit_vehicle_rule' : 'add_vehicle_rule');
      formData.append('api', '1');
      if (vehicleModalIsEdit) {
        formData.append('rule_id', vehicleModalData.id);
        formData.append('row_version', vehicleModalData.row_version || 1);
      }
      formData.append('car_type_id', vehicleModalData.car_type_id);
      formData.append('km_rate', vehicleModalData.km_rate);
      formData.append('min_distance_km', vehicleModalData.min_distance_km);
      formData.append('min_rate', vehicleModalData.min_rate || 0);
      formData.append('max_rate', vehicleModalData.max_rate || 0);
      formData.append('driver_allowance_short', vehicleModalData.driver_allowance_short);
      formData.append('driver_allowance_long', vehicleModalData.driver_allowance_long);
      formData.append('distance_threshold_km', vehicleModalData.distance_threshold_km);
      formData.append('company_share_percent', vehicleModalData.company_share_percent || 0);
      formData.append('display_order', vehicleModalData.display_order || 1);

      const res = await axios.post(ONEWAY_API_URL, formData);
      if (res.data && res.data.success) {
        addToast(res.data.message || 'Vehicle rate updated successfully!', 'success');
        setShowVehicleModal(false);
        fetchOneWayData();
      } else {
        addToast(res.data?.message || 'Failed to save vehicle rule', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error saving vehicle rule', 'error');
    }
  };

  // Toggle Vehicle Active
  const handleToggleVehicleStatus = async (r) => {
    const action = r.is_active ? 'deactivate_vehicle' : 'activate_vehicle';
    try {
      const res = await axios.get(`${ONEWAY_API_URL}?action=${action}&id=${r.id}&api=1`);
      if (res.data && res.data.success) {
        addToast(res.data.message || 'Vehicle status updated!', 'success');
        fetchOneWayData();
      } else {
        addToast(res.data?.message || 'Error updating status', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update vehicle status', 'error');
    }
  };

  // Run Simulator
  const runSimulation = async (presetOverrides = {}) => {
    setSimLoading(true);
    setSimError('');
    try {
      const formData = new FormData();
      formData.append('ajax_action', 'simulate_fare');
      formData.append('car_type_id', presetOverrides.carTypeId ?? simCarType);
      formData.append('distance_km', presetOverrides.distance ?? simDistance);
      formData.append('pickup_address', presetOverrides.pickup ?? simPickup);
      formData.append('drop_address', presetOverrides.drop ?? simDrop);

      // Overrides
      formData.append('dynamic_pricing_active', globalSettings.dynamic_pricing_active ? 1 : 0);
      formData.append('oneway_pricing_sensitivity', presetOverrides.sensitivity ?? globalSettings.oneway_pricing_sensitivity);
      formData.append('simulated_reference_demand', presetOverrides.refDemand ?? simRefDemand);
      formData.append('simulated_today_demand', presetOverrides.todayDemand ?? simTodayDemand);

      formData.append('company_share_active', globalSettings.company_share_active ? 1 : 0);
      formData.append('company_share_type', globalSettings.company_share_type);
      formData.append('company_share_value', globalSettings.company_share_value);
      formData.append('company_share_basis', globalSettings.company_share_basis);

      formData.append('driver_allowance_active', globalSettings.driver_allowance_active ? 1 : 0);
      formData.append('gst_active', globalSettings.gst_active ? 1 : 0);
      formData.append('gst_mode', globalSettings.gst_mode);
      formData.append('gst_percent', globalSettings.gst_percent);
      formData.append('discount_active', globalSettings.discount_active ? 1 : 0);
      formData.append('parking_active', globalSettings.parking_active ? 1 : 0);
      formData.append('default_parking_amount', globalSettings.default_parking_amount);
      formData.append('toll_auto_estimate', globalSettings.toll_auto_estimate ? 1 : 0);
      formData.append('toll_per_km_rate', globalSettings.toll_per_km_rate);

      const res = await axios.post(ONEWAY_API_URL, formData);
      if (res.data && res.data.success && res.data.data) {
        setSimResult(res.data.data);
      } else {
        setSimError(res.data?.message || 'Simulation returned no data');
      }
    } catch (err) {
      setSimError(err.message || 'Simulation network error');
    } finally {
      setSimLoading(false);
    }
  };

  const loadTestPreset = (testNum, refDemand, todayDemand, sens) => {
    setSimRefDemand(String(refDemand));
    setSimTodayDemand(String(todayDemand));
    setGlobalSettings(prev => ({ ...prev, oneway_pricing_sensitivity: sens }));
    runSimulation({
      refDemand,
      todayDemand,
      sensitivity: sens
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', color: '#6b7280' }}>
        <Activity style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading One-Way Fare Configuration...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ── 1. MASTER ENGINE BANNER (Gradient Header matching PHP v2.2) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                One-Way Dynamic Pricing & Company Share Engine (v2.2)
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: globalSettings.master_engine_active ? '#10b981' : '#475569',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                {globalSettings.master_engine_active ? 'ENGINE ACTIVE' : 'DISABLED (FALLBACK)'}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: globalSettings.dynamic_pricing_active ? '#f59e0b' : '#334155',
                color: globalSettings.dynamic_pricing_active ? '#0f172a' : '#cbd5e1'
              }}>
                {globalSettings.dynamic_pricing_active ? 'DYNAMIC PRICING ON' : 'DYNAMIC OFF'}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: globalSettings.company_share_active ? '#38bdf8' : '#334155',
                color: globalSettings.company_share_active ? '#0f172a' : '#cbd5e1'
              }}>
                {globalSettings.company_share_active ? `COMPANY SHARE ${globalSettings.company_share_value}%` : 'SHARE OFF'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'rgba(239, 246, 255, 0.9)', margin: 0, fontWeight: 500 }}>
              Supply-demand elastic pricing and automated <strong>Company Share vs Driver Payout</strong> split exclusively for One-Way trips.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Clock style={{ width: '14px', height: '14px' }} />
              <span>Audit Logs</span>
            </button>
            <a
              href="#simulatorSection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f59e0b',
                color: '#0f172a',
                padding: '8px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.8125rem',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              <Zap style={{ width: '14px', height: '14px', fill: '#0f172a' }} />
              <span>Live Simulator</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. LIVE DEMAND & DYNAMIC RATE MONITOR WIDGET ── */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Activity style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              Live One-Way Demand & Dynamic Calculation Breakdown
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Real-time supply vs demand metrics calculated from historical non-outlier One-Way bookings
            </p>
          </div>
          <Badge variant="blue">
            <Clock style={{ width: '12px', height: '12px' }} /> Live Metrics
          </Badge>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="grid-4" style={{ marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Reference Demand
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', display: 'block', marginTop: '4px' }}>
                {Number(liveDemandMetrics.reference_demand || 1).toFixed(4)}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '2px' }}>Historical clean avg</span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Today's Demand
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#2563eb', display: 'block', marginTop: '4px' }}>
                {Number(liveDemandMetrics.today_demand || 1).toFixed(4)}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '2px' }}>Bookings / Cabs ratio</span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Demand Change %
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: (liveDemandMetrics.demand_change_pct || 0) >= 0 ? '#10b981' : '#ef4444',
                display: 'block',
                marginTop: '4px'
              }}>
                {(liveDemandMetrics.demand_change_pct || 0) >= 0 ? '+' : ''}
                {Number(liveDemandMetrics.demand_change_pct || 0).toFixed(2)}%
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                Ratio: {Number(liveDemandMetrics.demand_ratio || 1).toFixed(4)}
              </span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Price Adjustment %
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: (liveDemandMetrics.price_adjustment_pct || 0) >= 0 ? '#10b981' : '#ef4444',
                display: 'block',
                marginTop: '4px'
              }}>
                {(liveDemandMetrics.price_adjustment_pct || 0) >= 0 ? '+' : ''}
                {Number(liveDemandMetrics.price_adjustment_pct || 0).toFixed(2)}%
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                At {liveDemandMetrics.pricing_sensitivity ?? 50}% Sensitivity
              </span>
            </div>
          </div>

          {/* Explainability Callout */}
          <div style={{
            backgroundColor: '#eff6ff',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '0 10px 10px 0',
            padding: '12px 16px',
            fontSize: '0.8125rem',
            color: '#1e3a8a'
          }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <HelpCircle style={{ width: '15px', height: '15px', color: '#3b82f6' }} />
              <span>Why did the One-Way price change?</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              {liveDemandMetrics.explanation_text || 'Demand is balanced with historical clean average.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. GLOBAL CONTROL TOGGLES, DYNAMIC PRICING & COMPANY SHARE FORM ── */}
      <form onSubmit={handleSaveGlobalSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sliders style={{ width: '18px', height: '18px', color: '#2563eb' }} />
            Global Control Toggles, Dynamic Pricing & Company Share
          </h2>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
          >
            <Save style={{ width: '16px', height: '16px' }} />
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>

        {/* Dynamic Pricing Configuration Card */}
        <div className="glass-card" style={{ border: '1px solid #bfdbfe', background: '#ffffff', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>One-Way Dynamic Pricing</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Supply-Demand Elasticity</span>
              </div>
            </div>

            <div>
              <ToggleSwitch
                checked={Boolean(globalSettings.dynamic_pricing_active)}
                onChange={(val) => handleToggle('dynamic_pricing_active', val, 'One-Way Dynamic Pricing')}
                label="Enable Engine"
              />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Sensitivity:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb' }}>{globalSettings.oneway_pricing_sensitivity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={globalSettings.oneway_pricing_sensitivity}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, oneway_pricing_sensitivity: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
              />
            </div>

            <div style={{ minWidth: '130px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Outlier (%)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 8px' }}>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="100"
                  value={globalSettings.outlier_threshold_pct}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, outlier_threshold_pct: Number(e.target.value) }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>%</span>
              </div>
            </div>

            <div style={{ minWidth: '130px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Lookback
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 8px' }}>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={globalSettings.historical_lookback_days}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, historical_lookback_days: Number(e.target.value) }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Share & Platform Commission Card */}
        <div className="glass-card" style={{ border: '1px solid #a7f3d0', background: '#ffffff', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>One-Way Company Share</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform Commission & Net Payout</span>
              </div>
            </div>

            <div>
              <ToggleSwitch
                checked={Boolean(globalSettings.company_share_active)}
                onChange={(val) => handleToggle('company_share_active', val, 'Company Share')}
                label="Enable Share"
              />
            </div>

            <div style={{ minWidth: '150px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Type
              </label>
              <select
                value={globalSettings.company_share_type}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_type: e.target.value }))}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Flat (₹)</option>
              </select>
            </div>

            <div style={{ minWidth: '130px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Share Value
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 8px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={globalSettings.company_share_value}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_value: Number(e.target.value) }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                  {globalSettings.company_share_type === 'fixed' ? '₹' : '%'}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Calculation Basis
              </label>
              <select
                value={globalSettings.company_share_basis}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_basis: e.target.value }))}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              >
                <option value="subtotal">Pre-Tax Subtotal (KM + Allowance + Toll)</option>
                <option value="base_km">Base KM Charge Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5 Core Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {/* 1. Master Engine */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>Master Engine</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.master_engine_active)}
                  onChange={(val) => handleToggle('master_engine_active', val, 'Master Engine')}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>When OFF, quotes automatically fallback to legacy table.</p>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textAlign: 'center',
              padding: '4px',
              borderRadius: '6px',
              backgroundColor: globalSettings.master_engine_active ? '#ecfdf5' : '#f1f5f9',
              color: globalSettings.master_engine_active ? '#065f46' : '#64748b'
            }}>
              {globalSettings.master_engine_active ? 'Engine Active' : 'Fallback Mode'}
            </span>
          </div>

          {/* 2. Driver Allowance */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>Driver Allowance</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.driver_allowance_active)}
                  onChange={(val) => handleToggle('driver_allowance_active', val, 'Driver Allowance')}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Short & Long allowance customized per vehicle below.</p>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textAlign: 'center',
              padding: '4px',
              borderRadius: '6px',
              backgroundColor: globalSettings.driver_allowance_active ? '#ecfdf5' : '#f1f5f9',
              color: globalSettings.driver_allowance_active ? '#065f46' : '#64748b'
            }}>
              {globalSettings.driver_allowance_active ? 'Allowance Active' : 'Allowance Excluded'}
            </span>
          </div>

          {/* 3. Estimated Toll */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>Estimated Toll</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.toll_auto_estimate)}
                  onChange={(val) => handleToggle('toll_auto_estimate', val, 'Estimated Toll')}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>Rate/KM ₹</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={globalSettings.toll_per_km_rate}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, toll_per_km_rate: Number(e.target.value) }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
                />
              </div>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textAlign: 'center',
              padding: '4px',
              borderRadius: '6px',
              backgroundColor: globalSettings.toll_auto_estimate ? '#ecfdf5' : '#f1f5f9',
              color: globalSettings.toll_auto_estimate ? '#065f46' : '#64748b'
            }}>
              {globalSettings.toll_auto_estimate ? `Toll Active (₹${globalSettings.toll_per_km_rate}/KM)` : 'Toll Excluded (₹0)'}
            </span>
          </div>

          {/* 4. Parking Charge */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>Parking Charge</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.parking_active)}
                  onChange={(val) => handleToggle('parking_active', val, 'Parking Charge')}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>Amount ₹</span>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={globalSettings.default_parking_amount}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, default_parking_amount: Number(e.target.value) }))}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
                />
              </div>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textAlign: 'center',
              padding: '4px',
              borderRadius: '6px',
              backgroundColor: globalSettings.parking_active ? '#ecfdf5' : '#f1f5f9',
              color: globalSettings.parking_active ? '#065f46' : '#64748b'
            }}>
              {globalSettings.parking_active ? `Parking ₹${globalSettings.default_parking_amount}` : 'No Parking (₹0)'}
            </span>
          </div>

          {/* 5. Tax / GST */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>Tax / GST</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.gst_active)}
                  onChange={(val) => handleToggle('gst_active', val, 'Tax / GST')}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                <select
                  value={globalSettings.gst_mode}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, gst_mode: e.target.value }))}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 6px', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                >
                  <option value="split">Intra/Inter-State Split</option>
                  <option value="flat">Flat Rate (%)</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>Rate %</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="28"
                    value={globalSettings.gst_percent}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, gst_percent: Number(e.target.value) }))}
                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
                  />
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textAlign: 'center',
              padding: '4px',
              borderRadius: '6px',
              backgroundColor: globalSettings.gst_active ? '#ecfdf5' : '#f1f5f9',
              color: globalSettings.gst_active ? '#065f46' : '#64748b'
            }}>
              {globalSettings.gst_active ? `GST Active (${globalSettings.gst_percent}%)` : 'Tax Exempt (0%)'}
            </span>
          </div>
        </div>

        {/* Promotional Discount Strip */}
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Percent style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>One-Way Promotional Discount</h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Apply instant checkout discounts</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <ToggleSwitch
              checked={Boolean(globalSettings.discount_active)}
              onChange={(val) => handleToggle('discount_active', val, 'Promotional Discount')}
              label="Enable Discount"
            />
            <select
              value={globalSettings.discount_type}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, discount_type: e.target.value }))}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Flat Amount (₹)</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 10px', width: '120px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>Value</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={globalSettings.discount_value}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}
              />
            </div>
          </div>
        </div>
      </form>

      {/* ── 4. PER-VEHICLE FARE RULES TABLE ── */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Car style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              Per-Vehicle Rate & Commission Configuration
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Custom Base KM rate, minimum floor, maximum ceiling, driver allowances & vehicle commission per car category
            </p>
          </div>
          <button
            type="button"
            onClick={openAddVehicleModal}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            <span>Add Vehicle Rate</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle Category</th>
                <th>Base Rate / KM</th>
                <th>Min Floor (₹)</th>
                <th>Max Ceiling (₹)</th>
                <th>Allowance (&lt; 200 KM)</th>
                <th>Allowance (≥ 200 KM)</th>
                <th>Company Share</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No vehicle rules configured yet.
                  </td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.car_type_label}</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>ID: #{r.car_type_id}</small>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.9375rem' }}>
                        ₹{Number(r.km_rate).toFixed(2)}
                      </span>{' '}
                      <small style={{ color: '#94a3b8' }}>/ KM</small>
                    </td>
                    <td>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {Number(r.min_rate) > 0 ? `₹${Number(r.min_rate).toFixed(2)}` : 'Auto (-20%)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {Number(r.max_rate) > 0 ? `₹${Number(r.max_rate).toFixed(2)}` : 'Auto (+40%)'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{Number(r.driver_allowance_short).toFixed(0)}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{Number(r.driver_allowance_long).toFixed(0)}</td>
                    <td>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {Number(r.company_share_percent || 0) > 0
                          ? `${Number(r.company_share_percent).toFixed(1)}% (Custom)`
                          : `Global (${globalSettings.company_share_value}%)`}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: r.is_active ? '#ecfdf5' : '#f1f5f9',
                        color: r.is_active ? '#065f46' : '#64748b'
                      }}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditVehicleModal(r)}
                          style={{
                            padding: '4px 10px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 style={{ width: '12px', height: '12px' }} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleStatus(r)}
                          style={{
                            padding: '4px 8px',
                            background: r.is_active ? '#fef2f2' : '#ecfdf5',
                            color: r.is_active ? '#dc2626' : '#059669',
                            border: `1px solid ${r.is_active ? '#fecaca' : '#a7f3d0'}`,
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                          title={r.is_active ? 'Deactivate rule' : 'Activate rule'}
                        >
                          {r.is_active ? <Ban style={{ width: '12px', height: '12px' }} /> : <Check style={{ width: '12px', height: '12px' }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. LIVE INTERACTIVE FARE & DYNAMIC DEMAND SIMULATOR ── */}
      <div id="simulatorSection" className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Zap style={{ width: '16px', height: '16px', color: '#f59e0b', fill: '#f59e0b' }} />
              Live Interactive Dynamic Fare & Commission Simulator
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Test real-time calculation and verify breakdowns with custom simulated demand and test presets
            </p>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button type="button" onClick={() => loadTestPreset(1, 1.0, 1.0, 50)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              Test 1 (Normal)
            </button>
            <button type="button" onClick={() => loadTestPreset(2, 1.0, 1.5, 50)} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              Test 2 (High +50%)
            </button>
            <button type="button" onClick={() => loadTestPreset(3, 1.0, 0.7, 50)} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              Test 3 (Low -30%)
            </button>
            <button type="button" onClick={() => loadTestPreset(4, 1.0, 2.5, 50)} style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              Test 4 (Max Cap)
            </button>
            <button type="button" onClick={() => loadTestPreset(5, 1.0, 0.1, 50)} style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              Test 5 (Min Floor)
            </button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Select Vehicle
              </label>
              <select
                value={simCarType}
                onChange={(e) => setSimCarType(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.car_type_id}>
                    {r.car_type_label} (₹{r.km_rate}/KM)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Distance (KM)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={simDistance}
                onChange={(e) => setSimDistance(Number(e.target.value))}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Simulated Ref Demand
              </label>
              <input
                type="number"
                step="0.05"
                value={simRefDemand}
                onChange={(e) => setSimRefDemand(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Simulated Today Demand
              </label>
              <input
                type="number"
                step="0.05"
                value={simTodayDemand}
                onChange={(e) => setSimTodayDemand(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Pickup Location
              </label>
              <input
                type="text"
                value={simPickup}
                onChange={(e) => setSimPickup(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Drop Location
              </label>
              <input
                type="text"
                value={simDrop}
                onChange={(e) => setSimDrop(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => runSimulation()}
              disabled={simLoading}
              style={{
                backgroundColor: '#f59e0b',
                color: '#0f172a',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: simLoading ? 'not-allowed' : 'pointer',
                opacity: simLoading ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(245,158,11,0.2)'
              }}
            >
              <Calculator style={{ width: '16px', height: '16px' }} />
              <span>{simLoading ? 'Calculating...' : 'Calculate Fare & Commission Split'}</span>
            </button>
          </div>

          {/* Simulation Output Area */}
          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '20px'
          }}>
            {simError && (
              <div style={{ padding: '12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.8125rem', fontWeight: 700 }}>
                {simError}
              </div>
            )}

            {!simResult && !simLoading && !simError && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <Calculator style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>Click <strong>"Calculate Fare & Commission Split"</strong> or any test preset above to see instant breakdown.</p>
              </div>
            )}

            {simLoading && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#2563eb' }}>
                <Activity style={{ width: '28px', height: '28px', margin: '0 auto 8px auto', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0 }}>Calculating fare & commission split with dynamic demand...</p>
              </div>
            )}

            {simResult && !simLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Receipt style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                    Live Simulation: {simResult.car_type} ({simResult.distance_km} KM)
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: simResult.dynamic_pricing?.is_active ? '#fef3c7' : '#f1f5f9', color: simResult.dynamic_pricing?.is_active ? '#92400e' : '#64748b' }}>
                      {simResult.dynamic_pricing?.is_active ? 'Dynamic Demand Active' : 'Static Base'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: simResult.company_share_breakdown?.is_active ? '#e0f2fe' : '#f1f5f9', color: simResult.company_share_breakdown?.is_active ? '#0369a1' : '#64748b' }}>
                      {simResult.company_share_breakdown?.is_active ? 'Share Active' : 'No Share'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: simResult.master_engine_active ? '#dcfce7' : '#f1f5f9', color: simResult.master_engine_active ? '#166534' : '#64748b' }}>
                      {simResult.master_engine_active ? 'Engine v2 Active' : 'Fallback'}
                    </span>
                  </div>
                </div>

                {/* Dynamic Rate Breakdown Strip */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Ref Demand</span>
                      <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{simResult.dynamic_pricing?.reference_demand || '1.0000'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Today's Demand</span>
                      <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{simResult.dynamic_pricing?.today_demand || '1.0000'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Demand Ratio</span>
                      <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{simResult.dynamic_pricing?.demand_ratio || '1.0000'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Demand Change</span>
                      <strong style={{ fontFamily: 'monospace', color: (simResult.dynamic_pricing?.demand_change_pct || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {(simResult.dynamic_pricing?.demand_change_pct || 0) >= 0 ? '+' : ''}{simResult.dynamic_pricing?.demand_change_pct || 0}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Sensitivity</span>
                      <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{simResult.dynamic_pricing?.pricing_sensitivity || 50}%</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Price Adj %</span>
                      <strong style={{ fontFamily: 'monospace', color: (simResult.dynamic_pricing?.price_adjustment_pct || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {(simResult.dynamic_pricing?.price_adjustment_pct || 0) >= 0 ? '+' : ''}{simResult.dynamic_pricing?.price_adjustment_pct || 0}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Base KM Charge ({simResult.chargeable_km} KM @ ₹{simResult.km_rate}/KM):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>₹{Number(simResult.base_km_charge || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Driver Allowance ({simResult.driver_allowance_active ? 'Active' : 'Disabled'}):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: simResult.driver_allowance_active ? '#0f172a' : '#94a3b8', textDecoration: simResult.driver_allowance_active ? 'none' : 'line-through' }}>
                      ₹{Number(simResult.driver_allowance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Estimated Toll ({simResult.chargeable_km} KM):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: simResult.toll_charge > 0 ? '#0f172a' : '#94a3b8' }}>
                      {simResult.toll_charge > 0 ? `₹${Number(simResult.toll_charge).toLocaleString('en-IN')}` : '₹0.00 (Toll Excluded)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Parking Surcharge:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: simResult.parking_charge > 0 ? '#0f172a' : '#94a3b8' }}>
                      {simResult.parking_charge > 0 ? `₹${Number(simResult.parking_charge).toLocaleString('en-IN')}` : '₹0.00 (No Parking)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                    <span>Pre-Tax Subtotal:</span>
                    <span style={{ fontFamily: 'monospace' }}>₹{Number(simResult.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Revenue Split Card */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontWeight: 700 }}>
                    <span style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 style={{ width: '15px', height: '15px' }} />
                      Revenue Split & Driver Settlement:
                    </span>
                    <span style={{ fontSize: '0.6875rem', backgroundColor: '#bbf7d0', color: '#14532d', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                      {simResult.company_share_breakdown?.type === 'fixed'
                        ? `Fixed ₹${simResult.company_share_breakdown?.value}`
                        : `${simResult.company_share_breakdown?.value}% ${simResult.company_share_breakdown?.basis === 'base_km' ? 'Base KM' : 'Subtotal'}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '2px' }}>
                    <span>🏢 Rentox Company Share:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>₹{Number(simResult.company_share_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>🚖 Driver / Partner Net Payout:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#059669' }}>₹{Number(simResult.driver_payout_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#64748b' }}>GST / Tax ({simResult.gst_breakdown?.mode || 'Active'} - {simResult.gst_breakdown?.rate}%):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>+ ₹{Number(simResult.gst_amount || 0).toLocaleString('en-IN')}</span>
                </div>

                {Number(simResult.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b' }}>Promotional Discount:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>- ₹{Number(simResult.discount_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '2px solid #cbd5e1',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#1e3a8a'
                }}>
                  <span>TOTAL CUSTOMER FARE:</span>
                  <span style={{ fontSize: '1.35rem', fontFamily: 'monospace' }}>₹{Number(simResult.final_fare || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* Explanation */}
                <div style={{
                  backgroundColor: '#eff6ff',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '0 8px 8px 0',
                  padding: '10px 14px',
                  fontSize: '0.75rem',
                  color: '#1e3a8a'
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <HelpCircle style={{ width: '13px', height: '13px' }} />
                    <span>Calculation Explanation</span>
                  </div>
                  <p style={{ margin: 0 }}>{simResult.dynamic_pricing?.explanation_text || 'Standard calculation.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: ADD / EDIT VEHICLE RULE ── */}
      {showVehicleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '480px',
            width: '100%',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {vehicleModalIsEdit ? 'Edit Vehicle Rate' : 'Add Vehicle Rate'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicleRule} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Vehicle Category
                </label>
                <select
                  value={vehicleModalData.car_type_id}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const cat = categories.find(c => c.id == cid);
                    setVehicleModalData(prev => ({
                      ...prev,
                      car_type_id: cid,
                      car_type_label: cat ? cat.car_type : ''
                    }));
                  }}
                  style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.car_type}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Rate per KM (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={vehicleModalData.km_rate}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, km_rate: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Min Distance (KM)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={vehicleModalData.min_distance_km}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, min_distance_km: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Min Floor Rate ₹ (0=Auto)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={vehicleModalData.min_rate}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, min_rate: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Max Ceiling Rate ₹ (0=Auto)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={vehicleModalData.max_rate}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, max_rate: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Short Allow (&lt; 200 KM)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={vehicleModalData.driver_allowance_short}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, driver_allowance_short: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Long Allow (≥ 200 KM)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={vehicleModalData.driver_allowance_long}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, driver_allowance_long: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Threshold (KM)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={vehicleModalData.distance_threshold_km}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, distance_threshold_km: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Company Share % (0=Global)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={vehicleModalData.company_share_percent}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, company_share_percent: Number(e.target.value) }))}
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={vehicleModalData.display_order}
                  onChange={(e) => setVehicleModalData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                  style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
                >
                  Save Vehicle Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AUDIT LOGS HISTORY ── */}
      {showAuditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Clock style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                Audit Log History
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, margin: '14px 0' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Changes (Before / After)</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : 'N/A'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{log.admin_id}</td>
                        <td>
                          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                            {log.action_type}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', wordBreak: 'break-all' }}>
                          {log.new_value || log.changes || log.old_value || log.description || log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.8125rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneWayFare;
