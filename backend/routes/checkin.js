const router = require('express').Router();
const { get, all, run } = require('../models/database');
const { requireAuth } = require('./auth');

router.get('/:token', (req, res) => {
  const p = get(`
    SELECT p.*, e.name as event_name, e.date as event_date, e.location
    FROM participants p
    JOIN events e ON e.id = p.event_id
    WHERE p.qr_token = ?
  `, [req.params.token]);

  if (!p) return res.status(404).json({ error: 'Invalid QR code', valid: false });

  if (p.attended) {
    return res.json({
      valid: true, already_checked_in: true,
      participant: { full_name: p.full_name, email: p.email, attended_at: p.attended_at },
      event: { name: p.event_name, date: p.event_date, location: p.location }
    });
  }

  run('UPDATE participants SET attended = 1, attended_at = datetime("now") WHERE qr_token = ?', [req.params.token]);

  res.json({
    valid: true, already_checked_in: false,
    participant: { full_name: p.full_name, email: p.email, attended_at: new Date().toISOString() },
    event: { name: p.event_name, date: p.event_date, location: p.location }
  });
});

router.post('/scan', requireAuth, (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const p = get(`
    SELECT p.*, e.name as event_name, e.date as event_date
    FROM participants p
    JOIN events e ON e.id = p.event_id
    WHERE p.qr_token = ?
  `, [token]);

  if (!p) return res.status(404).json({ error: 'Invalid QR code', valid: false });

  if (p.attended) {
    return res.json({
      valid: true, already_checked_in: true,
      participant: { id: p.id, full_name: p.full_name, email: p.email, event_name: p.event_name, attended_at: p.attended_at }
    });
  }

  run('UPDATE participants SET attended = 1, attended_at = datetime("now"), checked_in_by = ? WHERE qr_token = ?',
    [req.admin?.username || 'scanner', token]);

  const updated = get('SELECT * FROM participants WHERE qr_token = ?', [token]);

  res.json({
    valid: true, already_checked_in: false,
    participant: { id: updated.id, full_name: updated.full_name, email: updated.email, event_name: p.event_name, attended_at: updated.attended_at }
  });
});

router.get('/stats/:event_id', requireAuth, (req, res) => {
  const stats = get(`
    SELECT 
      COUNT(*) as total,
      SUM(attended) as attended,
      COUNT(*) - SUM(attended) as not_attended,
      SUM(email_sent) as emails_sent
    FROM participants WHERE event_id = ?
  `, [req.params.event_id]);

  const recent = all(`
    SELECT full_name, email, attended_at FROM participants
    WHERE event_id = ? AND attended = 1
    ORDER BY attended_at DESC LIMIT 10
  `, [req.params.event_id]);

  res.json({ ...stats, recent_checkins: recent });
});

module.exports = router;