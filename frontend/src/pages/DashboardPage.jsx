import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Calendar, Users, CheckCircle, Mail, ArrowRight, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totals = events.reduce((acc, e) => ({
    events: acc.events + 1,
    participants: acc.participants + (e.total_participants || 0),
    attended: acc.attended + (e.attended_count || 0),
    emails: acc.emails + (e.emails_sent || 0),
  }), { events: 0, participants: 0, attended: 0, emails: 0 });

  const attendanceRate = totals.participants ? Math.round(totals.attended / totals.participants * 100) : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Control Panel</h1>
        <p className="page-subtitle">Welcome back — here's your event overview</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Events', value: totals.events, icon: Calendar, color: '#00629B' },
          { label: 'Participants', value: totals.participants, icon: Users, color: '#0085CA' },
          { label: 'Checked In', value: totals.attended, icon: CheckCircle, color: '#0B7B5A' },
          { label: 'Emails Sent', value: totals.emails, icon: Mail, color: '#7C3AED' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="stat-value">{loading ? '—' : value}</div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Attendance rate */}
      {totals.participants > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="var(--ieee-blue)" />
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Overall Attendance Rate</span>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ieee-blue)' }}>{attendanceRate}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${attendanceRate}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>{totals.attended} checked in</span>
              <span>{totals.participants - totals.attended} remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Events</h2>
          <Link to="/events" className="btn btn-secondary btn-sm">
            View All <ArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <Calendar size={40} />
            <h3>No events yet</h3>
            <p>Create your first event to get started</p>
            <Link to="/events" className="btn btn-primary" style={{ marginTop: 16 }}>Create Event</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Participants</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 8).map(ev => {
                  const rate = ev.total_participants ? Math.round((ev.attended_count || 0) / ev.total_participants * 100) : 0;
                  const now = new Date();
                  const evDate = ev.date ? new Date(ev.date) : null;
                  const status = !evDate ? 'draft' : evDate > now ? 'upcoming' : 'completed';
                  return (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 500 }}>{ev.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString() : '—'}
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{ev.total_participants || 0}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${rate}%` }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rate}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${status === 'upcoming' ? 'badge-info' : status === 'completed' ? 'badge-success' : 'badge-gray'}`}>
                          {status === 'upcoming' ? '● Upcoming' : status === 'completed' ? '✓ Completed' : '○ Draft'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/events/${ev.id}`} className="btn btn-ghost btn-sm">
                          View <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
