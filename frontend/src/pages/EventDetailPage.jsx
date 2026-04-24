import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Upload, Mail, Download, Search, CheckCircle, XCircle,
  QrCode, RefreshCw, Users, Send, Trash2, ArrowLeft, Eye
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [stats, setStats] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const fileRef = useRef();

  const loadData = async () => {
    try {
      const [evRes, pRes, sRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/participants?event_id=${id}`),
        api.get(`/checkin/stats/${id}`)
      ]);
      setEvent(evRes.data);
      setParticipants(pRes.data);
      setStats(sRes.data);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post(`/participants/upload/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`✅ Added ${res.data.added} participants (${res.data.skipped} skipped)`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const sendAllEmails = async () => {
    const unsent = participants.filter(p => !p.email_sent);
    if (!unsent.length) { toast('All emails already sent!'); return; }
    if (!confirm(`Send QR code emails to ${unsent.length} participants?`)) return;
    setSendingEmails(true);
    try {
      await api.post(`/participants/send-emails/${id}`);
      toast.success(`📧 Sending emails to ${unsent.length} participants (check console)`);
      setTimeout(loadData, 3000);
    } catch (err) {
      toast.error('Email sending failed');
    } finally { setSendingEmails(false); }
  };

  const sendSingleEmail = async (p) => {
    try {
      await api.post(`/participants/${p.id}/send-email`);
      toast.success(`Email sent to ${p.email}`);
      loadData();
    } catch { toast.error('Failed to send email'); }
  };

  const toggleAttendance = async (p) => {
    await api.patch(`/participants/${p.id}/attend`, { attended: !p.attended });
    loadData();
  };

  const deleteParticipant = async (p) => {
    if (!confirm(`Remove ${p.full_name}?`)) return;
    await api.delete(`/participants/${p.id}`);
    toast.success('Participant removed');
    loadData();
  };

  const showQR = async (p) => {
    const res = await api.get(`/participants/${p.id}/qr`);
    setQrModal({ participant: p, qr: res.data.qr });
  };

  const exportReport = () => {
    window.open(`/api/reports/attendance/${id}`, '_blank');
  };

  const filtered = participants.filter(p => {
    const matchSearch = !search || p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'attended' && p.attended) || (filter === 'pending' && !p.attended) || (filter === 'emailed' && p.email_sent);
    return matchSearch && matchFilter;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (!event) return <div className="alert alert-danger">Event not found</div>;

  const attended = participants.filter(p => p.attended).length;
  const emailed = participants.filter(p => p.email_sent).length;
  const rate = participants.length ? Math.round(attended / participants.length * 100) : 0;

  return (
    <div className="fade-in">
      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{qrModal.participant.full_name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setQrModal(null)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>{qrModal.participant.email}</p>
              <img src={qrModal.qr} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid var(--border)' }} />
              <div style={{ marginTop: 16 }}>
                <a href={qrModal.qr} download={`qr-${qrModal.participant.full_name}.png`} className="btn btn-primary btn-sm">
                  <Download size={14} /> Download QR
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: 12 }}>
          <ArrowLeft size={14} /> Back to Events
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">{event.name}</h1>
            <p className="page-subtitle">
              {event.date && new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to={`/scanner/${id}`} className="btn btn-primary">
              <QrCode size={15} /> Scan QR Codes
            </Link>
            <button className="btn btn-secondary" onClick={exportReport}>
              <Download size={15} /> Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: participants.length, color: '#00629B' },
          { label: 'Checked In', value: attended, color: '#0B7B5A' },
          { label: 'Pending', value: participants.length - attended, color: '#B45309' },
          { label: 'Emails Sent', value: emailed, color: '#7C3AED' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
            {label === 'Checked In' && participants.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${rate}%` }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{rate}% attendance</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 2 }}>Participant Management</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Upload Excel, send emails, manage attendance</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Processing...</> : <><Upload size={15} /> Upload Excel</>}
          </button>
          <button className="btn btn-primary" onClick={sendAllEmails} disabled={sendingEmails || !participants.length}>
            {sendingEmails ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending...</> : <><Send size={15} /> Send QR Emails ({participants.filter(p => !p.email_sent).length} pending)</>}
          </button>
        </div>
        {/* Excel template hint */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          📋 Excel format: <strong>Full Name</strong>, <strong>Email</strong>, (optional: Phone) — Download <a href="/sample-participants.xlsx" style={{ color: 'var(--ieee-blue)' }}>sample template</a>
        </div>
      </div>

      {/* Participants Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} />
            <span style={{ fontWeight: 600 }}>Participants ({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 30, paddingRight: 10, width: 200, height: 34 }}
                placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[['all', 'All'], ['attended', '✓ Attended'], ['pending', '○ Pending'], ['emailed', '✉ Emailed']].map(([k, l]) => (
                <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>{participants.length === 0 ? 'No participants yet' : 'No results found'}</h3>
            <p>{participants.length === 0 ? 'Upload an Excel file to add participants' : 'Try adjusting your search or filter'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="hide-mobile">Phone</th>
                  <th>Email Sent</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.email}</td>
                    <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.phone || '—'}</td>
                    <td>
                      {p.email_sent
                        ? <span className="badge badge-success"><CheckCircle size={10} /> Sent</span>
                        : <span className="badge badge-gray">Pending</span>}
                    </td>
                    <td>
                      <button className={`badge ${p.attended ? 'badge-success' : 'badge-warning'}`}
                        onClick={() => toggleAttendance(p)}
                        style={{ cursor: 'pointer', border: 'none', fontFamily: 'var(--font)' }}>
                        {p.attended ? <><CheckCircle size={10} /> Attended</> : <><XCircle size={10} /> Pending</>}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="Show QR" onClick={() => showQR(p)}>
                          <QrCode size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Send Email" onClick={() => sendSingleEmail(p)}>
                          <Mail size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                          title="Delete" onClick={() => deleteParticipant(p)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
