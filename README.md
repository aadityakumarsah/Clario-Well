# Clario — Your Daily Emotional Companion

> *Because some days you just need something that actually gets it.*

Clario is a full-stack mental wellness web app built for the moments when you're running on empty — the 2 AM anxiety spiral, the midday fog that won't lift, the feeling you can't quite name. It doesn't judge. It doesn't give generic advice. It listens, guides, and meets you where you are.

---

## What It Does

Clario weaves together AI conversation, biofeedback, and creative expression into a single daily ritual. Three check-ins. A breathing session tuned to your exact emotion. A garden that grows as you show up for yourself.

---

## Features

### Daily Check — The Backbone of the Ritual

Three gentle anchors throughout your day, each one a different kind of care:

**Morning Energy** — Start with hydration and presence. Clario reminds you to drink water, not because it's on a checklist, but because it's the smallest act of kindness you can do for yourself before the day begins.

**Day Refill** — A midday movement moment. Five squats tracked by your camera. The goal isn't fitness. It's the 40-second interruption that reminds you that you have a body, and it needs you.

**Night Summary** — A voice agent that listens to your whole day. No prompts. No structure. Just you talking, and an AI that reflects back what it heard — patterns, wins, the weight you're carrying. Powered by Gemini.

Completion is remembered across the day. The garden on your home screen blooms a little more each time you check in.

---

### Breathe — Evidence-Based Breathing for Every Emotion

Not generic 4-7-8. Not a timer you ignore. Clario picks a breathing pattern calibrated to what you're actually feeling:

| Emotion | Pattern | Why |
|---------|---------|-----|
| Anxiety | 4s inhale → 6s exhale | Extended exhale activates the vagus nerve |
| Anger | 4s inhale → 8s exhale | Longest exhale to cool the nervous system fast |
| Stress | 4s inhale → 6s exhale | Box-adjacent, without the holds that spike anxiety |
| Fear | 4s inhale → 4s exhale | Equal ratio to ground, not overwhelm |
| Worry | 4s inhale → 7s exhale | Parasympathetic dominance through breath ratio |
| Sadness | 4s inhale → 5s exhale | Gentle extension, enough to shift state |
| Irritation | 4s inhale → 6s exhale | Steady rhythm to break the loop |
| Envy | 4s inhale → 4s exhale | Neutral, centering |

Audio cues — real recorded inhale and exhale sounds — play at exactly the right moment, timed so the next cue never feels late. Works fully on iOS with all audio restrictions respected.

---

### Relief — When Words Aren't Enough

Sometimes you need your hands, not your head. Relief offers two creative outlets:

**Air Drawing** — Draw in the air with your finger using your phone camera. MediaPipe Hands tracks your hand in real time with no special hardware. When you're done, tap Submit — Gemini Vision analyzes your drawing and generates a personalized emotional reflection report.

**Space Blocks** — Build in augmented reality with gesture controls, like Minecraft but in your living room and with your bare hands. Point to move a cursor, pinch to place a block, open palm to erase. Eight block types, a 6×6×8 isometric grid, full AR canvas overlay. The act of building something — anything — is itself the relief.

---

### Meditation — Stillness on Demand

Guided meditation sessions for when the breath work isn't enough and you need to fully stop.

---

### Dashboard — Your Emotional Story Over Time

See your check-in history, mood patterns, and journal entries across days. The data is yours, stored privately, surfaced back to you as insight rather than surveillance.

---

### Journal — Write the Things You Can't Say Out Loud

A private, searchable journal. Dark mode by default, because most journal entries happen at night.

---

### Mood Menu (Mobile)

The mobile tab bar is intentionally minimal — five tabs: Check, Dashboard, Mood, Journal, Settings. Tapping **Mood** slides up a bottom sheet where you choose between Breathe, Relief, and Meditation. No clutter. No decision fatigue.

---

## Technical Architecture

| Layer | Stack |
|-------|-------|
| Frontend | Vite + React + TypeScript, Tailwind CSS, shadcn/ui, framer-motion |
| Backend | FastAPI (Python 3.11+), Uvicorn, SQLite, Docker |
| AI | Google Gemini 2.5 Flash — vision analysis + real-time voice conversation |
| Gestures | MediaPipe Hands (runs entirely in-browser, no server round-trips) |
| Routing | React Router v6 |
| Auth | PyJWT |
| Deployment | Frontend → Vercel, Backend → Render |
| PWA | Web app manifest + service worker — installable on iOS and Android |

---

## Running Locally

**Backend**
```bash
cd clario-backend
pip install -r requirements.txt
GEMINI_API_KEY=your_key JWT_SECRET=your_secret uvicorn main:app --reload
```

**Frontend**
```bash
cd clario-frontend
npm install
VITE_BACKEND_BASE_URL=http://localhost:8000 npm run dev
```

**Required environment variables**
```
# Backend
GEMINI_API_KEY=
JWT_SECRET=

# Frontend  
VITE_BACKEND_BASE_URL=
```

---

## Installing as an App

Clario is a Progressive Web App. On Android: open in Chrome → three-dot menu → *Add to Home Screen*. On iOS: open in Safari → Share → *Add to Home Screen*. It runs fullscreen, no browser chrome, exactly like a native app.

---

## Screenshots

| Home — Light | Dashboard — Dark | Journal Entry |
|---|---|---|
| ![Home](project_screenshots/Home%20Page%20-%20Light.png) | ![Dashboard](project_screenshots/Dashboard%20-%20Dark.png) | ![Journal](project_screenshots/Journal%20Entry%20-%20Dark.png) |

| Voice Call | Report | About |
|---|---|---|
| ![Call](project_screenshots/Call%20-%20Light.png) | ![Report](project_screenshots/Report%20-%20Light.png) | ![About](project_screenshots/About%20Page%20-%20Dark.png) |

---

## The Philosophy

Most wellness apps are built around streaks, gamification, and engagement metrics. Clario is built around the opposite: the minimum effective dose of presence. Three check-ins. One breath session. Five minutes of air drawing if you need it. You close the app and go live your life.

The garden on the home screen doesn't wilt if you miss a day. It just waits.

---

## License

MIT — use it, build on it, make it your own.

---

*Built with care. For the hard days.*
