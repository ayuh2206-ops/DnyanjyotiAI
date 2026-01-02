# DnyanGPT - AI-Powered UPSC Preparation Platform

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=DnyanGPT" alt="DnyanGPT Logo" width="200" />
  <h3>Your AI-Powered UPSC Preparation Suite</h3>
</div>

## 🚀 Phase 1 - Production Ready

This is the Phase 1 release of DnyanGPT, featuring a three-tier role system (VERO/Faculty/Student), Firebase authentication, Firestore database, and Gemini AI integration.

### Features

- **🔐 Authentication**: Google OAuth & Email/Password login
- **👑 Three-Tier Role System**:
  - **VERO (Super Admin)**: Full platform control, user management, faculty assignment
  - **Faculty**: Batch management, student progress tracking, analytics
  - **Student**: Full access to learning features
- **💬 UPSC-GPT Chat**: AI-powered Socratic tutor with subject-specific guidance
- **📝 AI Quiz Generator**: Generate custom quizzes on any UPSC topic
- **✍️ Essay Grading**: Get detailed AI feedback on your answer writing
- **📊 Analytics Dashboard**: Track your progress across all subjects
- **🎴 Flashcard Generator**: Create revision cards from your notes
- **👤 Admin Dashboards**: Role-specific dashboards for VERO and Faculty

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **AI**: Google Gemini 2.0 Flash + 1.5 Pro

## 📁 Project Structure

```
dnyangpt-phase1/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── chat/route.ts
│   │       ├── quiz/route.ts
│   │       ├── grade/route.ts
│   │       ├── flashcards/route.ts
│   │       └── summarize/route.ts
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
│   │   ├── FacultyDashboard.tsx   # NEW: Faculty batch management
│   │   ├── Grading.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Practice.tsx
│   │   ├── Profile.tsx
│   │   ├── Tools.tsx
│   │   └── VERODashboard.tsx      # NEW: Super admin dashboard
│   ├── AppShell.tsx
│   └── UI.tsx
├── lib/
│   ├── auth-context.tsx
│   ├── db.ts
│   ├── firebase.ts
│   └── gemini.ts
├── .env.local.example
├── .gitignore
├── firestore.rules
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ayuh2206-ops/DnyanjyotiAI.git
   cd DnyanjyotiAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Vercel Deployment

1. **Push to GitHub** (main branch)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the main branch

3. **Configure Environment Variables** ⚠️ CRITICAL
   In Vercel project settings → Environment Variables, add:
   ```
   GEMINI_API_KEY = your_gemini_api_key_here
   ```
   
   **Get your Gemini API key from**: [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **Deploy**
   - Vercel will auto-deploy on every push to main branch

## 🔑 Role Access

| Role | Login Email | Access Level |
|------|-------------|--------------|
| **VERO** (Super Admin) | `vero.media.150@gmail.com` | Full platform control |
| **Faculty** | Assigned by VERO | Batch & student management |
| **Student** | Any registered user | All learning features |

### VERO Dashboard Features
- System-wide statistics
- User management (grant/revoke access)
- Faculty assignment
- Payment tracking
- Admin activity logs

### Faculty Dashboard Features
- Create and manage batches
- Add/remove students from batches
- Track student progress
- View batch analytics

## 📊 Database Schema

### Collections

- **users**: User profiles, tokens, streak, subject scores, role, batch assignment
- **faculties**: Faculty details and permissions
- **batches**: Batch information, student lists
- **payments**: Payment records
- **quiz_history**: Quiz attempts and results
- **grading_history**: Essay evaluations
- **chat_sessions**: Chat conversation history
- **daily_activity**: Aggregated daily metrics
- **admin_logs**: Admin action audit trail

## 🤖 AI Models

| Model | Use Case | Temperature |
|-------|----------|-------------|
| Gemini 2.0 Flash | Chat, Quizzes, Flashcards | 0.7 |
| Gemini 1.5 Pro | Essay Grading, Analysis | 0.9 |

## 🚧 Phase 1 Testing Checklist

- [x] User registration (Google + Email)
- [x] Three-tier role system (VERO/Faculty/Student)
- [x] VERO dashboard with full admin controls
- [x] Faculty dashboard with batch management
- [x] Token deduction on AI operations
- [x] Quiz generation and submission
- [x] Essay grading workflow
- [x] Chat message persistence
- [x] Streak counter updates
- [x] Subject score calculations
- [x] Weekly activity data
- [x] Profile updates sync
- [x] Mobile responsive layout

## 🔧 Troubleshooting

### AI Features Not Working
1. Check that `GEMINI_API_KEY` is set in Vercel environment variables
2. Ensure the API key is valid (get from [Google AI Studio](https://aistudio.google.com/app/apikey))
3. Check Vercel deployment logs for errors

### Page Redirects Unexpectedly
- Ensure you're using the latest code with the navigation fix
- Clear browser cache and cookies

### Firebase Errors
- Verify Firebase project is properly configured
- Check Firestore rules are deployed

## 🔮 Phase 2 Preview

- n8n automation integration
- Additional AI models (Claude 3.5, GPT-4)
- OCR Pipeline for handwritten answers
- Real-time collaboration
- Push notifications
- Payment integration (Razorpay)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

<div align="center">
  <p>Built with ❤️ for UPSC Aspirants</p>
</div>
