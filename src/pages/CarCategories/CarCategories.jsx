import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Car,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Zap,
  Repeat,
  Clock,
  ShieldCheck,
  Info,
  Sparkles,
  Layers,
  IndianRupee,
  Save,
  X
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';

const PRESETS = {
  SEDAN: {
    car_type: 'SEDAN',
    oneway_km_rate: 14,
    oneway_base_amount: 1500,
    oneway_driver_rate: 12,
    round_km_rate: 13,
    round_allowance: 400,
    round_daily_limit: 300,
    local_base_amount: 2200,
    local_package_km: 80,
    local_package_hours: 8,
    local_extra_km: 15,
    local_extra_hour: 100
  },
  ERTIGA: {
    car_type: 'ERTIGA',
    oneway_km_rate: 17,
    oneway_base_amount: 2000,
    oneway_driver_rate: 15,
    round_km_rate: 16,
    round_allowance: 450,
    round_daily_limit: 300,
    local_base_amount: 2700,
    local_package_km: 80,
    local_package_hours: 8,
    local_extra_km: 18,
    local_extra_hour: 120
  },
  INNOVA: {
    car_type: 'INNOVA',
    oneway_km_rate: 19,
    oneway_base_amount: 2400,
    oneway_driver_rate: 17,
    round_km_rate: 18,
    round_allowance: 500,
    round_daily_limit: 300,
    local_base_amount: 3200,
    local_package_km: 80,
    local_package_hours: 8,
    local_extra_km: 20,
    local_extra_hour: 150
  },
  CRYSTA: {
    car_type: 'CRYSTA',
    oneway_km_rate: 22,
    oneway_base_amount: 2800,
    oneway_driver_rate: 19,
    round_km_rate: 20,
    round_allowance: 550,
    round_daily_limit: 300,
    local_base_amount: 3800,
    local_package_km: 80,
    local_package_hours: 8,
    local_extra_km: 24,
    local_extra_hour: 180
  },
  TEMPO_TRAVELLER: {
    car_type: 'TEMPO_TRAVELLER',
    oneway_km_rate: 28,
    oneway_base_amount: 4000,
    oneway_driver_rate: 24,
    round_km_rate: 26,
    round_allowance: 700,
    round_daily_limit: 300,
    local_base_amount: 5500,
    local_package_km: 80,
    local_package_hours: 8,
    local_extra_km: 30,
    local_extra_hour: 250
  }
};

const CarCategories = () => {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    car_type: '',
    oneway_km_rate: 14,
    oneway_base_amount: 1500,
    oneway_driver_rate: 12,
    oneway_gst: 5,
    oneway_agni: 2,
    round_km_rate: 13,
    round_allowance: 400,
    round_daily_limit: 300,
    round_gst: 5,
    round_agni: 2,
    local_base_amount: 2200,
    local_package_km: 80,
    local_package_hours: 8,
    local_extra_km: 15,
    local_extra_hour: 100,
    local_allowance: 300,
    local_driver_rate: 1900,
    local_gst: 5,
    local_agni: 300
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await axios.get(`${endpoints.carCategoryMaster}?action=get_all`, { timeout: 8000 });
      } catch (err) {
        res = await axios.get(`${endpoints.carCategoryMaster2025}?action=get_all`, { timeout: 8000 });
      }

      if (res.data && res.data.status === 'success') {
        setCategories(res.data.categories || []);
      } else {
        addToast(res.data?.message || 'Failed to load categories', 'error');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      addToast('Error loading fleet categories from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    return categories.filter(c => 
      c.car_type.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [categories, searchTerm]);

  const handleApplyPreset = (key) => {
    const preset = PRESETS[key];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        ...preset
      }));
      addToast(`Applied '${key}' preset values`, 'info');
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      car_type: '',
      oneway_km_rate: 14,
      oneway_base_amount: 1500,
      oneway_driver_rate: 12,
      oneway_gst: 5,
      oneway_agni: 2,
      round_km_rate: 13,
      round_allowance: 400,
      round_daily_limit: 300,
      round_gst: 5,
      round_agni: 2,
      local_base_amount: 2200,
      local_package_km: 80,
      local_package_hours: 8,
      local_extra_km: 15,
      local_extra_hour: 100,
      local_allowance: 300,
      local_driver_rate: 1900,
      local_gst: 5,
      local_agni: 300
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setModalMode('edit');
    setFormData({
      car_type: cat.car_type,
      oneway_km_rate: cat.oneway?.kmRate ?? 14,
      oneway_base_amount: cat.oneway?.baseAmount ?? 1500,
      oneway_driver_rate: cat.oneway?.driverRate ?? 12,
      oneway_gst: cat.oneway?.gstPercent ?? 5,
      oneway_agni: cat.oneway?.agni_share ?? 2,
      round_km_rate: cat.roundtrip?.kmRate ?? 13,
      round_allowance: cat.roundtrip?.driver_allowance ?? 400,
      round_daily_limit: cat.roundtrip?.daily_limit ?? 300,
      round_gst: cat.roundtrip?.gstPercent ?? 5,
      round_agni: cat.roundtrip?.agni_share ?? 2,
      local_base_amount: cat.localduty?.baseAmount ?? 2200,
      local_package_km: cat.localduty?.packageKm ?? 80,
      local_package_hours: cat.localduty?.packageHours ?? 8,
      local_extra_km: cat.localduty?.extraKMAmount ?? 15,
      local_extra_hour: cat.localduty?.extraHoursAmount ?? 100,
      local_allowance: cat.localduty?.driver_allowance ?? 300,
      local_driver_rate: cat.localduty?.driverRate ?? 1900,
      local_gst: cat.localduty?.gstPercent ?? 5,
      local_agni: cat.localduty?.agni_share ?? 300
    });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.car_type.trim()) {
      addToast('Please enter category name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        action: modalMode === 'add' ? 'add_category' : 'update_fares',
        ...formData,
        oneway: {
          kmRate: formData.oneway_km_rate,
          baseAmount: formData.oneway_base_amount,
          driverRate: formData.oneway_driver_rate,
          gstPercent: formData.oneway_gst,
          agni_share: formData.oneway_agni
        },
        roundtrip: {
          kmRate: formData.round_km_rate,
          driver_allowance: formData.round_allowance,
          daily_limit: formData.round_daily_limit,
          gstPercent: formData.round_gst,
          agni_share: formData.round_agni
        },
        localduty: {
          baseAmount: formData.local_base_amount,
          packageKm: formData.local_package_km,
          packageHours: formData.local_package_hours,
          extraKMAmount: formData.local_extra_km,
          extraHoursAmount: formData.local_extra_hour,
          driver_allowance: formData.local_allowance,
          driverRate: formData.local_driver_rate,
          gstPercent: formData.local_gst,
          agni_share: formData.local_agni
        }
      };

      let res;
      try {
        res = await axios.post(endpoints.carCategoryMaster, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (postErr) {
        res = await axios.post(endpoints.carCategoryMaster2025, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (res.data && res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: modalMode === 'add' ? 'Category Added!' : 'Fares Updated!',
          text: res.data.message || 'Category details saved successfully',
          timer: 2000,
          showConfirmButton: false
        });
        addToast(res.data.message, 'success');
        setIsModalOpen(false);
        fetchCategories();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Operation Failed',
          text: res.data?.message || 'Failed to save category details'
        });
        addToast(res.data?.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Failed to save category. Please check your network connection.'
      });
      addToast('Failed to save category. Please check connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    const nextStatus = cat.status === 'active' ? 'blocked' : 'active';
    const isBlocking = nextStatus === 'blocked';

    const result = await Swal.fire({
      title: `${isBlocking ? 'Block' : 'Activate'} Category?`,
      text: `Are you sure you want to ${isBlocking ? 'block' : 'activate'} category '${cat.car_type}'?`,
      icon: isBlocking ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: isBlocking ? '#EF4444' : '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${isBlocking ? 'Block' : 'Activate'}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      let res;
      try {
        res = await axios.post(endpoints.carCategoryMaster, {
          action: 'toggle_status',
          id: cat.id,
          status: nextStatus
        });
      } catch {
        res = await axios.post(endpoints.carCategoryMaster2025, {
          action: 'toggle_status',
          id: cat.id,
          status: nextStatus
        });
      }

      if (res.data && res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Category ${cat.car_type} is now ${nextStatus}`,
          timer: 1800,
          showConfirmButton: false
        });
        addToast(`Category ${cat.car_type} is now ${nextStatus}`, 'success');
        setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: nextStatus } : c));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: res.data?.message || 'Toggle failed'
        });
        addToast(res.data?.message || 'Toggle failed', 'error');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update category status'
      });
      addToast('Failed to update category status', 'error');
    }
  };

  const handleDelete = async (carType) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: `Are you sure you want to delete category '${carType}' and all its trip fares? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      let res;
      try {
        res = await axios.post(endpoints.carCategoryMaster, {
          action: 'delete_category',
          car_type: carType
        });
      } catch {
        res = await axios.post(endpoints.carCategoryMaster2025, {
          action: 'delete_category',
          car_type: carType
        });
      }

      if (res.data && res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: res.data.message || `Category ${carType} has been deleted.`,
          timer: 2000,
          showConfirmButton: false
        });
        addToast(res.data.message, 'success');
        fetchCategories();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: res.data?.message || 'Could not delete category'
        });
        addToast(res.data?.message || 'Delete failed', 'error');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete category. Please check connection.'
      });
      addToast('Failed to delete category', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#fff7ed',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Car style={{ width: '26px', height: '26px' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Car Categories & Fleet Master
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Manage vehicle types. Auto-synchronizes with Driver App Add Form and One-Way, Round-Trip & Local Duty Fares.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '9px 16px', fontSize: '0.8125rem' }}
            >
              <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>Add Car Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Live Sync Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        backgroundColor: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: '12px',
        padding: '14px 18px',
        fontSize: '0.8125rem',
        color: '#92400e'
      }}>
        <Info style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Zero Backend Changes Live Sync:</strong> When you add or edit a category here, it is automatically written to <code style={{ backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>car_categories</code> (so the Driver Mobile App Add Car dropdown immediately offers it) and <code style={{ backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>tripCostTable</code> (so Customer One-Way, Round-Trip, and Local Taxi searches can book it).
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid-4">
        <StatCard
          icon={Car}
          label="Total Fleet Categories"
          value={categories.length}
          color="warning"
          trend={`${categories.filter(c => c.status === 'active').length} Active Categories`}
        />
        <StatCard
          icon={Zap}
          label="One-Way Enabled"
          value={categories.filter(c => c.oneway !== null).length}
          color="warning"
          trend="Dynamic Distance Pricing"
        />
        <StatCard
          icon={Repeat}
          label="Round-Trip Enabled"
          value={categories.filter(c => c.roundtrip !== null).length}
          color="info"
          trend="Per-KM + Driver Allowance"
        />
        <StatCard
          icon={Clock}
          label="Local Duty Enabled"
          value={categories.filter(c => c.localduty !== null).length}
          color="success"
          trend="Package Base + Extra KM/Hr"
        />
      </div>

      {/* Table Container Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search category (e.g. SEDAN, ERTIGA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            <span>Direct Database Connection: <strong>car_categories & tripCostTable</strong></span>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Status</th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#d97706' }}>
                    <Zap style={{ width: '14px', height: '14px' }} /> One-Way Fare
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                    <Repeat style={{ width: '14px', height: '14px' }} /> Round-Trip Fare
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
                    <Clock style={{ width: '14px', height: '14px' }} /> Local Duty Fare
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#f59e0b' }} />
                    <div>Loading live categories from AWS...</div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No vehicle categories found. Click <strong>"Add Car Category"</strong> above to create one.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.car_type}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: '#fff7ed',
                          color: '#f59e0b',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem'
                        }}>
                          {cat.car_type.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem', letterSpacing: '0.02em' }}>
                            {cat.car_type}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                            ID: #{cat.id || 'Live'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          border: cat.status === 'active' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                          backgroundColor: cat.status === 'active' ? '#ecfdf5' : '#fef2f2',
                          color: cat.status === 'active' ? '#059669' : '#dc2626'
                        }}
                      >
                        {cat.status === 'active' ? '● Active' : '○ Blocked'}
                      </button>
                    </td>

                    {/* One-Way */}
                    <td>
                      {cat.oneway ? (
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                            ₹{cat.oneway.kmRate} <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#94a3b8' }}>/ km</span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                            Base: ₹{cat.oneway.baseAmount}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.75rem' }}>— Not Set —</span>
                      )}
                    </td>

                    {/* Round-Trip */}
                    <td>
                      {cat.roundtrip ? (
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                            ₹{cat.roundtrip.kmRate} <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#94a3b8' }}>/ km</span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                            Allowance: ₹{cat.roundtrip.driver_allowance} / day
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.75rem' }}>— Not Set —</span>
                      )}
                    </td>

                    {/* Local-Duty */}
                    <td>
                      {cat.localduty ? (
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                            ₹{cat.localduty.baseAmount}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                            {cat.localduty.packageHours}hr / {cat.localduty.packageKm}km (+₹{cat.localduty.extraKMAmount}/km)
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.75rem' }}>— Not Set —</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          title="Edit Fares"
                          style={{
                            padding: '6px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.car_type)}
                          title="Delete Category"
                          style={{
                            padding: '6px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
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

      {/* Modal: Add or Edit Car Category */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: '#ffffff',
              zIndex: 10
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                  {modalMode === 'add' ? 'Add New Car Category' : `Edit Category: ${formData.car_type}`}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Configure vehicle rates across One-Way, Round-Trip, and Local-Duty.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCategory} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Category Name & Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  CATEGORY NAME (UPPERCASE) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEDAN, ERTIGA, INNOVA, SUV..."
                  value={formData.car_type}
                  disabled={modalMode === 'edit'}
                  onChange={(e) => setFormData(prev => ({ ...prev, car_type: e.target.value.toUpperCase() }))}
                  className="form-input"
                  style={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: modalMode === 'edit' ? '#f1f5f9' : '#ffffff'
                  }}
                />

                {modalMode === 'add' && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles style={{ width: '12px', height: '12px', color: '#f59e0b' }} /> 1-Click Fast Presets:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.keys(PRESETS).map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleApplyPreset(k)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Trip 1: One-Way Rates */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 800, fontSize: '0.8125rem', marginBottom: '12px' }}>
                  <Zap style={{ width: '16px', height: '16px', color: '#f59e0b' }} /> 1. ONE-WAY TRIP FARES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Rate per KM (₹) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.oneway_km_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, oneway_km_rate: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Base Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.oneway_base_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, oneway_base_amount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Driver Rate (₹/km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.oneway_driver_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, oneway_driver_rate: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Trip 2: Round-Trip Rates */}
              <div style={{ backgroundColor: '#eef2ff', border: '1px solid #e0e7ff', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3730a3', fontWeight: 800, fontSize: '0.8125rem', marginBottom: '12px' }}>
                  <Repeat style={{ width: '16px', height: '16px', color: '#6366f1' }} /> 2. ROUND-TRIP FARES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Rate per KM (₹) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.round_km_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, round_km_rate: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Daily Allowance (₹)</label>
                    <input
                      type="number"
                      value={formData.round_allowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, round_allowance: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Min KM / Day</label>
                    <input
                      type="number"
                      value={formData.round_daily_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, round_daily_limit: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Trip 3: Local-Duty Rates */}
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 800, fontSize: '0.8125rem', marginBottom: '12px' }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#10b981' }} /> 3. LOCAL DUTY / LOCAL TAXI FARES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Package Base (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.local_base_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_base_amount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Package KM (e.g. 80)</label>
                    <input
                      type="number"
                      value={formData.local_package_km}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_package_km: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Package Hours (e.g. 8)</label>
                    <input
                      type="number"
                      value={formData.local_package_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_package_hours: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Extra KM Rate (₹)</label>
                    <input
                      type="number"
                      value={formData.local_extra_km}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_extra_km: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Extra Hour Rate (₹)</label>
                    <input
                      type="number"
                      value={formData.local_extra_hour}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_extra_hour: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Driver Allowance (₹)</label>
                    <input
                      type="number"
                      value={formData.local_allowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, local_allowance: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '9px 20px', fontSize: '0.8125rem' }}
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Create & Sync Category' : 'Update Fares'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarCategories;
