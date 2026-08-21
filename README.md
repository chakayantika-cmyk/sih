# 🔒 Security Portal

A minimal two-panel web portal (Admin + User) built with **Next.js 14**, **Nodemailer + Gmail**, **Vercel KV**, and **Tailwind CSS**.

---

## ✨ Features

| Feature | Details |
|---|---|
| Admin Login | Credentials: `adminSIH` / `admin` |
| Add Users | Admin registers users by name + email |
| Login Logs | Admin sees `<name> logged-in at <time> <date>` |
| User OTP Login | 3-digit OTP sent to registered email (valid 10 min) |
| Route Protection | Middleware blocks unauthenticated access |
| Data Storage | Vercel KV in production · In-memory in local dev |

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note**: In local dev without Vercel KV configured, the app uses in-memory storage.
> Users/logs are reset every time you restart the dev server.

---

## ☁️ Deploy to Vercel

### Step 1 – Push to GitHub

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### Step 2 – Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repository
3. Click **Deploy** (Vercel auto-detects Next.js)

### Step 3 – Add Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `GMAIL_USER` | `arijitp203@gmail.com` |
| `GMAIL_APP_PASSWORD` | `zkwo svrv rxkd kdpt` |

### Step 4 – Link Vercel KV (for persistent data)

1. In your Vercel project → **Storage → Create Database → KV**
2. Name it anything (e.g. `security-portal-kv`) and click **Create**
3. Click **Connect to Project** → select your project
4. Vercel automatically injects all 4 `KV_*` env vars
5. **Redeploy** once so the new env vars take effect

### Step 5 – Pull env vars locally (optional)

```bash
npm i -g vercel
vercel login
vercel env pull .env.local
```

---

## 📁 Project Structure

```
SECURITY/
├── app/
│   ├── page.tsx                  # Landing page (Admin / User selector)
│   ├── admin/
│   │   ├── login/page.tsx        # Admin login form
│   │   └── dashboard/page.tsx   # Admin dashboard + logs
│   ├── user/
│   │   ├── login/page.tsx        # User OTP login (2-step)
│   │   └── success/page.tsx     # Success message
│   └── api/
│       ├── admin/login/          # POST (login) · DELETE (logout)
│       ├── admin/users/          # GET (list) · POST (add user)
│       ├── admin/logs/           # GET (login logs)
│       ├── user/request-otp/     # POST – generate & email OTP
│       └── user/verify-otp/      # POST – validate OTP & log login
├── lib/
│   ├── email.ts                  # Nodemailer Gmail SMTP
│   └── storage.ts               # KV + in-memory abstraction
├── middleware.ts                 # Route protection
├── .env.local                    # ⚠️ Never committed – real credentials
├── .env.example                  # Template (safe to commit)
└── vercel.json                   # Vercel config (15s function timeout)
```

---

## 🔐 Admin Credentials

| Field | Value |
|---|---|
| Name | `adminSIH` |
| Password | `admin` |

---

## 📧 Gmail Setup (already configured)

The app uses `arijitp203@gmail.com` with an **App Password** via Gmail SMTP.
No OAuth or Resend account needed. Works on Vercel serverless.

> If Gmail blocks the connection, ensure **2-Step Verification** is ON in your Google Account and the App Password is active.

---

## 🗃️ Data Model

| Storage Key | Purpose |
|---|---|
| `portal:users` | `Record<email, {name, email}>` |
| `portal:otp:<email>` | 3-digit OTP string, TTL 600s |
| `portal:logs` | `LogEntry[]` newest first |
