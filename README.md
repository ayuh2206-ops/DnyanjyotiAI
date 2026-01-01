# DnyanGPT - AI-Powered UPSC Preparation Platform

## 🚀 Production Ready - Three-Tier Role System

This is the complete production-ready codebase for DnyanGPT with the three-tier role-based access system.

### Role Hierarchy

| Role | Access Level | Description |
|------|--------------|-------------|
| **VERO** | Super Admin | Full system control, all users, all data |
| **Faculty** | Batch Admin | Manage assigned batches and students only |
| **Student** | Standard | Personal account access |

## 📁 Project Structure

```
dnyangpt-production/
├── app/
│   ├── api/ai/
│   │   ├── chat/route.ts
│   │   ├── flashcards/route.ts
│   │   ├── grade/route.ts
│   │   ├── quiz/route.ts
│   │   └── summarize/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── views/
│   │   ├── AdminDashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── Chat.tsx
│   │   ├── DailyAffairs.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FacultyDashboard.tsx   ← NEW
│   │   ├── Grading.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Practice.tsx
│   │   ├── Profile.tsx
│   │   ├── Tools.tsx
│   │   └── VERODashboard.tsx      ← NEW
│   ├── AppShell.tsx               ← UPDATED
│   └── UI.tsx
├── lib/
│   ├── auth-context.tsx           ← UPDATED
│   ├── db.ts                      ← UPDATED (1300+ lines)
│   ├── firebase.ts                ← UPDATED
│   └── gemini.ts
├── .env.local.example
├── .gitignore
├── firestore.rules                ← NEW
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Installation

### 1. Extract and Setup

```bash
# Extract the zip
unzip dnyangpt-production.zip
cd dnyangpt-production

# Install dependencies
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Firebase Setup

Firebase config is already in `lib/firebase.ts`. If using different project:

```typescript
// lib/firebase.ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Deploy Firestore Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy content from `firestore.rules`
3. Click "Publish"

### 5. Run Development

```bash
npm run dev
```

### 6. Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit: DnyanGPT with three-tier roles"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# Connect to Vercel and deploy
```

## 🔐 Role System

### VERO (Super Admin)
- **Email**: `vero.media.150@gmail.com` (auto-assigned)
- **Access**: Full system control
- **Tokens**: Unlimited (999,999)
- **Dashboard**: VERO Control Panel

Features:
- View/manage all users
- Grant/revoke lifetime access
- Promote users to Faculty
- Bulk payment status updates
- View admin action logs
- System-wide statistics

### Faculty
- **Created by**: VERO via dashboard
- **Access**: Batch-isolated
- **Tokens**: Unlimited
- **Dashboard**: Faculty Panel

Features:
- Create/manage batches
- Add/remove students from batches
- View student progress
- Track batch performance
- Cannot see students outside assigned batches

### Student (Default)
- **Default role**: All new signups
- **Access**: Personal only
- **Tokens**: 500 (starting)
- **Dashboard**: Standard views

Features:
- AI Chat, Quizzes, Grading
- Personal analytics
- Daily affairs
- Study tools

## 📊 Database Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles with role, payment status |
| `faculties` | Faculty records |
| `batches` | Batch management |
| `payments` | Payment history |
| `admin_logs` | VERO action audit trail |
| `quiz_history` | Quiz attempts |
| `grading_history` | Essay evaluations |
| `chat_sessions` | Chat conversations |
| `daily_activity` | Daily metrics |
| `study_sessions` | Study time logs |

## 🔄 Payment Statuses

| Status | Description |
|--------|-------------|
| `lifetime` | Permanent access (never expires) |
| `active` | Active paid subscription |
| `expired` | Subscription expired |
| `trial` | Trial period |
| `none` | Free tier |

## ✅ Testing Checklist

- [ ] VERO login with `vero.media.150@gmail.com`
- [ ] VERO Dashboard loads with all tabs
- [ ] VERO can view all users
- [ ] VERO can grant lifetime access
- [ ] VERO can promote user to Faculty
- [ ] Faculty Dashboard loads for faculty users
- [ ] Faculty can create batches
- [ ] Faculty can add students to batches
- [ ] Faculty can view student progress
- [ ] Faculty CANNOT see students outside their batches
- [ ] Students see standard dashboard
- [ ] Students CANNOT access admin views
- [ ] Token deduction works for students
- [ ] Admin logs record VERO actions

## 🐛 Troubleshooting

### Permission Denied Errors
- Deploy `firestore.rules` to Firebase Console
- Verify user role in Firestore users collection
- Check indexes are created

### Faculty Can't See Students
- Verify batch has `facultyId` set correctly
- Check student has `batchId` and `facultyId` fields
- Verify faculty record exists in `faculties` collection

### VERO Features Not Working
- Clear browser cache and re-login
- Verify email matches exactly: `vero.media.150@gmail.com`
- Check user document has `role: 'vero'` in Firestore

## 📝 License

MIT License

---

Built with ❤️ for UPSC Aspirants
