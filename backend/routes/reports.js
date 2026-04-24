const router = require('express').Router();
const XLSX = require('xlsx');
const { get, all } = require('../models/database');
const { requireAuth } = require('./auth');

router.get('/attendance/:event_id', requireAuth, (req, res) => {
  const event = get('SELECT * FROM events WHERE id = ?', [req.params.event_id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const participants = all(`
    SELECT full_name, email, phone, attended, attended_at, email_sent, email_sent_at, created_at
    FROM participants WHERE event_id = ?
    ORDER BY full_name ASC
  `, [req.params.event_id]);

  const worksheetData = participants.map(p => ({
    'Full Name': p.full_name,
    'Email': p.email,
    'Phone': p.phone || '',
    'Attended': p.attended ? 'Yes' : 'No',
    'Check-in Time': p.attended_at || '',
    'Email Sent': p.email_sent ? 'Yes' : 'No',
    'Email Sent At': p.email_sent_at || '',
    'Registered At': p.created_at
  }));

  const attended = participants.filter(p => p.attended).length;
  worksheetData.push({});
  worksheetData.push({
    'Full Name': 'SUMMARY',
    'Email': `Total: ${participants.length}`,
    'Attended': `Attended: ${attended}`,
    'Check-in Time': `Not attended: ${participants.length - attended}`,
    'Email Sent': `Rate: ${participants.length ? Math.round(attended / participants.length * 100) : 0}%`
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(worksheetData);
  ws['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}_attendance.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
});

module.exports = router;