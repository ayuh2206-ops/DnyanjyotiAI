# DnyanGPT - AI-Powered UPSC Preparation Platform

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=DnyanGPT" alt="DnyanGPT Logo" width="200" />
  <h3>Your AI-Powered UPSC Preparation Suite</h3>
</div>

## 🚀 Phase 1 - Production Ready

This is the Phase 1 release of DnyanGPT, focusing on core functionality with Firebase authentication, Firestore database, and Gemini AI integration.

### Features

- **🔐 Authentication**: Google OAuth & Email/Password login
- **💬 UPSC-GPT Chat**: AI-powered Socratic tutor with subject-specific guidance
- **📝 AI Quiz Generator**: Generate custom quizzes on any UPSC topic
- **✍️ Essay Grading**: Get detailed AI feedback on your answer writing
- **📊 Analytics Dashboard**: Track your progress across all subjects
- **🎴 Flashcard Generator**: Create revision cards from your notes
- **👤 Admin Dashboard**: Separate admin panel for platform management

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **AI**: Google Gemini 2.5 (Flash + Pro)

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
│   │   ├── Grading.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Practice.tsx
│   │   ├── Profile.tsx
│   │   └── Tools.tsx
│   ├── AppShell.tsx
│   └── UI.tsx
├── lib/
│   ├── auth-context.tsx
│   ├── db.ts
│   ├── firebase.ts
│   └── gemini.ts
├── .env.local
├── .env.local.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dnyangpt.git
   cd dnyangpt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Admin Access

Login with `vero.media.150@gmail.com` to access the admin dashboard with system-wide statistics and user management features.

## 📊 Database Schema

### Collections

- **users**: User profiles, tokens, streak, subject scores
- **quiz_history**: Quiz attempts and results
- **grading_history**: Essay evaluations
- **chat_sessions**: Chat conversation history
- **daily_activity**: Aggregated daily metrics

## 🤖 AI Models

| Model | Use Case | Temperature |
|-------|----------|-------------|
| Gemini 2.5 Flash | Chat, Quizzes, Flashcards | 0.7 |
| Gemini 2.5 Pro | Essay Grading, Analysis | 0.9 |

## 🚧 Phase 1 Testing Checklist

- [ ] User registration (Google + Email)
- [ ] Admin login access
- [ ] Token deduction on AI operations
- [ ] Quiz generation and submission
- [ ] Essay grading workflow
- [ ] Chat message persistence
- [ ] Streak counter updates
- [ ] Subject score calculations
- [ ] Weekly activity data
- [ ] Profile updates sync
- [ ] Mobile responsive layout

## 📱 Screenshots

*(Add screenshots here)*

## 🔮 Phase 2 Preview

- n8n automation integration
- Additional AI models (Claude 3.5, GPT-4)
- OCR Pipeline for handwritten answers
- Real-time collaboration
- Push notifications
- Payment integration

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

<div align="center">
  <p>Built with ❤️ for UPSC Aspirants</p>
</div>
