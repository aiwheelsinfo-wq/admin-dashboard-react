import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge from '../../components/common/Badge';
import {
  Car,
  Clock,
  Zap,
  Save,
  RefreshCw,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  DollarSign,
  TrendingUp,
  Sliders,
  ChevronRight,
  Database,
  Building2,
  Wallet
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const LocalDutyFare = () => {
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dedicated Local-Duty Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    company_share_active: true,
    company_share_type: 'percent',
    company_share_value: 10.0,
    min_wallet_balance: 0.0
  });
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Live Simulator State
  const [simCarType, setSimCarType] = useState('Sedan');
  const [simKm, setSimKm] = useState(100); // 80km included, 20 extra
  const [simHours, setSimHours] = useState(10); // 8hr included, 2 extra

  // Fetch Local-Duty Fares and Dedicated Global Settings from AWS
  const fetchFares = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${endpoints.localdutyFareManagement}?action=get_fares&api=1`, {
        timeout: 10000
      });
      if (res.data && res.data.status === 'success') {
        setVehicles(res.data.vehicles || []);
        if (res.data.globalSettings) {
          setGlobalSettings(res.data.globalSettings);
        }
        setHasUnsavedChanges(false);
      } else {
        addToast(res.data?.message || 'Failed to fetch Local Duty fares', 'error');
      }
    } catch (err) {
      console.error('Error fetching Local Duty fares:', err);
      // Fallback defaults if offline
      setVehicles([
        { id: 7, carType: 'Sedan', baseAmount: 2200, extraKMAmount: 18, extraHoursAmount: 150, packageKm: 80, packageHours: 8, driver_allowance: 300, driverRate: 2000, gstPercent: 5.0 },
        { id: 8, carType: 'Ertiga', baseAmount: 2800, extraKMAmount: 20, extraHoursAmount: 200, packageKm: 80, packageHours: 8, driver_allowance: 300, driverRate: 2600, gstPercent: 5.0 },
        { id: 9, carType: 'Innova', baseAmount: 3200, extraKMAmount: 23, extraHoursAmount: 250, packageKm: 80, packageHours: 8, driver_allowance: 300, driverRate: 2900, gstPercent: 5.0 },
        { id: 10, carType: 'Crysta', baseAmount: 3300, extraKMAmount: 25, extraHoursAmount: 275, packageKm: 80, packageHours: 8, driver_allowance: 300, driverRate: 3000, gstPercent: 5.0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
  }, []);

  // Update field for a vehicle
  const handleFieldChange = (id, field, value) => {
    const num = parseFloat(value);
    const validVal = isNaN(num) ? 0 : num;
    setVehicles(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: validVal } : v))
    );
    setHasUnsavedChanges(true);
  };

  // Toggle vehicle active / blocked status for Local-Duty
  const handleToggleActive = async (vehicle) => {
    const isCurrentlyActive = (vehicle.is_active === 1 || vehicle.is_active === '1' || vehicle.is_active === true);
    const newStatus = !isCurrentlyActive;
    // Optimistic UI update
    setVehicles(prev =>
      prev.map(v => v.id === vehicle.id ? { ...v, is_active: newStatus } : v)
    );

    try {
      const res = await axios.post(
        endpoints.localdutyFareManagement,
        {
          action: 'toggle_active',
          carType: vehicle.carType,
          is_active: newStatus ? 1 : 0
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      if (res.data && res.data.status === 'success') {
        addToast(res.data.message, 'success');
      } else {
        // Rollback
        setVehicles(prev =>
          prev.map(v => v.id === vehicle.id ? { ...v, is_active: !newStatus } : v)
        );
        addToast(res.data?.message || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      console.error(err);
      // Rollback
      setVehicles(prev =>
        prev.map(v => v.id === vehicle.id ? { ...v, is_active: !newStatus } : v)
      );
      addToast(`Failed to toggle ${vehicle.carType}`, 'error');
    }
  };

  // Save single vehicle rate
  const handleSaveSingle = async (vehicle) => {
    setSavingId(vehicle.id);
    try {
      const res = await axios.post(
        endpoints.localdutyFareManagement,
        {
          action: 'update_rate',
          carType: vehicle.carType,
          baseAmount: vehicle.baseAmount,
          extraKMAmount: vehicle.extraKMAmount,
          extraHoursAmount: vehicle.extraHoursAmount,
          driver_allowance: vehicle.driver_allowance,
          driverRate: vehicle.driverRate
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      if (res.data && res.data.status === 'success') {
        addToast(`Updated ${vehicle.carType} successfully!`, 'success');
      } else {
        addToast(res.data?.message || `Failed to update ${vehicle.carType}`, 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Error updating rate', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Bulk save all vehicles
  const handleBulkSave = async () => {
    setIsBulkSaving(true);
    try {
      const res = await axios.post(
        endpoints.localdutyFareManagement,
        {
          action: 'bulk_update',
          vehicles: vehicles
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000
        }
      );

      if (res.data && res.data.status === 'success') {
        addToast('All Hourly Rental vehicle rates & driver allowances saved!', 'success');
        setHasUnsavedChanges(false);
      } else {
        addToast(res.data?.message || 'Failed to save all vehicles', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Error in bulk save', 'error');
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Save Dedicated Local-Duty Commission & Wallet Settings
  const handleSaveGlobalSettings = async () => {
    setSavingGlobal(true);
    try {
      const res = await axios.post(
        endpoints.localdutyFareManagement,
        {
          action: 'update_global_settings',
          company_share_active: globalSettings.company_share_active ? 1 : 0,
          company_share_type: globalSettings.company_share_type,
          company_share_value: parseFloat(globalSettings.company_share_value) || 10.0,
          min_wallet_balance: parseFloat(globalSettings.min_wallet_balance) || 0.0
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      if (res.data && res.data.status === 'success') {
        addToast('Hourly Rental platform commission & wallet threshold saved!', 'success');
        if (res.data.globalSettings) {
          setGlobalSettings(res.data.globalSettings);
        }
      } else {
        addToast(res.data?.message || 'Failed to update commission settings', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Error saving commission settings', 'error');
    } finally {
      setSavingGlobal(false);
    }
  };

  // Selected vehicle for simulator
  const activeSimVehicle = useMemo(() => {
    return vehicles.find(v => v.carType === simCarType) || vehicles[0] || {
      carType: 'Sedan',
      baseAmount: 2200,
      extraKMAmount: 18,
      extraHoursAmount: 150,
      packageKm: 80,
      packageHours: 8,
      driver_allowance: 300,
      driverRate: 2000
    };
  }, [vehicles, simCarType]);

  // Simulator Calculation
  const simResults = useMemo(() => {
    const pkgKm = activeSimVehicle.packageKm || 80;
    const pkgHours = activeSimVehicle.packageHours || 8;
    const baseAmt = activeSimVehicle.baseAmount || 0;
    const extraKmRate = activeSimVehicle.extraKMAmount || 0;
    const extraHrRate = activeSimVehicle.extraHoursAmount || 0;
    const allowance = activeSimVehicle.driver_allowance || 0;
    const driverBase = activeSimVehicle.driverRate || 0;

    const extraKm = Math.max(0, simKm - pkgKm);
    const extraHours = Math.max(0, simHours - pkgHours);

    const extraKmCost = extraKm * extraKmRate;
    const extraHoursCost = extraHours * extraHrRate;

    const subtotalCustomer = baseAmt + extraKmCost + extraHoursCost + allowance;
    const gstCustomer = Math.round(subtotalCustomer * 0.05);
    const totalCustomer = subtotalCustomer + gstCustomer;

    // Driver payout estimation
    const driverExtraKmCost = extraKm * (activeSimVehicle.extraKMAmountFroDriver || 15);
    const driverExtraHrCost = extraHours * (activeSimVehicle.extraHoursAmountForDriver || 100);
    const totalDriverPayout = driverBase + driverExtraKmCost + driverExtraHrCost + allowance;

    const companyMargin = totalCustomer - totalDriverPayout - gstCustomer;

    return {
      pkgKm,
      pkgHours,
      extraKm,
      extraHours,
      baseAmt,
      extraKmCost,
      extraHoursCost,
      allowance,
      subtotalCustomer,
      gstCustomer,
      totalCustomer,
      totalDriverPayout,
      companyMargin
    };
  }, [activeSimVehicle, simKm, simHours]);

  return (
    <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Operations</span>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D97706' }}>Hourly Rental Management</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Hourly Rental Fare & Driver Allowance
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Set standard package fares (80 KM / 8 Hours), extra KM/hour rates, and driver allowances across your fleet.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchFares}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            title="Reload live fares from AWS"
          >
            <RefreshCw style={{ width: '16px', height: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={handleBulkSave}
            disabled={isBulkSaving || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              backgroundColor: hasUnsavedChanges ? '#D97706' : '#0F172A',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#FFFFFF',
              cursor: isBulkSaving ? 'not-allowed' : 'pointer',
              boxShadow: hasUnsavedChanges ? '0 4px 12px rgba(217, 119, 6, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Save style={{ width: '16px', height: '16px' }} />
            <span>{isBulkSaving ? 'Saving All...' : hasUnsavedChanges ? 'Save All Changes *' : 'Save Fleet Fares'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Standard Package */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Package Standard</span>
            <div style={{ padding: '6px', backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#2563EB' }}>
              <Clock style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>80 KM / 8 Hours</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Default Local Rental baseline</div>
        </div>

        {/* Driver Allowance */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Driver Allowance</span>
            <div style={{ padding: '6px', backgroundColor: '#FEF3C7', borderRadius: '8px', color: '#D97706' }}>
              <DollarSign style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#D97706' }}>₹300 – ₹400</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Per local rental duty</div>
        </div>

        {/* Active Fleet Categories */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Fleet Categories</span>
            <div style={{ padding: '6px', backgroundColor: '#ECFDF5', borderRadius: '8px', color: '#059669' }}>
              <Car style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>{vehicles.length} Categories</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>Sedan, Ertiga, Innova, Crysta</div>
        </div>

        {/* Live Database Sync */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>AWS MySQL Target</span>
            <div style={{ padding: '6px', backgroundColor: '#F1F5F9', borderRadius: '8px', color: '#475569' }}>
              <Database style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>tripCostTable</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>● Live Sync Enabled</div>
        </div>
      </div>

      {/* Dedicated Rentox Platform Commission & Wallet Threshold Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#F5F3FF',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Rentox Platform Commission & Wallet Threshold
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Dedicated company margin & driver prepaid wallet balance check for Local-Duty
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Commission Active
              </label>
              <ToggleSwitch
                checked={Boolean(globalSettings.company_share_active)}
                onChange={(val) => setGlobalSettings(prev => ({ ...prev, company_share_active: val }))}
              />
            </div>

            <div style={{ minWidth: '130px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Type
              </label>
              <select
                value={globalSettings.company_share_type}
                onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_type: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  outline: 'none'
                }}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Fixed Flat (₹)</option>
              </select>
            </div>

            <div style={{ minWidth: '120px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Commission {globalSettings.company_share_type === 'percent' ? '(%)' : '(₹)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '5px 10px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B', marginRight: '6px' }}>
                  {globalSettings.company_share_type === 'percent' ? '%' : '₹'}
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={globalSettings.company_share_value}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, company_share_value: e.target.value }))}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}
                />
              </div>
            </div>

            <div style={{ minWidth: '140px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Min Wallet Balance (₹)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '5px 10px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B', marginRight: '6px' }}>₹</span>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={globalSettings.min_wallet_balance}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, min_wallet_balance: e.target.value }))}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveGlobalSettings}
              disabled={savingGlobal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: savingGlobal ? 'not-allowed' : 'pointer',
                marginTop: '16px'
              }}
            >
              <Save style={{ width: '15px', height: '15px' }} />
              <span>{savingGlobal ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Fleet Pricing Matrix (Full-Width with Big, Unclipped Rate Fields) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        padding: '28px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        marginBottom: '28px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                Vehicle Pricing & Driver Allowance Matrix
              </h2>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: '#D97706',
                backgroundColor: '#FEF3C7',
                padding: '3px 10px',
                borderRadius: '20px',
                textTransform: 'uppercase'
              }}>
                80 KM / 8 Hours Package
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '6px 0 0 0' }}>
              Adjust standard base fares, driver base payouts, daily allowances, and extra kilometer/hour charges. Changes take effect instantly.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: '#059669',
            backgroundColor: '#ECFDF5',
            padding: '7px 14px',
            borderRadius: '10px',
            border: '1px solid #A7F3D0',
            fontWeight: 600
          }}>
            <ShieldCheck style={{ width: '15px', height: '15px' }} />
            <span>Direct Database Connection: <strong>tripCostTable (Local-Duty)</strong></span>
          </div>
        </div>

        {/* Spacious Matrix Table */}
        <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
          <table style={{ width: '100%', minWidth: '1060px', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 14px', width: '220px' }}>Vehicle Category</th>
                <th style={{ padding: '10px 14px', width: '190px' }}>Base Fare (80km/8hr)</th>
                <th style={{ padding: '10px 14px', width: '170px' }}>Driver Base Payout</th>
                <th style={{ padding: '10px 14px', width: '160px' }}>Driver Allowance</th>
                <th style={{ padding: '10px 14px', width: '150px' }}>Extra KM (₹/km)</th>
                <th style={{ padding: '10px 14px', width: '150px' }}>Extra Hr (₹/hr)</th>
                <th style={{ padding: '10px 14px', width: '120px' }}>Status</th>
                <th style={{ padding: '10px 14px', width: '100px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    <RefreshCw style={{ width: '26px', height: '26px', animation: 'spin 1s linear infinite', margin: '0 auto 10px', color: '#D97706' }} />
                    <div style={{ fontWeight: 700 }}>Loading live Local Duty configurations from AWS...</div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No vehicle categories found for Local-Duty in tripCostTable.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr
                    key={v.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '14px',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* 1. Vehicle Category */}
                    <td style={{ padding: '16px 14px', borderRadius: '14px 0 0 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          backgroundColor: '#FFF7ED',
                          border: '1.5px solid #FED7AA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#D97706',
                          flexShrink: 0
                        }}>
                          <Car style={{ width: '22px', height: '22px' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
                            {v.carType}
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: '#64748B',
                            marginTop: '2px'
                          }}>
                            <span>ID: #{v.id}</span>
                            <span>•</span>
                            <span style={{ color: '#D97706' }}>80km/8hr</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Big Base Fare Input */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        maxWidth: '170px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#D97706',
                          fontWeight: 800,
                          backgroundColor: '#FFF7ED',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          marginRight: '8px',
                          flexShrink: 0
                        }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={v.baseAmount}
                          onChange={(e) => handleFieldChange(v.id, 'baseAmount', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: '#0F172A',
                            letterSpacing: '0.01em'
                          }}
                          placeholder="2200"
                        />
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px', paddingLeft: '2px' }}>
                        Customer Package Fare
                      </div>
                    </td>

                    {/* 3. Big Driver Base Payout Input (Editable!) */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #A7F3D0',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        maxWidth: '160px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#059669',
                          fontWeight: 800,
                          backgroundColor: '#ECFDF5',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          marginRight: '8px',
                          flexShrink: 0
                        }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={v.driverRate}
                          onChange={(e) => handleFieldChange(v.id, 'driverRate', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: '#047857'
                          }}
                          placeholder="1900"
                        />
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600, marginTop: '4px', paddingLeft: '2px' }}>
                        Driver Base Payout
                      </div>
                    </td>

                    {/* 4. Big Driver Allowance Input */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #FED7AA',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        maxWidth: '150px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#D97706',
                          fontWeight: 800,
                          backgroundColor: '#FEF3C7',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          marginRight: '8px',
                          flexShrink: 0
                        }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={v.driver_allowance}
                          onChange={(e) => handleFieldChange(v.id, 'driver_allowance', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: '#D97706'
                          }}
                          placeholder="300"
                        />
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#D97706', fontWeight: 600, marginTop: '4px', paddingLeft: '2px' }}>
                        Per Duty Day
                      </div>
                    </td>

                    {/* 5. Big Extra KM Rate Input */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        width: '100%',
                        maxWidth: '140px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                      }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 700, marginRight: '4px' }}>₹</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={v.extraKMAmount}
                          onChange={(e) => handleFieldChange(v.id, 'extraKMAmount', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: '#0F172A'
                          }}
                          placeholder="15"
                        />
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', marginLeft: '4px' }}>/km</span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px', paddingLeft: '2px' }}>
                        After 80 KM
                      </div>
                    </td>

                    {/* 6. Big Extra Hour Rate Input */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        width: '100%',
                        maxWidth: '140px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                      }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 700, marginRight: '4px' }}>₹</span>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={v.extraHoursAmount}
                          onChange={(e) => handleFieldChange(v.id, 'extraHoursAmount', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            color: '#0F172A'
                          }}
                          placeholder="100"
                        />
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', marginLeft: '4px' }}>/hr</span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px', paddingLeft: '2px' }}>
                        After 8 Hours
                      </div>
                    </td>

                    {/* 7. Status Toggle */}
                    <td style={{ padding: '16px 14px' }}>
                      {(() => {
                        const isActive = (v.is_active === 1 || v.is_active === '1' || v.is_active === true);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ToggleSwitch
                              checked={isActive}
                              onChange={() => handleToggleActive(v)}
                            />
                            <Badge variant={isActive ? 'green' : 'slate'}>
                              {isActive ? 'Active' : 'Blocked'}
                            </Badge>
                          </div>
                        );
                      })()}
                    </td>

                    {/* 8. Row Save Button */}
                    <td style={{ padding: '16px 14px', textAlign: 'right', borderRadius: '0 14px 14px 0' }}>
                      <button
                        onClick={() => handleSaveSingle(v)}
                        disabled={savingId === v.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          backgroundColor: savingId === v.id ? '#F1F5F9' : '#0F172A',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: savingId === v.id ? '#94A3B8' : '#FFFFFF',
                          cursor: savingId === v.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: savingId === v.id ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        title={`Save changes for ${v.carType}`}
                      >
                        <Save style={{ width: '13px', height: '13px' }} />
                        <span>{savingId === v.id ? 'Saving...' : 'Save'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend / Help Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          padding: '14px 18px',
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          fontSize: '0.8125rem',
          color: '#475569'
        }}>
          <Info style={{ width: '18px', height: '18px', color: '#D97706', flexShrink: 0 }} />
          <div>
            <strong>Standard Duty Package Rule:</strong> All vehicle rates apply to <strong>80 KM & 8 Hours</strong>. When a ride exceeds 80 km or 8 hours, the system automatically bills the extra kilometer rate and extra hour rate.
          </div>
        </div>
      </div>

      {/* 4. Interactive Duty Fare Testing Studio (Full-Width Studio Card) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        padding: '28px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calculator style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
              Interactive Duty Fare Testing Studio
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '3px 0 0 0' }}>
              Simulate any distance & duration scenario in real time to verify customer billing, driver payouts, and company margins.
            </p>
          </div>
        </div>

        {/* 3-Column Studio Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Column 1: Test Scenario Controls */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Scenario Configuration
            </div>

            {/* Vehicle Selection Pills */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>
                Select Vehicle Category:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSimCarType(v.carType)}
                    style={{
                      padding: '8px 14px',
                      border: simCarType === v.carType ? '2px solid #D97706' : '1px solid #CBD5E1',
                      backgroundColor: simCarType === v.carType ? '#FFF7ED' : '#FFFFFF',
                      color: simCarType === v.carType ? '#D97706' : '#334155',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {v.carType}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Total Trip Distance</span>
                <span style={{ fontWeight: 900, color: '#D97706', fontSize: '0.9375rem' }}>{simKm} KM</span>
              </div>
              <input
                type="range"
                min="40"
                max="250"
                step="5"
                value={simKm}
                onChange={(e) => setSimKm(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer', height: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                <span>80 km (Included in Package)</span>
                <span style={{ fontWeight: 700, color: simResults.extraKm > 0 ? '#D97706' : '#94A3B8' }}>
                  {simResults.extraKm > 0 ? `+${simResults.extraKm} Extra KM` : 'No Extra KM'}
                </span>
              </div>
            </div>

            {/* Duration Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Total Trip Duration</span>
                <span style={{ fontWeight: 900, color: '#D97706', fontSize: '0.9375rem' }}>{simHours} Hours</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={simHours}
                onChange={(e) => setSimHours(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer', height: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                <span>8 Hours (Included in Package)</span>
                <span style={{ fontWeight: 700, color: simResults.extraHours > 0 ? '#D97706' : '#94A3B8' }}>
                  {simResults.extraHours > 0 ? `+${simResults.extraHours} Extra Hours` : 'No Extra Time'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Customer Price Breakdown */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
              2. Customer Bill Breakdown
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#334155' }}>
                <span>Base Package (80km / 8hr)</span>
                <span style={{ fontWeight: 700 }}>₹{simResults.baseAmt.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#334155' }}>
                <span>Extra KM ({simResults.extraKm} km × ₹{activeSimVehicle.extraKMAmount})</span>
                <span style={{ fontWeight: 700 }}>₹{simResults.extraKmCost.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#334155' }}>
                <span>Extra Time ({simResults.extraHours} hr × ₹{activeSimVehicle.extraHoursAmount})</span>
                <span style={{ fontWeight: 700 }}>₹{simResults.extraHoursCost.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#D97706' }}>
                <span style={{ fontWeight: 700 }}>Driver Allowance (Per Duty)</span>
                <span style={{ fontWeight: 800 }}>₹{simResults.allowance.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748B' }}>
                <span>GST (5%)</span>
                <span>₹{simResults.gstCustomer.toLocaleString()}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '14px',
              borderTop: '1.5px dashed #CBD5E1',
              marginTop: '14px'
            }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', display: 'block' }}>Customer Total Fare</span>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Inclusive of GST & Allowance</span>
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.5rem', color: '#0F172A' }}>
                ₹{simResults.totalCustomer.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Column 3: Driver Payout & Company Margin Split */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
              3. Profit & Payout Split
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#047857' }}>
                <span>Driver Base Payout</span>
                <span style={{ fontWeight: 700 }}>₹{activeSimVehicle.driverRate?.toLocaleString() || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#047857' }}>
                <span>Driver Allowance</span>
                <span style={{ fontWeight: 700 }}>₹{simResults.allowance.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#047857' }}>
                <span>Driver Extra Distance / Time</span>
                <span style={{ fontWeight: 700 }}>
                  ₹{((simResults.totalDriverPayout || 0) - (activeSimVehicle.driverRate || 0) - (simResults.allowance || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Split Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <div style={{
                backgroundColor: '#ECFDF5',
                borderRadius: '10px',
                border: '1px solid #A7F3D0',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', display: 'block' }}>Estimated Driver Net</span>
                  <span style={{ fontSize: '0.6875rem', color: '#059669' }}>Transferred to driver wallet</span>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#065F46' }}>
                  ₹{simResults.totalDriverPayout.toLocaleString()}
                </span>
              </div>

              <div style={{
                backgroundColor: '#FFFBEB',
                borderRadius: '10px',
                border: '1px solid #FDE68A',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E', display: 'block' }}>Platform Margin</span>
                  <span style={{ fontSize: '0.6875rem', color: '#B45309' }}>Retained company revenue</span>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#92400E' }}>
                  ₹{simResults.companyMargin.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LocalDutyFare;
