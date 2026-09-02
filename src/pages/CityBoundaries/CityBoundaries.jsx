import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Globe,
  Navigation,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  MousePointerClick,
  Undo2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const API_BASE = 'https://agnicarrental.com/2025';

const CityBoundaries = () => {
  const { showSuccess, showError } = useToast();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected city for viewing on main overview map
  const [selectedCityId, setSelectedCityId] = useState(null);

  // Main overview map ref
  const overviewMapRef = useRef(null);
  const overviewMapInstance = useRef(null);
  const overviewPolygons = useRef([]);

  // Modal / Drawing map state
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [formData, setFormData] = useState({
    city_name: '',
    min_lat: '',
    max_lat: '',
    min_lng: '',
    max_lng: '',
    status: 'active',
    polygon_coords: []
  });

  // Modal map refs
  const modalMapRef = useRef(null);
  const modalMapInstance = useRef(null);
  const activeDrawPolygon = useRef(null);

  // Simulator test coordinate
  const [testLat, setTestLat] = useState('19.1726');
  const [testLng, setTestLng] = useState('72.9565');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchBoundaries();
  }, []);

  // Initialize or update Main Overview Map
  useEffect(() => {
    if (!loading && overviewMapRef.current && window.google && window.google.maps) {
      if (!overviewMapInstance.current) {
        overviewMapInstance.current = new window.google.maps.Map(overviewMapRef.current, {
          center: { lat: 19.15, lng: 73.5 },
          zoom: 8,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] }
          ]
        });
      }

      // Clear existing polygons
      overviewPolygons.current.forEach(p => p.setMap(null));
      overviewPolygons.current = [];

      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;

      // Draw each active city polygon
      cities.forEach(city => {
        if (city.status === 'active' && city.polygon_coords && city.polygon_coords.length >= 3) {
          const path = city.polygon_coords.map(pt => ({ lat: pt.lat, lng: pt.lng }));
          path.forEach(pt => bounds.extend(pt));
          hasPoints = true;

          const poly = new window.google.maps.Polygon({
            paths: path,
            strokeColor: '#2563EB',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#3B82F6',
            fillOpacity: 0.25,
            map: overviewMapInstance.current
          });

          // Info window on click
          const info = new window.google.maps.InfoWindow({
            content: `<div style="font-family:sans-serif;padding:4px;"><strong style="color:#1E3A8A;font-size:13px;">${city.city_name}</strong><br/><span style="font-size:11px;color:#64748B;">Local Taxi Active Zone</span></div>`
          });

          poly.addListener('click', (e) => {
            info.setPosition(e.latLng);
            info.open(overviewMapInstance.current);
          });

          overviewPolygons.current.push(poly);
        }
      });

      if (hasPoints) {
        overviewMapInstance.current.fitBounds(bounds);
      }
    }
  }, [cities, loading]);

  const fetchBoundaries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/get_city_boundaries.php`);
      if (res.data && res.data.cities) {
        setCities(res.data.cities);
      }
    } catch (e) {
      showError('Failed to load city boundaries from server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCity(null);
    setFormData({
      city_name: '',
      min_lat: '',
      max_lat: '',
      min_lng: '',
      max_lng: '',
      status: 'active',
      polygon_coords: []
    });
    setShowModal(true);
    setTimeout(initDrawingMap, 300);
  };

  const handleOpenEditModal = (city) => {
    setEditingCity(city);
    setFormData({
      id: city.id,
      city_name: city.city_name,
      min_lat: city.min_lat,
      max_lat: city.max_lat,
      min_lng: city.min_lng,
      max_lng: city.max_lng,
      status: city.status,
      polygon_coords: city.polygon_coords || []
    });
    setShowModal(true);
    setTimeout(() => initDrawingMap(city), 300);
  };

  // Initialize Modal Drawing Map
  const initDrawingMap = (existingCity = null) => {
    if (!modalMapRef.current || !window.google || !window.google.maps) return;

    let centerLoc = { lat: 19.18, lng: 72.97 };
    if (existingCity && existingCity.min_lat && existingCity.min_lng) {
      centerLoc = {
        lat: (existingCity.min_lat + existingCity.max_lat) / 2,
        lng: (existingCity.min_lng + existingCity.max_lng) / 2
      };
    }

    modalMapInstance.current = new window.google.maps.Map(modalMapRef.current, {
      center: centerLoc,
      zoom: existingCity ? 11 : 10,
      mapTypeId: 'roadmap'
    });

    // Create or parse polygon path
    let initialPath = [];
    if (existingCity && existingCity.polygon_coords && existingCity.polygon_coords.length > 0) {
      initialPath = existingCity.polygon_coords.map(pt => new window.google.maps.LatLng(pt.lat, pt.lng));
    }

    // Editable & Draggable Polygon
    activeDrawPolygon.current = new window.google.maps.Polygon({
      paths: [initialPath],
      strokeColor: '#F59E0B',
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor: '#F59E0B',
      fillOpacity: 0.3,
      editable: true,
      draggable: true,
      map: modalMapInstance.current
    });

    if (initialPath.length > 0) {
      const b = new window.google.maps.LatLngBounds();
      initialPath.forEach(pt => b.extend(pt));
      modalMapInstance.current.fitBounds(b);
    }

    const updatePathState = () => {
      const path = activeDrawPolygon.current.getPath();
      const coords = [];
      const lats = [];
      const lngs = [];

      for (let i = 0; i < path.getLength(); i++) {
        const pt = path.getAt(i);
        coords.push({ lat: pt.lat(), lng: pt.lng() });
        lats.push(pt.lat());
        lngs.push(pt.lng());
      }

      setFormData(prev => ({
        ...prev,
        polygon_coords: coords,
        min_lat: lats.length > 0 ? Math.min(...lats) : '',
        max_lat: lats.length > 0 ? Math.max(...lats) : '',
        min_lng: lngs.length > 0 ? Math.min(...lngs) : '',
        max_lng: lngs.length > 0 ? Math.max(...lngs) : ''
      }));
    };

    // Click map to add vertex point
    modalMapInstance.current.addListener('click', (e) => {
      const path = activeDrawPolygon.current.getPath();
      path.push(e.latLng);
      updatePathState();
    });

    // Vertex listeners (drag, move, remove)
    const polyPath = activeDrawPolygon.current.getPath();
    polyPath.addListener('set_at', updatePathState);
    polyPath.addListener('insert_at', updatePathState);
    polyPath.addListener('remove_at', updatePathState);

    // Right-click vertex to delete
    activeDrawPolygon.current.addListener('rightclick', (e) => {
      if (e.vertex != null) {
        activeDrawPolygon.current.getPath().removeAt(e.vertex);
        updatePathState();
      }
    });
  };

  const handleClearDrawing = () => {
    if (activeDrawPolygon.current) {
      activeDrawPolygon.current.setPath([]);
      setFormData(prev => ({
        ...prev,
        polygon_coords: [],
        min_lat: '',
        max_lat: '',
        min_lng: '',
        max_lng: ''
      }));
    }
  };

  const handleToggleStatus = async (city) => {
    const newStatus = city.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await axios.post(`${API_BASE}/save_city_boundary.php`, {
        action: 'toggle_status',
        id: city.id,
        status: newStatus
      });
      if (res.data && res.data.status === 'success') {
        showSuccess(`${city.city_name} is now ${newStatus}`);
        fetchBoundaries();
      } else {
        showError(res.data.message || 'Failed to update status');
      }
    } catch (e) {
      showError('Network error while updating city status');
    }
  };

  const handleDelete = async (city) => {
    if (!window.confirm(`Are you sure you want to delete boundary for ${city.city_name}?`)) return;
    try {
      const res = await axios.post(`${API_BASE}/save_city_boundary.php`, {
        action: 'delete',
        id: city.id
      });
      if (res.data && res.data.status === 'success') {
        showSuccess(`Deleted boundary for ${city.city_name}`);
        fetchBoundaries();
      } else {
        showError(res.data.message || 'Failed to delete');
      }
    } catch (e) {
      showError('Network error while deleting');
    }
  };

  const handleSaveBoundary = async (e) => {
    e.preventDefault();
    if (!formData.city_name.trim()) {
      showError('City name is required');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/save_city_boundary.php`, {
        ...formData,
        action: 'save'
      });
      if (res.data && res.data.status === 'success') {
        showSuccess(res.data.message || 'Saved successfully');
        setShowModal(false);
        fetchBoundaries();
      } else {
        showError(res.data.message || 'Failed to save');
      }
    } catch (e) {
      showError('Network error while saving city boundary');
    }
  };

  // Test GPS inside boundary
  const handleTestGPS = () => {
    const lat = parseFloat(testLat);
    const lng = parseFloat(testLng);
    if (isNaN(lat) || isNaN(lng)) {
      setTestResult({ match: false, message: 'Invalid GPS coordinates' });
      return;
    }

    const matched = cities.find(c => 
      c.status === 'active' &&
      lat >= c.min_lat && lat <= c.max_lat &&
      lng >= c.min_lng && lng <= c.max_lng
    );

    if (matched) {
      setTestResult({
        match: true,
        cityName: matched.city_name,
        message: `✅ Point is INSIDE active ${matched.city_name} Geo-Fence! Local Taxi is available.`
      });
    } else {
      setTestResult({
        match: false,
        message: '🚫 Point is OUTSIDE active city boundaries. System will recommend Outstation One-Way.'
      });
    }
  };

  const activeCount = cities.filter(c => c.status === 'active').length;
  const filteredCities = cities.filter(c => 
    c.city_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB'
            }}>
              <MapPin size={18} />
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              City Boundaries & Geo-Fencing
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Draw visual service polygons on Google Maps, set GPS bounding coordinates, and manage Local Taxi operational zones.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchBoundaries}
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleOpenAddModal}
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
            }}
          >
            <Plus size={16} /> Draw New Boundary
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Geo-Fences
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {activeCount} of {cities.length} Cities
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Primary Coverage
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              Mumbai, Pune, Thane
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Polygon Drawing Tool
            </span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              Google Maps Draggable
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#2563EB" />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Interactive Live Geo-Fencing Map
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Blue zones represent active Local Taxi service areas in Maharashtra
          </span>
        </div>

        {/* Map Container */}
        <div
          ref={overviewMapRef}
          style={{
            width: '100%',
            height: '380px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: '#F8FAFC'
          }}
        />
      </div>

      {/* GPS Geo-Fence Simulator Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Navigation size={18} color="#2563EB" />
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Live Coordinate Geo-Fence Tester
          </h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Enter any GPS latitude & longitude to test whether a customer pickup location is permitted for Local Taxi.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              LATITUDE (e.g. Mulund: 19.1726)
            </label>
            <input
              type="text"
              value={testLat}
              onChange={(e) => setTestLat(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              LONGITUDE (e.g. Mulund: 72.9565)
            </label>
            <input
              type="text"
              value={testLng}
              onChange={(e) => setTestLng(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              onClick={handleTestGPS}
              style={{
                padding: '10px 18px',
                backgroundColor: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> Test Geo-Fence
            </button>
          </div>
        </div>

        {testResult && (
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: testResult.match ? '#ECFDF5' : '#FFF1F2',
            border: `1px solid ${testResult.match ? '#A7F3D0' : '#FECDD3'}`,
            color: testResult.match ? '#065F46' : '#9F1239',
            fontSize: '13px',
            fontWeight: 700
          }}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Main City Boundaries Table Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Configured City Boundaries ({filteredCities.length})
            </h3>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search city boundaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 30px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            Loading city boundaries from AWS...
          </div>
        ) : filteredCities.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No city boundaries found matching "{searchTerm}".
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>City Name</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Latitude Range</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Longitude Range</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Polygon Shape</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Service Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city) => {
                  const isActive = city.status === 'active';
                  const polyCount = city.polygon_coords ? city.polygon_coords.length : 0;

                  return (
                    <tr key={city.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: isActive ? '#EFF6FF' : '#F1F5F9',
                            color: isActive ? '#2563EB' : '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 800
                          }}>
                            {city.city_name.substring(0, 2).toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{city.city_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '12px' }}>
                        [{city.min_lat?.toFixed(4)} → {city.max_lat?.toFixed(4)}]
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '12px' }}>
                        [{city.min_lng?.toFixed(4)} → {city.max_lng?.toFixed(4)}]
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {polyCount > 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            color: '#16A34A',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {polyCount}-Point Geo-Polygon
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            Bounding Box
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleToggleStatus(city)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                            color: isActive ? '#166534' : '#991B1B'
                          }}
                        >
                          {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(city)}
                            title="Edit / Draw Boundary on Map"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700
                            }}
                          >
                            <Edit2 size={12} /> Draw / Edit
                          </button>
                          <button
                            onClick={() => handleDelete(city)}
                            title="Delete Boundary"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FFF1F2',
                              border: '1px solid #FECDD3',
                              color: '#E11D48',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Modal with Interactive Map Drawing Canvas */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '840px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingCity ? `Draw / Edit Boundary: ${editingCity.city_name}` : 'Draw New City Boundary'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Click on map to place polygon points. Drag points to reshape. Right-click any point to delete.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearDrawing}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  borderRadius: '8px',
                  color: '#E11D48',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={13} /> Clear Polygon
              </button>
            </div>

            {/* Interactive Drawing Map */}
            <div style={{ marginBottom: '16px' }}>
              <div
                ref={modalMapRef}
                style={{
                  width: '100%',
                  height: '360px',
                  borderRadius: '12px',
                  border: '2px solid #F59E0B',
                  backgroundColor: '#F8FAFC'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700 }}>
                  📍 {formData.polygon_coords.length} Vertex Points Placed
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Right-click any vertex on map to delete
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveBoundary} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    CITY NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, Mumbai, Thane"
                    value={formData.city_name}
                    onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    STATUS
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="active">Active (Enforcing Zone)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Computed Lat/Lng Readonly Box */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px'
              }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Auto-Computed Bounding Box (From Polygon)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Min Latitude</span>
                    <input
                      type="text"
                      readOnly
                      value={formData.min_lat ? formData.min_lat.toFixed(6) : 'Auto'}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Max Latitude</span>
                    <input
                      type="text"
                      readOnly
                      value={formData.max_lat ? formData.max_lat.toFixed(6) : 'Auto'}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Min Longitude</span>
                    <input
                      type="text"
                      readOnly
                      value={formData.min_lng ? formData.min_lng.toFixed(6) : 'Auto'}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Max Longitude</span>
                    <input
                      type="text"
                      readOnly
                      value={formData.max_lng ? formData.max_lng.toFixed(6) : 'Auto'}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
                  }}
                >
                  Save Boundary & Polygon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityBoundaries;
