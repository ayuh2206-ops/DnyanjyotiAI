# DnyanGPT - AI-Powered UPSC Preparation Platform

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=DnyanGPT" alt="DnyanGPT Logo" width="200" />
  <h3>Your AI-Powered UPSC Preparation Suite</h3>
</div>

## 🚀 Phase 1.5 - Production Ready

This is the Phase 1.5 release of DnyanGPT, featuring a three-tier role system (VERO/Faculty/Student), Firebase authentication, Firestore database, Gemini AI integration, **faculty email invitation system**, and **content management**.

### ✨ NEW in Phase 1.5

- **📧 Faculty Email Invitations**: VERO can invite faculty by email - they auto-become Faculty on login
- **📰 Content Management**: Faculty can create news articles and add PYQs
- **📚 Complete Database Infrastructure**: All types ready for Phase 2 AI features

### Features

- **🔐 Authentication**: Google OAuth & Email/Password login
- **👑 Three-Tier Role System**:
  - **VERO (Super Admin)**: Full platform control, user management, faculty invitations
  - **Faculty**: Batch management, student tracking, content creation
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

| Role | How to Get | Access Level |
|------|------------|--------------|
| **VERO** (Super Admin) | Email matches `NEXT_PUBLIC_VERO_EMAIL` env var | Full platform control |
| **Faculty** | Email pre-assigned by VERO via Faculty Invites | Batch & content management |
| **Student** | Default for all registered users | All learning features |

### VERO Dashboard Features
- System-wide statistics
- User management (grant/revoke access)
- **NEW: Faculty email invitations (Faculty Invites tab)**
- Payment tracking
- Admin activity logs

### Faculty Dashboard Features
- Create and manage batches
- Add/remove students from batches
- Track student progress
- View batch analytics
- **NEW: Content tab - Create articles & add PYQs**

### How Faculty Invitation Works
1. VERO goes to VERO Dashboard → **Faculty Invites** tab
2. Click **"Invite Faculty"**
3. Enter faculty's email, name, and specializations
4. When that person logs in with the email, they become Faculty automatically

## 📊 Database Schema

### Collections

**Core Collections:**
- **users**: User profiles, tokens, streak, subject scores, role, batch assignment
- **faculties**: Faculty details and permissions
- **batches**: Batch information, student lists
- **payments**: Payment records
- **admin_logs**: Admin action audit trail

**Learning Data:**
- **quiz_history**: Quiz attempts and results
- **grading_history**: Essay evaluations
- **chat_sessions**: Chat conversation history
- **daily_activity**: Aggregated daily metrics

**NEW in Phase 1.5:**
- **facultyAssignments**: Email-based faculty invitations
- **newsArticles**: Faculty-created current affairs
- **editorialBriefs**: 60-word summaries
- **pyqQuestions**: Previous Year Questions
- **syllabus**: UPSC syllabus structure
- **syllabusProgress**: User syllabus tracking
- **flashcards**: User-generated flashcards
- **mindMaps**: Visual study aids
- **bookmarks**: User bookmarks

## 🤖 AI Models

| Model | Use Case | Speed |
|-------|----------|-------|
| Gemini 2.0 Flash | Chat, Quizzes, Flashcards, Summarization | Fast |
| Gemini 2.5 Pro Preview | Essay Grading, Complex Analysis | Slower, Higher Quality |

**Rate Limits (Free Tier):**
- Gemini 2.0 Flash: 15 requests/min
- Gemini 2.5 Pro: 2 requests/min
- Built-in retry logic with exponential backoff

## 🚧 Phase 1.5 Testing Checklist

- [x] User registration (Google + Email)
- [x] Three-tier role system (VERO/Faculty/Student)
- [x] VERO dashboard with full admin controls
- [x] Faculty dashboard with batch management
- [x] **NEW: Faculty email invitation system**
- [x] **NEW: Faculty content creation (articles/PYQs)**
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
3. **If quota error:** Create a new API key in a new project
4. Check Vercel deployment logs for errors

### Faculty Email Invite Not Working
1. Ensure VERO created the invitation in Faculty Invites tab
2. Faculty must log in with the **exact** email address
3. Check `facultyAssignments` collection in Firebase Console

### Page Redirects Unexpectedly
- Ensure you're using the latest code with the navigation fix
- Clear browser cache and cookies

### Firebase Errors
- Verify Firebase project is properly configured
- Check Firestore rules are deployed

## 🔮 Phase 2 Preview

Phase 2 will add AI-powered automation:
- **Groq API Integration**: 4-model hybrid architecture (Velocity, Mentor, Deep-Scan, Vision)
- **n8n Automation**: Self-improving feedback loops
- **AI News Summarization**: Auto-generate 60-word briefs
- **Smart Daily 5 Quiz**: Based on user's study topics
- **OCR Pipeline**: Handwritten answer processing
- **Real-time Collaboration**
- **Payment Integration** (Razorpay)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

<div align="center">
  <p>Built with ❤️ for UPSC Aspirants</p>
</div>
