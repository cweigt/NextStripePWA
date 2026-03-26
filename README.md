# NextStripe

A Brazilian Jiu-Jitsu training tracker built with Next.js. Log sessions, track competition results, analyze your progress with charts, and get AI-powered insights — all in one place.

---

## Purpose

NextStripe helps BJJ practitioners monitor their development over time. Instead of keeping mental notes or scattered journals, you get a structured dashboard to record every training session, tag the techniques you worked on, track your competition record, and visualize trends in your training quality and focus areas.

---

## Features

- **Training Session Logging** — Record sessions with title, date, duration, quality rating (1–10), notes, and technique tags
- **Technique Tagging** — Tag sessions with BJJ-specific categories (takedowns, guard attacks, chokes, sweeps, escapes, etc.) to track where you spend your mat time
- **Competition Tracker** — Log wins and losses, broken down by submission vs. points
- **Analytics Dashboard** — Technique frequency charts and monthly average quality trends over the last 6 months
- **AI-Powered Summaries & Insights** — Session notes are summarized by GPT-4o-mini; training patterns generate coaching insights
- **Video Library** — Store and organize BJJ instructional videos with difficulty ratings
- **Belt & Stripe Tracking** — Set your current rank (White through Black) with stripe progress displayed visually
- **Daily Motivational Quotes** — Pulled fresh each day and cached to Firebase
- **Progressive Web App (PWA)** — Installable on mobile and desktop with offline caching support
- **Responsive Layout** — Sidebar navigation on desktop, bottom tab bar on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Firebase Realtime Database |
| Auth | Firebase Authentication |
| Storage | Firebase Cloud Storage |
| AI | OpenAI API (GPT-4o-mini) |
| Charts | Recharts |
| PWA | @ducanh2912/next-pwa |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase project](https://console.firebase.google.com/) with Realtime Database, Authentication (Email/Password), and Storage enabled
- An [OpenAI API key](https://platform.openai.com/)

### 1. Clone the repo

```bash
git clone <repo-url>
cd NextStripe-Web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Firebase — safe to expose to the client (security enforced by Firebase rules)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# OpenAI — server-side only, never expose to the client
OPENAI_API_KEY=
```

Find your Firebase credentials in the Firebase console under **Project Settings > General > Your apps > SDK setup and configuration**.

### 4. Firebase setup

In the Firebase console:

1. **Authentication** — Enable the **Email/Password** sign-in provider
2. **Realtime Database** — Create a database and set rules that restrict read/write to authenticated users:
   ```json
   {
     "rules": {
       "users": {
         "$uid": {
           ".read": "$uid === auth.uid",
           ".write": "$uid === auth.uid"
         }
       }
     }
   }
   ```
3. **Storage** — Enable Firebase Storage for video uploads

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account and start logging.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production (also generates the PWA service worker) |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

> **Note:** The PWA service worker is only active in production builds. In development, offline caching is disabled.

---

## Authentication

- Email/password authentication via Firebase
- Password requirements: 10+ characters, uppercase, lowercase, number, and special character
- Unauthenticated users are redirected to `/auth`
- Supports password reset via email and full account deletion

---

## AI Features

Two server-side API routes handle OpenAI calls so the API key is never exposed to the client:

- **`/api/summarize`** — Accepts session notes and returns a concise summary
- **`/api/insights`** — Accepts training context (recent sessions, tags, quality trends) and returns personalized coaching insights

Both use `gpt-4o-mini` for cost efficiency.

---

## PWA / Mobile

NextStripe is installable as a PWA on iOS, Android, and desktop. After running `npm run build`, a service worker is generated that caches navigation and static assets for offline support. The app uses Apple Web App meta tags and safe-area insets for a native feel on iOS.

---

## Belt System

Ranks supported: White, Blue, Purple, Brown, Black — each with 0–4 stripes. The account page displays the current rank visually and allows updating it.

---

## Technique Tags

Tags cover the major BJJ positions and technique categories:

Takedowns, Guard Attacks, Guard Sweeps, Guard Passes, Side Control Attacks, Side Control Escapes, Mount Attacks, Mount Escapes, Back Control, Chokes, Rear-Naked Chokes, Kimura, Americana, Arm Locks, Leg Locks, X-Guard, North-South, Knee on Belly, Grips

These tags are used for session filtering and technique frequency analytics.

---

## Environment Variable Reference

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client + Server | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client + Server | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Client + Server | Realtime Database URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client + Server | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client + Server | Cloud Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client + Server | Firebase messaging sender |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client + Server | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Client + Server | Firebase Analytics ID |
| `OPENAI_API_KEY` | Server only | OpenAI key for AI features |
