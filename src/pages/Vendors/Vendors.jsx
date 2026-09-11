import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Building2,
  Car,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Plus,
  Activity,
  SlidersHorizontal,
  ExternalLink,
  Fuel,
  FileCheck,
  Award,
  Sparkles,
  Info,
  RotateCcw,
  Ban,
  Unlock,
  ShieldAlert,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const Vendors = () => {
  const { addToast } = useToast();

  // Data states
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({
    total_vendors: 0,
    total_vehicles: 0,
    total_drivers: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // Top Level View Tabs: 'vendors' | 'vehicles' | 'drivers' | 'assignments'
  const [activeTab, setActiveTab] = useState('vendors');

  // Search & Detailed Dropdown Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'active' | 'blocked' | 'notified' | 'pending' | 'suspended' | 'inactive'
  const [vehiclesFilter, setVehiclesFilter] = useState('All'); // 'All' | 'has_vehicles' | 'no_vehicles'
  const [driversFilter, setDriversFilter] = useState('All'); // 'All' | 'has_drivers' | 'no_drivers'
  const [cityFilter, setCityFilter] = useState('All');

  // Compact Quick Filter Chips
  const [quickFilter, setQuickFilter] = useState('All'); // 'All' | 'Active' | 'Blocked' | 'HasVehicles' | 'HasDrivers' | 'Both' | 'Empty'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const tableRef = useRef(null);

  // Copy state
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Inspect Fleet Drawer state
  const [inspectVendorPhone, setInspectVendorPhone] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Block / Unblock Modal States
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedVendorForBlock, setSelectedVendorForBlock] = useState(null);
  const [blockReasonCategory, setBlockReasonCategory] = useState('Payment Default / Overdue Commission');
  const [customBlockNote, setCustomBlockNote] = useState('');
  const [isBlockingLoading, setIsBlockingLoading] = useState(false);

  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedVendorForUnblock, setSelectedVendorForUnblock] = useState(null);
  const [isUnblockingLoading, setIsUnblockingLoading] = useState(false);

  // Add Vendor Modal state
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [addVendorForm, setAddVendorForm] = useState({
    vendor_name: '',
    agency_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    initial_vehicle: '',
    assigned_driver: '',
    status: 'active'
  });
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);

  // Vendor Wallet Adjustment Modal state
  const [showAdjustWalletModal, setShowAdjustWalletModal] = useState(false);
  const [selectedVendorForWallet, setSelectedVendorForWallet] = useState(null);
  const [walletAdjustType, setWalletAdjustType] = useState('credit'); // 'credit' | 'debit'
  const [walletAdjustAmount, setWalletAdjustAmount] = useState('');
  const [walletAdjustReason, setWalletAdjustReason] = useState('');
  const [isAdjustingWalletLoading, setIsAdjustingWalletLoading] = useState(false);

  // Vendor Wallet Passbook / History Modal state
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false);
  const [walletHistoryVendor, setWalletHistoryVendor] = useState(null);
  const [walletHistoryData, setWalletHistoryData] = useState(null);
  const [isWalletHistoryLoading, setIsWalletHistoryLoading] = useState(false);

  // Fetch all vendors and summary stats from AWS
  const fetchVendorsData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [vendorsRes, statsRes] = await Promise.all([
        axios.get(`${endpoints.vendorsManagement}?action=get_vendors&limit=500`, { timeout: 15000 }),
        axios.get(`${endpoints.vendorsManagement}?action=get_vendor_stats`, { timeout: 12000 })
      ]);

      if (vendorsRes.data && vendorsRes.data.status === 'success') {
        setVendors(vendorsRes.data.vendors || []);
      }
      if (statsRes.data && statsRes.data.status === 'success') {
        setStats(statsRes.data.stats || {});
      }
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (isManual) {
        addToast('Vendor & Fleet Partner registry refreshed.', 'success');
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      addToast('Unable to load vendors from AWS database.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendorsData();
  }, []);

  // Distinct sorted cities extracted from vendors data
  const availableCities = useMemo(() => {
    const citiesSet = new Set();
    vendors.forEach((v) => {
      const c = (v.city || '').trim();
      if (c) citiesSet.add(c.toUpperCase());
    });
    return Array.from(citiesSet).sort();
  }, [vendors]);

  // Derived KPI & Fleet Health metrics (calculated dynamically without hardcoding)
  const kpiMetrics = useMemo(() => {
    const total = stats.total_vendors || vendors.length;
    let active = 0;
    let blocked = 0;
    let notified = 0;
    let pending = 0;
    let hasVehicles = 0;
    let hasDrivers = 0;
    let fullFleet = 0;
    let zeroAssets = 0;
    let unassignedFleet = 0; // has vehicles but no drivers attached
    let totalWalletFloat = 0;
    let eligibleWallets = 0;
    let lowWallets = 0;

    vendors.forEach((v) => {
      const st = (v.status || '').toLowerCase().trim();
      if (st === 'blocked') {
        blocked++;
      } else if (['active', 'verified', 'filled'].includes(st)) {
        active++;
      } else if (st === 'notified') {
        notified++;
      } else {
        pending++;
      }

      if (v.vehicle_count > 0) hasVehicles++;
      if (v.driver_count > 0) hasDrivers++;
      if (v.vehicle_count > 0 && v.driver_count > 0) fullFleet++;
      if (v.vehicle_count === 0 && v.driver_count === 0) zeroAssets++;
      if (v.vehicle_count > 0 && v.driver_count === 0) unassignedFleet++;

      const bal = Number(v.wallet_balance || 0);
      totalWalletFloat += bal;
      if (bal >= 100) {
        eligibleWallets++;
      } else {
        lowWallets++;
      }
    });

    return {
      total,
      active,
      blocked,
      notified,
      pending,
      hasVehicles,
      hasDrivers,
      fullFleet,
      zeroAssets,
      unassignedFleet,
      totalVehicles: stats.total_vehicles || 0,
      totalDrivers: stats.total_drivers || 0,
      totalWalletFloat,
      eligibleWallets,
      lowWallets
    };
  }, [vendors, stats]);

  // Fetch detailed vendor fleet & drivers for the drawer
  const handleOpenInspect = async (vendor) => {
    setInspectVendorPhone(vendor.vendor_phone);
    setVendorDetails(null);
    setInspectLoading(true);

    try {
      const res = await axios.get(
        `${endpoints.vendorsManagement}?action=get_vendor_details&vendor_phone=${encodeURIComponent(vendor.vendor_phone)}`,
        { timeout: 15000 }
      );
      if (res.data && res.data.status === 'success') {
        setVendorDetails(res.data);
      } else {
        addToast(res.data?.message || 'Failed to load vendor fleet details.', 'error');
      }
    } catch (err) {
      console.error('Failed to load vendor details:', err);
      addToast('Error fetching vendor driver & vehicle details.', 'error');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleCloseInspect = () => {
    setInspectVendorPhone(null);
    setVendorDetails(null);
  };

  // Handle Vendor Block API action
  const handleConfirmBlock = async () => {
    if (!selectedVendorForBlock) return;

    const fullReason = blockReasonCategory === 'Other (Custom Reason)'
      ? (customBlockNote.trim() || 'Administrative restriction')
      : (customBlockNote.trim() ? `${blockReasonCategory} - ${customBlockNote.trim()}` : blockReasonCategory);

    setIsBlockingLoading(true);
    try {
      const res = await axios.post(
        endpoints.vendorsManagement,
        {
          action: 'toggle_vendor_block',
          vendor_phone: selectedVendorForBlock.vendor_phone,
          status: 'blocked',
          block_reason: fullReason
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data && res.data.status === 'success') {
        const nowIso = new Date().toISOString();
        addToast(`Vendor ${selectedVendorForBlock.vendor_name || selectedVendorForBlock.vendor_phone} blocked. Attached fleet drivers set offline.`, 'success');
        
        // Optimistically update vendor list in state
        setVendors((prev) =>
          prev.map((v) =>
            v.vendor_phone === selectedVendorForBlock.vendor_phone
              ? { ...v, status: 'blocked', block_reason: fullReason, blocked_at: nowIso }
              : v
          )
        );

        // If currently inspecting this vendor in drawer, update drawer state
        if (inspectVendorPhone === selectedVendorForBlock.vendor_phone) {
          setVendorDetails((prev) =>
            prev
              ? {
                  ...prev,
                  vendor: {
                    ...prev.vendor,
                    status: 'blocked',
                    block_reason: fullReason,
                    blocked_at: nowIso
                  },
                  drivers: prev.drivers?.map((d) => ({ ...d, is_online: 0 })) || []
                }
              : null
          );
        }

        setShowBlockModal(false);
        setSelectedVendorForBlock(null);
        setCustomBlockNote('');
      } else {
        addToast(res.data?.message || 'Failed to block vendor.', 'error');
      }
    } catch (err) {
      console.error('Error blocking vendor:', err);
      addToast('Network or server error blocking vendor.', 'error');
    } finally {
      setIsBlockingLoading(false);
    }
  };

  // Handle Vendor Unblock API action
  const handleConfirmUnblock = async () => {
    if (!selectedVendorForUnblock) return;

    setIsUnblockingLoading(true);
    try {
      const res = await axios.post(
        endpoints.vendorsManagement,
        {
          action: 'toggle_vendor_block',
          vendor_phone: selectedVendorForUnblock.vendor_phone,
          status: 'active',
          block_reason: ''
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data && res.data.status === 'success') {
        addToast(`Vendor ${selectedVendorForUnblock.vendor_name || selectedVendorForUnblock.vendor_phone} unblocked and restored to Active status.`, 'success');

        // Optimistically update vendor list in state
        setVendors((prev) =>
          prev.map((v) =>
            v.vendor_phone === selectedVendorForUnblock.vendor_phone
              ? { ...v, status: 'active', block_reason: '', blocked_at: null }
              : v
          )
        );

        // If currently inspecting this vendor in drawer, update drawer state
        if (inspectVendorPhone === selectedVendorForUnblock.vendor_phone) {
          setVendorDetails((prev) =>
            prev
              ? {
                  ...prev,
                  vendor: {
                    ...prev.vendor,
                    status: 'active',
                    block_reason: '',
                    blocked_at: null
                  }
                }
              : null
          );
        }

        setShowUnblockModal(false);
        setSelectedVendorForUnblock(null);
      } else {
        addToast(res.data?.message || 'Failed to unblock vendor.', 'error');
      }
    } catch (err) {
      console.error('Error unblocking vendor:', err);
      addToast('Network or server error unblocking vendor.', 'error');
    } finally {
      setIsUnblockingLoading(false);
    }
  };

  // Vendor Wallet Adjustment Handlers
  const handleOpenAdjustWallet = (vendor, type = 'credit') => {
    setSelectedVendorForWallet(vendor);
    setWalletAdjustType(type);
    setWalletAdjustAmount('');
    setWalletAdjustReason(type === 'credit' ? 'Admin Top-Up / Security Deposit' : 'Commission Adjustment / Deduction');
    setShowAdjustWalletModal(true);
  };

  const handleConfirmAdjustWallet = async (e) => {
    if (e) e.preventDefault();
    if (!selectedVendorForWallet) return;

    const rawAmt = parseFloat(walletAdjustAmount);
    if (!rawAmt || isNaN(rawAmt) || rawAmt <= 0) {
      addToast('Please enter a valid positive adjustment amount (greater than 0).', 'warning');
      return;
    }

    if (!walletAdjustReason.trim()) {
      addToast('Please enter a reason or note for this wallet adjustment.', 'warning');
      return;
    }

    const finalAmount = walletAdjustType === 'credit' ? rawAmt : -rawAmt;
    const currentBal = Number(selectedVendorForWallet.wallet_balance || 0);

    if (walletAdjustType === 'debit' && rawAmt > currentBal) {
      const proceed = window.confirm(
        `Caution: Deducting ₹${rawAmt.toFixed(2)} will exceed the current balance of ₹${currentBal.toFixed(2)} and result in a negative balance (₹${(currentBal - rawAmt).toFixed(2)}). Do you wish to continue?`
      );
      if (!proceed) return;
    }

    setIsAdjustingWalletLoading(true);
    try {
      const res = await axios.post(
        endpoints.vendorWallet,
        {
          action: 'admin_adjust',
          phone_number: selectedVendorForWallet.vendor_phone,
          amount: finalAmount,
          reason: walletAdjustReason.trim()
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data && res.data.status === 'success') {
        const newBalance = res.data.wallet_balance !== undefined
          ? Number(res.data.wallet_balance)
          : currentBal + finalAmount;

        addToast(
          `Wallet successfully ${walletAdjustType === 'credit' ? 'credited' : 'debited'} with ₹${rawAmt.toFixed(2)}. Current balance: ₹${newBalance.toFixed(2)}`,
          'success'
        );

        // Optimistically update vendor in local list
        setVendors((prev) =>
          prev.map((v) =>
            v.vendor_phone === selectedVendorForWallet.vendor_phone
              ? { ...v, wallet_balance: newBalance }
              : v
          )
        );

        // If currently open in inspect drawer, update it too
        if (inspectVendorPhone === selectedVendorForWallet.vendor_phone) {
          setVendorDetails((prev) =>
            prev
              ? {
                  ...prev,
                  vendor: {
                    ...prev.vendor,
                    wallet_balance: newBalance
                  }
                }
              : null
          );
        }

        setShowAdjustWalletModal(false);
        setSelectedVendorForWallet(null);
        setWalletAdjustAmount('');
        setWalletAdjustReason('');
      } else {
        addToast(res.data?.message || 'Failed to update vendor wallet balance.', 'error');
      }
    } catch (err) {
      console.error('Error adjusting vendor wallet:', err);
      addToast(err.response?.data?.message || 'Network error updating vendor wallet.', 'error');
    } finally {
      setIsAdjustingWalletLoading(false);
    }
  };

  const handleOpenWalletHistory = async (vendor) => {
    setSelectedVendorForWallet(vendor);
    setWalletHistoryVendor(vendor);
    setWalletHistoryData(null);
    setShowWalletHistoryModal(true);
    setIsWalletHistoryLoading(true);

    try {
      const res = await axios.get(
        `${endpoints.vendorWallet}?action=get_wallet&phone_number=${encodeURIComponent(vendor.vendor_phone)}`,
        { timeout: 15000 }
      );

      if (res.data && res.data.status === 'success') {
        setWalletHistoryData(res.data);
      } else {
        addToast(res.data?.message || 'Unable to load wallet passbook history.', 'error');
      }
    } catch (err) {
      console.error('Error fetching wallet passbook:', err);
      addToast('Error fetching vendor transaction history.', 'error');
    } finally {
      setIsWalletHistoryLoading(false);
    }
  };

  // Copy phone helper
  const handleCopyPhone = (phone, e) => {
    if (e) e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    addToast(`Phone number ${phone} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Export filtered vendors to CSV
  const handleExportCSV = () => {
    if (filteredVendors.length === 0) {
      addToast('No vendor records to export.', 'warning');
      return;
    }

    const headers = [
      'Vendor Name',
      'Agency Name',
      'Phone Number',
      'Email',
      'City',
      'Status',
      'Vehicle Count',
      'Driver Count',
      'Registration Date'
    ];

    const rows = filteredVendors.map((v) => [
      `"${(v.vendor_name || '').replace(/"/g, '""')}"`,
      `"${(v.agency_name || '').replace(/"/g, '""')}"`,
      `"${v.vendor_phone || ''}"`,
      `"${(v.email || '').replace(/"/g, '""')}"`,
      `"${(v.city || '').replace(/"/g, '""')}"`,
      `"${v.status || 'Active'}"`,
      v.vehicle_count || 0,
      v.driver_count || 0,
      `"${v.created_at || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rentox_vendors_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filteredVendors.length} vendors to CSV.`, 'success');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setVehiclesFilter('All');
    setDriversFilter('All');
    setCityFilter('All');
    setQuickFilter('All');
  };

  // Handle Add Vendor Submission (UI simulation with clean feedback)
  const handleCreateVendor = (e) => {
    e.preventDefault();
    if (!addVendorForm.vendor_name.trim() || !addVendorForm.phone.trim()) {
      addToast('Vendor name and phone number are required.', 'warning');
      return;
    }

    setIsSubmittingVendor(true);
    setTimeout(() => {
      setIsSubmittingVendor(false);
      setShowAddVendorModal(false);
      addToast(`Vendor partner "${addVendorForm.vendor_name}" recorded successfully.`, 'success');
      // Reset form
      setAddVendorForm({
        vendor_name: '',
        agency_name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        initial_vehicle: '',
        assigned_driver: '',
        status: 'active'
      });
    }, 600);
  };

  // Filtered vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchTerm.toLowerCase().trim();
      const status = (v.status || '').toLowerCase().trim();
      const name = (v.vendor_name || '').toLowerCase();
      const agency = (v.agency_name || '').toLowerCase();
      const phone = (v.vendor_phone || '').toLowerCase();
      const city = (v.city || '').toLowerCase();
      const email = (v.email || '').toLowerCase();

      // 1. Text Search across name, agency, phone, city, email
      const matchesSearch =
        !q ||
        name.includes(q) ||
        agency.includes(q) ||
        phone.includes(q) ||
        city.includes(q) ||
        email.includes(q);

      // 2. Status Dropdown Filter
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = ['active', 'verified', 'filled'].includes(status);
      } else if (statusFilter === 'blocked') {
        matchesStatus = status === 'blocked';
      } else if (statusFilter === 'notified') {
        matchesStatus = status === 'notified';
      } else if (statusFilter === 'pending') {
        matchesStatus = ['not join', 'pending', 'new'].includes(status);
      } else if (statusFilter === 'suspended') {
        matchesStatus = status === 'suspended';
      } else if (statusFilter === 'inactive') {
        matchesStatus = status === 'inactive';
      }

      // 3. Vehicles Dropdown Filter
      let matchesVehicles = true;
      if (vehiclesFilter === 'has_vehicles') {
        matchesVehicles = v.vehicle_count > 0;
      } else if (vehiclesFilter === 'no_vehicles') {
        matchesVehicles = v.vehicle_count === 0;
      }

      // 4. Drivers Dropdown Filter
      let matchesDrivers = true;
      if (driversFilter === 'has_drivers') {
        matchesDrivers = v.driver_count > 0;
      } else if (driversFilter === 'no_drivers') {
        matchesDrivers = v.driver_count === 0;
      }

      // 5. City Dropdown Filter
      let matchesCity = true;
      if (cityFilter !== 'All') {
        matchesCity = (v.city || '').toUpperCase() === cityFilter;
      }

      // 6. Compact Quick Filter Chips
      let matchesQuick = true;
      if (quickFilter === 'Active') {
        matchesQuick = ['active', 'verified', 'filled'].includes(status);
      } else if (quickFilter === 'Blocked') {
        matchesQuick = status === 'blocked';
      } else if (quickFilter === 'HasVehicles') {
        matchesQuick = v.vehicle_count > 0;
      } else if (quickFilter === 'HasDrivers') {
        matchesQuick = v.driver_count > 0;
      } else if (quickFilter === 'Both') {
        matchesQuick = v.vehicle_count > 0 && v.driver_count > 0;
      } else if (quickFilter === 'Empty') {
        matchesQuick = v.vehicle_count === 0 && v.driver_count === 0;
      }

      // 7. Top Level Tab Filter
      let matchesTab = true;
      if (activeTab === 'vehicles') {
        matchesTab = v.vehicle_count > 0;
      } else if (activeTab === 'drivers') {
        matchesTab = v.driver_count > 0;
      } else if (activeTab === 'assignments') {
        matchesTab = v.vehicle_count > 0 && v.driver_count > 0;
      } else if (activeTab === 'wallets') {
        matchesTab = true;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVehicles &&
        matchesDrivers &&
        matchesCity &&
        matchesQuick &&
        matchesTab
      );
    });
  }, [
    vendors,
    searchTerm,
    statusFilter,
    vehiclesFilter,
    driversFilter,
    cityFilter,
    quickFilter,
    activeTab
  ]);

  // Reset page to 1 whenever search, filter, or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    vehiclesFilter,
    driversFilter,
    cityFilter,
    quickFilter,
    activeTab,
    pageSize
  ]);

  // Pagination metrics
  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated subset of vendors
  const paginatedVendors = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredVendors.slice(startIndex, startIndex + pageSize);
  }, [filteredVendors, safeCurrentPage, pageSize]);

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

  // Small status pill helper
  const renderStatusBadge = (statusStr, vendor = null) => {
    const s = (statusStr || '').toLowerCase().trim();
    let bg = '#F1F5F9';
    let text = '#475569';
    let border = '#E2E8F0';
    let dot = '#94A3B8';
    let label = statusStr || 'Inactive';

    if (s === 'blocked') {
      bg = '#FEF2F2';
      text = '#DC2626';
      border = '#FECACA';
      dot = '#EF4444';
      label = 'Blocked';

      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: bg,
              color: text,
              border: `1px solid ${border}`
            }}
            title={vendor?.block_reason ? `Block Reason: ${vendor.block_reason}${vendor.blocked_at ? ` (${new Date(vendor.blocked_at).toLocaleString()})` : ''}` : 'Partner Account Blocked'}
          >
            <Ban style={{ width: '12px', height: '12px', color: '#DC2626' }} />
            <span>Blocked</span>
          </span>
          {vendor?.block_reason && (
            <span
              style={{
                fontSize: '0.6875rem',
                color: '#991B1B',
                fontWeight: 600,
                maxWidth: '170px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                backgroundColor: '#FEE2E2',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid #FECACA'
              }}
              title={`Reason: ${vendor.block_reason}${vendor.blocked_at ? `\nBlocked At: ${new Date(vendor.blocked_at).toLocaleString()}` : ''}`}
            >
              {vendor.block_reason}
            </span>
          )}
        </div>
      );
    }

    if (['active', 'verified', 'filled'].includes(s)) {
      bg = '#ECFDF5';
      text = '#059669';
      border = '#A7F3D0';
      dot = '#10B981';
      label = 'Active';
    } else if (s === 'notified' || s === 'pending' || s === 'not join' || s === 'new') {
      bg = '#FFFBEB';
      text = '#B45309';
      border = '#FDE68A';
      dot = '#F59E0B';
      label = s === 'notified' ? 'Notified' : 'Pending';
    } else if (s === 'suspended' || s === 'rejected') {
      bg = '#FEF2F2';
      text = '#DC2626';
      border = '#FECACA';
      dot = '#EF4444';
      label = 'Suspended';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: bg,
          color: text,
          border: `1px solid ${border}`
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: dot
          }}
        />
        {label}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', color: '#111827', minHeight: '100vh', backgroundColor: '#F7F8FA' }}>
      
      {/* ==================================================
          1. PAGE HEADER
          ================================================== */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#F59E0B',
            marginBottom: '4px'
          }}>
            PARTNER NETWORK & FLEET OWNERS
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.025em' }}>
            Vendors & Fleet Partners
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '0.9rem', maxWidth: '780px', lineHeight: 1.5 }}>
            Manage vendor agencies, fleet capacity, driver assignments, vehicle availability, and partner status from one workspace.
          </p>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddVendorModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#111827',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>Add Vendor</span>
            </button>

            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download style={{ width: '15px', height: '15px', color: '#64748B' }} />
              <span>Export</span>
            </button>

            <button
              onClick={() => fetchVendorsData(true)}
              disabled={refreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#334155',
                cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw style={{
                width: '15px',
                height: '15px',
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Sync indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748B' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981'
            }} />
            <span>Registry synced</span>
            {lastSynced && (
              <span style={{ color: '#94A3B8' }}>• Last synced: {lastSynced}</span>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          2. KPI SECTION (4 Dynamic Cards)
          ================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* TOTAL VENDORS */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL VENDORS
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Building2 style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {kpiMetrics.total}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
            Registered transport partners
          </div>
        </div>

        {/* ACTIVE VENDORS */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ACTIVE VENDORS
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
            {kpiMetrics.active}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#059669', marginTop: '4px' }}>
            Currently active partners
          </div>
        </div>

        {/* FLEET VEHICLES */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FLEET VEHICLES
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Car style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {kpiMetrics.totalVehicles}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
            Vehicles registered
          </div>
        </div>

        {/* ATTACHED DRIVERS */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ATTACHED DRIVERS
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Users style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {kpiMetrics.totalDrivers}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
            Drivers mapped to vendors
          </div>
        </div>
      </div>

      {/* ==================================================
          3. FLEET HEALTH SUMMARY
          ================================================== */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ width: '16px', height: '16px', color: '#059669' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Fleet Health & Readiness</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
              <span style={{ color: '#64748B' }}>Active:</span>
              <strong style={{ color: '#111827' }}>{kpiMetrics.active}</strong>
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
              <span style={{ color: '#64748B' }}>Blocked:</span>
              <strong style={{ color: '#DC2626' }}>{kpiMetrics.blocked}</strong>
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
              <span style={{ color: '#64748B' }}>Maintenance / Notified:</span>
              <strong style={{ color: '#111827' }}>{kpiMetrics.notified}</strong>
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span style={{ color: '#64748B' }}>Unavailable / Pending:</span>
              <strong style={{ color: '#111827' }}>{kpiMetrics.pending}</strong>
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94A3B8' }} />
              <span style={{ color: '#64748B' }}>Unassigned Fleet:</span>
              <strong style={{ color: '#111827' }}>{kpiMetrics.unassignedFleet}</strong>
            </span>
          </div>
        </div>

        {/* Subtle Horizontal Distribution / Progress Visualization */}
        {kpiMetrics.total > 0 && (
          <div style={{
            height: '8px',
            backgroundColor: '#F1F5F9',
            borderRadius: '6px',
            display: 'flex',
            overflow: 'hidden'
          }}>
            <div
              title={`Active: ${kpiMetrics.active}`}
              style={{
                width: `${(kpiMetrics.active / kpiMetrics.total) * 100}%`,
                backgroundColor: '#059669',
                transition: 'width 0.3s ease'
              }}
            />
            <div
              title={`Blocked: ${kpiMetrics.blocked}`}
              style={{
                width: `${(kpiMetrics.blocked / kpiMetrics.total) * 100}%`,
                backgroundColor: '#DC2626',
                transition: 'width 0.3s ease'
              }}
            />
            <div
              title={`Notified: ${kpiMetrics.notified}`}
              style={{
                width: `${(kpiMetrics.notified / kpiMetrics.total) * 100}%`,
                backgroundColor: '#D97706',
                transition: 'width 0.3s ease'
              }}
            />
            <div
              title={`Pending / Inactive: ${kpiMetrics.pending}`}
              style={{
                width: `${(kpiMetrics.pending / kpiMetrics.total) * 100}%`,
                backgroundColor: '#F87171',
                transition: 'width 0.3s ease'
              }}
            />
            <div
              title={`Unassigned: ${kpiMetrics.unassignedFleet}`}
              style={{
                width: `${(kpiMetrics.unassignedFleet / kpiMetrics.total) * 100}%`,
                backgroundColor: '#CBD5E1',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        )}
      </div>

      {/* ==================================================
          9. TABS (Subtle Enterprise Navigation)
          ================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid #E5E7EB',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => setActiveTab('vendors')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'vendors' ? '#111827' : '#64748B',
            borderBottom: activeTab === 'vendors' ? '2px solid #F59E0B' : '2px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 style={{ width: '16px', height: '16px', color: activeTab === 'vendors' ? '#F59E0B' : '#94A3B8' }} />
          <span>Vendors</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: activeTab === 'vendors' ? '#FEF3C7' : '#F1F5F9',
            color: activeTab === 'vendors' ? '#92400E' : '#64748B',
            fontWeight: 700
          }}>
            {vendors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'vehicles' ? '#111827' : '#64748B',
            borderBottom: activeTab === 'vehicles' ? '2px solid #F59E0B' : '2px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Car style={{ width: '16px', height: '16px', color: activeTab === 'vehicles' ? '#F59E0B' : '#94A3B8' }} />
          <span>Fleet Partners</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: activeTab === 'vehicles' ? '#FEF3C7' : '#F1F5F9',
            color: activeTab === 'vehicles' ? '#92400E' : '#64748B',
            fontWeight: 700
          }}>
            {kpiMetrics.hasVehicles}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'drivers' ? '#111827' : '#64748B',
            borderBottom: activeTab === 'drivers' ? '2px solid #F59E0B' : '2px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users style={{ width: '16px', height: '16px', color: activeTab === 'drivers' ? '#F59E0B' : '#94A3B8' }} />
          <span>Driver Rosters</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: activeTab === 'drivers' ? '#FEF3C7' : '#F1F5F9',
            color: activeTab === 'drivers' ? '#92400E' : '#64748B',
            fontWeight: 700
          }}>
            {kpiMetrics.hasDrivers}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'assignments' ? '#111827' : '#64748B',
            borderBottom: activeTab === 'assignments' ? '2px solid #F59E0B' : '2px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Award style={{ width: '16px', height: '16px', color: activeTab === 'assignments' ? '#F59E0B' : '#94A3B8' }} />
          <span>Full Fleet Assignments</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: activeTab === 'assignments' ? '#FEF3C7' : '#F1F5F9',
            color: activeTab === 'assignments' ? '#92400E' : '#64748B',
            fontWeight: 700
          }}>
            {kpiMetrics.fullFleet}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'wallets' ? '#111827' : '#64748B',
            borderBottom: activeTab === 'wallets' ? '2px solid #10B981' : '2px solid transparent',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Wallet style={{ width: '16px', height: '16px', color: activeTab === 'wallets' ? '#10B981' : '#94A3B8' }} />
          <span>Vendor Wallets</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: activeTab === 'wallets' ? '#D1FAE5' : '#F1F5F9',
            color: activeTab === 'wallets' ? '#065F46' : '#64748B',
            fontWeight: 700
          }}>
            ₹{kpiMetrics.totalWalletFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </button>
      </div>

      {/* WALLET MANAGEMENT KPI BANNER (when activeTab === 'wallets') */}
      {activeTab === 'wallets' && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
              }}>
                <Wallet style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#065F46' }}>
                  Vendor Capital & Wallet Management
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#047857' }}>
                  Manage driver/vendor security deposits, credit earnings, and inspect full transaction passbooks.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #6EE7B7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Total Floating Float
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064E3B', fontFamily: 'monospace' }}>
                  ₹{kpiMetrics.totalWalletFloat.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #6EE7B7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Local Taxi Eligible (≥ ₹100)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                  {kpiMetrics.eligibleWallets} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>/ {vendors.length}</span>
                </div>
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                  Low Balance (&lt; ₹100)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B91C1C' }}>
                  {kpiMetrics.lowWallets} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>vendors</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: '#065F46',
            borderTop: '1px solid #A7F3D0',
            paddingTop: '10px'
          }}>
            <Info style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            <span>
              <strong>Local Taxi Booking Rule:</strong> Vendors require at least <strong>₹100</strong> in their wallet balance to receive instant ride dispatch alerts. Admins can top up or deduct funds below at any time.
            </span>
          </div>
        </div>
      )}

      {/* ==================================================
          4. SEARCH & FILTER TOOLBAR
          ================================================== */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '14px 18px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        {/* Left: Search input */}
        <div style={{ position: 'relative', minWidth: '320px', flex: '1 1 320px' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#94A3B8'
          }} />
          <input
            type="text"
            placeholder="Search vendor, agency, phone, city, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 34px 9px 38px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>
          )}
        </div>

        {/* Right: Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              border: statusFilter !== 'All' ? '1px solid #F59E0B' : '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: statusFilter !== 'All' ? '#111827' : '#475569',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">Status: All</option>
            <option value="active">Status: Active</option>
            <option value="blocked">Status: Blocked ({kpiMetrics.blocked})</option>
            <option value="notified">Status: Notified</option>
            <option value="pending">Status: Pending</option>
            <option value="suspended">Status: Suspended</option>
            <option value="inactive">Status: Inactive</option>
          </select>

          {/* Vehicles Dropdown */}
          <select
            value={vehiclesFilter}
            onChange={(e) => setVehiclesFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              border: vehiclesFilter !== 'All' ? '1px solid #F59E0B' : '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: vehiclesFilter !== 'All' ? '#111827' : '#475569',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">Vehicles: All</option>
            <option value="has_vehicles">Has Vehicles (&gt;0)</option>
            <option value="no_vehicles">No Vehicles (0)</option>
          </select>

          {/* Drivers Dropdown */}
          <select
            value={driversFilter}
            onChange={(e) => setDriversFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              border: driversFilter !== 'All' ? '1px solid #F59E0B' : '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: driversFilter !== 'All' ? '#111827' : '#475569',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">Drivers: All</option>
            <option value="has_drivers">Has Drivers (&gt;0)</option>
            <option value="no_drivers">No Drivers (0)</option>
          </select>

          {/* City Dropdown */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              border: cityFilter !== 'All' ? '1px solid #F59E0B' : '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: cityFilter !== 'All' ? '#111827' : '#475569',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '180px'
            }}
          >
            <option value="All">City: All</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Reset Button */}
          {(searchTerm || statusFilter !== 'All' || vehiclesFilter !== 'All' || driversFilter !== 'All' || cityFilter !== 'All' || quickFilter !== 'All') && (
            <button
              onClick={handleResetFilters}
              title="Reset all search queries and filters"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw style={{ width: '13px', height: '13px' }} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          5. QUICK FILTERS (Compact Chips)
          ================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        {[
          { id: 'All', label: 'All Vendors', count: kpiMetrics.total },
          { id: 'Active', label: 'Active', count: kpiMetrics.active },
          { id: 'Blocked', label: 'Blocked', count: kpiMetrics.blocked },
          { id: 'HasVehicles', label: 'Has Vehicles', count: kpiMetrics.hasVehicles },
          { id: 'HasDrivers', label: 'Has Drivers', count: kpiMetrics.hasDrivers },
          { id: 'Both', label: 'Full Fleet', count: kpiMetrics.fullFleet },
          { id: 'Empty', label: 'Zero Assets', count: kpiMetrics.zeroAssets }
        ].map((chip) => {
          const isSelected = quickFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setQuickFilter(chip.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                color: isSelected ? '#B45309' : '#475569',
                border: isSelected ? '1px solid #F59E0B' : '1px solid #E5E7EB'
              }}
            >
              <span>{chip.label}</span>
              <span style={{
                fontSize: '0.75rem',
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#FDE68A' : '#F1F5F9',
                color: isSelected ? '#92400E' : '#64748B',
                fontWeight: 600
              }}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================================================
          6 & 7. VENDOR TABLE & ROW DESIGN
          ================================================== */}
      <div
        ref={tableRef}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#F59E0B' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Loading Vendors & Fleet Network...</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>Querying AWS live driver and vehicle associations</div>
          </div>
        ) : filteredVendors.length === 0 ? (
          /* ==================================================
             12. EMPTY STATES
             ================================================== */
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <Building2 style={{ width: '44px', height: '44px', margin: '0 auto 12px', color: '#CBD5E1' }} />
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>No vendors found</div>
            <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '420px', margin: '6px auto 18px', lineHeight: 1.5 }}>
              Try changing your filters or search query to find the desired vendor partners.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '8px 18px',
                backgroundColor: '#111827',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E5E7EB',
                  color: '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '14px 20px' }}>VENDOR</th>
                  <th style={{ padding: '14px 20px' }}>CONTACT</th>
                  <th style={{ padding: '14px 20px' }}>LOCATION</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>FLEET</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>DRIVERS</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>WALLET</th>
                  <th style={{ padding: '14px 20px' }}>STATUS</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVendors.map((vendor, idx) => {
                  const hasVehicles = vendor.vehicle_count > 0;
                  const hasDrivers = vendor.driver_count > 0;
                  const isCopied = copiedPhone === vendor.vendor_phone;

                  return (
                    <tr
                      key={vendor.vendor_phone || idx}
                      style={{
                        minHeight: '82px',
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      {/* 1. VENDOR CELL */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: hasVehicles ? '#FEF3C7' : '#F1F5F9',
                            color: hasVehicles ? '#B45309' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9375rem',
                            flexShrink: 0
                          }}>
                            {vendor.vendor_name ? vendor.vendor_name.charAt(0).toUpperCase() : 'V'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem' }}>
                              {vendor.vendor_name || 'Transport Partner'}
                            </div>
                            {vendor.agency_name ? (
                              <div style={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building2 style={{ width: '13px', height: '13px' }} />
                                {vendor.agency_name}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                Independent Partner
                              </div>
                            )}
                            {vendor.email && (
                              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                                {vendor.email.toLowerCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. CONTACT */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#111827', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {vendor.vendor_phone}
                          </span>
                          <button
                            onClick={(e) => handleCopyPhone(vendor.vendor_phone, e)}
                            title="Copy phone number"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '4px',
                              cursor: 'pointer',
                              color: isCopied ? '#059669' : '#94A3B8',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            {isCopied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                          </button>
                        </div>
                      </td>

                      {/* 3. LOCATION */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {vendor.city ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: '#334155', fontWeight: 500 }}>
                            <MapPin style={{ width: '13px', height: '13px', color: '#F59E0B' }} />
                            <span>{vendor.city}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>—</span>
                        )}
                      </td>

                      {/* 4. FLEET */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          backgroundColor: hasVehicles ? '#ECFDF5' : '#F1F5F9',
                          color: hasVehicles ? '#059669' : '#94A3B8',
                          border: hasVehicles ? '1px solid #A7F3D0' : '1px solid #E2E8F0'
                        }}>
                          <Car style={{ width: '14px', height: '14px' }} />
                          <span>{vendor.vehicle_count} {vendor.vehicle_count === 1 ? 'Vehicle' : 'Vehicles'}</span>
                        </span>
                      </td>

                      {/* 5. DRIVERS */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          backgroundColor: hasDrivers ? '#EFF6FF' : '#F1F5F9',
                          color: hasDrivers ? '#2563EB' : '#94A3B8',
                          border: hasDrivers ? '1px solid #BFDBFE' : '1px solid #E2E8F0'
                        }}>
                          <Users style={{ width: '14px', height: '14px' }} />
                          <span>{vendor.driver_count} {vendor.driver_count === 1 ? 'Driver' : 'Drivers'}</span>
                        </span>
                      </td>

                      {/* 6. WALLET */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                          <span style={{
                            fontSize: '0.9375rem',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: Number(vendor.wallet_balance || 0) >= 100 ? '#047857' : Number(vendor.wallet_balance || 0) > 0 ? '#B45309' : '#DC2626'
                          }}>
                            ₹{Number(vendor.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {Number(vendor.wallet_balance || 0) >= 100 ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: '#065F46',
                              backgroundColor: '#D1FAE5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              <CheckCircle2 style={{ width: '10px', height: '10px' }} />
                              Eligible (≥ ₹100)
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: '#991B1B',
                              backgroundColor: '#FEE2E2',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              <AlertTriangle style={{ width: '10px', height: '10px' }} />
                              Low (&lt; ₹100)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. STATUS */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {renderStatusBadge(vendor.status, vendor)}
                      </td>

                      {/* 7. ACTIONS */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {vendor.status === 'blocked' ? (
                            <button
                              onClick={() => {
                                setSelectedVendorForUnblock(vendor);
                                setShowUnblockModal(true);
                              }}
                              title="Unblock Partner Account"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '7px 12px',
                                backgroundColor: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#047857',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#D1FAE5';
                                e.currentTarget.style.borderColor = '#6EE7B7';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ECFDF5';
                                e.currentTarget.style.borderColor = '#A7F3D0';
                              }}
                            >
                              <Unlock style={{ width: '13px', height: '13px' }} />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedVendorForBlock(vendor);
                                setBlockReasonCategory('Payment Default / Overdue Commission');
                                setCustomBlockNote('');
                                setShowBlockModal(true);
                              }}
                              title="Block Partner Account"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '7px 12px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #FECACA',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#DC2626',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEF2F2';
                                e.currentTarget.style.borderColor = '#EF4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#FECACA';
                              }}
                            >
                              <Ban style={{ width: '13px', height: '13px' }} />
                              <span>Block</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenAdjustWallet(vendor, 'credit')}
                            title="Adjust Vendor Wallet Balance (Credit / Debit)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '7px 11px',
                              backgroundColor: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#15803D',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#DCFCE7';
                              e.currentTarget.style.borderColor = '#86EFAC';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#F0FDF4';
                              e.currentTarget.style.borderColor = '#BBF7D0';
                            }}
                          >
                            <Wallet style={{ width: '13px', height: '13px' }} />
                            <span>Adjust</span>
                          </button>

                          <button
                            onClick={() => handleOpenWalletHistory(vendor)}
                            title="View Transaction Passbook"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '7px 11px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#475569',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F1F5F9';
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.color = '#1E293B';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#F8FAFC';
                              e.currentTarget.style.borderColor = '#E2E8F0';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            <Receipt style={{ width: '13px', height: '13px' }} />
                            <span>Passbook</span>
                          </button>

                          <button
                            onClick={() => handleOpenInspect(vendor)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#111827',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FFFBEB';
                              e.currentTarget.style.borderColor = '#F59E0B';
                              e.currentTarget.style.color = '#B45309';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.color = '#111827';
                            }}
                          >
                            <span>Inspect</span>
                            <ChevronRight style={{ width: '13px', height: '13px', color: '#94A3B8' }} />
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

        {/* ==================================================
            PAGINATION CONTROLS
            ================================================== */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E5E7EB',
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
              Showing <strong style={{ color: '#111827' }}>
                {filteredVendors.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong> to <strong style={{ color: '#111827' }}>
                {Math.min(safeCurrentPage * pageSize, filteredVendors.length)}
              </strong> of <strong style={{ color: '#111827' }}>{filteredVendors.length}</strong> vendors
              {filteredVendors.length !== vendors.length && (
                <span style={{ color: '#94A3B8', marginLeft: '4px' }}>
                  (filtered from {vendors.length} total)
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
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#111827',
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

          {/* Right: Page Navigation Buttons */}
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
                  border: '1px solid #E5E7EB',
                  backgroundColor: safeCurrentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronsLeft style={{ width: '15px', height: '15px' }} />
              </button>

              {/* Prev Page */}
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
                  border: '1px solid #E5E7EB',
                  backgroundColor: safeCurrentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronLeft style={{ width: '15px', height: '15px' }} />
              </button>

              {/* Numbers */}
              {getPageNumbers().map((pageNum, i) => {
                if (pageNum === '...') {
                  return (
                    <span key={`el-${i}`} style={{ padding: '0 6px', color: '#94A3B8', fontSize: '0.875rem' }}>
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
                      border: isActive ? '1px solid #111827' : '1px solid #E5E7EB',
                      backgroundColor: isActive ? '#111827' : '#FFFFFF',
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
                  border: '1px solid #E5E7EB',
                  backgroundColor: safeCurrentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronRight style={{ width: '15px', height: '15px' }} />
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
                  border: '1px solid #E5E7EB',
                  backgroundColor: safeCurrentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronsRight style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          8. INSPECT FLEET DRAWER (Right-Side Drawer: 460px)
          ================================================== */}
      {inspectVendorPhone && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            width: '100%',
            maxWidth: '480px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            borderLeft: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                  marginBottom: '6px'
                }}>
                  VENDOR DETAILS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {vendorDetails?.vendor?.vendor_name ? vendorDetails.vendor.vendor_name.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      {vendorDetails?.vendor?.vendor_name || 'Loading Vendor...'}
                    </h2>
                    {vendorDetails?.vendor?.agency_name && (
                      <div style={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 600 }}>
                        {vendorDetails.vendor.agency_name}
                      </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      {renderStatusBadge(vendorDetails?.vendor?.status, vendorDetails?.vendor)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseInspect}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Drawer Body */}
            {inspectLoading ? (
              <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748B', flex: 1 }}>
                <RefreshCw style={{ width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#F59E0B' }} />
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>Loading Vendor Fleet & Drivers...</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>Querying live database associations</div>
              </div>
            ) : vendorDetails ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {/* 0. ACCOUNT SUSPENSION BANNER */}
                {vendorDetails.vendor.status === 'blocked' && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)'
                  }}>
                    <Ban style={{ width: '20px', height: '20px', color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991B1B' }}>
                        Partner Account Suspended / Blocked
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: '3px' }}>
                        <strong>Reason:</strong> {vendorDetails.vendor.block_reason || 'Administrative restriction'}
                      </div>
                      {vendorDetails.vendor.blocked_at && (
                        <div style={{ fontSize: '0.75rem', color: '#7F1D1D', marginTop: '4px' }}>
                          Blocked on: {new Date(vendorDetails.vendor.blocked_at).toLocaleString()}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#991B1B', marginTop: '6px', fontStyle: 'italic' }}>
                        All attached fleet drivers are forced offline. Bookings cannot be dispatched to this vendor until unblocked.
                      </div>
                    </div>
                  </div>
                )}
                {/* 1. CONTACT SECTION */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    CONTACT
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Phone:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{vendorDetails.vendor.vendor_phone}</strong>
                        <button
                          onClick={(e) => handleCopyPhone(vendorDetails.vendor.vendor_phone, e)}
                          title="Copy phone"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94A3B8' }}
                        >
                          <Copy style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Email:</span>
                      <strong style={{ color: '#111827' }}>{vendorDetails.vendor.email || 'Not Provided'}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>City:</span>
                      <strong style={{ color: '#111827' }}>{vendorDetails.vendor.city || 'Not Specified'}</strong>
                    </div>

                    {vendorDetails.vendor.address && (
                      <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Address:</span>
                        <div style={{ color: '#334155', fontSize: '0.75rem', lineHeight: 1.4 }}>
                          {vendorDetails.vendor.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. FLEET OVERVIEW MINI CARDS */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    FLEET OVERVIEW
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Vehicles</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                        {vendorDetails.vehicle_count}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Drivers</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                        {vendorDetails.driver_count}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Availability</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: vendorDetails.vehicle_count > 0 ? '#059669' : '#64748B', marginTop: '6px' }}>
                        {vendorDetails.vehicle_count > 0 ? 'Ready' : 'Standby'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2.5 VENDOR WALLET & SECURITY FLOAT */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    VENDOR WALLET & SECURITY FLOAT
                  </div>
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Wallet style={{ width: '20px', height: '20px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Available Balance</div>
                          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>
                            ₹{Number(vendorDetails.vendor.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div>
                        {Number(vendorDetails.vendor.wallet_balance || 0) >= 100 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                            Local Taxi Eligible
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <AlertTriangle style={{ width: '12px', height: '12px' }} />
                            Min ₹100 Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                      <button
                        onClick={() => handleOpenAdjustWallet(vendorDetails.vendor, 'credit')}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#059669',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus style={{ width: '14px', height: '14px' }} />
                        <span>Credit / Top-Up</span>
                      </button>
                      <button
                        onClick={() => handleOpenAdjustWallet(vendorDetails.vendor, 'debit')}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw style={{ width: '13px', height: '13px' }} />
                        <span>Debit / Deduct</span>
                      </button>
                      <button
                        onClick={() => handleOpenWalletHistory(vendorDetails.vendor)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <Receipt style={{ width: '14px', height: '14px' }} />
                        <span>Passbook</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. REGISTERED VEHICLES */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
                      REGISTERED VEHICLES ({vendorDetails.vehicle_count})
                    </span>
                  </div>

                  {vendorDetails.vehicles.length === 0 ? (
                    <div style={{ padding: '24px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                      <Car style={{ width: '28px', height: '28px', margin: '0 auto 6px', color: '#CBD5E1' }} />
                      <div>No vehicles registered under this vendor.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {vendorDetails.vehicles.map((v, i) => (
                        <div
                          key={v.id || i}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '0.8125rem',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                backgroundColor: '#F1F5F9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                color: '#111827'
                              }}>
                                {v.vehicle_number}
                              </span>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B', marginTop: '4px' }}>
                                {v.vehicle_name || 'Vehicle'}
                              </div>
                            </div>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE'
                            }}>
                              {v.vehicle_type}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                            <span>Fuel: <strong>{v.fuel_type || '—'}</strong></span>
                            <span>RC: <strong>{v.rc_name || '—'}</strong></span>
                            <span>Status: <strong style={{ color: v.status === 'active' ? '#059669' : '#D97706' }}>{v.status || 'Active'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. ASSIGNED DRIVERS */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
                      ASSIGNED DRIVERS ({vendorDetails.driver_count})
                    </span>
                  </div>

                  {vendorDetails.drivers.length === 0 ? (
                    <div style={{ padding: '24px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                      <Users style={{ width: '28px', height: '28px', margin: '0 auto 6px', color: '#CBD5E1' }} />
                      <div>No drivers attached to this vendor.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {vendorDetails.drivers.map((d, i) => (
                        <div
                          key={d.driver_id || i}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8125rem'
                              }}>
                                {d.full_name ? d.full_name.charAt(0).toUpperCase() : 'D'}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                                  {d.full_name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                                  {d.phone_number}
                                </div>
                              </div>
                            </div>

                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: d.is_online ? '#ECFDF5' : '#F1F5F9',
                              color: d.is_online ? '#059669' : '#64748B',
                              border: d.is_online ? '1px solid #A7F3D0' : '1px solid #E2E8F0'
                            }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: d.is_online ? '#10B981' : '#94A3B8'
                              }} />
                              {d.is_online ? 'Online' : 'Offline'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                            <span>License: <strong style={{ fontFamily: 'monospace' }}>{d.license_no || '—'}</strong></span>
                            <span>City: <strong>{d.driver_city || '—'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. ACTIONS */}
                <div style={{
                  paddingTop: '14px',
                  borderTop: '1px solid #E5E7EB',
                  display: 'flex',
                  gap: '10px'
                }}>
                  {vendorDetails.vendor.status === 'blocked' ? (
                    <button
                      onClick={() => {
                        setSelectedVendorForUnblock(vendorDetails.vendor);
                        setShowUnblockModal(true);
                      }}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px',
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#047857',
                        cursor: 'pointer'
                      }}
                    >
                      <Unlock style={{ width: '14px', height: '14px' }} />
                      <span>Unblock Partner</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedVendorForBlock(vendorDetails.vendor);
                        setBlockReasonCategory('Payment Default / Overdue Commission');
                        setCustomBlockNote('');
                        setShowBlockModal(true);
                      }}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#DC2626',
                        cursor: 'pointer'
                      }}
                    >
                      <Ban style={{ width: '14px', height: '14px' }} />
                      <span>Block Partner</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      addToast(`Partner settings for ${vendorDetails.vendor.vendor_name} opened.`, 'info');
                    }}
                    style={{
                      flex: 1,
                      padding: '9px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#111827',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Vendor
                  </button>

                  <button
                    onClick={() => {
                      addToast(`Fleet inventory manager opened for ${vendorDetails.vendor.vendor_name}.`, 'info');
                    }}
                    style={{
                      flex: 1,
                      padding: '9px',
                      backgroundColor: '#111827',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    Manage Fleet
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ==================================================
          10. ADD VENDOR MODAL
          ================================================== */}
      {showAddVendorModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Add Transport Vendor Partner
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '2px 0 0' }}>
                  Register a new agency, independent fleet partner, and contact credentials.
                </p>
              </div>
              <button
                onClick={() => setShowAddVendorModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateVendor} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Vendor Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    VENDOR NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={addVendorForm.vendor_name}
                    onChange={(e) => setAddVendorForm({ ...addVendorForm, vendor_name: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    AGENCY / COMPANY
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Skyline Travels"
                    value={addVendorForm.agency_name}
                    onChange={(e) => setAddVendorForm({ ...addVendorForm, agency_name: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={addVendorForm.phone}
                    onChange={(e) => setAddVendorForm({ ...addVendorForm, phone: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={addVendorForm.email}
                    onChange={(e) => setAddVendorForm({ ...addVendorForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    OPERATIONAL CITY
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={addVendorForm.city}
                    onChange={(e) => setAddVendorForm({ ...addVendorForm, city: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    REGISTERED ADDRESS
                  </label>
                  <input
                    type="text"
                    placeholder="Full business address"
                    value={addVendorForm.address}
                    onChange={(e) => setAddVendorForm({ ...addVendorForm, address: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  INITIAL PARTNER STATUS
                </label>
                <select
                  value={addVendorForm.status}
                  onChange={(e) => setAddVendorForm({ ...addVendorForm, status: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="pending">Pending Onboarding</option>
                  <option value="notified">Notified</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingVendor}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#111827',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    cursor: isSubmittingVendor ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingVendor ? 'Saving Partner...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================
          11. BLOCK VENDOR MODAL
          ================================================== */}
      {showBlockModal && selectedVendorForBlock && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #FEE2E2',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FEF2F2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626'
                }}>
                  <Ban style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                    Block Vendor Partner
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#B91C1C', margin: '2px 0 0' }}>
                    Restrict portal access & force attached fleet offline
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isBlockingLoading) {
                    setShowBlockModal(false);
                    setSelectedVendorForBlock(null);
                  }
                }}
                disabled={isBlockingLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: isBlockingLoading ? 'not-allowed' : 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Target Vendor Summary Card */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827' }}>
                    {selectedVendorForBlock.vendor_name || 'Transport Partner'}
                  </div>
                  {selectedVendorForBlock.agency_name && (
                    <div style={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 600 }}>
                      {selectedVendorForBlock.agency_name}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                    {selectedVendorForBlock.vendor_phone}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                  <div>Fleet: <strong style={{ color: '#111827' }}>{selectedVendorForBlock.vehicle_count || 0} Cars</strong></div>
                  <div>Drivers: <strong style={{ color: '#111827' }}>{selectedVendorForBlock.driver_count || 0} Attached</strong></div>
                </div>
              </div>

              {/* Safety Alert */}
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.8125rem',
                color: '#92400E'
              }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ lineHeight: 1.45 }}>
                  <strong>Safety Action:</strong> Blocking this vendor will prevent new trip dispatches and immediately force <strong>{selectedVendorForBlock.driver_count || 0} attached driver(s)</strong> offline.
                </div>
              </div>

              {/* Reason Category Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Primary Block Reason *
                </label>
                <select
                  value={blockReasonCategory}
                  onChange={(e) => setBlockReasonCategory(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    fontWeight: 500,
                    outline: 'none'
                  }}
                >
                  <option value="Payment Default / Overdue Commission">Payment Default / Overdue Commission</option>
                  <option value="Customer Dispute / Misbehavior">Customer Dispute / Misbehavior</option>
                  <option value="Rash Driving / Safety Violation">Rash Driving / Safety Violation</option>
                  <option value="Document Verification Failure / Expired RC or DL">Document Verification Failure / Expired RC or DL</option>
                  <option value="Non-fulfillment of Accepted Bookings">Non-fulfillment of Accepted Bookings</option>
                  <option value="Fraudulent Activity / Rate Manipulation">Fraudulent Activity / Rate Manipulation</option>
                  <option value="Other (Custom Reason)">Other (Custom Reason)</option>
                </select>
              </div>

              {/* Additional Details Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Specific Reason Details / Administrative Notes {blockReasonCategory === 'Other (Custom Reason)' ? '*' : '(Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={customBlockNote}
                  onChange={(e) => setCustomBlockNote(e.target.value)}
                  placeholder="e.g. Outstanding commission ₹14,200 pending for 45 days. Disregard of 3 reminders."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    color: '#111827',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '6px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockModal(false);
                    setSelectedVendorForBlock(null);
                  }}
                  disabled={isBlockingLoading}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: isBlockingLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={isBlockingLoading || (blockReasonCategory === 'Other (Custom Reason)' && !customBlockNote.trim())}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    backgroundColor: '#DC2626',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isBlockingLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
                    opacity: isBlockingLoading ? 0.8 : 1
                  }}
                >
                  {isBlockingLoading ? (
                    <>
                      <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      <span>Blocking Partner...</span>
                    </>
                  ) : (
                    <>
                      <Ban style={{ width: '16px', height: '16px' }} />
                      <span>Confirm & Block Vendor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          12. UNBLOCK VENDOR MODAL
          ================================================== */}
      {showUnblockModal && selectedVendorForUnblock && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #A7F3D0',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ECFDF5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#D1FAE5',
                  border: '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <Unlock style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#065F46', margin: 0 }}>
                    Unblock Vendor Partner
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#047857', margin: '2px 0 0' }}>
                    Restore active standing & permit fleet dispatch
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isUnblockingLoading) {
                    setShowUnblockModal(false);
                    setSelectedVendorForUnblock(null);
                  }
                }}
                disabled={isUnblockingLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: isUnblockingLoading ? 'not-allowed' : 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to unblock <strong>{selectedVendorForUnblock.vendor_name || selectedVendorForUnblock.vendor_phone}</strong>?
              </p>

              {selectedVendorForUnblock.block_reason && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ color: '#991B1B', fontWeight: 700 }}>Recorded Block Reason:</div>
                  <div style={{ color: '#B91C1C', marginTop: '2px' }}>{selectedVendorForUnblock.block_reason}</div>
                  {selectedVendorForUnblock.blocked_at && (
                    <div style={{ color: '#7F1D1D', fontSize: '0.75rem', marginTop: '3px' }}>
                      Blocked on: {new Date(selectedVendorForUnblock.blocked_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.8125rem',
                color: '#1E40AF',
                lineHeight: 1.45
              }}>
                <CheckCircle2 style={{ width: '15px', height: '15px', display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px', color: '#2563EB' }} />
                Unblocking will restore this vendor to <strong>Active</strong> status. Attached fleet drivers will regain access to go online.
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnblockModal(false);
                    setSelectedVendorForUnblock(null);
                  }}
                  disabled={isUnblockingLoading}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: isUnblockingLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmUnblock}
                  disabled={isUnblockingLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    backgroundColor: '#059669',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isUnblockingLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {isUnblockingLoading ? (
                    <>
                      <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      <span>Unblocking...</span>
                    </>
                  ) : (
                    <>
                      <Unlock style={{ width: '16px', height: '16px' }} />
                      <span>Confirm Unblock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ==================================================
          10. VENDOR WALLET ADJUSTMENT MODAL
          ================================================== */}
      {showAdjustWalletModal && selectedVendorForWallet && (() => {
        const curBal = Number(selectedVendorForWallet.wallet_balance || 0);
        const parsedAmt = parseFloat(walletAdjustAmount) || 0;
        const projectedBal = walletAdjustType === 'credit' ? (curBal + parsedAmt) : (curBal - parsedAmt);
        const willBeNegative = projectedBal < 0;
        const willBeEligible = projectedBal >= 100;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              animation: 'fadeIn 0.15s ease'
            }}
            onClick={() => {
              if (!isAdjustingWalletLoading) {
                setShowAdjustWalletModal(false);
                setSelectedVendorForWallet(null);
              }
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: walletAdjustType === 'credit' ? '#F0FDF4' : '#FFFBEB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: walletAdjustType === 'credit' ? '#DCFCE7' : '#FEE2E2',
                    color: walletAdjustType === 'credit' ? '#15803D' : '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Wallet style={{ width: '22px', height: '22px' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
                      Vendor Wallet Adjustment
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                      {selectedVendorForWallet.vendor_name || 'Vendor'} • {selectedVendorForWallet.vendor_phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdjustingWalletLoading) {
                      setShowAdjustWalletModal(false);
                      setSelectedVendorForWallet(null);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleConfirmAdjustWallet} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Current Balance & Eligibility Card */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Current Wallet Balance
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: curBal >= 100 ? '#047857' : '#DC2626', fontFamily: 'monospace' }}>
                      ₹{curBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    {curBal >= 100 ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                        Local Taxi Active (≥ ₹100)
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <AlertTriangle style={{ width: '12px', height: '12px' }} />
                        Low Balance (&lt; ₹100)
                      </span>
                    )}
                  </div>
                </div>

                {/* Adjustment Action Toggle Tabs */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Action Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setWalletAdjustType('credit');
                        if (!walletAdjustReason || walletAdjustReason.includes('Deduction')) {
                          setWalletAdjustReason('Admin Top-Up / Security Deposit');
                        }
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: walletAdjustType === 'credit' ? '#059669' : 'transparent',
                        color: walletAdjustType === 'credit' ? '#FFFFFF' : '#475569',
                        boxShadow: walletAdjustType === 'credit' ? '0 1px 3px rgba(5, 150, 105, 0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus style={{ width: '15px', height: '15px' }} />
                      <span>Credit (+) Add Funds</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWalletAdjustType('debit');
                        if (!walletAdjustReason || walletAdjustReason.includes('Top-Up')) {
                          setWalletAdjustReason('Commission Adjustment / Deduction');
                        }
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: walletAdjustType === 'debit' ? '#DC2626' : 'transparent',
                        color: walletAdjustType === 'debit' ? '#FFFFFF' : '#475569',
                        boxShadow: walletAdjustType === 'debit' ? '0 1px 3px rgba(220, 38, 38, 0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <RotateCcw style={{ width: '15px', height: '15px' }} />
                      <span>Debit (-) Deduct Funds</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input & Quick Chips */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                      Adjustment Amount (₹) *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {walletAdjustType === 'credit' ? 'Amount to add' : 'Amount to deduct'}
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: walletAdjustType === 'credit' ? '#059669' : '#DC2626'
                    }}>
                      {walletAdjustType === 'credit' ? '+₹' : '-₹'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={walletAdjustAmount}
                      onChange={(e) => setWalletAdjustAmount(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px 12px 48px',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        color: '#111827'
                      }}
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[100, 500, 1000, 2000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWalletAdjustAmount(String(preset))}
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EEF2F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      >
                        +{preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWalletAdjustAmount('')}
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        color: '#94A3B8',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Safe Real-Time Calculation Preview Card */}
                {parsedAmt > 0 && (
                  <div style={{
                    backgroundColor: willBeNegative ? '#FEF2F2' : '#F8FAFC',
                    border: willBeNegative ? '1px solid #FECACA' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.8125rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Balance Calculation Preview
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#475569' }}>
                      <span>Current Balance:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{curBal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: walletAdjustType === 'credit' ? '#059669' : '#DC2626', fontWeight: 700 }}>
                      <span>Adjustment ({walletAdjustType === 'credit' ? 'Credit' : 'Debit'}):</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {walletAdjustType === 'credit' ? `+ ₹${parsedAmt.toFixed(2)}` : `- ₹${parsedAmt.toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: '1px solid #E2E8F0',
                      fontSize: '0.9375rem',
                      fontWeight: 800,
                      color: willBeNegative ? '#B91C1C' : willBeEligible ? '#047857' : '#D97706'
                    }}>
                      <span>Projected New Balance:</span>
                      <span style={{ fontFamily: 'monospace' }}>₹{projectedBal.toFixed(2)}</span>
                    </div>

                    {willBeNegative && (
                      <div style={{ marginTop: '8px', color: '#B91C1C', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Warning: This deduction exceeds available funds and puts the wallet into debt.</span>
                      </div>
                    )}
                    {!willBeNegative && willBeEligible && (
                      <div style={{ marginTop: '8px', color: '#047857', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Partner will be eligible for instant Local Taxi dispatches (≥ ₹100).</span>
                      </div>
                    )}
                    {!willBeNegative && !willBeEligible && (
                      <div style={{ marginTop: '8px', color: '#B45309', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>Partner requires at least ₹100 to receive Local Taxi dispatches.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason / Admin Audit Note */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Reason / Statement Note *
                  </label>
                  <input
                    type="text"
                    value={walletAdjustReason}
                    onChange={(e) => setWalletAdjustReason(e.target.value)}
                    placeholder="e.g. Deposit via UPI, Commission adjustment, Bonus"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: '#111827'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {[
                      walletAdjustType === 'credit' ? 'Admin Top-Up' : 'Commission Deduction',
                      walletAdjustType === 'credit' ? 'Security Deposit' : 'Cancellation Penalty',
                      walletAdjustType === 'credit' ? 'Referral Bonus' : 'Dispute Adjustment'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWalletAdjustReason(preset)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.6875rem',
                          borderRadius: '4px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          color: '#64748B',
                          cursor: 'pointer'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '6px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustWalletModal(false);
                      setSelectedVendorForWallet(null);
                    }}
                    disabled={isAdjustingWalletLoading}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: isAdjustingWalletLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isAdjustingWalletLoading || !parsedAmt || parsedAmt <= 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      backgroundColor: walletAdjustType === 'credit' ? '#059669' : '#DC2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      cursor: isAdjustingWalletLoading || !parsedAmt ? 'not-allowed' : 'pointer',
                      boxShadow: walletAdjustType === 'credit'
                        ? '0 1px 3px rgba(5, 150, 105, 0.3)'
                        : '0 1px 3px rgba(220, 38, 38, 0.3)',
                      opacity: (!parsedAmt || parsedAmt <= 0) ? 0.6 : 1
                    }}
                  >
                    {isAdjustingWalletLoading ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        <span>Updating Wallet...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                        <span>
                          Confirm {walletAdjustType === 'credit' ? 'Credit' : 'Debit'} {parsedAmt > 0 ? `(₹${parsedAmt.toFixed(2)})` : ''}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ==================================================
          11. VENDOR WALLET HISTORY & PASSBOOK MODAL
          ================================================== */}
      {showWalletHistoryModal && walletHistoryVendor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => {
            if (!isWalletHistoryLoading) {
              setShowWalletHistoryModal(false);
              setWalletHistoryVendor(null);
              setWalletHistoryData(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '88vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  <Receipt style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
                    Wallet Statement & Passbook
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                    {walletHistoryVendor.vendor_name || 'Vendor'} • {walletHistoryVendor.vendor_phone}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenAdjustWallet(walletHistoryVendor, 'credit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 12px',
                    backgroundColor: '#059669',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <Plus style={{ width: '13px', height: '13px' }} />
                  <span>Adjust Balance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowWalletHistoryModal(false);
                    setWalletHistoryVendor(null);
                    setWalletHistoryData(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div style={{
              padding: '14px 24px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Live Balance
                  </div>
                  <div style={{
                    fontSize: '1.375rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: Number(walletHistoryData?.wallet_balance ?? walletHistoryVendor.wallet_balance ?? 0) >= 100 ? '#047857' : '#DC2626'
                  }}>
                    ₹{Number(walletHistoryData?.wallet_balance ?? walletHistoryVendor.wallet_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ height: '32px', width: '1px', backgroundColor: '#E2E8F0' }} />

                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Local Taxi Rule
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                    Min ₹100 Required
                  </div>
                </div>

                <div style={{ height: '32px', width: '1px', backgroundColor: '#E2E8F0' }} />

                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Commission Rate
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                    {walletHistoryData?.commission_rate || 10}%
                  </div>
                </div>
              </div>

              <div>
                {(walletHistoryData?.is_eligible_for_local_taxi ?? (Number(walletHistoryVendor.wallet_balance || 0) >= 100)) ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#D1FAE5',
                    color: '#065F46'
                  }}>
                    <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                    Active for Local Taxi
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B'
                  }}>
                    <AlertTriangle style={{ width: '14px', height: '14px' }} />
                    Insufficient Balance (&lt; ₹100)
                  </span>
                )}
              </div>
            </div>

            {/* Statement Table Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {isWalletHistoryLoading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                  <RefreshCw style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#10B981' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>Loading Passbook Records...</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>Fetching ledger statement from AWS database</div>
                </div>
              ) : (!walletHistoryData?.transactions || walletHistoryData.transactions.length === 0) ? (
                <div style={{
                  padding: '50px 20px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px dashed #CBD5E1'
                }}>
                  <Receipt style={{ width: '36px', height: '36px', margin: '0 auto 10px', color: '#94A3B8' }} />
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827' }}>No Transactions Recorded Yet</div>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '420px', margin: '6px auto 16px' }}>
                    This vendor has no wallet debit/credit ledger entries yet. Transactions will automatically appear when trips are completed, commission is deducted, or wallet is topped up.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAdjustWallet(walletHistoryVendor, 'credit')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#059669',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    <span>Perform First Credit Top-Up</span>
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E5E7EB',
                      color: '#475569',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      <th style={{ padding: '10px 12px' }}>DATE & TIME</th>
                      <th style={{ padding: '10px 12px' }}>TYPE</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>AMOUNT</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>BALANCE AFTER</th>
                      <th style={{ padding: '10px 12px' }}>DESCRIPTION / NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletHistoryData.transactions.map((tx, idx) => {
                      const isCredit = (tx.transaction_type || '').toLowerCase() === 'credit';
                      const amt = Number(tx.amount || 0);

                      return (
                        <tr
                          key={tx.id || idx}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '—'}
                          </td>

                          <td style={{ padding: '12px' }}>
                            {isCredit ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                backgroundColor: '#DCFCE7',
                                color: '#15803D'
                              }}>
                                <ArrowUpRight style={{ width: '12px', height: '12px' }} />
                                CREDIT
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                backgroundColor: '#FEE2E2',
                                color: '#B91C1C'
                              }}>
                                <ArrowDownLeft style={{ width: '12px', height: '12px' }} />
                                DEBIT
                              </span>
                            )}
                          </td>

                          <td style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            color: isCredit ? '#047857' : '#DC2626'
                          }}>
                            {isCredit ? `+₹${amt.toFixed(2)}` : `-₹${Math.abs(amt).toFixed(2)}`}
                          </td>

                          <td style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#111827'
                          }}>
                            ₹{Number(tx.balance_after || 0).toFixed(2)}
                          </td>

                          <td style={{ padding: '12px', color: '#334155' }}>
                            <div>{tx.description || tx.reason || 'Wallet adjustment'}</div>
                            {tx.booking_id && (
                              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                                Ref: #{tx.booking_id}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Showing {walletHistoryData?.transactions?.length || 0} passbook records
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowWalletHistoryModal(false);
                  setWalletHistoryVendor(null);
                  setWalletHistoryData(null);
                }}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Close Passbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
