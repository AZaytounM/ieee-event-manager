# IEEE Event Manager 🎯

A full-stack event management system that allows admins to upload participants via Excel, auto-generate unique QR codes, email participants, and scan QR codes for check-in on event day.

![IEEE Themed](https://img.shields.io/badge/IEEE-Themed-00629B?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge)

---

## 📁 Project Structure

```
ieee-event-manager/
├── backend/                   # Node.js + Express API
│   ├── models/
│   │   └── database.js        # SQLite schema + initialization
│   ├── routes/
│   │   ├── auth.js            # JWT authentication
│   │   ├── events.js          # Event CRUD
│   │   ├── participants.js    # Participant management + Excel upload
│   │   ├── checkin.js         # QR scanning + attendance
│   │   └── reports.js         # Excel export
│   ├── utils/
│   │   ├── qrcode.js          # QR code generation
│   │   └── email.js           # IEEE-themed email templates + SMTP
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx     # IEEE sidebar navigation
│   │   ├── hooks/
│   │   │   └── useAuth.jsx    # Auth context
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── EventDetailPage.jsx
│   │   │   ├── ScannerPage.jsx
│   │   │   └── CheckInSuccessPage.jsx
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance
│   │   ├── App.jsx
│   │   ├── index.css          # IEEE theme variables + global styles
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── sample/
    └── participants-template.xlsx   # Sample Excel template
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:3001

# Security (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-long-random-secret-here
ADMIN_PASSWORD=your-secure-password

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM_NAME=IEEE Event Manager
```

### 3. Gmail Setup (for emails)

1. Enable 2-Factor Authentication on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate a new App Password for "Mail"
4. Use this 16-character password as `SMTP_PASS`

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# API running at http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# UI running at http://localhost:5173
```

### 5. Login

Open `http://localhost:5173`

Default credentials: **admin / admin123**

> ⚠️ Change the password after first login via `ADMIN_PASSWORD` in `.env`

---

## 🎯 How to Use

### Step 1: Create an Event
1. Go to **Events** → **New Event**
2. Fill in name, date, location
3. Customize the email subject and body
4. Set brand color (default IEEE blue)

### Step 2: Upload Participants
1. Open your event → **Upload Excel**
2. Use the provided template (`sample/participants-template.xlsx`)
3. Required columns: **Full Name**, **Email**
4. Optional: Phone

### Step 3: Send QR Emails
1. Click **Send QR Emails** to email all participants
2. Each participant receives a personalized IEEE-themed email with their unique QR code
3. Track email status in the participants table

### Step 4: Event Day Scanning
1. Go to **QR Scanner**
2. Select your event
3. Click **Start Camera** to activate scanning
4. Scan participant QR codes → instant check-in confirmation

### Step 5: Export Report
1. On the event detail page → **Export Report**
2. Downloads an Excel file with full attendance data

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/login          { username, password } → { token }
```

### Events
```
GET    /api/events             List all events
POST   /api/events             Create event
GET    /api/events/:id         Get event details
PUT    /api/events/:id         Update event
DELETE /api/events/:id         Delete event
```

### Participants
```
GET    /api/participants?event_id=&search=&attended=   List participants
POST   /api/participants/upload/:event_id              Upload Excel
POST   /api/participants/send-emails/:event_id         Send bulk emails
POST   /api/participants/:id/send-email                Send single email
PATCH  /api/participants/:id/attend                    Toggle attendance
GET    /api/participants/:id/qr                        Get QR image
DELETE /api/participants/:id                           Delete participant
```

### Check-in
```
GET  /api/checkin/:token         Public check-in via QR URL
POST /api/checkin/scan           Admin scan endpoint
GET  /api/checkin/stats/:event_id  Live attendance stats
```

### Reports
```
GET /api/reports/attendance/:event_id    Download Excel attendance report
```

---

## 🏗️ Production Deployment

### Using PM2

```bash
# Backend
cd backend
npm install -g pm2
pm2 start server.js --name ieee-backend
pm2 save

# Frontend build
cd frontend
npm run build
# Serve dist/ with nginx or any static host
```

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=use-a-very-long-random-string-here
ADMIN_PASSWORD=strong-password-here
APP_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
DB_PATH=/var/data/ieee-events.db
```

### Nginx Config (example)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # QR codes
    location /qrcodes {
        proxy_pass http://localhost:3001;
    }
}
```

---

## 📊 Excel Template Format

| Column | Required | Description |
|--------|----------|-------------|
| Full Name | ✅ Yes | Participant's full name |
| Email | ✅ Yes | Unique email address |
| Phone | ❌ No | Contact number |

Any extra columns are preserved as additional data.

---

## 🔒 Security Features

- **JWT Authentication** with 24h expiry
- **Hashed passwords** with bcryptjs
- **Secure QR tokens** — 32 random bytes (256-bit entropy)
- **Rate limiting** on API endpoints
- **Duplicate email prevention** per event
- **Excel validation** before processing
- **Helmet.js** security headers

---

## 📧 Email Configuration Options

### Gmail (Recommended for development)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password
```

### SendGrid (Recommended for production)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your-api-key
SMTP_USER=apikey
```

### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=you@company.com
SMTP_PASS=your-password
```

---

## 🎨 Customization

- **Colors**: Edit CSS variables in `frontend/src/index.css`
- **Email template**: Edit `backend/utils/email.js` → `buildEmailHTML()`
- **Event branding**: Set custom `banner_color` per event
- **QR code colors**: Edit `backend/utils/qrcode.js` color options

---

## 🐛 Troubleshooting

**Emails not sending?**
- Check SMTP credentials in `.env`
- For Gmail: ensure App Passwords are enabled (not your regular password)
- Check firewall allows port 587

**QR codes not generating?**
- Ensure `APP_URL` in `.env` is set correctly
- QR codes are stored in `backend/qrcodes/` directory

**Camera not working in scanner?**
- Browser requires HTTPS for camera access in production
- Use localhost for development (works without HTTPS)

---

## 📄 License

MIT License — Free to use and modify for IEEE events and beyond.
