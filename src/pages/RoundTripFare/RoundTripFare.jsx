import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import {
  Repeat,
  Car,
  Save,
  RefreshCw,
  Edit2,
  CheckCircle2,
  IndianRupee,
  UserCheck,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const RoundTripFare = () => {
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingVehicleId, setSavingVehicleId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [modalRate, setModalRate] = useState('');
  const [modalAllowance, setModalAllowance] = useState('');

  // Fetch live rates from AWS
  const fetchFares = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${endpoints.roundtripFareManagement}?api=1&action=get_fares`);
      if (res.data?.status === 'success' && Array.isArray(res.data.vehicles)) {
        setVehicles(res.data.vehicles);
        setHasChanges(false);
      } else {
        addToast('Failed to parse Round-Trip vehicle fares.', 'error');
      }
    } catch (err) {
      console.error('Error fetching round-trip fares:', err);
      addToast('Error connecting to AWS round-trip fare API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
  }, []);

  // Fleet Statistics
  const stats = useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      return { total: 0, avgRate: 0, avgAllowance: 400, minRate: 0, maxRate: 0 };
    }
    const rates = vehicles.map(v => Number(v.kmRate) || 0);
    const allowances = vehicles.map(v => Number(v.driver_allowance) || 400);
    const sumRate = rates.reduce((a, b) => a + b, 0);
    const sumAllowance = allowances.reduce((a, b) => a + b, 0);

    return {
      total: vehicles.length,
      avgRate: (sumRate / rates.length).toFixed(2),
      avgAllowance: Math.round(sumAllowance / allowances.length),
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates)
    };
  }, [vehicles]);

  // Handle inline change for a vehicle
  const handleInlineChange = (id, field, value) => {
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === id) {
          return { ...v, [field]: value };
        }
        return v;
      })
    );
    setHasChanges(true);
  };

  // Save single vehicle
  const handleSaveSingle = async (vehicle) => {
    const kmRate = parseFloat(vehicle.kmRate);
    const driverAllowance = parseFloat(vehicle.driver_allowance);

    if (isNaN(kmRate) || kmRate <= 0) {
      addToast(`Invalid KM rate for ${vehicle.carType}`, 'error');
      return;
    }

    setSavingVehicleId(vehicle.id);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'update_rate');
      formData.append('carType', vehicle.carType);
      formData.append('kmRate', kmRate);
      formData.append('driver_allowance', driverAllowance);

      const res = await axios.post(`${endpoints.roundtripFareManagement}?api=1`, formData);
      if (res.data?.status === 'success') {
        addToast(`${vehicle.carType} updated: ₹${kmRate}/KM, Allowance ₹${driverAllowance}`, 'success');
      } else {
        addToast(res.data?.message || 'Update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast(`Failed to update ${vehicle.carType}`, 'error');
    } finally {
      setSavingVehicleId(null);
    }
  };

  // Bulk save all vehicles
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const payload = {
        action: 'bulk_update',
        vehicles: vehicles.map(v => ({
          carType: v.carType,
          kmRate: parseFloat(v.kmRate) || 0,
          driver_allowance: parseFloat(v.driver_allowance) || 0
        }))
      };

      const res = await axios.post(`${endpoints.roundtripFareManagement}?api=1`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data?.status === 'success') {
        addToast(res.data.message || 'All Round-Trip vehicle rates saved successfully!', 'success');
        setHasChanges(false);
      } else {
        addToast(res.data?.message || 'Bulk save failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving changes to AWS server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal
  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setModalRate(String(vehicle.kmRate));
    setModalAllowance(String(vehicle.driver_allowance));
  };

  // Save modal edit
  const handleSaveModal = async () => {
    if (!editingVehicle) return;
    const rateNum = parseFloat(modalRate);
    const allowNum = parseFloat(modalAllowance);

    if (isNaN(rateNum) || rateNum <= 0) {
      addToast('Vehicle rate per KM must be greater than 0', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'update_rate');
      formData.append('carType', editingVehicle.carType);
      formData.append('kmRate', rateNum);
      formData.append('driver_allowance', allowNum);

      const res = await axios.post(`${endpoints.roundtripFareManagement}?api=1`, formData);
      if (res.data?.status === 'success') {
        setVehicles(prev =>
          prev.map(v => v.id === editingVehicle.id ? { ...v, kmRate: rateNum, driver_allowance: allowNum } : v)
        );
        addToast(`${editingVehicle.carType} rates updated successfully!`, 'success');
        setEditingVehicle(null);
      } else {
        addToast(res.data?.message || 'Update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to save rates via modal', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.15)'
          }}>
            <Repeat style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Round-Trip Fare Management
              </h1>
              <Badge variant="live" text="AWS Live" />
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Configure Vehicle Rate (₹/KM) and Driver Allowance (₹/Day) for Outstation Round-Trip Journeys
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchFares}
            disabled={loading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.8125rem', fontWeight: 700 }}
          >
            <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Reload</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving || !hasChanges}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              opacity: (!hasChanges && !isSaving) ? 0.6 : 1,
              cursor: (!hasChanges && !isSaving) ? 'not-allowed' : 'pointer'
            }}
          >
            <Save style={{ width: '15px', height: '15px' }} />
            <span>{isSaving ? 'Saving to AWS...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Round-Trip Vehicles"
          value={stats.total}
          subtext="Active fleet categories in database"
          icon={Car}
          color="warning"
        />
        <StatCard
          label="Average Fleet Rate"
          value={`₹${stats.avgRate}/KM`}
          subtext={`Range: ₹${stats.minRate} - ₹${stats.maxRate}/KM`}
          icon={IndianRupee}
          color="info"
        />
        <StatCard
          label="Driver Allowance"
          value={`₹${stats.avgAllowance}/Day`}
          subtext="Standard outstation overnight allowance"
          icon={UserCheck}
          color="success"
        />
        <StatCard
          label="Minimum Daily Run"
          value="300 KM/Day"
          subtext="Standard minimum billing benchmark"
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Main Vehicle Rates Table Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Vehicle Rate & Driver Allowance Table
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
              Adjust the rate per kilometer and daily driver allowance below. Changes immediately impact customer quotes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            <span>Direct Database Connection: <strong>tripCostTable (Round-trip)</strong></span>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Vehicle Category
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Rate per KM (₹)
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Driver Allowance (₹ / Day)
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Minimum KM / Day
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Sample 2-Day Fare (600 KM)
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', color: '#f59e0b' }} />
                    <div>Loading Round-Trip vehicle configurations from AWS...</div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No Round-Trip vehicles found in tripCostTable.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => {
                  const rateNum = parseFloat(v.kmRate) || 0;
                  const allowNum = parseFloat(v.driver_allowance) || 0;
                  // Sample calculation: 600 KM (2 days * 300 KM) + 2 days allowance
                  const sampleFare = (600 * rateNum) + (2 * allowNum);
                  const isSavingThis = savingVehicleId === v.id;

                  return (
                    <tr key={v.id || v.carType} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}>
                      {/* Vehicle Category */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Car style={{ width: '20px', height: '20px' }} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                              {v.carType}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Outstation Round-Trip Fleet
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Rate / KM */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', maxWidth: '160px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#94a3b8', marginRight: '6px' }}>₹</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={v.kmRate}
                            onChange={(e) => handleInlineChange(v.id, 'kmRate', e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              outline: 'none',
                              fontSize: '0.9375rem',
                              fontWeight: 800,
                              color: '#0f172a'
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>/KM</span>
                        </div>
                      </td>

                      {/* Driver Allowance */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', maxWidth: '160px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#94a3b8', marginRight: '6px' }}>₹</span>
                          <input
                            type="number"
                            step="50"
                            min="0"
                            value={v.driver_allowance}
                            onChange={(e) => handleInlineChange(v.id, 'driver_allowance', e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              outline: 'none',
                              fontSize: '0.9375rem',
                              fontWeight: 800,
                              color: '#0f172a'
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>/Day</span>
                        </div>
                      </td>

                      {/* Minimum Daily Limit */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                          {v.kmPerDay || 300} KM / Day
                        </span>
                      </td>

                      {/* Sample Estimate */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#059669' }}>
                            ₹{sampleFare.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                            (600km × ₹{rateNum} + 2d × ₹{allowNum})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(v)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Open Edit Modal"
                          >
                            <Edit2 style={{ width: '13px', height: '13px' }} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSavingThis}
                            onClick={() => handleSaveSingle(v)}
                            style={{
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: isSavingThis ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)'
                            }}
                            title="Save this vehicle rate"
                          >
                            <Save style={{ width: '13px', height: '13px' }} />
                            <span>{isSavingThis ? 'Saving...' : 'Save'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Notice Card */}
      <div className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Info style={{ width: '20px', height: '20px', color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#15803d', margin: '0 0 4px 0' }}>
            Live Calculation Notice
          </h4>
          <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
            Whenever you adjust a vehicle's <strong>Rate per KM</strong> or <strong>Driver Allowance</strong>, the changes are written directly to AWS MySQL table <code>tripCostTable</code>. Customers searching for round-trip journeys on the Rentox website or mobile apps immediately receive quotes computed with these updated rates.
          </p>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editingVehicle && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Car style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Edit {editingVehicle.carType}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Round-Trip Fleet Configuration</span>
              </div>
            </div>

            {/* Field 1: Vehicle Rate */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Vehicle Rate per KM (₹)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#94a3b8', marginRight: '8px' }}>₹</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={modalRate}
                  onChange={(e) => setModalRate(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b' }}>/ KM</span>
              </div>
            </div>

            {/* Field 2: Driver Allowance */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Driver Allowance (₹ / Day)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#94a3b8', marginRight: '8px' }}>₹</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={modalAllowance}
                  onChange={(e) => setModalAllowance(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b' }}>/ Day</span>
              </div>
            </div>

            {/* Live Sample Calculation */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Sample 2-Day Trip (600 KM) Preview:
              </span>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#059669' }}>
                ₹{((parseFloat(modalRate) || 0) * 600 + (parseFloat(modalAllowance) || 0) * 2).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 16px', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveModal}
                style={{
                  flex: 1,
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundTripFare;
