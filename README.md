# 🚀 ProgressTracker — Intelligent Personal Productivity Command Center

[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-NextAuth_v5-purple?style=for-the-badge)](https://authjs.dev/)
[![OpenRouter AI](https://img.shields.io/badge/OpenRouter-AI_Assistant-indigo?style=for-the-badge)](https://openrouter.ai/)

**ProgressTracker** is a unified, full-stack productivity web application designed to help you organize tasks, build long-lasting habits, achieve long-term goals, track deep focus time, and receive **intelligent, personalized progress guidance** powered by an AI assistant grounded in your real application data.

---

## ✨ Key Features

### 🤖 Intelligent AI Progress Assistant
- **Live Grounded Reasoning**: Rather than acting as a generic chatbot, the AI assistant analyzes your actual database records (overdue tasks, upcoming deadlines, active streaks, in-progress goals, and focus time).
- **Intelligent Task Prioritization**: Ranks tasks based on urgency, deadline proximity, goal alignment, priority level, and streak preservation with clear explanatory reasoning.
- **Available-Time Intelligence**: Constrains recommendations to your available time (e.g. *"I only have 30 minutes"* vs *"Plan my afternoon"*).
- **Structured Output**: Delivers an executive summary, prioritized action cards, analytical progress insights, warning alerts, and concrete next actions.
- **Global Drawer & Dashboard Widget**: Accessible anywhere across the application via a floating trigger (`Ctrl+J` / `Cmd+J`) or the live dashboard intelligence widget.
- **Server-Side Security**: OpenRouter API key remains strictly server-side and is never exposed to the client bundle.

### 📊 Daily Command Center & Live Navigation Shell
- **Real-Time Sidebar Navigation Badges**: Dynamic, high-contrast numeric counters for Tasks, Habits, Sections, and Goals in the desktop sidebar and mobile drawer that stay synchronized with your Command Center data.
- **Live Completion Gauge**: Real-time circular metric tracking your daily combined task and habit completion percentage.
- **Dynamic Greeting & Quick Metrics**: Instant summary of today's completed tasks, habits checked in, focus minutes logged, and active habits.
- **Weekly Rolling Activity Chart**: 7-day interactive bar visualization tracking daily tasks, habits, and focus minutes.
- **Recent Activity Feed**: Append-only audit history of completed items and focus sessions.

### ⚡ Task Management
- Organized tasks with priority flags (`urgent`, `high`, `medium`, `low`), due dates, and section categorization.
- Automatic overdue task detection with day-count calculations.
- Instant check-off with optimistic UI updates and automatic activity logging.

### 🔥 Habit & Streak Engine
- Daily and weekly scheduled habit tracking.
- Pure deterministic streak math with consecutive active runs, lifetime longest streak records, and active grace periods.
- 7-day rolling visual completion dots and 30-day consistency rates.

### 🎯 Goal Tracking & Milestones
- Long-term target management with custom units (e.g. `pages`, `problems`, `hours`, `%`).
- Real-time progress percentages and days remaining countdown.
- Status management (`in_progress`, `paused`, `completed`, `cancelled`).

### 🗂️ Focus Sections & Workspace Isolation
- Flexible customizable sections to organize tasks, habits, and goals by focus area or project.
- Color-coded visual tags and isolated filtering across all views.

### ⏱️ Focus Time & Activity Logging
- Track dedicated work sessions with duration in minutes and custom tag categorizations.
- Top tag analytics and focus time distributions.

### 📈 Deep Analytics & History
- Comprehensive 7-day and 30-day productivity trends.
- Priority breakdowns, section focus distributions, habit performance leaderboard, and all-time active days consistency scoring.

---

## 🔒 Security & Multi-Tenant Architecture

- **Session Isolation**: Authentication is powered by Auth.js (NextAuth v5) using JWT session cookies with bcrypt password hashing.
- **Multi-Tenant Query Scoping**: Every database query is strictly scoped to the server-verified session user (`userId: sessionUser.id`). Client-provided IDs are never trusted.
- **Server-Side AI Protection**: The AI endpoint verifies user authentication, extracts only the authenticated user's data, strips sensitive information, and communicates with OpenRouter server-to-server.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **UI & Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://authjs.dev/) with Credentials Provider & bcryptjs
- **AI Intelligence**: [OpenRouter API](https://openrouter.ai/) (Configured with `minimax/minimax-m3:free`, compatible with Claude Sonnet, GPT-4o, DeepSeek)
- **Validation**: [Zod](https://zod.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A MongoDB database (local MongoDB or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- An [OpenRouter API Key](https://openrouter.ai/keys)

### 2. Clone the Repository
```bash
git clone https://github.com/Thanniru-yaswanth03/ProgressTracker.git
cd ProgressTracker
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory (refer to `.env.example`):

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/progress_tracker?retryWrites=true&w=majority

# NextAuth / Auth.js secrets
AUTH_SECRET=generate_a_random_32_character_secret_here
NEXTAUTH_SECRET=generate_a_random_32_character_secret_here
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000

# OpenRouter AI Assistant
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
OPENROUTER_MODEL=minimax/minimax-m3:free
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the comprehensive 27-test automated verification suite covering multi-tenant isolation, calculations, and live AI integration:

```bash
npx tsx --env-file=.env.local scripts/test-ai-assistant.ts
```

Run ESLint and Production Build:
```bash
npm run lint
npm run build
```

---

## 🌐 Deploying to Vercel

1. **Push to GitHub**: Ensure all your code is committed and pushed to your GitHub repository.
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your `ProgressTracker` repository.
3. **Configure Environment Variables** in the Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `AUTH_SECRET`: A secure random secret string (e.g. `openssl rand -hex 32`).
   - `NEXTAUTH_SECRET`: Same value as `AUTH_SECRET`.
   - `AUTH_TRUST_HOST`: `true`
   - `NEXTAUTH_URL`: Your Vercel production domain (e.g. `https://your-app.vercel.app`).
   - `OPENROUTER_API_KEY`: Your OpenRouter API key (`sk-or-v1-...`).
   - `OPENROUTER_MODEL`: `minimax/minimax-m3:free` (or your preferred OpenRouter model).
4. **Deploy**: Click **Deploy**. Vercel will build and host your Next.js application live!

---

## 📄 License

This project is licensed under the MIT License.
   
