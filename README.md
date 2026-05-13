# 🔢 Counter App

A modern, production-ready counter app built with **Next.js 14**, **SQLite**, **Nodemailer**, and **Chart.js**.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Persistent Counter** | SQLite-backed — survives restarts |
| **Dark / Light Mode** | System-aware, toggle in header |
| **Weekly Email Report** | Auto-sent every Sunday 8 PM via SMTP |
| **Statistics Chart** | Daily increments vs decrements (last 7 days) |
| **PDF Export** | Client-side jsPDF report download |
| **Mobile-Friendly** | Responsive layout, large touch targets |
| **Manual Report Trigger** | "Send Report" button in the UI |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd CounterApp
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your SMTP credentials
```

#### Gmail Setup (recommended)
1. Enable **2-Step Verification** on your Google Account
2. Go to **Google Account → Security → App Passwords**
3. Create an App Password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
CounterApp/
├── server.js                  # Custom server (starts cron scheduler)
├── data/
│   └── counter.db             # SQLite database (auto-created)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + dark mode init
│   │   ├── page.tsx           # Main UI page
│   │   ├── globals.css        # Design tokens + utility styles
│   │   └── api/
│   │       ├── counter/       # GET/POST counter value
│   │       ├── stats/         # GET daily & weekly stats
│   │       └── send-report/   # POST trigger email
│   ├── components/
│   │   └── StatsChart.tsx     # Chart.js bar chart
│   └── lib/
│       ├── db.ts              # SQLite queries (better-sqlite3)
│       ├── email.ts           # Nodemailer weekly report
│       └── scheduler.ts       # node-cron job (Sun 20:00)
└── .env.local.example         # Environment variable template
```

---

## 🌍 Deployment

### Vercel
> Note: Vercel's serverless functions don't support `node-cron`. Use **Render** instead for full cron support.

### Render
1. Push to GitHub
2. Create a **Web Service** on [render.com](https://render.com)
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables in Render's dashboard

---

## 🔧 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS (`true` / `false`) | `false` |
| `SMTP_USER` | SMTP username / email | — |
| `SMTP_PASS` | SMTP password / App Password | — |
| `EMAIL_FROM` | Sender display address | Same as `SMTP_USER` |
| `EMAIL_TO` | Report recipient address | — |
| `PORT` | Server port | `3000` |

---

## 📜 License
MIT
