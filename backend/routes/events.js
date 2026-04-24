const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../models/database');
const { requireAuth } = require('./auth');

router.get('/', requireAuth, (req, res) => {
  const events = all(`
    SELECT e.*, 
      COUNT(p.id) as total_participants,
      SUM(p.attended) as attended_count,
      SUM(p.email_sent) as emails_sent
    FROM events e
    LEFT JOIN participants p ON p.event_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `);
  res.json(events);
});

router.get('/:id', requireAuth, (req, res) => {
  const event = get(`
    SELECT e.*,
      COUNT(p.id) as total_participants,
      SUM(p.attended) as attended_count,
      SUM(p.email_sent) as emails_sent
    FROM events e
    LEFT JOIN participants p ON p.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `, [req.params.id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.post('/', requireAuth, (req, res) => {
  const { name, description, date, location, email_subject, email_body, banner_color } = req.body;
  if (!name) return res.status(400).json({ error: 'Event name required' });
  const id = uuidv4();
  run(`INSERT INTO events (id, name, description, date, location, email_subject, email_body, banner_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description, date, location, email_subject, email_body, banner_color || '#00629B']);
  res.status(201).json({ id, message: 'Event created' });
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, description, date, location, email_subject, email_body, banner_color } = req.body;
  run(`UPDATE events SET name=?, description=?, date=?, location=?, email_subject=?, email_body=?, banner_color=?, updated_at=datetime('now')
       WHERE id=?`,
    [name, description, date, location, email_subject, email_body, banner_color, req.params.id]);
  res.json({ message: 'Event updated' });
});

router.delete('/:id', requireAuth, (req, res) => {
  run('DELETE FROM participants WHERE event_id = ?', [req.params.id]);
  run('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ message: 'Event deleted' });
});

module.exports = router;