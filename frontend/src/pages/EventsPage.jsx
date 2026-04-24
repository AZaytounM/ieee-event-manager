import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Calendar, Trash2, Edit, ArrowRight, Users } from 'lucide-react';

function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event || {
    name: '', description: '', date: '', location: '',
    email_subject: 'Your QR Code for {event}',
    email_body: 'We are pleased to confirm your registration for {event}. Please present the attached QR code at the entrance.',
    banner_color: '#00629B'
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (event?.id) {
        await api.put(`/events/${event.id}`, form);
        toast.success('Event updated');
      } else {
        await api.post('/events', form);
        toast.success('Event created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{event?.id ? 'Edit Event' : 'Create New Event'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div className="form-group">
            <label className="form-label">Event Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g., IEEE Annual Conference 2025" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g., Main Auditorium" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief event description..." />
          </div>
          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input className="form-input" value={form.email_subject} onChange={e => set('email_subject', e.target.value)} placeholder="Use {event} for event name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Message Body</label>
            <textarea className="form-textarea" value={form.email_body} onChange={e => set('email_body', e.target.value)} placeholder="Use {name} and {event} as placeholders" />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Use {'{name}'} and {'{event}'} as dynamic placeholders</div>
          </div>
          <div className="form-group">
            <label className="form-label">Brand Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.banner_color} onChange={e => set('banner_color', e.target.value)} style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
              <input className="form-input" value={form.banner_color} onChange={e => set('banner_color', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/events').then(r => setEvents(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteEvent = async (ev) => {
    if (!confirm(`Delete "${ev.name}" and all its participants?`)) return;
    await api.delete(`/events/${ev.id}`);
    toast.success('Event deleted');
    load();
  };

  return (
    <div className="fade-in">
      {modal !== null && (
        <EventModal event={modal === 'new' ? null : modal}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Manage your IEEE events and participants</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> New Event
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : events.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No events created yet</h3>
            <p>Create your first event to start managing participants</p>
            <button className="btn btn-primary" onClick={() => setModal('new')} style={{ marginTop: 16 }}>
              <Plus size={16} /> Create First Event
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {events.map(ev => {
            const rate = ev.total_participants ? Math.round((ev.attended_count || 0) / ev.total_participants * 100) : 0;
            return (
              <div key={ev.id} className="card" style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/events/${ev.id}`)}>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${ev.banner_color || '#00629B'}, ${ev.banner_color || '#00629B'}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Calendar size={20} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{ev.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {ev.date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {new Date(ev.date).toLocaleDateString()}
                      </span>}
                      {ev.location && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {ev.location}</span>}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {ev.total_participants || 0} participants
                      </span>
                    </div>
                  </div>
                  <div className="hide-mobile" style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ieee-blue)' }}>{rate}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>attendance</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(ev)}>
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => deleteEvent(ev)}>
                      <Trash2 size={14} />
                    </button>
                    <Link to={`/events/${ev.id}`} className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}>
                      Open <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
