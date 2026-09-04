import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Car,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Navigation,
  Eye,
  Trash2,
  Calendar,
  RefreshCw,
  FileText,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldAlert,
  DollarSign,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Gauge,
  FileSpreadsheet,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const Bookings = () => {
  const { addToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total_bookings: 0,
    completed_count: 0,
    active_count: 0,
    cancelled_count: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTripType, setFilterTripType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const tableRef = useRef(null);

  // Selected booking for detailed inspection modal
  const [inspectBooking, setInspectBooking] = useState(null);

  // Single delete state
  const [deletingId, setDeletingId] = useState(null);

  // Delete All Bookings Modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Fetch live bookings and stats from AWS MySQL
  const fetchBookingsData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        axios.get(`${endpoints.bookingsManagement}?action=get_all_bookings&limit=500`, { timeout: 12000 }),
        axios.get(`${endpoints.bookingsManagement}?action=get_booking_stats`, { timeout: 10000 })
      ]);

      if (bookingsRes.data && bookingsRes.data.status === 'success') {
        setBookings(bookingsRes.data.bookings || []);
      }
      if (statsRes.data && statsRes.data.status === 'success') {
        setStats(statsRes.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to fetch live bookings:', err);
      addToast('Unable to load live bookings from AWS. Showing cached view.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsData();
  }, []);

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const status = (b.booking_status || '').toLowerCase();
      const trip = (b.trip_type || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesStatus =
        filterStatus === 'All' || status === filterStatus.toLowerCase();

      const matchesTripType =
        filterTripType === 'All' || trip === filterTripType.toLowerCase();

      const matchesSearch =
        !q ||
        String(b.id).includes(q) ||
        String(b.invoice_no || '').toLowerCase().includes(q) ||
        (b.customer_name || '').toLowerCase().includes(q) ||
        (b.customer_phone || '').includes(q) ||
        (b.from_address || '').toLowerCase().includes(q) ||
        (b.to_address || '').toLowerCase().includes(q) ||
        (b.car_type || '').toLowerCase().includes(q) ||
        (b.driver_name || '').toLowerCase().includes(q);

      return matchesStatus && matchesTripType && matchesSearch;
    });
  }, [bookings, filterStatus, filterTripType, searchTerm]);

  // Reset page to 1 whenever filters, search, or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTripType, pageSize]);

  // Pagination metrics
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated subset of bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredBookings.slice(startIndex, startIndex + pageSize);
  }, [filteredBookings, safeCurrentPage, pageSize]);

  // Page change handler with smooth scroll to table
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate pagination button numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Delete single booking
  const handleDeleteSingle = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to delete Booking #${bookingId}?`)) {
      return;
    }
    setDeletingId(bookingId);
    try {
      const res = await axios.post(
        endpoints.bookingsManagement,
        { action: 'delete_single', id: bookingId },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      if (res.data && res.data.status === 'success') {
        addToast(`Booking #${bookingId} deleted successfully.`, 'success');
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setStats(prev => ({
          ...prev,
          total_bookings: Math.max(0, prev.total_bookings - 1)
        }));
        if (inspectBooking && inspectBooking.id === bookingId) {
          setInspectBooking(null);
        }
      } else {
        addToast(res.data?.message || 'Failed to delete booking', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error deleting booking', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Safe Delete All Bookings
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await axios.post(
        endpoints.bookingsManagement,
        { action: 'delete_all_bookings' },
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
      );

      if (res.data && res.data.status === 'success') {
        const backupTable = res.data.backup_table || 'bookings_backup';
        addToast(`All bookings deleted! Automated backup saved in ${backupTable}`, 'success');
        setBookings([]);
        setStats({
          total_bookings: 0,
          completed_count: 0,
          active_count: 0,
          cancelled_count: 0,
          total_revenue: 0
        });
        setShowDeleteAllModal(false);
        setInspectBooking(null);
      } else {
        addToast(res.data?.message || 'Failed to delete all bookings', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error executing delete-all', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'Completed' };
      case 'in-transit':
      case 'driver assigned':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'In-Transit' };
      case 'confirmed':
        return { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', label: 'Confirmed' };
      case 'cancelled':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Cancelled' };
      default:
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: status || 'Pending' };
    }
  };

  // 1. Batch Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredBookings.length === 0) {
      addToast('No bookings available to export.', 'warning');
      return;
    }

    try {
      const dataToExport = filteredBookings.map((b) => ({
        'Booking ID': `#${b.id}`,
        'Invoice No': b.invoice_no || `INV-${b.id}`,
        'Customer Name': b.customer_name || 'N/A',
        'Customer Phone': b.customer_phone || 'N/A',
        'Customer Email': b.customer_email || 'N/A',
        'Trip Type': b.trip_type || 'N/A',
        'Vehicle Model / Type': b.car_type || 'N/A',
        'Pickup Location': b.from_address || 'N/A',
        'Drop Location': b.to_address || 'N/A',
        'Pickup Date': b.pickup_date || 'N/A',
        'Pickup Time': b.pickup_time || 'N/A',
        'Estimated KM': b.distance_km || b.kms || '—',
        'Total Amount (INR)': Number(b.total_amount || b.booking_amount || 0),
        'Advance Paid (INR)': Number(b.advance_amount || 0),
        'Balance Due (INR)': Number(b.balance_amount || 0),
        'Driver Name': b.driver_name || 'Not Assigned',
        'Driver Phone': b.driver_phone || '—',
        'Booking Status': b.booking_status || 'Pending',
        'Payment Status': b.payment_status || '—',
        'Created At': b.created_at || '—'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Auto-fit column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Booking ID
        { wch: 14 }, // Invoice No
        { wch: 22 }, // Customer Name
        { wch: 16 }, // Customer Phone
        { wch: 24 }, // Customer Email
        { wch: 14 }, // Trip Type
        { wch: 20 }, // Vehicle Type
        { wch: 32 }, // Pickup Location
        { wch: 32 }, // Drop Location
        { wch: 14 }, // Pickup Date
        { wch: 12 }, // Pickup Time
        { wch: 14 }, // Estimated KM
        { wch: 18 }, // Total Amount
        { wch: 18 }, // Advance Paid
        { wch: 18 }, // Balance Due
        { wch: 20 }, // Driver Name
        { wch: 16 }, // Driver Phone
        { wch: 16 }, // Booking Status
        { wch: 16 }, // Payment Status
        { wch: 20 }, // Created At
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Rentox_Bookings_${dateStr}.xlsx`);
      addToast(`Exported ${filteredBookings.length} bookings to Excel successfully!`, 'success');
    } catch (err) {
      console.error('Failed to export Excel:', err);
      addToast('Failed to export Excel file.', 'error');
    }
  };

  // 2. Batch Export to PDF (.pdf)
  const handleExportPDF = () => {
    if (filteredBookings.length === 0) {
      addToast('No bookings available to export.', 'warning');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const dateStr = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Title & Header Banner
      doc.setFillColor(15, 23, 42); // #0F172A
      doc.rect(0, 0, 842, 60, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RENTOX MOBILITY — BOOKINGS & DISPATCH REGISTRY', 30, 32);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // #CBD5E1
      doc.text(`Official Dispatch Log & Trip Audit Report  •  Generated: ${dateStr} at ${timeStr}  •  Total Records: ${filteredBookings.length}`, 30, 48);

      // KPI summary sub-bar
      doc.setFillColor(248, 250, 252);
      doc.rect(30, 70, 782, 30, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(30, 70, 782, 30, 'S');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Total: ${filteredBookings.length}`, 44, 89);
      doc.setTextColor(5, 150, 105);
      doc.text(`Completed: ${filteredBookings.filter(b => (b.booking_status||'').toLowerCase() === 'completed').length}`, 160, 89);
      doc.setTextColor(217, 119, 6);
      doc.text(`Active: ${filteredBookings.filter(b => ['in-transit', 'confirmed', 'pending'].includes((b.booking_status||'').toLowerCase())).length}`, 300, 89);
      doc.setTextColor(220, 38, 38);
      doc.text(`Cancelled: ${filteredBookings.filter(b => (b.booking_status||'').toLowerCase() === 'cancelled').length}`, 440, 89);
      const totalRev = filteredBookings.reduce((sum, b) => sum + Number(b.total_amount || b.booking_amount || 0), 0);
      doc.setTextColor(15, 23, 42);
      doc.text(`Revenue: INR ${totalRev.toLocaleString('en-IN')}`, 590, 89);

      // Table Rows
      const tableRows = filteredBookings.map((b) => [
        `#${b.id}`,
        b.invoice_no || `INV-${b.id}`,
        `${b.customer_name || 'Customer'}\n${b.customer_phone || ''}`,
        b.trip_type || '—',
        b.car_type || 'Standard',
        `${b.from_address ? b.from_address.slice(0, 30) : '—'}\n→ ${b.to_address ? b.to_address.slice(0, 30) : '—'}`,
        `${b.pickup_date || ''} ${b.pickup_time || ''}`.trim() || '—',
        `₹${Number(b.total_amount || b.booking_amount || 0).toLocaleString('en-IN')}`,
        (b.booking_status || 'Pending').toUpperCase(),
        b.driver_name || 'Unassigned'
      ]);

      autoTable(doc, {
        head: [['ID', 'Invoice', 'Customer', 'Type', 'Vehicle', 'Route (Pickup → Drop)', 'Schedule', 'Fare', 'Status', 'Driver']],
        body: tableRows,
        startY: 110,
        margin: { left: 30, right: 30 },
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 54 },
          2: { cellWidth: 85 },
          3: { cellWidth: 56 },
          4: { cellWidth: 60 },
          5: { cellWidth: 175 },
          6: { cellWidth: 70 },
          7: { cellWidth: 64, halign: 'right', fontStyle: 'bold' },
          8: { cellWidth: 62, halign: 'center', fontStyle: 'bold' },
          9: { cellWidth: 80 }
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}  •  Rentox Fleet & Ride Operations  •  Confidential`,
            30,
            580
          );
        }
      });

      const pdfFilename = `Rentox_Bookings_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(pdfFilename);
      addToast(`Exported ${filteredBookings.length} bookings to PDF report!`, 'success');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      addToast('Failed to generate PDF document.', 'error');
    }
  };

  // 3. Single Booking PDF Slip Export
  const handleExportSinglePDF = (b) => {
    if (!b) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Top Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 595, 70, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RENTOX MOBILITY', 40, 36);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('Official Duty Slip & Trip Manifest', 40, 52);

      // Right Header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Booking #${b.id}`, 555, 34, { align: 'right' });
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice: ${b.invoice_no || `INV-${b.id}`}`, 555, 48, { align: 'right' });
      doc.text(`Status: ${(b.booking_status || 'Pending').toUpperCase()}`, 555, 60, { align: 'right' });

      // Customer & Booking Overview Box
      doc.setFillColor(248, 250, 252);
      doc.rect(40, 85, 515, 80, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(40, 85, 515, 80, 'S');

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', 55, 102);
      doc.text('TRIP & VEHICLE SPECIFICATIONS', 310, 102);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(`${b.customer_name || 'Valued Customer'}`, 55, 118);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Phone: ${b.customer_phone || '—'}`, 55, 132);
      doc.text(`Email: ${b.customer_email || '—'}`, 55, 146);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Trip Type: ${b.trip_type || 'One-Way'}`, 310, 118);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Vehicle: ${b.car_type || 'Standard'}`, 310, 132);
      doc.text(`Scheduled: ${b.pickup_date || '—'} at ${b.pickup_time || '—'}`, 310, 146);

      // Route & Driver Table
      autoTable(doc, {
        head: [['Section', 'Trip Dispatch Details']],
        body: [
          ['Pickup Address', b.from_address || '—'],
          ['Drop Address', b.to_address || '—'],
          ['Estimated Distance', `${b.distance_km || b.kms || '—'} KM`],
          ['Assigned Driver', b.driver_name ? `${b.driver_name} (${b.driver_phone || 'No phone'})` : 'Driver Not Yet Assigned'],
          ['Total Booking Fare', `INR ${Number(b.total_amount || b.booking_amount || 0).toLocaleString('en-IN')}`],
          ['Advance Payment', `INR ${Number(b.advance_amount || 0).toLocaleString('en-IN')}`],
          ['Balance Due at Drop', `INR ${Number(b.balance_amount || 0).toLocaleString('en-IN')}`],
          ['Dispatch Date / Time', b.created_at || '—']
        ],
        startY: 180,
        margin: { left: 40, right: 40 },
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 140, fontStyle: 'bold', textColor: [71, 85, 105] },
          1: { cellWidth: 375, textColor: [15, 23, 42] }
        }
      });

      // Footer notice
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Rentox Mobility Technologies • Automated Ride Dispatch Verification Manifest • Support: support@rentox.in', 40, 800);

      doc.save(`Rentox_Booking_Slip_${b.id}.pdf`);
      addToast(`Booking #${b.id} slip exported to PDF!`, 'success');
    } catch (err) {
      console.error('Failed to export single booking PDF:', err);
      addToast('Failed to export booking slip.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* 1. Header & Quick Actions */}
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D97706' }}>Live Fleet Bookings</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Bookings & Ride Operations
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Inspect live booking dispatches, customer/agent details, trip metrics, and invoice documentation.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchBookingsData}
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
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Refresh bookings from AWS"
          >
            <RefreshCw style={{ width: '16px', height: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync Live</span>
          </button>

          {/* Export to Excel (.xlsx) */}
          <button
            onClick={handleExportExcel}
            disabled={loading || filteredBookings.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#059669',
              cursor: loading || filteredBookings.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
            title="Download formatted Excel spreadsheet of current bookings"
          >
            <FileSpreadsheet style={{ width: '16px', height: '16px', color: '#059669' }} />
            <span>Export Excel</span>
          </button>

          {/* Export to PDF (.pdf) */}
          <button
            onClick={handleExportPDF}
            disabled={loading || filteredBookings.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#DC2626',
              cursor: loading || filteredBookings.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.15s ease'
            }}
            title="Download printable PDF audit report of current bookings"
          >
            <FileText style={{ width: '16px', height: '16px', color: '#DC2626' }} />
            <span>Export PDF</span>
          </button>

          {/* DANGER: Delete All Bookings Button */}
          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={loading || bookings.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: bookings.length > 0 ? '#DC2626' : '#94A3B8',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#FFFFFF',
              cursor: bookings.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: bookings.length > 0 ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Remove all bookings with automated database backup"
          >
            <Trash2 style={{ width: '16px', height: '16px' }} />
            <span>Delete All Bookings</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
            Total Bookings
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            {stats.total_bookings ?? bookings.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            All-time registered rides
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
            Completed Trips
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
            {stats.completed_count ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
            Invoiced & Closed
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
            Pending / Active
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
            {stats.active_count ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '2px' }}>
            Requiring action
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
            Total Booking Revenue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            ₹{(stats.total_revenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Gross cumulative fares
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '18px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
          border: '1.5px solid #CBD5E1',
          borderRadius: '10px',
          padding: '8px 14px',
          minWidth: '280px',
          flex: '1 1 320px'
        }}>
          <Search style={{ width: '18px', height: '18px', color: '#94A3B8', marginRight: '10px' }} />
          <input
            type="text"
            placeholder="Search by ID, Invoice #, Customer, Phone, Route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0F172A'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Trip Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B' }}>Trip:</span>
            <select
              value={filterTripType}
              onChange={(e) => setFilterTripType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Trip Types</option>
              <option value="One-way">One-way</option>
              <option value="Round-Trip">Round-Trip</option>
              <option value="Local-Duty">Local-Duty</option>
              <option value="Local-taxi">Local-taxi</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In-Transit">In-Transit</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bookings Data Table */}
      <div
        ref={tableRef}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Booking / Bill</th>
                <th style={{ padding: '12px 14px' }}>Customer / Contact</th>
                <th style={{ padding: '12px 14px' }}>Trip & Vehicle</th>
                <th style={{ padding: '12px 14px' }}>Route</th>
                <th style={{ padding: '12px 14px' }}>Schedule</th>
                <th style={{ padding: '12px 14px' }}>Total Amount</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                    <div>Loading live bookings from AWS MySQL...</div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    <CheckCircle2 style={{ width: '32px', height: '32px', color: '#94A3B8', margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>No bookings found</div>
                    <div style={{ fontSize: '0.8125rem' }}>Try clearing filters or search query.</div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => {
                  const badge = getStatusBadge(b.booking_status);
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Booking ID & Invoice */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>
                            #{b.id}
                          </span>
                          {b.invoice_no && (
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: '#6366F1',
                              backgroundColor: '#EEF2FF',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Bill #{b.invoice_no}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                          {b.booked_at ? new Date(b.booked_at).toLocaleDateString() : ''}
                        </div>
                      </td>

                      {/* Customer / Contact */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                          {b.customer_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                          <span>{b.customer_phone}</span>
                        </div>
                        {b.agency_name && (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: '#C2410C',
                            backgroundColor: '#FFF7ED',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            marginTop: '2px',
                            display: 'inline-block'
                          }}>
                            Agent: {b.agency_name}
                          </span>
                        )}
                      </td>

                      {/* Trip & Vehicle */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Car style={{ width: '15px', height: '15px', color: '#D97706' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                            {b.car_type}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#2563EB',
                          backgroundColor: '#EFF6FF',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginTop: '2px',
                          display: 'inline-block'
                        }}>
                          {b.trip_type}
                        </span>
                      </td>

                      {/* Route */}
                      <td style={{ padding: '14px', maxWidth: '240px' }}>
                        <div style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: '#334155',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={b.from_address}>
                          {b.from_address ? b.from_address.split(',')[0] : '—'}
                        </div>
                        {b.to_address && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748B',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={b.to_address}>
                            → {b.to_address.split(',')[0]}
                          </div>
                        )}
                        {b.distance > 0 && (
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                            {b.distance} KM
                          </div>
                        )}
                      </td>

                      {/* Schedule */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                          {b.date || '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {b.time || '—'}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
                          ₹{b.total_amount ? b.total_amount.toLocaleString() : '0'}
                        </div>
                        {b.paid_amount > 0 && (
                          <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                            Paid: ₹{b.paid_amount}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          padding: '3px 10px',
                          borderRadius: '20px',
                          display: 'inline-block'
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Inspect Booking Details */}
                          <button
                            onClick={() => setInspectBooking(b)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Inspect complete booking details"
                          >
                            <Eye style={{ width: '15px', height: '15px' }} />
                          </button>

                          {/* Open Official Invoice */}
                          <a
                            href={`https://web-rentox.vercel.app/invoice?bookingId=${b.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#2563EB',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none'
                            }}
                            title="Open / Print Official Invoice"
                          >
                            <FileText style={{ width: '15px', height: '15px' }} />
                          </a>

                          {/* Delete Single Booking */}
                          <button
                            onClick={() => handleDeleteSingle(b.id)}
                            disabled={deletingId === b.id}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              cursor: deletingId === b.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete this booking"
                          >
                            <Trash2 style={{ width: '15px', height: '15px' }} />
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

        {/* Table Footer with Interactive Pagination Controls */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.8125rem',
          color: '#64748B'
        }}>
          {/* Left: Summary and Page Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <div>
              Showing <strong style={{ color: '#0F172A' }}>
                {filteredBookings.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong> to <strong style={{ color: '#0F172A' }}>
                {Math.min(safeCurrentPage * pageSize, filteredBookings.length)}
              </strong> of <strong style={{ color: '#0F172A' }}>{filteredBookings.length}</strong> bookings
              {filteredBookings.length !== bookings.length && (
                <span style={{ color: '#94A3B8', marginLeft: '4px' }}>
                  (filtered from {bookings.length} total)
                </span>
              )}
            </div>

            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#64748B' }}>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronsLeft style={{ width: '16px', height: '16px' }} />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
              </button>

              {/* Page Number Buttons */}
              {getPageNumbers().map((pageNum, idx) => {
                if (pageNum === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: '0 6px',
                        color: '#94A3B8',
                        fontSize: '0.875rem',
                        userSelect: 'none'
                      }}
                    >
                      ...
                    </span>
                  );
                }

                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      minWidth: '32px',
                      height: '32px',
                      padding: '0 8px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      backgroundColor: isActive ? '#2563EB' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#334155',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronsRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Booking Inspection Details Modal */}
      {inspectBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Booking #{inspectBooking.id}
                  </h3>
                  {inspectBooking.invoice_no && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366F1', backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>
                      Invoice #{inspectBooking.invoice_no}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: getStatusBadge(inspectBooking.booking_status).color,
                    backgroundColor: getStatusBadge(inspectBooking.booking_status).bg,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {inspectBooking.booking_status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>
                  {inspectBooking.trip_type} • {inspectBooking.car_type}
                </div>
              </div>

              <button
                onClick={() => setInspectBooking(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Route & Timing Box */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Trip Route & Schedule
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                  <strong>Pickup:</strong> {inspectBooking.from_address || '—'}
                </div>
                {inspectBooking.to_address && (
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
                    <strong>Drop:</strong> {inspectBooking.to_address}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: '#475569', marginTop: '8px' }}>
                  <span><strong>Date:</strong> {inspectBooking.date}</span>
                  <span><strong>Time:</strong> {inspectBooking.time}</span>
                  {inspectBooking.distance > 0 && <span><strong>Estimated Distance:</strong> {inspectBooking.distance} KM</span>}
                </div>
              </div>

              {/* Odometer & Running Telemetry */}
              {(inspectBooking.starting_km !== null || inspectBooking.closing_km !== null) && (
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '16px', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gauge style={{ width: '16px', height: '16px' }} />
                    <span>Odometer Reading & Run Distance</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: '#15803D', fontSize: '0.75rem' }}>Start KM:</span>
                      <div style={{ fontWeight: 800, color: '#14532D' }}>{inspectBooking.starting_km ?? '—'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#15803D', fontSize: '0.75rem' }}>Closing KM:</span>
                      <div style={{ fontWeight: 800, color: '#14532D' }}>{inspectBooking.closing_km ?? '—'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#15803D', fontSize: '0.75rem' }}>Total Run KM:</span>
                      <div style={{ fontWeight: 800, color: '#14532D' }}>
                        {inspectBooking.closing_km && inspectBooking.starting_km ? inspectBooking.closing_km - inspectBooking.starting_km : '—'} KM
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver & Customer Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Customer Details
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>{inspectBooking.customer_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{inspectBooking.customer_phone}</div>
                  {inspectBooking.agency_name && <div style={{ fontSize: '0.75rem', color: '#C2410C', marginTop: '2px' }}>Agency: {inspectBooking.agency_name}</div>}
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Driver & Vehicle
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>{inspectBooking.driver_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{inspectBooking.driver_phone || 'Phone: Unassigned'}</div>
                  {inspectBooking.vehicle_id && <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '2px' }}>Vehicle: {inspectBooking.vehicle_id}</div>}
                </div>
              </div>

              {/* Financial & Charges Breakdown */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Fare & Surcharge Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Base Package Fare:</span>
                    <span style={{ fontWeight: 700 }}>₹{inspectBooking.base_charge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Driver Allowance / TA:</span>
                    <span style={{ fontWeight: 700 }}>₹{inspectBooking.driver_ta || inspectBooking.driver_allowance}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Toll Charges:</span>
                    <span style={{ fontWeight: 700 }}>₹{inspectBooking.toll_charge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Parking Charges:</span>
                    <span style={{ fontWeight: 700 }}>₹{inspectBooking.parking_charge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Permit Charges:</span>
                    <span style={{ fontWeight: 700 }}>₹{inspectBooking.permit_charge}</span>
                  </div>
                  {inspectBooking.agent_commission > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                      <span>Agent Commission:</span>
                      <span style={{ fontWeight: 700 }}>₹{inspectBooking.agent_commission}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #E2E8F0'
                }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>Total Customer Fare:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A' }}>₹{inspectBooking.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => handleDeleteSingle(inspectBooking.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Trash2 style={{ width: '15px', height: '15px' }} />
                <span>Delete Booking</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleExportSinglePDF(inspectBooking)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                  }}
                  title="Download single duty manifest as PDF"
                >
                  <Download style={{ width: '15px', height: '15px', color: '#64748B' }} />
                  <span>Download Duty Slip (PDF)</span>
                </button>

                <a
                  href={`https://web-rentox.vercel.app/invoice?bookingId=${inspectBooking.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <span>View Full Invoice</span>
                  <ExternalLink style={{ width: '15px', height: '15px' }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. High-Security Delete All Bookings Modal */}
      {showDeleteAllModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            position: 'relative'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              <ShieldAlert style={{ width: '28px', height: '28px' }} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Delete All Active Bookings?
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
              You are about to clear all <strong>{bookings.length}</strong> records from the <code>bookings</code> table in your AWS MySQL database.
            </p>

            {/* Automated Backup Notice */}
            <div style={{
              backgroundColor: '#ECFDF5',
              borderRadius: '12px',
              border: '1px solid #A7F3D0',
              padding: '14px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#047857' }}>
                  Safety Backup Automated
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#065F46', margin: 0, lineHeight: '1.5' }}>
                A timestamped snapshot table (e.g. <code>bookings_backup_YYYYMMDD_HHMMSS</code>) will be created automatically before clearing, ensuring historical data can be restored at any time.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeletingAll}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                style={{
                  padding: '10px 22px',
                  backgroundColor: '#DC2626',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  cursor: isDeletingAll ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                }}
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    <span>Backing Up & Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                    <span>Confirm Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Bookings;
