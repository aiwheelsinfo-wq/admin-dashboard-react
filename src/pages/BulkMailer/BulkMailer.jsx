import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Mail,
  Upload,
  FileSpreadsheet,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Eye,
  Code,
  Layers,
  Sparkles,
  Server,
  Play,
  Pause,
  StopCircle,
  Check,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const PREMADE_TEMPLATES = [
  {
    id: 'promo_discount',
    name: '🎉 Exclusive ₹200 Ride Discount',
    subject: 'Special Offer for {name}: Flat ₹200 OFF on Your Next Rentox Ride!',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #008CFF; padding-bottom: 15px; margin-bottom: 20px;">
    <h1 style="color: #008CFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RENTOX CAR RENTAL</h1>
    <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Premium Intercity & Local Taxi Services</p>
  </div>
  
  <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Hello <strong>{name}</strong>,</p>
  
  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
    Planning your next weekend getaway or local business trip? Rentox is here to make your journey comfortable, safe, and affordable!
  </p>
  
  <div style="background: linear-gradient(135deg, #008CFF 0%, #0056B3 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
    <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0; opacity: 0.9;">Exclusive Promo Code</p>
    <div style="font-size: 26px; font-weight: bold; letter-spacing: 2px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 6px; display: inline-block;">RENTOX200</div>
    <p style="font-size: 12px; margin: 8px 0 0 0; opacity: 0.9;">Get flat ₹200 OFF on any One-Way or Round-Trip booking</p>
  </div>

  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
    <strong>Why Travel with Rentox?</strong><br>
    ✅ Verified, Courteous Drivers<br>
    ✅ 100% On-Time Guarantee<br>
    ✅ Zero Cancellation Fee<br>
    ✅ Sanitized & Clean AC Fleet
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://agnicarrental.com" style="background-color: #008CFF; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 8px; font-size: 15px; display: inline-block;">Book Your Ride Now →</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;">
  
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
    You received this email at {email} as a registered user of Rentox Car Rental.<br>
    &copy; {year} Rentox Mobility Pvt Ltd. All rights reserved.
  </p>
</div>`
  },
  {
    id: 'outstation_special',
    name: '🚗 Outstation Holiday Travel Special',
    subject: 'Book Outstation Cabs starting at just ₹10/km - Rentox Travel Special',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h2 style="color: #0f172a; margin-top: 0;">Explore India with Rentox Outstation 🌄</h2>
  <p style="font-size: 15px; color: #334155; line-height: 1.6;">Dear {name},</p>
  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
    Beat the rush and travel comfortably in our top-rated Sedans, Ertiga, and Innova Crysta cabs. Enjoy transparent pricing with toll and tax inclusive options!
  </p>
  <ul style="color: #475569; font-size: 14px; line-height: 1.8;">
    <li>Doorstep pickup and drop</li>
    <li>GPS-tracked rides for safety</li>
    <li>24/7 dedicated customer support</li>
  </ul>
  <div style="text-align: center; margin: 25px 0;">
    <a href="https://agnicarrental.com" style="background-color: #10b981; color: white; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Check Outstation Routes</a>
  </div>
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">Delivered to: {email} &bull; &copy; {year} Rentox</p>
</div>`
  },
  {
    id: 'b2b_corporate',
    name: '🏢 Corporate & Monthly Travel Solutions',
    subject: 'Corporate Cab Solutions for Your Company - Rentox Mobility',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h2 style="color: #1e293b; margin-top: 0;">Streamlined Corporate Ground Transport</h2>
  <p style="font-size: 14px; color: #334155;">Hello {name},</p>
  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
    Rentox delivers unified employee transit, airport transfers, and executive outstation rentals with GST billing and monthly corporate credit invoicing.
  </p>
  <div style="background-color: #f8fafc; border-left: 4px solid #008CFF; padding: 15px; margin: 20px 0;">
    <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Special B2B Rates:</strong> Enjoy up to 15% corporate rebate on recurring intercity routes.</p>
  </div>
  <p style="font-size: 14px; color: #475569;">Contact our corporate travel desk directly at <strong>support@agnicarrental.com</strong> or call <strong>+91 9847267465</strong>.</p>
  <p style="font-size: 12px; color: #94a3b8;">Rentox Corporate Mobility &bull; Delivered to {email}</p>
</div>`
  }
];

const BulkMailer = () => {
  const { addToast } = useToast();

  // Excel & Recipients state
  const [recipients, setRecipients] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchRecipient, setSearchRecipient] = useState('');
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [emailColumn, setEmailColumn] = useState('');
  const [nameColumn, setNameColumn] = useState('');
  const [availableColumns, setAvailableColumns] = useState([]);
  const [rawRows, setRawRows] = useState([]);

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState('promo_discount');
  const [subject, setSubject] = useState(PREMADE_TEMPLATES[0].subject);
  const [bodyHtml, setBodyHtml] = useState(PREMADE_TEMPLATES[0].body);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  // Schedule & Interval settings
  const [intervalMinutes, setIntervalMinutes] = useState(60); // 60 mins (1 hour)
  const [batchSize, setBatchSize] = useState(50);
  const [dispatchMode, setDispatchMode] = useState('aws_queue'); // 'aws_queue' | 'browser_live'

  // Execution & Logs
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [nextBatchCountdown, setNextBatchCountdown] = useState(null);

  // AWS Queue Status
  const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, sent: 0, failed: 0, next_scheduled_at: null });
  const [queueLogs, setQueueLogs] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Test modal
  const [testEmail, setTestEmail] = useState('info@rentox.co.in');
  const [isTesting, setIsTesting] = useState(false);

  const fileInputRef = useRef(null);
  const pausedRef = useRef(isPaused);
  const cancelledRef = useRef(false);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    fetchQueueStatus();
  }, []);

  // 1. Parse Excel / CSV File
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsingExcel(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          addToast('The uploaded sheet is empty.', 'error');
          setIsParsingExcel(false);
          return;
        }

        const cols = Object.keys(jsonData[0]);
        setAvailableColumns(cols);
        setRawRows(jsonData);

        // Auto-detect email column
        const detectedEmailCol = cols.find((c) => /email|mail|e-mail/i.test(c)) || cols[0];
        const detectedNameCol = cols.find((c) => /name|full_name|customer|client/i.test(c)) || '';

        setEmailColumn(detectedEmailCol);
        setNameColumn(detectedNameCol);

        extractRecipients(jsonData, detectedEmailCol, detectedNameCol);
        addToast(`Excel parsed successfully! Found ${jsonData.length} rows.`, 'success');
      } catch (err) {
        console.error('Excel parse error:', err);
        addToast('Failed to parse Excel file. Please ensure it is valid .xlsx or .csv', 'error');
      } finally {
        setIsParsingExcel(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 2. Extract and de-duplicate emails from raw rows
  const extractRecipients = (rows, emailCol, nameCol) => {
    const map = new Map();
    rows.forEach((row) => {
      const email = String(row[emailCol] || '').trim().toLowerCase();
      const name = nameCol ? String(row[nameCol] || '').trim() : '';
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (!map.has(email)) {
          map.set(email, { email, name: name || 'Valued Customer' });
        }
      }
    });

    const parsed = Array.from(map.values());
    setRecipients(parsed);
    setProgress({ sent: 0, failed: 0, total: parsed.length });
  };

  const handleColumnChange = (newEmailCol, newNameCol) => {
    setEmailColumn(newEmailCol);
    setNameColumn(newNameCol);
    if (rawRows.length > 0) {
      extractRecipients(rawRows, newEmailCol, newNameCol);
    }
  };

  // 3. Template Selection
  const handleSelectTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = PREMADE_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setSubject(tpl.subject);
      setBodyHtml(tpl.body);
    }
  };

  // 4. Test Single Email
  const handleTestSmtp = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      addToast('Please enter a valid email address for testing.', 'error');
      return;
    }

    setIsTesting(true);
    try {
      const res = await axios.post(endpoints.bulkMailer, {
        action: 'test_smtp',
        test_email: testEmail
      });

      if (res.data && res.data.status === 'success') {
        addToast(res.data.message || 'Test email sent successfully!', 'success');
      } else {
        addToast(res.data?.message || 'SMTP Test failed.', 'error');
      }
    } catch (err) {
      console.error('Test SMTP Error:', err);
      addToast('Failed to connect to backend mailer API.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // 5. Fetch AWS Queue Status
  const fetchQueueStatus = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await axios.post(endpoints.bulkMailer, {
        action: 'get_queue_status'
      });
      if (res.data && res.data.status === 'success') {
        setQueueStats(res.data.stats);
        setQueueLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Fetch queue error:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // 6. Launch AWS Server-Side Schedule (1-Hour Intervals)
  const handleScheduleOnAws = async () => {
    if (recipients.length === 0) {
      addToast('Please upload an Excel file with recipients first.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await axios.post(endpoints.bulkMailer, {
        action: 'save_queue',
        campaign_name: `Campaign ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        recipients,
        subject,
        body_html: bodyHtml,
        batch_size: batchSize,
        interval_minutes: intervalMinutes
      });

      if (res.data && res.data.status === 'success') {
        addToast(res.data.message || 'Campaign scheduled successfully on AWS!', 'success');
        fetchQueueStatus();
      } else {
        addToast(res.data?.message || 'Failed to schedule campaign on AWS.', 'error');
      }
    } catch (err) {
      console.error('Schedule queue error:', err);
      addToast('Network error while scheduling campaign on AWS.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // 7. Live Browser-Side Dispatcher (with interval delay)
  const handleStartBrowserCampaign = async () => {
    if (recipients.length === 0) {
      addToast('No recipients found to send.', 'error');
      return;
    }

    setIsSending(true);
    setIsPaused(false);
    cancelledRef.current = false;

    let currentSent = 0;
    let currentFailed = 0;
    const total = recipients.length;
    const batches = [];

    // Split into batches
    for (let i = 0; i < total; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    addToast(`Starting campaign: ${batches.length} batches of ${batchSize} emails.`, 'info');

    for (let bIndex = 0; bIndex < batches.length; bIndex++) {
      if (cancelledRef.current) break;

      // Check pause
      while (pausedRef.current && !cancelledRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (cancelledRef.current) break;

      const currentBatchList = batches[bIndex];

      try {
        const res = await axios.post(endpoints.bulkMailer, {
          action: 'send_batch',
          recipients: currentBatchList,
          subject,
          body_html: bodyHtml
        });

        if (res.data && res.data.status === 'success') {
          currentSent += res.data.sent_count || 0;
          currentFailed += res.data.failed_count || 0;

          // Append batch details to logs
          if (res.data.details) {
            setLogs((prev) => [...res.data.details, ...prev].slice(0, 100));
          }
        }
      } catch (err) {
        console.error('Batch send error:', err);
        currentFailed += currentBatchList.length;
      }

      setProgress({ sent: currentSent, failed: currentFailed, total });

      // If not the last batch and interval > 0, wait
      if (bIndex < batches.length - 1 && !cancelledRef.current) {
        const waitMs = intervalMinutes * 60 * 1000;
        let remainingSec = Math.floor(waitMs / 1000);

        while (remainingSec > 0 && !cancelledRef.current) {
          if (!pausedRef.current) {
            setNextBatchCountdown(`${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s`);
            remainingSec--;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        setNextBatchCountdown(null);
      }
    }

    setIsSending(false);
    setNextBatchCountdown(null);
    addToast(`Campaign completed! Sent: ${currentSent}, Failed: ${currentFailed}`, 'success');
  };

  // 8. Process AWS Queue trigger now
  const handleProcessAwsQueueNow = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await axios.post(endpoints.bulkMailer, {
        action: 'process_queue',
        limit: batchSize
      });
      if (res.data && res.data.status === 'success') {
        addToast(`Queue batch processed! Sent: ${res.data.sent}, Failed: ${res.data.failed}`, 'success');
        fetchQueueStatus();
      }
    } catch (err) {
      addToast('Failed to trigger queue processing.', 'error');
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // 9. Clear AWS Queue
  const handleClearQueue = async (mode = 'all') => {
    if (!window.confirm(`Are you sure you want to clear ${mode === 'completed' ? 'completed' : 'all'} queue records?`)) return;
    try {
      await axios.post(endpoints.bulkMailer, { action: 'clear_queue', mode });
      addToast('Queue cleared successfully.', 'info');
      fetchQueueStatus();
    } catch (err) {
      addToast('Failed to clear queue.', 'error');
    }
  };

  // Filtered recipients for display
  const filteredRecipients = recipients.filter(
    (r) =>
      r.email.toLowerCase().includes(searchRecipient.toLowerCase()) ||
      r.name.toLowerCase().includes(searchRecipient.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Top Header & Stats ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '12px' }}>
              <Mail style={{ width: '24px', height: '24px', color: '#0284c7' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Automated Bulk Email Campaigns</h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
                Extract emails from Excel sheets, customize dynamic HTML templates, and send with 1-hour automated intervals.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Test SMTP Tool */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter test recipient email..."
            style={{ border: 'none', outline: 'none', fontSize: '13px', width: '220px', color: '#334155' }}
          />
          <button
            onClick={handleTestSmtp}
            disabled={isTesting}
            style={{
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isTesting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isTesting ? <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: '13px', height: '13px' }} />}
            <span>{isTesting ? 'Testing...' : 'Test SMTP'}</span>
          </button>
        </div>
      </div>

      {/* ── Top Metrics Banner ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px' }}>
            <UserCheck style={{ width: '22px', height: '22px', color: '#16a34a' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Extracted Recipients</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{recipients.length}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px' }}>
            <Server style={{ width: '22px', height: '22px', color: '#2563eb' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>AWS Queue Pending</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb' }}>{queueStats.pending}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px' }}>
            <CheckCircle style={{ width: '22px', height: '22px', color: '#16a34a' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Delivered</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a' }}>{queueStats.sent}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ backgroundColor: '#fff1f2', padding: '12px', borderRadius: '10px' }}>
            <AlertCircle style={{ width: '22px', height: '22px', color: '#e11d48' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Failed Bounces</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#e11d48' }}>{queueStats.failed}</div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Workflow Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* ── LEFT COLUMN: Step 1 & Step 3 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* STEP 1: Upload Excel & Extract Emails */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#0284c7', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</span>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Upload Excel File (.xlsx / .csv)</h3>
              </div>
              {recipients.length > 0 && (
                <span style={{ fontSize: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                  {recipients.length} Emails Ready
                </span>
              )}
            </div>

            {/* Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <FileSpreadsheet style={{ width: '40px', height: '40px', color: '#0284c7', margin: '0 auto 10px auto' }} />
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                {fileName ? fileName : 'Click or Drag & Drop your Excel file here'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Supports customer lists, driver lists, or custom contact sheets (.xlsx, .xls, .csv)
              </p>
            </div>

            {/* Column Mapping Selector (if Excel has multiple columns) */}
            {availableColumns.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>EMAIL COLUMN</label>
                  <select
                    value={emailColumn}
                    onChange={(e) => handleColumnChange(e.target.value, nameColumn)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {availableColumns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>NAME COLUMN (OPTIONAL)</label>
                  <select
                    value={nameColumn}
                    onChange={(e) => handleColumnChange(emailColumn, e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="">-- None (Default Customer) --</option>
                    {availableColumns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Recipient Preview List */}
            {recipients.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search recipients..."
                      value={searchRecipient}
                      onChange={(e) => setSearchRecipient(e.target.value)}
                      style={{ padding: '6px 10px 6px 30px', fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}
                    />
                  </div>
                  <button
                    onClick={() => setRecipients([])}
                    style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 style={{ width: '13px', height: '13px' }} /> Clear List
                  </button>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                  {filteredRecipients.slice(0, 100).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f8fafc', fontSize: '12px' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{r.name}</span>
                        <span style={{ color: '#64748b', marginLeft: '8px' }}>&lt;{r.email}&gt;</span>
                      </div>
                      <button
                        onClick={() => setRecipients((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                        title="Remove recipient"
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  ))}
                  {filteredRecipients.length > 100 && (
                    <div style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                      Showing first 100 of {filteredRecipients.length} recipients...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Automated 1-Hour Schedule Settings */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ backgroundColor: '#0284c7', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>3</span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Automated Schedule & Rate Limiting</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Dispatch Mode Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>DISPATCH METHOD</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setDispatchMode('aws_queue')}
                    style={{
                      border: dispatchMode === 'aws_queue' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      backgroundColor: dispatchMode === 'aws_queue' ? '#f0f9ff' : '#ffffff',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      <Server style={{ width: '15px', height: '15px', color: '#0284c7' }} />
                      <span>AWS Background Queue</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                      Schedules on AWS server. Runs automatically every 1h even if you shut down your PC.
                    </p>
                  </div>

                  <div
                    onClick={() => setDispatchMode('browser_live')}
                    style={{
                      border: dispatchMode === 'browser_live' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      backgroundColor: dispatchMode === 'browser_live' ? '#f0f9ff' : '#ffffff',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      <Clock style={{ width: '15px', height: '15px', color: '#0284c7' }} />
                      <span>Live Browser Dispatcher</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                      Dispatches batches right in front of you with real-time logs and progress bar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interval & Batch Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>BATCH SIZE</label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value={25}>25 Emails / Batch</option>
                    <option value={50}>50 Emails / Batch (Recommended)</option>
                    <option value={100}>100 Emails / Batch</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>DELAY BETWEEN BATCHES</label>
                  <select
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour (Industry Best Practice)</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>
              </div>

              {/* Dispatch Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {dispatchMode === 'aws_queue' ? (
                  <button
                    onClick={handleScheduleOnAws}
                    disabled={isSending || recipients.length === 0}
                    style={{
                      flex: 1,
                      backgroundColor: '#0284c7',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: isSending || recipients.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                    }}
                  >
                    <Server style={{ width: '16px', height: '16px' }} />
                    <span>Schedule on AWS Queue ({recipients.length} Emails)</span>
                  </button>
                ) : (
                  <>
                    {!isSending ? (
                      <button
                        onClick={handleStartBrowserCampaign}
                        disabled={recipients.length === 0}
                        style={{
                          flex: 1,
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '14px',
                          cursor: recipients.length === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Play style={{ width: '16px', height: '16px' }} />
                        <span>Start Live Dispatch ({recipients.length} Emails)</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          style={{
                            flex: 1,
                            backgroundColor: isPaused ? '#16a34a' : '#f59e0b',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          {isPaused ? <Play style={{ width: '14px', height: '14px' }} /> : <Pause style={{ width: '14px', height: '14px' }} />}
                          <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                        <button
                          onClick={() => { cancelledRef.current = true; setIsSending(false); }}
                          style={{
                            flex: 1,
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <StopCircle style={{ width: '14px', height: '14px' }} />
                          <span>Stop</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Countdown between batches */}
              {nextBatchCountdown && (
                <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '13px' }}>
                  <Clock style={{ width: '16px', height: '16px', animation: 'spin 4s linear infinite' }} />
                  <span>Next batch scheduled in: <strong>{nextBatchCountdown}</strong> (Resting for 1-hour interval...)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Step 2: Email Template Builder ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            
            {/* Header with Editor / Preview Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#0284c7', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</span>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Customize Email Template</h3>
              </div>

              {/* View switch */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                <button
                  onClick={() => setActiveTab('editor')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'editor' ? '#ffffff' : 'transparent',
                    color: activeTab === 'editor' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'editor' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <Code style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                  HTML Editor
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'preview' ? '#ffffff' : 'transparent',
                    color: activeTab === 'preview' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <Eye style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                  Live Preview
                </button>
              </div>
            </div>

            {/* Premade Template Picker */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>LOAD PRE-MADE TEMPLATE</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc' }}
              >
                {PREMADE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Subject Line Input */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>SUBJECT LINE</label>
                <span style={{ fontSize: '11px', color: '#0284c7' }}>Supported tags: <code>{'{name}'}</code>, <code>{'{email}'}</code></span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject of your email..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            {/* Editor or Preview Pane */}
            {activeTab === 'editor' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>HTML BODY TEMPLATE</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setBodyHtml((prev) => prev + ' {name}')}
                      style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                    >
                      + {`{name}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyHtml((prev) => prev + ' {email}')}
                      style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                    >
                      + {`{email}`}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={12}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    lineHeight: '1.5',
                    backgroundColor: '#fafafa'
                  }}
                />
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', maxHeight: '350px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                  <strong>Subject:</strong> {subject.replace('{name}', 'John Doe').replace('{email}', 'john@example.com')}
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: bodyHtml
                      .replace(/{name}/g, 'John Doe')
                      .replace(/{email}/g, 'john@example.com')
                      .replace(/{year}/g, new Date().getFullYear())
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: Live AWS Server Queue Status & Logs ── */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server style={{ width: '18px', height: '18px', color: '#0284c7' }} />
              AWS Background Queue Monitor
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Current email dispatch schedule on MySQL AWS EC2 &bull; Next scheduled batch: <strong>{queueStats.next_scheduled_at ? queueStats.next_scheduled_at : 'No pending batches'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleProcessAwsQueueNow}
              disabled={isLoadingQueue || queueStats.pending === 0}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: isLoadingQueue || queueStats.pending === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Play style={{ width: '13px', height: '13px' }} />
              Process Due Batch Now
            </button>

            <button
              onClick={fetchQueueStatus}
              disabled={isLoadingQueue}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw style={{ width: '13px', height: '13px', animation: isLoadingQueue ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>

            <button
              onClick={() => handleClearQueue('completed')}
              style={{
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                border: '1px solid #fecdd3',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Completed
            </button>
          </div>
        </div>

        {/* Queue Logs Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>ID</th>
                <th style={{ padding: '10px 14px' }}>Campaign</th>
                <th style={{ padding: '10px 14px' }}>Recipient</th>
                <th style={{ padding: '10px 14px' }}>Scheduled For</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Sent Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {queueLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No emails currently in the AWS queue. Upload an Excel file above and click "Schedule on AWS Queue" to launch.
                  </td>
                </tr>
              ) : (
                queueLogs.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>#{item.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1e293b' }}>{item.campaign_name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.recipient_name || 'Customer'}</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{item.recipient_email}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: '12px' }}>{item.scheduled_at}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          backgroundColor: item.status === 'sent' ? '#f0fdf4' : item.status === 'pending' ? '#eff6ff' : '#fff1f2',
                          color: item.status === 'sent' ? '#16a34a' : item.status === 'pending' ? '#2563eb' : '#e11d48'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>
                      {item.sent_at ? item.sent_at : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BulkMailer;

