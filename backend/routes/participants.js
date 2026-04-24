const router = require('express').Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { get, all, run } = require('../models/database');
const { requireAuth } = require('./auth');
const { generateQRCode, generateQRCodeBase64 } = require('../utils/qrcode');
const { sendBulkEmails, sendQREmail } = require('../utils/email');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls'))
      cb(null, true);
    else cb(new Error('Only Excel files allowed'));
  }
});

router.get('/', requireAuth, (req, res) => {
  const { event_id, search, attended } = req.query;
  let query = 'SELECT * FROM participants WHERE 1=1';
  const params = [];
  if (event_id) { query += ' AND event_id = ?'; params.push(event_id); }
  if (search) { query += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (attended !== undefined) { query += ' AND attended = ?'; params.push(attended === 'true' ? 1 : 0); }
  query += ' ORDER BY created_at DESC';
  res.json(all(query, params));
});

router.get('/:id', requireAuth, (req, res) => {
  const p = get('SELECT * FROM participants WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

router.post('/upload/:event_id', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const eventId = req.params.event_id;
  const event = get('SELECT * FROM events WHERE id = ?', [eventId]);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!data.length) return res.status(400).json({ error: 'Excel file is empty' });

    const keys = Object.keys(data[0]);
    const findCol = (...names) => keys.find(k => names.some(n => k.toLowerCase().includes(n.toLowerCase()))) || null;
    const nameCol = findCol('name', 'full name', 'fullname', 'participant');
    const emailCol = findCol('email', 'e-mail', 'mail');
    if (!nameCol) return res.status(400).json({ error: 'Could not find "Name" column' });
    if (!emailCol) return res.status(400).json({ error: 'Could not find "Email" column' });
    const phoneCol = findCol('phone', 'mobile', 'tel');

    const results = { added: 0, skipped: 0, errors: [] };

    for (const row of data) {
      const name = String(row[nameCol] || '').trim();
      const email = String(row[emailCol] || '').trim().toLowerCase();
      if (!name || !email || !email.includes('@')) {
        results.skipped++;
        continue;
      }
      const existing = get('SELECT id FROM participants WHERE event_id = ? AND email = ?', [eventId, email]);
      if (existing) { results.skipped++; continue; }

      const id = uuidv4();
      const token = crypto.randomBytes(32).toString('hex');
      const phone = phoneCol ? String(row[phoneCol] || '').trim() : '';
      run('INSERT INTO participants (id, event_id, full_name, email, phone, extra_data, qr_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, eventId, name, email, phone, JSON.stringify(row), token]);
      results.added++;
    }

    // Generate QR codes
    const newParticipants = all('SELECT * FROM participants WHERE event_id = ? AND qr_code_path IS NULL', [eventId]);
    for (const p of newParticipants) {
      try {
        const { filepath } = await generateQRCode(p.qr_token, p.id);
        run('UPDATE participants SET qr_code_path = ? WHERE id = ?', [filepath, p.id]);
      } catch (e) { console.error('QR gen error:', e.message); }
    }

    const fs = require('fs');
    fs.unlinkSync(req.file.path);
    res.json({ message: 'Upload successful', ...results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-emails/:event_id', requireAuth, async (req, res) => {
  const event = get('SELECT * FROM events WHERE id = ?', [req.params.event_id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const participants = all('SELECT * FROM participants WHERE event_id = ? AND email_sent = 0', [req.params.event_id]);
  if (!participants.length) return res.json({ message: 'No participants to email', sent: 0 });

  res.json({ message: 'Email sending started', total: participants.length });

  sendBulkEmails(participants, event, (done, total, email, err) => {
    const p = participants.find(x => x.email === email);
    if (p && !err) run('UPDATE participants SET email_sent = 1, email_sent_at = datetime("now") WHERE id = ?', [p.id]);
  });
});

router.post('/:id/send-email', requireAuth, async (req, res) => {
  const p = get('SELECT * FROM participants WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const event = get('SELECT * FROM events WHERE id = ?', [p.event_id]);
  const qrBase64 = await generateQRCodeBase64(p.qr_token);
  await sendQREmail(p, event, qrBase64);
  run('UPDATE participants SET email_sent = 1, email_sent_at = datetime("now") WHERE id = ?', [p.id]);
  res.json({ message: 'Email sent' });
});

router.patch('/:id/attend', requireAuth, (req, res) => {
  const p = get('SELECT * FROM participants WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const attended = req.body.attended !== undefined ? (req.body.attended ? 1 : 0) : 1;
  run('UPDATE participants SET attended = ?, attended_at = ? WHERE id = ?',
    [attended, attended ? new Date().toISOString() : null, req.params.id]);
  res.json({ message: 'Updated', attended });
});

router.delete('/:id', requireAuth, (req, res) => {
  run('DELETE FROM participants WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

router.get('/:id/qr', requireAuth, async (req, res) => {
  const p = get('SELECT * FROM participants WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const qrBase64 = await generateQRCodeBase64(p.qr_token);
  res.json({ qr: qrBase64 });
});

module.exports = router;