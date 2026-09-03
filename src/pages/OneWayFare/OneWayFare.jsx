import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  Zap,
  Percent,
  Building2,
  Save,
  Car,
  Clock,
  RotateCcw,
  Plus,
  Edit2,
  Ban,
  Check,
  X,
  Calculator,
  Activity,
  AlertCircle,
  HelpCircle,
  Receipt,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin
} from 'lucide-react';

const ONEWAY_API_URL = 'https://agnicarrental.com/admin2025/oneway_fare_management.php';

const OneWayFare = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Global Settings
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
  const handleSaveGlobalSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('action', 'update_global_settings');
      formData.append('api', '1');
      formData.append('row_version', globalSettings.row_version || 1);
      formData.append('master_engine_active', globalSettings.master_engine_active ? '1' : '0');
      formData.append('driver_allowance_active', globalSettings.driver_allowance_active ? '1' : '0');
      formData.append('discount_active', globalSettings.discount_active ? '1' : '0');
      formData.append('discount_type', globalSettings.discount_type);
      formData.append('discount_value', globalSettings.discount_value);
      formData.append('gst_active', globalSettings.gst_active ? '1' : '0');
      formData.append('gst_mode', globalSettings.gst_mode);
      formData.append('gst_percent', globalSettings.gst_percent);
      formData.append('parking_active', globalSettings.parking_active ? '1' : '0');
      formData.append('default_parking_amount', globalSettings.default_parking_amount);
      formData.append('toll_auto_estimate', globalSettings.toll_auto_estimate ? '1' : '0');
      formData.append('toll_per_km_rate', globalSettings.toll_per_km_rate);
      formData.append('dynamic_pricing_active', globalSettings.dynamic_pricing_active ? '1' : '0');
      formData.append('oneway_pricing_sensitivity', globalSettings.oneway_pricing_sensitivity);
      formData.append('outlier_threshold_pct', globalSettings.outlier_threshold_pct);
      formData.append('historical_lookback_days', globalSettings.historical_lookback_days);
      formData.append('company_share_active', globalSettings.company_share_active ? '1' : '0');
      formData.append('company_share_type', globalSettings.company_share_type);
      formData.append('company_share_value', globalSettings.company_share_value);
      formData.append('company_share_basis', globalSettings.company_share_basis);

      const res = await axios.post(ONEWAY_API_URL, formData);
      if (res.data && res.data.success) {
        addToast(res.data.message || 'One-Way settings updated successfully!', 'success');
        fetchOneWayData();
      } else {
        addToast(res.data?.message || 'Error updating settings', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Network error updating settings', 'error');
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-slate-500">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Loading One-Way Fare Configuration...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
      {/* ── 1. MASTER ENGINE BANNER (Matching oneway_fare_management.php lines 526-554) ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md bg-gradient-to-r from-slate-900 via-blue-950 to-blue-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl md:text-2xl font-black text-white">
                One-Way Dynamic Pricing & Company Share Engine (v2.2)
              </h1>
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${globalSettings.master_engine_active ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-200'}`}>
                {globalSettings.master_engine_active ? 'ENGINE ACTIVE' : 'DISABLED (FALLBACK)'}
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${globalSettings.dynamic_pricing_active ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                {globalSettings.dynamic_pricing_active ? 'DYNAMIC PRICING ON' : 'DYNAMIC OFF'}
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${globalSettings.company_share_active ? 'bg-sky-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                {globalSettings.company_share_active ? `COMPANY SHARE ${globalSettings.company_share_value}%` : 'SHARE OFF'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-blue-100/90 font-medium">
              Supply-demand elastic pricing and automated <strong>Company Share vs Driver Payout</strong> split exclusively for One-Way trips.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
            <a
              href="#simulatorSection"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Live Simulator</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. LIVE ONE-WAY DEMAND & DYNAMIC RATE MONITOR WIDGET (Matching lines 556-610) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live One-Way Demand & Dynamic Calculation Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Real-time supply vs demand metrics calculated from historical non-outlier One-Way bookings
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Live Metrics
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Reference Demand</span>
              <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
                {Number(liveDemandMetrics.reference_demand || 1).toFixed(4)}
              </span>
              <span className="text-[10px] text-slate-500 block">Historical clean avg</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Today's Demand</span>
              <span className="text-lg font-black font-mono text-blue-600 block mt-0.5">
                {Number(liveDemandMetrics.today_demand || 1).toFixed(4)}
              </span>
              <span className="text-[10px] text-slate-500 block">Bookings / Cabs ratio</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Demand Change %</span>
              <span className={`text-lg font-black font-mono block mt-0.5 ${(liveDemandMetrics.demand_change_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(liveDemandMetrics.demand_change_pct || 0) >= 0 ? '+' : ''}
                {Number(liveDemandMetrics.demand_change_pct || 0).toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 block">Ratio: {Number(liveDemandMetrics.demand_ratio || 1).toFixed(4)}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Price Adjustment %</span>
              <span className={`text-lg font-black font-mono block mt-0.5 ${(liveDemandMetrics.price_adjustment_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(liveDemandMetrics.price_adjustment_pct || 0) >= 0 ? '+' : ''}
                {Number(liveDemandMetrics.price_adjustment_pct || 0).toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 block">At {liveDemandMetrics.pricing_sensitivity ?? 50}% Sensitivity</span>
            </div>
          </div>

          {/* Plain-English Explainability Box */}
          <div className="bg-blue-50/80 border-l-4 border-blue-500 rounded-r-xl p-3.5 text-xs text-blue-950 flex flex-col gap-1">
            <div className="font-extrabold flex items-center gap-1.5 text-blue-900">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Why did the One-Way price change?</span>
            </div>
            <p className="font-medium leading-relaxed">
              {liveDemandMetrics.explanation_text || 'Demand is balanced with historical clean average.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. GLOBAL CONTROL TOGGLES, DYNAMIC PRICING & COMPANY SHARE FORM ── */}
      <form onSubmit={handleSaveGlobalSettings} className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Global Control Toggles, Dynamic Pricing & Company Share
          </h2>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>

        {/* Dynamic Pricing Configuration Card */}
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">One-Way Dynamic Pricing</h3>
                <span className="text-xs text-slate-500">Supply-Demand Elasticity</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <ToggleSwitch
                checked={Boolean(globalSettings.dynamic_pricing_active)}
                onChange={(val) => setGlobalSettings(prev => ({ ...prev, dynamic_pricing_active: val ? 1 : 0 }))}
                label="Enable Engine"
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-700">Sensitivity</span>
                <span className="text-xs font-black text-blue-600">{globalSettings.oneway_pricing_sensitivity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={globalSettings.oneway_pricing_sensitivity}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, oneway_pricing_sensitivity: Number(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Outlier Threshold</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="100"
                  value={globalSettings.outlier_threshold_pct}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, outlier_threshold_pct: Number(e.target.value) }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Lookback</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={globalSettings.historical_lookback_days}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, historical_lookback_days: Number(e.target.value) }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-400">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Share & Platform Commission Card */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">One-Way Company Share</h3>
                <span className="text-xs text-slate-500">Platform Commission & Net Payout</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <ToggleSwitch
                checked={Boolean(globalSettings.company_share_active)}
                onChange={(val) => setGlobalSettings(prev => ({ ...prev, company_share_active: val ? 1 : 0 }))}
                label="Enable Share"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Commission Type</label>
              <select
                value={globalSettings.company_share_type}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_type: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Flat (₹)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Share Value</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={globalSettings.company_share_value}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_value: Number(e.target.value) }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-400">
                  {globalSettings.company_share_type === 'fixed' ? '₹' : '%'}
                </span>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Calculation Basis</label>
              <select
                value={globalSettings.company_share_basis}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_basis: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 outline-none"
              >
                <option value="subtotal">Pre-Tax Subtotal (KM + Allowance + Toll)</option>
                <option value="base_km">Base KM Charge Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5 Core Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Master Engine */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-extrabold text-slate-900">Master Engine</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.master_engine_active)}
                  onChange={(val) => setGlobalSettings(prev => ({ ...prev, master_engine_active: val ? 1 : 0 }))}
                />
              </div>
              <p className="text-[11px] text-slate-500">When OFF, quotes automatically fallback to legacy table.</p>
            </div>
            <span className={`text-[10px] font-extrabold text-center py-1 rounded-lg ${globalSettings.master_engine_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {globalSettings.master_engine_active ? 'Engine Active' : 'Fallback Mode'}
            </span>
          </div>

          {/* Driver Allowance */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-extrabold text-slate-900">Driver Allowance</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.driver_allowance_active)}
                  onChange={(val) => setGlobalSettings(prev => ({ ...prev, driver_allowance_active: val ? 1 : 0 }))}
                />
              </div>
              <p className="text-[11px] text-slate-500">Short & Long allowance customized per vehicle below.</p>
            </div>
            <span className={`text-[10px] font-extrabold text-center py-1 rounded-lg ${globalSettings.driver_allowance_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {globalSettings.driver_allowance_active ? 'Allowance Active' : 'Allowance Excluded'}
            </span>
          </div>

          {/* Estimated Toll */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-extrabold text-slate-900">Estimated Toll</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.toll_auto_estimate)}
                  onChange={(val) => setGlobalSettings(prev => ({ ...prev, toll_auto_estimate: val ? 1 : 0 }))}
                />
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Rate/KM ₹</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={globalSettings.toll_per_km_rate}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, toll_per_km_rate: Number(e.target.value) }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>
            <span className={`text-[10px] font-extrabold text-center py-1 rounded-lg ${globalSettings.toll_auto_estimate ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {globalSettings.toll_auto_estimate ? `Toll Active (₹${globalSettings.toll_per_km_rate}/KM)` : 'Toll Excluded (₹0)'}
            </span>
          </div>

          {/* Parking Surcharge */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-extrabold text-slate-900">Parking Charge</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.parking_active)}
                  onChange={(val) => setGlobalSettings(prev => ({ ...prev, parking_active: val ? 1 : 0 }))}
                />
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Amount ₹</span>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={globalSettings.default_parking_amount}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, default_parking_amount: Number(e.target.value) }))}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>
            <span className={`text-[10px] font-extrabold text-center py-1 rounded-lg ${globalSettings.parking_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {globalSettings.parking_active ? `Parking ₹${globalSettings.default_parking_amount}` : 'No Parking (₹0)'}
            </span>
          </div>

          {/* Tax / GST */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-extrabold text-slate-900">Tax / GST</span>
                <ToggleSwitch
                  checked={Boolean(globalSettings.gst_active)}
                  onChange={(val) => setGlobalSettings(prev => ({ ...prev, gst_active: val ? 1 : 0 }))}
                />
              </div>
              <div className="flex flex-col gap-1 mb-1">
                <select
                  value={globalSettings.gst_mode}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, gst_mode: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-semibold text-slate-900"
                >
                  <option value="split">Intra/Inter-State Split</option>
                  <option value="flat">Flat Rate (%)</option>
                </select>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Rate %</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="28"
                    value={globalSettings.gst_percent}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, gst_percent: Number(e.target.value) }))}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-extrabold text-center py-1 rounded-lg ${globalSettings.gst_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {globalSettings.gst_active ? `GST Active (${globalSettings.gst_percent}%)` : 'Tax Exempt (0%)'}
            </span>
          </div>
        </div>

        {/* Promotional Discount Row */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">One-Way Promotional Discount</h4>
              <span className="text-[11px] text-slate-500">Apply instant checkout discounts</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <ToggleSwitch
              checked={Boolean(globalSettings.discount_active)}
              onChange={(val) => setGlobalSettings(prev => ({ ...prev, discount_active: val ? 1 : 0 }))}
              label="Enable Discount"
            />
            <select
              value={globalSettings.discount_type}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, discount_type: e.target.value }))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Flat Amount (₹)</option>
            </select>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-32">
              <span className="text-xs text-slate-400 font-bold mr-1">Value</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={globalSettings.discount_value}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>
      </form>

      {/* ── 4. PER-VEHICLE FARE RULES TABLE (Matching lines 846-929) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              Per-Vehicle Rate & Commission Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Custom Base KM rate, minimum floor, maximum ceiling, driver allowances & vehicle commission per car category
            </p>
          </div>
          <button
            type="button"
            onClick={openAddVehicleModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle Rate</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Vehicle Category</th>
                <th className="py-3 px-4">Base Rate / KM</th>
                <th className="py-3 px-4">Min Floor (₹)</th>
                <th className="py-3 px-4">Max Ceiling (₹)</th>
                <th className="py-3 px-4">Allowance (&lt; 200 KM)</th>
                <th className="py-3 px-4">Allowance (≥ 200 KM)</th>
                <th className="py-3 px-4">Company Share</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-semibold">
                    No vehicle rules configured yet.
                  </td>
                </tr>
              ) : (
                rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.car_type_label}</div>
                      <span className="text-[10px] text-slate-400 font-normal">ID: #{r.car_type_id}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      ₹{Number(r.km_rate).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ KM</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono text-[11px]">
                        {Number(r.min_rate) > 0 ? `₹${Number(r.min_rate).toFixed(2)}` : 'Auto (-20%)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono text-[11px]">
                        {Number(r.max_rate) > 0 ? `₹${Number(r.max_rate).toFixed(2)}` : 'Auto (+40%)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">₹{Number(r.driver_allowance_short).toFixed(0)}</td>
                    <td className="py-3.5 px-4 font-mono">₹{Number(r.driver_allowance_long).toFixed(0)}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono text-[11px]">
                        {Number(r.company_share_percent || 0) > 0
                          ? `${Number(r.company_share_percent).toFixed(1)}% (Custom)`
                          : `Global (${globalSettings.company_share_value}%)`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${r.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditVehicleModal(r)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleStatus(r)}
                          className={`p-1 rounded text-xs transition-all cursor-pointer ${r.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={r.is_active ? 'Deactivate rule' : 'Activate rule'}
                        >
                          {r.is_active ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
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

      {/* ── 5. LIVE INTERACTIVE FARE & DYNAMIC DEMAND SIMULATOR (Matching lines 931-1376) ── */}
      <div id="simulatorSection" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Live Interactive Dynamic Fare & Commission Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Test real-time calculation and verify breakdowns with custom simulated demand and test presets
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => loadTestPreset(1, 1.0, 1.0, 50)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] transition-all cursor-pointer">
              Test 1 (Normal)
            </button>
            <button type="button" onClick={() => loadTestPreset(2, 1.0, 1.5, 50)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[11px] transition-all cursor-pointer">
              Test 2 (High +50%)
            </button>
            <button type="button" onClick={() => loadTestPreset(3, 1.0, 0.7, 50)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded text-[11px] transition-all cursor-pointer">
              Test 3 (Low -30%)
            </button>
            <button type="button" onClick={() => loadTestPreset(4, 1.0, 2.5, 50)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded text-[11px] transition-all cursor-pointer">
              Test 4 (Max Cap)
            </button>
            <button type="button" onClick={() => loadTestPreset(5, 1.0, 0.1, 50)} className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded text-[11px] transition-all cursor-pointer">
              Test 5 (Min Floor)
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mb-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Select Vehicle</label>
              <select
                value={simCarType}
                onChange={(e) => setSimCarType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none"
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.car_type_id}>
                    {r.car_type_label} (₹{r.km_rate}/KM)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Distance (KM)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={simDistance}
                onChange={(e) => setSimDistance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Simulated Ref Demand</label>
              <input
                type="number"
                step="0.05"
                value={simRefDemand}
                onChange={(e) => setSimRefDemand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Simulated Today Demand</label>
              <input
                type="number"
                step="0.05"
                value={simTodayDemand}
                onChange={(e) => setSimTodayDemand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Pickup Location</label>
              <input
                type="text"
                value={simPickup}
                onChange={(e) => setSimPickup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Drop Location</label>
              <input
                type="text"
                value={simDrop}
                onChange={(e) => setSimDrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => runSimulation()}
              disabled={simLoading}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>{simLoading ? 'Calculating...' : 'Calculate Fare & Commission Split'}</span>
            </button>
          </div>

          {/* Simulation Output Area */}
          <div className="bg-slate-50/80 border border-dashed border-slate-300 rounded-xl p-4 sm:p-5">
            {simError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {simError}
              </div>
            )}

            {!simResult && !simLoading && !simError && (
              <div className="text-center py-6 text-slate-400">
                <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Click <strong>"Calculate Fare & Commission Split"</strong> or any test preset above to see instant breakdown.</p>
              </div>
            )}

            {simLoading && (
              <div className="text-center py-8 text-blue-600">
                <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold">Calculating fare & commission split with dynamic demand...</p>
              </div>
            )}

            {simResult && !simLoading && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    Live Simulation: {simResult.car_type} ({simResult.distance_km} KM)
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${simResult.dynamic_pricing?.is_active ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {simResult.dynamic_pricing?.is_active ? 'Dynamic Demand Active' : 'Static Base'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${simResult.company_share_breakdown?.is_active ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>
                      {simResult.company_share_breakdown?.is_active ? 'Share Active' : 'No Share'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${simResult.master_engine_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {simResult.master_engine_active ? 'Engine v2 Active' : 'Fallback'}
                    </span>
                  </div>
                </div>

                {/* Dynamic Rate Breakdown Strip */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Ref Demand</span>
                      <strong className="font-mono text-slate-800">{simResult.dynamic_pricing?.reference_demand || '1.0000'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Today's Demand</span>
                      <strong className="font-mono text-blue-600">{simResult.dynamic_pricing?.today_demand || '1.0000'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Demand Ratio</span>
                      <strong className="font-mono text-slate-800">{simResult.dynamic_pricing?.demand_ratio || '1.0000'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Demand Change</span>
                      <strong className={`font-mono ${(simResult.dynamic_pricing?.demand_change_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(simResult.dynamic_pricing?.demand_change_pct || 0) >= 0 ? '+' : ''}{simResult.dynamic_pricing?.demand_change_pct || 0}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Sensitivity</span>
                      <strong className="font-mono text-slate-800">{simResult.dynamic_pricing?.pricing_sensitivity || 50}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Price Adj %</span>
                      <strong className={`font-mono ${(simResult.dynamic_pricing?.price_adjustment_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {(simResult.dynamic_pricing?.price_adjustment_pct || 0) >= 0 ? '+' : ''}{simResult.dynamic_pricing?.price_adjustment_pct || 0}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Fare Line Items */}
                <div className="flex flex-col text-xs divide-y divide-slate-200/60">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Base KM Charge ({simResult.chargeable_km} KM @ ₹{simResult.km_rate}/KM):</span>
                    <span className="font-mono font-bold text-slate-900">₹{Number(simResult.base_km_charge || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Driver Allowance ({simResult.driver_allowance_active ? 'Active' : 'Disabled'}):</span>
                    <span className={`font-mono font-bold ${simResult.driver_allowance_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      ₹{Number(simResult.driver_allowance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Estimated Toll ({simResult.chargeable_km} KM):</span>
                    <span className={`font-mono font-bold ${simResult.toll_charge > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                      {simResult.toll_charge > 0 ? `₹${Number(simResult.toll_charge).toLocaleString('en-IN')}` : '₹0.00 (Toll Excluded)'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Parking Surcharge:</span>
                    <span className={`font-mono font-bold ${simResult.parking_charge > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                      {simResult.parking_charge > 0 ? `₹${Number(simResult.parking_charge).toLocaleString('en-IN')}` : '₹0.00 (No Parking)'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 bg-slate-100 px-2 rounded-lg font-bold text-slate-900">
                    <span>Pre-Tax Subtotal:</span>
                    <span className="font-mono">₹{Number(simResult.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Company Share & Driver Settlement Card */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-col gap-1.5 text-xs text-emerald-950">
                  <div className="flex justify-between items-center font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Revenue Split & Driver Settlement:
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      {simResult.company_share_breakdown?.type === 'fixed'
                        ? `Fixed ₹${simResult.company_share_breakdown?.value}`
                        : `${simResult.company_share_breakdown?.value}% ${simResult.company_share_breakdown?.basis === 'base_km' ? 'Base KM' : 'Subtotal'}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>🏢 Rentox Company Share:</span>
                    <strong className="font-mono text-blue-700">₹{Number(simResult.company_share_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>🚖 Driver / Partner Net Payout:</span>
                    <strong className="font-mono text-emerald-700">₹{Number(simResult.driver_payout_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 text-xs">
                  <span className="text-slate-500">GST / Tax ({simResult.gst_breakdown?.mode || 'Active'} - {simResult.gst_breakdown?.rate}%):</span>
                  <span className="font-mono font-bold text-rose-600">+ ₹{Number(simResult.gst_amount || 0).toLocaleString('en-IN')}</span>
                </div>

                {Number(simResult.discount_amount) > 0 && (
                  <div className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500">Promotional Discount:</span>
                    <span className="font-mono font-bold text-emerald-600">- ₹{Number(simResult.discount_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-300 text-base font-black text-blue-900">
                  <span>TOTAL CUSTOMER FARE:</span>
                  <span className="text-xl font-mono text-blue-700">₹{Number(simResult.final_fare || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* Plain-English Explanation Card */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-3 text-xs text-blue-900 mt-2">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Calculation Explanation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {simResult.dynamic_pricing?.explanation_text || 'Standard calculation.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: ADD / EDIT VEHICLE RULE ── */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-900">
                {vehicleModalIsEdit ? 'Edit Vehicle Rate' : 'Add Vehicle Rate'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicleRule} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Vehicle Category</label>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.car_type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Rate per KM (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={vehicleModalData.km_rate}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, km_rate: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Min Distance (KM)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={vehicleModalData.min_distance_km}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, min_distance_km: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Min Floor Rate ₹ (0 = Auto)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={vehicleModalData.min_rate}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, min_rate: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Max Ceiling Rate ₹ (0 = Auto)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={vehicleModalData.max_rate}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, max_rate: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Short Allowance (&lt; 200 KM)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={vehicleModalData.driver_allowance_short}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, driver_allowance_short: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Long Allowance (≥ 200 KM)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={vehicleModalData.driver_allowance_long}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, driver_allowance_long: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Threshold (KM)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={vehicleModalData.distance_threshold_km}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, distance_threshold_km: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Company Share % (0 = Global)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={vehicleModalData.company_share_percent}
                    onChange={(e) => setVehicleModalData(prev => ({ ...prev, company_share_percent: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={vehicleModalData.display_order}
                  onChange={(e) => setVehicleModalData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Audit Log History
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Changes (Before / After)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">No audit logs recorded yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{log.admin_id}</td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {log.action_type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] font-mono text-slate-600 break-all">
                          {log.new_value || log.changes || log.old_value || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
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
