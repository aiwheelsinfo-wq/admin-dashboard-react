import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Navigation,
  ArrowRightLeft,
  Car,
  Percent,
  RefreshCw,
  PieChart,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const SalesAnalytics = () => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // '7d' | '30d' | 'all'
  const [analyticsData, setAnalyticsData] = useState({
    daily_sales: [],
    trip_breakdown: [],
    vehicle_breakdown: [],
    status_breakdown: []
  });
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Fetch sales analytics from AWS backend
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${endpoints.bookingsManagement}?action=get_sales_analytics`,
        { timeout: 12000 }
      );
      if (res.data && res.data.status === 'success') {
        setAnalyticsData({
          daily_sales: res.data.daily_sales || [],
          trip_breakdown: res.data.trip_breakdown || [],
          vehicle_breakdown: res.data.vehicle_breakdown || [],
          status_breakdown: res.data.status_breakdown || []
        });
      } else {
        addToast('Failed to load sales analytics.', 'warning');
      }
    } catch (err) {
      console.error('Failed to fetch sales analytics:', err);
      addToast('Unable to connect to live sales analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filter daily sales based on active timeframe
  const filteredDailySales = useMemo(() => {
    const list = [...analyticsData.daily_sales];
    if (list.length === 0) return [];

    if (timeframe === '7d') {
      return list.slice(-7);
    }
    if (timeframe === '30d') {
      return list.slice(-30);
    }
    return list;
  }, [analyticsData.daily_sales, timeframe]);

  // Aggregate high-level totals
  const totals = useMemo(() => {
    const grossRev = filteredDailySales.reduce((acc, d) => acc + (d.gross_revenue || 0), 0);
    const companyProf = filteredDailySales.reduce((acc, d) => acc + (d.company_profit || 0), 0);
    const driverPayout = filteredDailySales.reduce((acc, d) => acc + (d.driver_payout || 0), 0);
    const totalTrips = filteredDailySales.reduce((acc, d) => acc + (d.trips || 0), 0);
    const avgTicket = totalTrips > 0 ? grossRev / totalTrips : 0;
    const marginPct = grossRev > 0 ? (companyProf / grossRev) * 100 : 0;

    return {
      grossRev,
      companyProf,
      driverPayout,
      totalTrips,
      avgTicket,
      marginPct
    };
  }, [filteredDailySales]);

  // SVG Chart Geometry Calculations
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 65 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxRevenue = useMemo(() => {
    if (filteredDailySales.length === 0) return 10000;
    const peak = Math.max(...filteredDailySales.map((d) => d.gross_revenue || 0));
    return peak > 0 ? Math.ceil((peak * 1.2) / 1000) * 1000 : 10000;
  }, [filteredDailySales]);

  const points = useMemo(() => {
    if (filteredDailySales.length === 0) return [];
    const count = filteredDailySales.length;

    return filteredDailySales.map((d, index) => {
      const x =
        count === 1
          ? padding.left + innerWidth / 2
          : padding.left + (index / (count - 1)) * innerWidth;
      const yRev = padding.top + innerHeight - ((d.gross_revenue || 0) / maxRevenue) * innerHeight;
      const yProf = padding.top + innerHeight - ((d.company_profit || 0) / maxRevenue) * innerHeight;

      return {
        ...d,
        x,
        yRev,
        yProf,
        index
      };
    });
  }, [filteredDailySales, maxRevenue, innerWidth, innerHeight, padding]);

  // Generate SVG Path for smooth area and line
  const createAreaPath = (pts, keyY) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) {
      return `M ${padding.left} ${padding.top + innerHeight} L ${pts[0].x} ${pts[0][keyY]} L ${padding.left + innerWidth} ${pts[0][keyY]} L ${padding.left + innerWidth} ${padding.top + innerHeight} Z`;
    }
    const lineParts = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p[keyY].toFixed(1)}`);
    const closeParts = `L ${pts[pts.length - 1].x.toFixed(1)} ${(padding.top + innerHeight).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padding.top + innerHeight).toFixed(1)} Z`;
    return `${lineParts.join(' ')} ${closeParts}`;
  };

  const createLinePath = (pts, keyY) => {
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p[keyY].toFixed(1)}`).join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Intelligence</span>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563EB' }}>Sales & Revenue Analytics</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <BarChart3 style={{ width: '28px', height: '28px', color: '#2563EB' }} />
            <span>Sales & Revenue Statistics</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Visual dispatch sales velocity, net company margin retention, and fleet category volume trends.
          </p>
        </div>

        {/* Action Controls & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Timeframe selector */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setTimeframe('7d')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: timeframe === '7d' ? '#FFFFFF' : 'transparent',
                color: timeframe === '7d' ? '#0F172A' : '#64748B',
                fontWeight: timeframe === '7d' ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: timeframe === '7d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: timeframe === '30d' ? '#FFFFFF' : 'transparent',
                color: timeframe === '30d' ? '#0F172A' : '#64748B',
                fontWeight: timeframe === '30d' ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: timeframe === '30d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: timeframe === 'all' ? '#FFFFFF' : 'transparent',
                color: timeframe === 'all' ? '#0F172A' : '#64748B',
                fontWeight: timeframe === 'all' ? 700 : 500,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: timeframe === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              All Time
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync</span>
          </button>

          <NavLink
            to="/bookings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#2563EB',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#FFFFFF',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <ShieldCheck style={{ width: '15px', height: '15px' }} />
            <span>Live Bookings</span>
          </NavLink>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* Gross Sales */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Cumulative Gross Sales
            </span>
            <div style={{ backgroundColor: '#EFF6FF', padding: '6px', borderRadius: '8px', color: '#2563EB' }}>
              <DollarSign style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            ₹{totals.grossRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Across {totals.totalTrips} registered dispatches
          </div>
        </div>

        {/* Company Profit */}
        <div style={{
          backgroundColor: '#F0FDF4',
          borderRadius: '16px',
          border: '1.5px solid #BBF7D0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(5, 150, 105, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
              Company Profit (Net)
            </span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '6px', borderRadius: '8px', color: '#059669' }}>
              <TrendingUp style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.02em' }}>
            ₹{totals.companyProf.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px', fontWeight: 600 }}>
            {totals.marginPct.toFixed(1)}% Platform Retention Rate
          </div>
        </div>

        {/* Driver Disbursements */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Driver Fleet Disbursements
            </span>
            <div style={{ backgroundColor: '#F1F5F9', padding: '6px', borderRadius: '8px', color: '#475569' }}>
              <Wallet style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            ₹{totals.driverPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            {(100 - totals.marginPct).toFixed(1)}% Fleet Partner Payout
          </div>
        </div>

        {/* Average Ticket Size */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Average Ticket Size
            </span>
            <div style={{ backgroundColor: '#FAF5FF', padding: '6px', borderRadius: '8px', color: '#7C3AED' }}>
              <Percent style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            ₹{totals.avgTicket.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Avg value per passenger ride
          </div>
        </div>
      </div>

      {/* 3. Hero Visual Sales & Profit Area Curve */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Sales & Company Profit Velocity
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px', margin: 0 }}>
              Daily timeline tracking total customer fare bookings alongside company margin.
            </p>
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2563EB' }} />
              <span style={{ color: '#334155' }}>Gross Revenue (₹)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#059669' }} />
              <span style={{ color: '#334155' }}>Company Profit (₹)</span>
            </div>
          </div>
        </div>

        {/* SVG Chart Render */}
        <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
          {loading ? (
            <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
              <span>Loading sales data...</span>
            </div>
          ) : points.length === 0 ? (
            <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              <span>No sales data found for the selected timeframe.</span>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '550px' }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                {/* Blue gradient for Revenue */}
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>

                {/* Green gradient for Profit */}
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + innerHeight * (1 - ratio);
                const val = maxRevenue * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerWidth}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 ? 'none' : '4 4'}
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="600"
                      fill="#94A3B8"
                    >
                      ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Filled Area Paths */}
              <path d={createAreaPath(points, 'yRev')} fill="url(#revGrad)" />
              <path d={createAreaPath(points, 'yProf')} fill="url(#profGrad)" />

              {/* Stroke Lines */}
              <path
                d={createLinePath(points, 'yRev')}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={createLinePath(points, 'yProf')}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Points and Hover Circles */}
              {points.map((p) => {
                const isHovered = hoveredPoint && hoveredPoint.index === p.index;
                return (
                  <g key={p.date}>
                    {/* Hover vertical crosshair */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={padding.top}
                        x2={p.x}
                        y2={padding.top + innerHeight}
                        stroke="#94A3B8"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Revenue Circle */}
                    <circle
                      cx={p.x}
                      cy={p.yRev}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth={isHovered ? 3 : 2}
                      style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                    />

                    {/* Profit Circle */}
                    <circle
                      cx={p.x}
                      cy={p.yProf}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#059669"
                      strokeWidth={isHovered ? 3 : 2}
                      style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                    />

                    {/* Transparent Hit Area for Easy Mouse Interaction */}
                    <rect
                      x={p.x - 20}
                      y={padding.top}
                      width={40}
                      height={innerHeight}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(p)}
                    />

                    {/* X-Axis Date Label */}
                    <text
                      x={p.x}
                      y={padding.top + innerHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isHovered ? '700' : '500'}
                      fill={isHovered ? '#0F172A' : '#64748B'}
                    >
                      {p.date ? p.date.slice(5) : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Floating Glassmorphism Tooltip */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(chartWidth - 220, Math.max(20, (hoveredPoint.x / chartWidth) * 100))}%`,
                top: '10px',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.8125rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                pointerEvents: 'none',
                zIndex: 10,
                backdropFilter: 'blur(8px)',
                minWidth: '190px'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '6px', color: '#F8FAFC' }}>
                📅 {hoveredPoint.date}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#93C5FD' }}>Gross Sales:</span>
                <span style={{ fontWeight: 700 }}>₹{Number(hoveredPoint.gross_revenue).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#86EFAC' }}>Company Profit:</span>
                <span style={{ fontWeight: 700, color: '#4ADE80' }}>₹{Number(hoveredPoint.company_profit).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#CBD5E1' }}>Driver Payout:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(hoveredPoint.driver_payout).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                <span style={{ color: '#94A3B8' }}>Trips:</span>
                <span style={{ fontWeight: 700 }}>{hoveredPoint.trips} Bookings</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Category Breakdown & Partner Disbursements Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
        gap: '20px'
      }}>
        {/* Trip Type Breakdown Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: '#EFF6FF', padding: '6px', borderRadius: '8px', color: '#2563EB' }}>
                <Navigation style={{ width: '16px', height: '16px' }} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Trip Category Distribution
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
              By Sales Share
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analyticsData.trip_breakdown.map((t) => {
              const sharePct = totals.grossRev > 0 ? ((t.gross_revenue || 0) / totals.grossRev) * 100 : 0;
              const isOneWay = t.category.toLowerCase().includes('one');
              const isRound = t.category.toLowerCase().includes('round');
              const barColor = isOneWay ? '#059669' : isRound ? '#2563EB' : '#D97706';

              return (
                <div key={t.category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{t.category}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({t.trips} rides)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>₹{Number(t.gross_revenue).toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: barColor, backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: '4px' }}>
                        {sharePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(2, sharePct)}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  {/* Company Margin Subtitle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                    <span>Company Profit: <strong style={{ color: '#059669' }}>₹{Number(t.company_profit).toLocaleString('en-IN')}</strong></span>
                    <span>Driver: ₹{Number(t.driver_payout).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Category Breakdown Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: '#FAF5FF', padding: '6px', borderRadius: '8px', color: '#7C3AED' }}>
                <Car style={{ width: '16px', height: '16px' }} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Vehicle Fleet Revenue
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
              Model Volume
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analyticsData.vehicle_breakdown.map((v) => {
              const sharePct = totals.grossRev > 0 ? ((v.gross_revenue || 0) / totals.grossRev) * 100 : 0;
              return (
                <div key={v.vehicle} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{v.vehicle}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>₹{Number(v.gross_revenue).toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({v.trips} rides)</span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(2, sharePct)}%`,
                        height: '100%',
                        backgroundColor: '#7C3AED',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    Company Earnings: ₹{Number(v.company_profit).toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
