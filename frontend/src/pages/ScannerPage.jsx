import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import api from '../utils/api';
import { CheckCircle, XCircle, Camera, QrCode, Users, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ScannerPage() {
  const { event_id } = useParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(event_id || '');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    api.get('/events').then(r => {
      setEvents(r.data);
      if (!selectedEvent && r.data.length > 0) setSelectedEvent(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedEvent) loadStats();
  }, [selectedEvent]);

  const loadStats = async () => {
    try {
      const res = await api.get(`/checkin/stats/${selectedEvent}`);
      setStats(res.data);
      setRecentCheckins(res.data.recent_checkins || []);
    } catch {}
  };

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      if (!scannerRef.current) return;
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10, qrbox: { width: 260, height: 260 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      }, false);

      scanner.render(
        async (decodedText) => {
          scanner.pause(true);
          await handleScan(decodedText);
          setTimeout(() => scanner.resume(), 3000);
        },
        (err) => {}
      );
      scannerInstanceRef.current = scanner;
    }, 200);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.clear().catch(() => {});
      scannerInstanceRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (text) => {
    // Extract token from URL or use directly
    let token = text;
    const match = text.match(/\/checkin\/([a-f0-9]+)$/i) || text.match(/([a-f0-9]{64})/i);
    if (match) token = match[1];

    try {
      const res = await api.post('/checkin/scan', { token });
      const { valid, already_checked_in, participant } = res.data;

      if (!valid) {
        setResult({ type: 'error', message: 'Invalid QR code' });
        return;
      }

      const scanResult = {
        type: already_checked_in ? 'duplicate' : 'success',
        name: participant.full_name,
        email: participant.email,
        event: participant.event_name,
        time: participant.attended_at,
        already_checked_in
      };
      setResult(scanResult);
      loadStats();
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Scan failed' });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput('');
    }
  };

  const selectedEventData = events.find(e => e.id === selectedEvent);
  const rate = stats?.total ? Math.round((stats.attended || 0) / stats.total * 100) : 0;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">QR Code Scanner</h1>
          <p className="page-subtitle">Scan participant QR codes for event check-in</p>
        </div>
        {event_id && (
          <Link to={`/events/${event_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Event
          </Link>
        )}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Scanner Column */}
        <div>
          {/* Event Selector */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '16px 20px' }}>
              <label className="form-label">Select Event</label>
              <select className="form-select" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                <option value="">-- Choose Event --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
          </div>

          {/* Scanner Card */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={16} />
                <span style={{ fontWeight: 600 }}>Camera Scanner</span>
              </div>
              {scanning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0B7B5A',
                    animation: 'pulseGreen 1s infinite' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--success)' }}>Active</span>
                </div>
              )}
            </div>
            <div style={{ padding: 20 }}>
              {!scanning ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0,98,155,0.08), rgba(0,133,202,0.12))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    border: '2px dashed var(--border-strong)' }}>
                    <QrCode size={36} color="var(--ieee-blue)" />
                  </div>
                  <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Ready to Scan</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                    Click Start to activate the camera and scan participant QR codes
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={startScanner} disabled={!selectedEvent}>
                    <Camera size={16} /> Start Camera
                  </button>
                </div>
              ) : (
                <div>
                  <div id="qr-reader" style={{ width: '100%' }} ref={scannerRef} />
                  <button className="btn btn-danger btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={stopScanner}>
                    Stop Scanner
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Manual Token Entry</span>
            </div>
            <form onSubmit={handleManualSubmit} style={{ padding: 16, display: 'flex', gap: 8 }}>
              <input className="form-input" value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="Paste QR token or URL..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={!manualInput.trim()}>
                Check In
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Result + Stats */}
        <div>
          {/* Scan Result */}
          {result && (
            <div className={`card fade-in`} style={{
              marginBottom: 16, borderLeft: `4px solid ${
                result.type === 'success' ? 'var(--success)' :
                result.type === 'duplicate' ? 'var(--warning)' : 'var(--danger)'
              }`
            }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: result.type === 'success' ? 'var(--success-bg)' :
                      result.type === 'duplicate' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {result.type === 'success' ? <CheckCircle size={22} color="var(--success)" /> :
                     result.type === 'duplicate' ? <AlertCircle size={22} color="var(--warning)" /> :
                     <XCircle size={22} color="var(--danger)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4,
                      color: result.type === 'success' ? 'var(--success)' :
                        result.type === 'duplicate' ? 'var(--warning)' : 'var(--danger)' }}>
                      {result.type === 'success' ? '✅ Check-In Successful!' :
                       result.type === 'duplicate' ? '⚠️ Already Checked In' :
                       '❌ Invalid QR Code'}
                    </h3>
                    {result.name && <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>{result.name}</p>}
                    {result.email && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>{result.email}</p>}
                    {result.event && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>📅 {result.event}</p>}
                    {result.time && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                      🕐 {new Date(result.time).toLocaleTimeString()}
                    </p>}
                    {result.message && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{result.message}</p>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => setResult(null)}>
                  Clear Result
                </button>
              </div>
            </div>
          )}

          {/* Live Stats */}
          {stats && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Live Attendance</span>
                <button className="btn btn-ghost btn-sm" onClick={loadStats}>
                  <RefreshCw size={13} />
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Checked In', value: stats.attended || 0, color: 'var(--success)' },
                    { label: 'Remaining', value: (stats.total || 0) - (stats.attended || 0), color: 'var(--warning)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Attendance Rate</span>
                    <span style={{ fontWeight: 700, color: 'var(--ieee-blue)' }}>{rate}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${rate}%` }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {stats.attended || 0} / {stats.total || 0} total participants
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Check-ins */}
          {recentCheckins.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent Check-ins</span>
                <span className="badge badge-success">{recentCheckins.length}</span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {recentCheckins.map((c, i) => (
                  <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.full_name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.email}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {new Date(c.attended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        #qr-reader { border-radius: 10px; overflow: hidden; }
        #qr-reader video { border-radius: 10px; }
        #qr-reader__scan_region { border-radius: 10px; }
      `}</style>
    </div>
  );
}
