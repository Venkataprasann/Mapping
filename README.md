# SyncRoute AI — Real-Time Journey Synchronization Application

SyncRoute AI is a modern consumer web application engineered to solve a common urban travel problem: **helping two or more people travelling from different starting locations arrive at a shared destination at approximately the same time.**

Unlike traditional navigation apps that merely calculate individual routes, SyncRoute AI synchronizes group arrivals by using traffic-aware travel durations to compute personalized departure countdowns, monitor real-time arrival gaps, and alert participants when conditions change.

---

## 1. Real-World Scenario (Bengaluru Demonstration)

* **Friend A** departs from **ITPL Main Rd, Whitefield** (21.4 km, heavy peak traffic, ~55 min travel duration).
* **Friend B** departs from **Phase 1, Electronic City** (14.2 km via Elevated Tollway, ~32 min travel duration).
* **Destination**: Movie night at **PVR Cinemas, Nexus Koramangala** at 7:30 PM.
* **Sync Recommendation**: Friend A must leave around 6:35 PM; Friend B is closer and is advised to wait until 6:58 PM.
* **Outcome**: Both friends step out of their vehicles within 2 minutes of each other, minimizing parking lot and lobby waiting time.

---

## 2. System Architecture

```
                                  +------------------------------------+
                                  |     SyncRoute AI Client (React)    |
                                  |  - Mobile-First Responsive UI      |
                                  |  - Google Maps JS API Viewport    |
                                  |  - AI Voice Copilot Interface      |
                                  |  - Real-Time Socket.IO Client      |
                                  +-----------------+------------------+
                                                    |
                                   REST / WebSocket | (JWT Auth & RLS)
                                                    v
                                  +------------------------------------+
                                  |      Express / Node.js Backend     |
                                  |  - Auth & Trip Membership Guard    |
                                  |  - Journey Synchronization Engine  |
                                  |  - Notification & Cooldown Guard   |
                                  |  - Voice Assistant Tool Registry   |
                                  |  - Google Routes & Places Client   |
                                  +--------+------------------+--------+
                                           |                  |
                          SQL / RLS Policy |                  | External APIs
                                           v                  v
    +----------------------------------------+   +-------------------------------+
    |      PostgreSQL / Supabase Database    |   | - Google Maps Platform        |
    | - profiles, trips, trip_participants   |   |   (Routes API v2, Places API) |
    | - notifications, audit logs            |   | - OpenAI API (gpt-4o-mini)    |
    | - Row Level Security (RLS)             |   | - Web Push VAPID Service      |
    +----------------------------------------+   +-------------------------------+
```

---

## 3. Project Structure

```
Mapping/
├── backend/
│   ├── migrations/
│   │   └── 001_initial_schema.sql         # PostgreSQL schema & RLS policies
│   ├── src/
│   │   ├── config/index.ts                # Environment configuration loader
│   │   ├── controllers/
│   │   │   ├── authController.ts          # Login, signup & profile handler
│   │   │   ├── routeController.ts         # Routes & Places search handler
│   │   │   ├── tripController.ts          # Trip CRUD & sync handlers
│   │   │   └── voiceController.ts         # Conversational voice command handler
│   │   ├── middleware/
│   │   │   ├── auth.ts                    # Bearer token validation
│   │   │   └── membership.ts              # Trip membership & privacy guard
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── routeRoutes.ts
│   │   │   ├── tripRoutes.ts
│   │   │   └── voiceRoutes.ts
│   │   ├── services/
│   │   │   ├── database.ts                # Supabase & resilient in-memory store
│   │   │   ├── googleRoutesService.ts     # Google Routes API v2 & Bengaluru simulator
│   │   │   ├── notificationService.ts     # Anti-flapping deduplication & cooldowns
│   │   │   ├── placesService.ts           # Google Places autocomplete & presets
│   │   │   ├── syncEngine.ts              # Mathematical journey synchronization
│   │   │   ├── voiceAssistantService.ts   # OpenAI & offline driving copilot
│   │   │   └── voiceAssistantTools.ts     # 9 approved tools with Zod validation
│   │   └── server.ts                      # Express & Socket.IO server
│   ├── test/                              # 41 automated tests
│   │   ├── phase2_auth_trip.test.ts
│   │   ├── phase2_membership_api.test.ts
│   │   ├── phase3_routes.test.ts
│   │   ├── phase4_sync_engine.test.ts
│   │   ├── phase5_realtime_notifications.test.ts
│   │   ├── phase6_voice_tools.test.ts
│   │   └── phase7_master_integration.test.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                        # Reusable accessible design system
│   │   │   │   ├── ArrivalGapMeter.tsx    # Differentiator gap gauge
│   │   │   │   ├── Badge.tsx              # Live/Demo status pills
│   │   │   │   ├── Button.tsx             # Interactive variants
│   │   │   │   ├── Card.tsx               # Glassmorphic surfaces
│   │   │   │   ├── CountdownTimer.tsx     # Urgency-colored departure countdown
│   │   │   │   └── Modal.tsx              # Accessible dialog
│   │   │   ├── DemoBanner.tsx             # Clear Live vs Demo indicator
│   │   │   ├── Navbar.tsx                 # Responsive mobile-first navigation
│   │   │   ├── TripMapView.tsx            # Multi-route map with stale GPS alerts
│   │   │   └── VoiceAssistantModal.tsx    # Speech recognition & audio synthesis
│   │   ├── hooks/
│   │   │   └── useRealtimeTrip.ts         # Socket.IO & Geolocation watcher hook
│   │   ├── mock/
│   │   │   └── demoData.ts                # Pre-seeded Bengaluru scenario
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── CreateTripPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── JoinTripPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LiveTripPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/
│   │   │   └── api.ts                     # Typed REST client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared/
│   └── types.ts                           # Shared TypeScript domain contracts
└── package.json                           # Root workspace orchestrator
```

---

## 4. Local Development Instructions

### Prerequisites
* Node.js v18+ (tested on v24)
* npm v9+

### Quick Start (Zero Config Demo Mode)
The application is pre-configured with a high-fidelity Bengaluru simulation engine so that **every feature, countdown, route, and voice command is 100% operational immediately without requiring external API keys**.

1. **Install Dependencies**:
   ```bash
   # From root directory:
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Run Backend (Port 5000)**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Run Frontend (Port 5173)**:
   ```bash
   cd frontend
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`. Click **"Explore Bengaluru Demo"** to see live synchronization in action.

---

## 5. API Setup Instructions (Optional for Live Production)

To enable live external APIs, copy `backend/.env.example` to `backend/.env` and supply credentials:

### A. Google Maps Platform
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Routes API** and **Places API (New)**.
3. Generate an API Key restricted by IP address (for server-side calls).
4. Set in `backend/.env`:
   ```env
   GOOGLE_MAPS_SERVER_API_KEY=AIzaSy...
   ```
5. *(Optional for frontend Google Maps rendering)*: Set in `frontend/.env`:
   ```env
   VITE_GOOGLE_MAPS_PUBLIC_KEY=AIzaSy...
   ```

### B. Supabase / PostgreSQL
1. Create a project at [Supabase](https://supabase.com).
2. Run the SQL migration file located at `backend/migrations/001_initial_schema.sql` in the Supabase SQL Editor to establish tables and Row Level Security.
3. Set in `backend/.env`:
   ```env
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_ANON_KEY=<your-anon-key>
   ```

### C. OpenAI API (AI Voice Assistant)
1. Obtain an API key from [OpenAI Platform](https://platform.openai.com/api-keys).
2. Set in `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   ```

---

## 6. Features Matrix

| Feature | Works Out of the Box (Demo Mode) | Activated With Credentials |
| :--- | :---: | :---: |
| **Synchronized Departure Recommendations** | ✅ Supported | ✅ Supported |
| **Countdown Urgency Timers** | ✅ Supported | ✅ Supported |
| **Arrival Gap & Tolerance Meter** | ✅ Supported | ✅ Supported |
| **Anti-Spam Notification Cooldowns** | ✅ Supported | ✅ Supported |
| **Multi-Party Trips & Unique Codes** | ✅ Supported | ✅ Supported |
| **Location Sharing Privacy Toggles** | ✅ Supported | ✅ Supported |
| **Stale GPS Location Warnings** | ✅ Supported | ✅ Supported |
| **AI Voice Assistant (Hands-Free)** | ✅ Intelligent Copilot | ✅ GPT-4o-mini Tool Calling |
| **Interactive Map Viewport** | ✅ Canvas Vector Routes | ✅ Google Maps JS API |
| **Traffic-Aware Travel Durations** | ✅ Bengaluru Corridor Model | ✅ Google Routes API v2 |
| **Location Autocomplete** | ✅ Bengaluru Curated Places | ✅ Google Places API |

---

## 7. Cost-Control Checklist for Google Maps & OpenAI

To prevent runaway billing in production:

* [x] **Strict Field Masking**: All server-side Google Routes API calls use `X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline`, preventing excess charge for unneeded metadata.
* [x] **Server-Side Routing Proxy**: Frontend never calls paid APIs directly; all requests flow through backend caching and rate limiting.
* [x] **Anti-Flapping Damping (180s)**: Route recalculations ignore minor traffic jitter (< 3 mins), preventing repeated expensive Matrix lookups.
* [x] **Exponential Cooldown on Notifications**: 5-minute deduplication window prevents notification and background job storms.
* [x] **OpenAI Token Minimization**: System prompt is compact, tool definitions are strictly typed, and `temperature` is set to `0.2` to ensure deterministic, cost-effective responses.

---

## 8. Automated Testing

Run the complete automated test suite (all 12 required test conditions from project specification):

```bash
cd backend
npm test
```

### Verified Test Conditions:
1. Two users with different starting locations.
2. Three or more participants with unequal journey durations.
3. One user starting later than another (staggered departure).
4. Traffic-related ETA changes and delay threat detection.
5. A user stopping location sharing immediately.
6. Stale location data detection (flags updates older than 2 minutes).
7. Network failure and offline state resilience.
8. Rejection of invalid or expired invitation tokens.
9. Blocked unauthorized access to private trips.
10. Repeated notification suppression via cooldown windows.
11. Arrival-time calculations and configured tolerance checks ($\pm 5$ mins).
12. AI tool calls with missing or invalid arguments rejected cleanly.

**Current Test Status**: 7 test suites, 41 tests passing (100% pass rate).
