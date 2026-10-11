# PulseQuiz - Interactive Live Quiz Platform

A premium, full-stack real-time interactive quiz platform inspired by modern live multiplayer gaming and educational platforms like juntos.live.

Built with **React 19**, **TypeScript**, **Express.js**, **Socket.IO**, **Tailwind CSS**, and **Google Gemini AI**.

---

## 🌟 Key Features

- **Real-Time Multiplayer Engine**: Synchronized low-latency live gameplay using server-authoritative Socket.IO channels.
- **Server-Authoritative Speed Scoring**:
  $$\text{earnedPoints} = \text{round}\left(\text{basePoints} \times \left(0.5 + 0.5 \times \frac{\text{remainingTime}}{\text{totalTime}}\right) \times \text{multiplier}\right)$$
  Validated strictly on the server with anti-cheat deadline enforcement.
- **8 Interactive Slide & Question Types**:
  1. Multiple Choice (2 to 6 options with color-coding and explanations)
  2. True / False
  3. Numeric (Exact value and configurable tolerance $\pm$)
  4. Poll Surveys (Anonymous voting & percentage share)
  5. Rating Scales (1 to 5 customizable feedback)
  6. Open-Ended Text responses
  7. Word Clouds (Real-time collective sentiment frequency)
  8. Content Slides (Guideline & break cards)
- **AI Quiz Studio (Gemini 3.8 Flash)**:
  - Generate full quizzes with multiple questions, plausible distractors, and educational explanations from a prompt or uploaded text.
  - Interactive question review and regeneration of individual questions.
- **Host Control Room**:
  - Big-screen PIN display and dynamically rendered QR Code (`qrcode`) for mobile camera scanning.
  - Live response progress counters and participant grid.
  - Host controls: Lock submissions early, reveal correct answers, show live leaderboard, and advance slides.
- **Mobile-First Player Experience**:
  - Zero-friction join via 6-character code or QR code (no registration required for players).
  - 10 custom animal/cyber avatars (Fox, Robot, Cat, Panda, Dragon, etc.).
  - Tactile responsive answer buttons with sub-second feedback.
  - Real-time floating emoji crowd reactions ($\text{🔥, 👏, 🚀, ❤️, 💡, 🎉}$).
- **Championship Podium & Analytics**:
  - 1st, 2nd, and 3rd place podium animation with confetti fanfare.
  - Recharts visual performance charts (daily volume trends, score averages).
  - Formatted executive PDF scorecard exports with rankings, scores, and podium honors.
- **Solo Mode**: Practice or review any quiz independently at your own pace.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Full-Stack Development Server
Runs Express, Socket.IO, and Vite SPA on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Demo Credentials
For testing creator features, you can log in with:
- **Email**: `demo@pulsequiz.com`
- **Password**: `password123`
*(Or click the "Demo Creator" button on the navbar/login page for instant access).*

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📂 Architecture Overview

```
├── server.ts                    # Full-stack server entry point (Express, Socket.IO, Vite middlewares)
├── server/
│   ├── auth.ts                  # JWT token handling, bcrypt password hashing, auth middleware
│   ├── db.ts                    # Document store with seed templates, quizzes, and session history
│   ├── ai.ts                    # Google GenAI SDK integration (Gemini 3.8 Flash)
│   ├── sockets/
│   │   └── gameSocket.ts        # Server-authoritative game-state machine & socket events
│   └── routes/
│       ├── authRoutes.ts        # /api/v1/auth & /api/v1/users endpoints
│       ├── quizRoutes.ts        # /api/v1/quizzes CRUD, duplication & publishing
│       ├── gameRoutes.ts        # /api/v1/games creation, lookup & session recovery
│       ├── templateRoutes.ts    # /api/v1/templates & template cloning
│       ├── aiRoutes.ts          # /api/v1/ai/generate-quiz & question regeneration
│       └── analyticsRoutes.ts   # /api/v1/analytics & CSV exports
├── src/
│   ├── types/quiz.ts            # Shared TypeScript contracts and schemas
│   ├── contexts/AuthContext.tsx # User session provider & persistent auth state
│   ├── services/
│   │   ├── api.ts               # Frontend REST API client
│   │   └── socket.ts            # Socket.IO connection manager
│   ├── utils/
│   │   ├── avatars.ts           # Avatars & player identities
│   │   └── effects.ts           # Web Audio synthesizer & confetti effects
│   ├── components/              # Layout, Navbar, Footer, and Interactive Hero
│   └── pages/                   # Landing, Join, Host, Player, Solo, Dashboard, AI Generator
```

---

## 🔒 Security Measures

- **No Answer Key Leakage**: Option answer keys and explanations are stripped from Socket.IO question broadcasts until the host initiates the reveal phase.
- **Backend Timestamp Verification**: Submissions past deadline $+ 1.5\text{s}$ grace period are rejected on the server.
- **Double Submission Prevention**: Unique session/slide participant answer indexing prevents duplicate votes or inflated scores.
- **Safe Environment Variables**: Secrets (`JWT_ACCESS_SECRET`, `GEMINI_API_KEY`) stay strictly on the Node.js backend.
