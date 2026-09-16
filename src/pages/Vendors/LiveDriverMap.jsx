import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  MapPin,
  Car,
  Search,
  RefreshCw,
  Phone,
  Clock,
  Building2,
  Users,
  Eye,
  Crosshair,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { endpoints } from '../../config/api';

const LiveDriverMap = ({ vendors = [], initialSelectedVendorPhone = null }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const infoWindowRef = useRef(null);

  // Data states
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter states
  const [selectedVendorFilter, setSelectedVendorFilter] = useState(initialSelectedVendorPhone || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'ACTIVE_TODAY'
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [isRosterOpen, setIsRosterOpen] = useState(true);

  // Vendor Lookup Map (by phone number)
  const vendorLookup = useMemo(() => {
    const map = {};
    vendors.forEach((v) => {
      const phone = (v.vendor_phone || v.phone_number || '').trim();
      if (phone) {
        map[phone] = v.agency_name || v.vendor_name || `Partner (${phone})`;
      }
    });
    return map;
  }, [vendors]);

  // Fetch Drivers Telemetry
  const fetchDriverLocations = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await axios.get(endpoints.driverListAgni, { timeout: 15000 });
      if (res.data && Array.isArray(res.data.driversdata)) {
        // Filter out drivers with invalid / 0 coordinates
        const validDrivers = res.data.driversdata.filter((d) => {
          const lat = parseFloat(d.latitude);
          const lng = parseFloat(d.longitude);
          return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        });

        setDrivers(validDrivers);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch live driver locations:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // Initial Load and Auto-Refresh Interval
  useEffect(() => {
    fetchDriverLocations();

    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDriverLocations(false);
      }, 15000); // 15 seconds live polling
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Determine if driver is considered "online" based on timestamp
  const getDriverActivity = (timestampStr) => {
    if (!timestampStr || timestampStr === '0000-00-00 00:00:00') {
      return { isRecent: false, label: 'Offline / Inactive', color: '#94A3B8' };
    }

    try {
      const lastPing = new Date(timestampStr.replace(/-/g, '/'));
      const now = new Date();
      const diffMinutes = Math.floor((now - lastPing) / (1000 * 60));

      if (diffMinutes <= 30) {
        return { isRecent: true, label: 'Online (< 30m)', color: '#10B981', isLive: true };
      } else if (diffMinutes <= 180) {
        return { isRecent: true, label: 'Active Today', color: '#F59E0B', isLive: false };
      } else {
        return { isRecent: false, label: 'Idle / Offline', color: '#64748B', isLive: false };
      }
    } catch {
      return { isRecent: false, label: 'Offline', color: '#94A3B8' };
    }
  };

  // Filtered drivers based on vendor, search, and status
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      // 1. Vendor Filter
      if (selectedVendorFilter !== 'ALL') {
        const owner = (d.owner_id || '').trim();
        if (owner !== selectedVendorFilter) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const act = getDriverActivity(d.timestamp);
        if (statusFilter === 'ONLINE' && !act.isLive) return false;
        if (statusFilter === 'ACTIVE_TODAY' && !act.isRecent) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (d.full_name || '').toLowerCase();
        const phone = (d.phone_number || '').toLowerCase();
        const plate = (d.vehicle_number || '').toLowerCase();
        const car = (d.car_name || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || plate.includes(q) || car.includes(q);
      }

      return true;
    });
  }, [drivers, selectedVendorFilter, statusFilter, searchQuery]);

  // Helper to format timestamps nicely
  const formatTimestamp = (ts) => {
    if (!ts || ts === '0000-00-00 00:00:00') return 'No recent GPS ping';
    try {
      const d = new Date(ts.replace(/-/g, '/'));
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return ts;
    }
  };

  // Build Info Window HTML Content
  const createInfoWindowContent = (driver) => {
    const activity = getDriverActivity(driver.timestamp);
    const vendorName = vendorLookup[driver.owner_id] || (driver.owner_id ? `Vendor (${driver.owner_id})` : 'Independent / Direct Fleet');
    const carModel = driver.car_name || driver.driver_vehicle_name || 'Vehicle Assigned';
    const plate = driver.vehicle_number || 'Plate Pending';

    return `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 12px 14px; max-width: 280px; color: #0F172A; line-height: 1.4;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
          <div style="font-weight: 800; font-size: 15px; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${driver.full_name || 'Driver Partner'}
          </div>
          <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: ${activity.color}15; color: ${activity.color}; border: 1px solid ${activity.color}30; white-space: nowrap;">
            ${activity.label}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; margin-bottom: 6px;">
          <span style="font-weight: 600;">📞 Phone:</span>
          <a href="tel:${driver.phone_number}" style="color: #2563EB; text-decoration: none; font-weight: 700;">
            ${driver.phone_number || 'N/A'}
          </a>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 10px; margin: 8px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #1E293B;">
            🚗 ${carModel}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #2563EB; margin-top: 2px;">
            🆔 ${plate}
          </div>
        </div>

        <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">
          <strong>🏢 Partner Agency:</strong> ${vendorName}
        </div>

        <div style="font-size: 10px; color: #94A3B8; margin-top: 8px; border-top: 1px solid #F1F5F9; padding-top: 6px;">
          ⏱️ Last GPS: ${formatTimestamp(driver.timestamp)}
        </div>
      </div>
    `;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.15, lng: 73.5 }, // Default Maharashtra / Mumbai-Pune central region
        zoom: 7,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, []);

  // Update Markers on Map when filteredDrivers or drivers change
  useEffect(() => {
    if (!mapInstance.current || !window.google || !window.google.maps) return;

    const bounds = new window.google.maps.LatLngBounds();
    const currentActiveIds = new Set();
    let hasValidPoints = false;

    filteredDrivers.forEach((driver) => {
      const lat = parseFloat(driver.latitude);
      const lng = parseFloat(driver.longitude);
      const id = String(driver.driver_id || driver.phone_number);

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      currentActiveIds.add(id);
      const pos = { lat, lng };
      bounds.extend(pos);
      hasValidPoints = true;

      const activity = getDriverActivity(driver.timestamp);
      const isSelected = selectedDriverId === id;

      // Custom Car Marker SVG Icon
      const pinColor = isSelected ? '#F59E0B' : activity.isLive ? '#10B981' : activity.isRecent ? '#3B82F6' : '#64748B';
      const markerScale = isSelected ? 1.3 : 1.0;

      // Inline SVG Icon for crystal-sharp rendering
      const svgIcon = {
        path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
        fillColor: pinColor,
        fillOpacity: 1.0,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 1.2 * markerScale,
        anchor: new window.google.maps.Point(12, 12)
      };

      if (markersRef.current[id]) {
        // Update existing marker position & icon
        const marker = markersRef.current[id];
        marker.setPosition(pos);
        marker.setIcon(svgIcon);
        marker.driverData = driver;
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position: pos,
          map: mapInstance.current,
          title: driver.full_name || `Driver ${driver.phone_number}`,
          icon: svgIcon
        });

        marker.driverData = driver;

        marker.addListener('click', () => {
          setSelectedDriverId(id);
          infoWindowRef.current.setContent(createInfoWindowContent(driver));
          infoWindowRef.current.open(mapInstance.current, marker);
        });

        markersRef.current[id] = marker;
      }
    });

    // Remove markers that are filtered out
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentActiveIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Auto-fit bounds if we have points and user just selected a vendor filter
    if (hasValidPoints && (selectedVendorFilter !== 'ALL' || filteredDrivers.length <= 10)) {
      mapInstance.current.fitBounds(bounds, 80);
      const listener = window.google.maps.event.addListener(mapInstance.current, 'idle', () => {
        if (mapInstance.current.getZoom() > 15) {
          mapInstance.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [filteredDrivers, selectedDriverId]);

  // Focus directly on a driver on click from roster
  const focusOnDriver = (driver) => {
    const id = String(driver.driver_id || driver.phone_number);
    setSelectedDriverId(id);

    const lat = parseFloat(driver.latitude);
    const lng = parseFloat(driver.longitude);

    if (mapInstance.current && !isNaN(lat) && !isNaN(lng)) {
      const pos = { lat, lng };
      mapInstance.current.panTo(pos);
      mapInstance.current.setZoom(16);

      if (markersRef.current[id] && infoWindowRef.current) {
        infoWindowRef.current.setContent(createInfoWindowContent(driver));
        infoWindowRef.current.open(mapInstance.current, markersRef.current[id]);
      }
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    let liveOnline = 0;
    let activeToday = 0;
    drivers.forEach((d) => {
      const act = getDriverActivity(d.timestamp);
      if (act.isLive) liveOnline++;
      if (act.isRecent) activeToday++;
    });
    return {
      totalTracked: drivers.length,
      liveOnline,
      activeToday,
      filteredCount: filteredDrivers.length
    };
  }, [drivers, filteredDrivers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner & Control Center */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Row 1: Title, KPI Tags & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Compass style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Live Fleet Radar & Driver Tracking
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 6px #10B981'
                    }}
                  />
                  LIVE GPS
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Monitor real-time GPS locations, active duty partners, and transport agency fleet deployment across India.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Refresh Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '0.8125rem'
              }}
            >
              <Car style={{ width: '15px', height: '15px', color: '#2563EB' }} />
              <span style={{ color: '#64748B' }}>Plotted:</span>
              <strong style={{ color: '#0F172A' }}>{metrics.filteredCount} / {metrics.totalTracked}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                fontSize: '0.8125rem'
              }}
            >
              <CheckCircle2 style={{ width: '15px', height: '15px', color: '#059669' }} />
              <span style={{ color: '#065F46' }}>Online (&lt;30m):</span>
              <strong style={{ color: '#047857' }}>{metrics.liveOnline}</strong>
            </div>

            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: autoRefresh ? '1px solid #10B981' : '1px solid #CBD5E1',
                backgroundColor: autoRefresh ? '#F0FDF4' : '#F8FAFC',
                color: autoRefresh ? '#15803D' : '#64748B',
                cursor: 'pointer'
              }}
              title={autoRefresh ? 'Auto-refresh active (every 15s)' : 'Auto-refresh paused'}
            >
              <Clock style={{ width: '13px', height: '13px' }} />
              <span>{autoRefresh ? 'Auto 15s' : 'Paused'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchDriverLocations(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <RefreshCw
                style={{
                  width: '14px',
                  height: '14px',
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
              <span>{refreshing ? 'Updating...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search, Vendor Dropdown & Activity Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '10px',
            borderTop: '1px solid #F1F5F9'
          }}
        >
          {/* Vendor Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px', flex: '1 1 260px' }}>
            <Building2 style={{ width: '16px', height: '16px', color: '#64748B' }} />
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="ALL">🏢 All Transport Vendors & Agencies ({vendors.length})</option>
              {vendors.map((v) => {
                const phone = v.vendor_phone || v.phone_number;
                return (
                  <option key={phone} value={phone}>
                    {v.agency_name ? `${v.agency_name} (${v.vendor_name})` : v.vendor_name || phone}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search by Driver / Plate */}
          <div style={{ position: 'relative', flex: '2 1 280px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '15px',
                height: '15px',
                color: '#94A3B8'
              }}
            />
            <input
              type="text"
              placeholder="Search driver name, phone, plate (e.g. MH01, Sedan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Activity Status Filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'All Fleet' },
              { id: 'ONLINE', label: '🟢 Online Only' },
              { id: 'ACTIVE_TODAY', label: '🟡 Active Today' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === tab.id ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: statusFilter === tab.id ? '#EFF6FF' : '#FFFFFF',
                  color: statusFilter === tab.id ? '#1D4ED8' : '#64748B'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle Roster Drawer Button */}
          <button
            onClick={() => setIsRosterOpen(!isRosterOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              border: '1px solid #E2E8F0',
              backgroundColor: isRosterOpen ? '#F1F5F9' : '#FFFFFF',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <Users style={{ width: '15px', height: '15px' }} />
            <span>{isRosterOpen ? 'Hide Roster' : 'Show Roster'} ({filteredDrivers.length})</span>
          </button>
        </div>
      </div>

      {/* Main Map & Roster Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isRosterOpen ? '1fr 340px' : '1fr',
          gap: '16px',
          height: '650px',
          minHeight: '600px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Google Map Viewport */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#E2E8F0',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: '#2563EB',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                Connecting to live driver satellites & telemetry...
              </span>
            </div>
          )}

          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Map Legend Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.6875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              zIndex: 5
            }}
          >
            <span style={{ fontWeight: 800, color: '#0F172A' }}>LEGEND:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Online (&lt;30m)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
              Active Today
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748B' }} />
              Idle / Standby
            </span>
          </div>
        </div>

        {/* Collapsible Driver Roster Side Panel */}
        {isRosterOpen && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}
          >
            {/* Roster Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                  Matching Drivers ({filteredDrivers.length})
                </span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Click to zoom</span>
            </div>

            {/* Roster Scroll List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {filteredDrivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                  <Car style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B' }}>No drivers match this filter</p>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>Try clearing the search or selecting "All Vendors".</p>
                </div>
              ) : (
                filteredDrivers.map((driver) => {
                  const id = String(driver.driver_id || driver.phone_number);
                  const isSelected = selectedDriverId === id;
                  const activity = getDriverActivity(driver.timestamp);
                  const vendorName = vendorLookup[driver.owner_id] || (driver.owner_id ? `Vendor (${driver.owner_id})` : 'Direct Partner');

                  return (
                    <div
                      key={id}
                      onClick={() => focusOnDriver(driver)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: isSelected ? '#1E40AF' : '#0F172A' }}>
                          {driver.full_name || 'Driver Partner'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: `${activity.color}15`,
                            color: activity.color
                          }}
                        >
                          {activity.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px' }}>
                        📞 {driver.phone_number}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B' }}>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>
                          🚗 {driver.vehicle_number || driver.car_name || 'Vehicle Assigned'}
                        </span>
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🏢 {vendorName}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDriverMap;
