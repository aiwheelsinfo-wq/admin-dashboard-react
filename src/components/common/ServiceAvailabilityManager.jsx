import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import {
  Car,
  Clock,
  Zap,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  Radio
} from 'lucide-react';

const serviceIcons = {
  local_taxi: Car,
  local_duty: Clock,
  one_way: Zap,
  round_trip: Repeat,
};

const serviceColors = {
  local_taxi: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', active: 'from-purple-600 to-indigo-600' },
  local_duty: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', active: 'from-amber-500 to-orange-500' },
  one_way: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', active: 'from-blue-600 to-cyan-600' },
  round_trip: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', active: 'from-emerald-600 to-teal-600' },
};

const ServiceAvailabilityManager = ({ compact = false, showHeader = true, title = "Trip Services Availability (Coming Soon Toggle)" }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [services, setServices] = useState({});
  const [expandedKey, setExpandedKey] = useState(null);
  const [editForms, setEditForms] = useState({});

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(endpoints.getServiceStatus);
      if (res.data?.success && res.data.services) {
        setServices(res.data.services);
        setEditForms(res.data.services);
      }
    } catch (err) {
      console.error("Failed to load service statuses:", err);
      addToast("Failed to load service statuses", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, currentStatus) => {
    const newStatus = !currentStatus;
    // Optimistic update
    setServices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        is_enabled: newStatus
      }
    }));

    try {
      setSavingKey(key);
      const res = await axios.post(endpoints.updateServiceStatus, {
        service_key: key,
        is_enabled: newStatus ? 1 : 0
      });
      if (res.data?.success) {
        addToast(
          `${services[key]?.service_name || key} is now ${newStatus ? 'ACTIVE' : 'COMING SOON'}`,
          newStatus ? 'success' : 'info'
        );
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      // Revert on error
      setServices(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          is_enabled: currentStatus
        }
      }));
      addToast(`Error updating ${key}: ${err.message}`, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveDetails = async (key) => {
    const form = editForms[key];
    if (!form) return;

    try {
      setSavingKey(key);
      const res = await axios.post(endpoints.updateServiceStatus, {
        service_key: key,
        coming_soon_title: form.coming_soon_title,
        coming_soon_message: form.coming_soon_message,
        badge_text: form.badge_text
      });
      if (res.data?.success) {
        setServices(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            coming_soon_title: form.coming_soon_title,
            coming_soon_message: form.coming_soon_message,
            badge_text: form.badge_text
          }
        }));
        setExpandedKey(null);
        addToast(`Updated Coming Soon message for ${services[key]?.service_name}`, "success");
      }
    } catch (err) {
      addToast(`Error: ${err.message}`, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const serviceOrder = ['local_taxi', 'local_duty', 'one_way', 'round_trip'];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 text-brandAmber animate-spin mr-3" />
        <span className="text-sm font-medium text-slate-500">Loading service availability...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {showHeader && (
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Toggle any trip service ON (Active) or OFF (Coming Soon). When disabled, Web and Flutter apps display a "Coming Soon" badge and block booking forms.
            </p>
          </div>
          <button
            onClick={fetchServices}
            className="text-xs font-semibold text-slate-600 hover:text-brandAmber px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brandAmber transition-colors"
          >
            Refresh Status
          </button>
        </div>
      )}

      <div className={`p-6 ${compact ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'}`}>
        {serviceOrder.map((key) => {
          const item = services[key] || { service_key: key, service_name: key, is_enabled: true };
          const IconComponent = serviceIcons[key] || Car;
          const styling = serviceColors[key] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', active: 'from-slate-700 to-slate-900' };
          const isEnabled = !!item.is_enabled;
          const isSaving = savingKey === key;
          const isExpanded = expandedKey === key;

          return (
            <div
              key={key}
              className={`relative rounded-2xl border transition-all duration-200 ${
                isEnabled
                  ? 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20 shadow-sm'
                  : 'border-amber-200 bg-gradient-to-b from-white to-amber-50/20 shadow-sm'
              }`}
            >
              <div className="p-5">
                {/* Header row: Icon & Status Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${styling.bg} ${styling.text} border ${styling.border}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isEnabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {item.badge_text || 'Coming Soon'}
                      </>
                    )}
                  </span>
                </div>

                {/* Service Name */}
                <h4 className="font-bold text-slate-800 text-base mb-1">{item.service_name}</h4>
                <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                  {isEnabled
                    ? 'Service is live and accepting customer bookings.'
                    : (item.coming_soon_message || 'Displays "Coming Soon" on app & website.')}
                </p>

                {/* Main Action Toggle Switch */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {isEnabled ? 'Live on App' : 'Set to Coming Soon'}
                  </span>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleToggle(key, isEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Customize Button */}
                <div className="mt-3 pt-2 text-center">
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700 inline-flex items-center gap-1 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    {isExpanded ? 'Hide Details' : 'Edit Coming Soon Text'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expandable Coming Soon Config Drawer */}
              {isExpanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={editForms[key]?.badge_text || ''}
                      onChange={(e) => setEditForms(prev => ({ ...prev, [key]: { ...prev[key], badge_text: e.target.value } }))}
                      placeholder="Coming Soon"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brandAmber"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Header Title
                    </label>
                    <input
                      type="text"
                      value={editForms[key]?.coming_soon_title || ''}
                      onChange={(e) => setEditForms(prev => ({ ...prev, [key]: { ...prev[key], coming_soon_title: e.target.value } }))}
                      placeholder="Coming Soon"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brandAmber"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Description Message
                    </label>
                    <textarea
                      rows={2}
                      value={editForms[key]?.coming_soon_message || ''}
                      onChange={(e) => setEditForms(prev => ({ ...prev, [key]: { ...prev[key], coming_soon_message: e.target.value } }))}
                      placeholder="We are expanding to this route soon..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brandAmber resize-none"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveDetails(key)}
                    disabled={isSaving}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Text
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceAvailabilityManager;
