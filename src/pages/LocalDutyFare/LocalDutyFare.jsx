import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
  Database
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

  // Live Simulator State
  const [simCarType, setSimCarType] = useState('Sedan');
  const [simKm, setSimKm] = useState(100); // 80km included, 20 extra
  const [simHours, setSimHours] = useState(10); // 8hr included, 2 extra

  // Fetch Local-Duty Fares from AWS
  const fetchFares = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${endpoints.localdutyFareManagement}?action=get_fares&api=1`, {
        timeout: 10000
      });
      if (res.data && res.data.status === 'success') {
        setVehicles(res.data.vehicles || []);
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
        addToast('All Local Duty vehicle rates & driver allowances saved!', 'success');
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
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D97706' }}>Local Duty Management</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Local Duty Fare & Driver Allowance
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

      {/* 3. Main Fleet Pricing Grid & Simulator Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(450px, 1.6fr) minmax(320px, 1fr)',
        gap: '24px'
      }}>
        
        {/* Left Column: Editable Rates Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Vehicle Pricing & Driver Allowance Matrix
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Directly adjust base package price, extra km/hour charges, and driver allowance.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Vehicle Category</th>
                  <th style={{ padding: '8px 12px' }}>Base Fare (80km/8hr)</th>
                  <th style={{ padding: '8px 12px' }}>Driver Allowance</th>
                  <th style={{ padding: '8px 12px' }}>Extra KM (₹)</th>
                  <th style={{ padding: '8px 12px' }}>Extra Hr (₹)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Vehicle Category & Badge */}
                    <td style={{ padding: '14px 12px', borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: '#FFF7ED',
                          border: '1px solid #FED7AA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#D97706',
                          flexShrink: 0
                        }}>
                          <Car style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
                            {v.carType}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            Driver Base: ₹{v.driverRate}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Base Fare Input */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        maxWidth: '120px'
                      }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>₹</span>
                        <input
                          type="number"
                          value={v.baseAmount}
                          onChange={(e) => handleFieldChange(v.id, 'baseAmount', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#0F172A'
                          }}
                        />
                      </div>
                    </td>

                    {/* Driver Allowance Input */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #F59E0B',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        maxWidth: '110px'
                      }}>
                        <span style={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 700, marginRight: '4px' }}>₹</span>
                        <input
                          type="number"
                          value={v.driver_allowance}
                          onChange={(e) => handleFieldChange(v.id, 'driver_allowance', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 800,
                            color: '#D97706'
                          }}
                        />
                      </div>
                    </td>

                    {/* Extra KM Rate */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        maxWidth: '85px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', marginRight: '4px' }}>₹</span>
                        <input
                          type="number"
                          value={v.extraKMAmount}
                          onChange={(e) => handleFieldChange(v.id, 'extraKMAmount', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: '#0F172A'
                          }}
                        />
                      </div>
                    </td>

                    {/* Extra Hour Rate */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        maxWidth: '85px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', marginRight: '4px' }}>₹</span>
                        <input
                          type="number"
                          value={v.extraHoursAmount}
                          onChange={(e) => handleFieldChange(v.id, 'extraHoursAmount', e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: '#0F172A'
                          }}
                        />
                      </div>
                    </td>

                    {/* Row Save Button */}
                    <td style={{ padding: '14px 12px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                      <button
                        onClick={() => handleSaveSingle(v)}
                        disabled={savingId === v.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          cursor: savingId === v.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Save changes for ${v.carType}`}
                      >
                        {savingId === v.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Legend / Note */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '18px',
            padding: '12px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            fontSize: '0.8125rem',
            color: '#64748B'
          }}>
            <Info style={{ width: '16px', height: '16px', color: '#D97706', flexShrink: 0 }} />
            <span>
              All package fares apply to <strong>80 KM & 8 Hours</strong>. When a trip exceeds either limit, extra KM or extra hour rates are automatically added.
            </span>
          </div>
        </div>

        {/* Right Column: Live Duty Fare Simulator */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Live Duty Fare Simulator
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Test any distance & duration scenario in real time
              </p>
            </div>
          </div>

          {/* Vehicle Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Select Vehicle Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSimCarType(v.carType)}
                  style={{
                    padding: '8px 4px',
                    border: simCarType === v.carType ? '2px solid #D97706' : '1px solid #E2E8F0',
                    backgroundColor: simCarType === v.carType ? '#FFF7ED' : '#F8FAFC',
                    color: simCarType === v.carType ? '#D97706' : '#475569',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {v.carType}
                </button>
              ))}
            </div>
          </div>

          {/* Test Distance Slider */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Total Trip Distance</span>
              <span style={{ fontWeight: 800, color: '#D97706' }}>{simKm} KM</span>
            </div>
            <input
              type="range"
              min="40"
              max="250"
              step="5"
              value={simKm}
              onChange={(e) => setSimKm(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8' }}>
              <span>80 km (Package)</span>
              <span>{simResults.extraKm > 0 ? `+${simResults.extraKm} Extra KM` : 'No Extra KM'}</span>
            </div>
          </div>

          {/* Test Duration Slider */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Total Trip Duration</span>
              <span style={{ fontWeight: 800, color: '#D97706' }}>{simHours} Hours</span>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              step="1"
              value={simHours}
              onChange={(e) => setSimHours(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94A3B8' }}>
              <span>8 Hours (Package)</span>
              <span>{simResults.extraHours > 0 ? `+${simResults.extraHours} Extra Hours` : 'No Extra Time'}</span>
            </div>
          </div>

          {/* Live Bill Breakdown Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
              Customer Fare Calculation
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px', color: '#334155' }}>
              <span>Base Package (80km / 8hr)</span>
              <span style={{ fontWeight: 700 }}>₹{simResults.baseAmt.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px', color: '#334155' }}>
              <span>Extra KM ({simResults.extraKm} km × ₹{activeSimVehicle.extraKMAmount})</span>
              <span style={{ fontWeight: 700 }}>₹{simResults.extraKmCost.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px', color: '#334155' }}>
              <span>Extra Time ({simResults.extraHours} hr × ₹{activeSimVehicle.extraHoursAmount})</span>
              <span style={{ fontWeight: 700 }}>₹{simResults.extraHoursCost.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px', color: '#D97706' }}>
              <span style={{ fontWeight: 700 }}>Driver Allowance (Per Duty)</span>
              <span style={{ fontWeight: 800 }}>₹{simResults.allowance.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '10px', color: '#64748B' }}>
              <span>GST (5%)</span>
              <span>₹{simResults.gstCustomer.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '10px',
              borderTop: '1.5px dashed #CBD5E1'
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>Estimated Customer Total</span>
              <span style={{ fontWeight: 900, fontSize: '1.35rem', color: '#0F172A' }}>
                ₹{simResults.totalCustomer.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Driver Payout & Company Share Split */}
          <div style={{
            backgroundColor: '#ECFDF5',
            borderRadius: '12px',
            border: '1px solid #A7F3D0',
            padding: '14px',
            marginTop: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>Estimated Driver Net Payout</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#065F46' }}>
                ₹{simResults.totalDriverPayout.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#059669' }}>
              Includes Base (₹{activeSimVehicle.driverRate}) + Allowance (₹{activeSimVehicle.driver_allowance}) + Extra distance/hours
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LocalDutyFare;
