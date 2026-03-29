# Virtual Event Platform

Full-stack web application for discovering, registering for, and attending online events. Organizers can broadcast live video to attendees; participants share an event-scoped chat with optional file attachments. Paid events use **Stripe Checkout**; authentication uses **JWT** in **HTTP-only cookies** with a **MongoDB** persistence layer.

Originally developed as a capstone-style team project; this document reflects the **implemented** behavior in the repository, not aspirational features.

---

## What it does

| Area | Behavior (as implemented) |
|------|---------------------------|
| **Accounts** | Sign up, login, logout; JWT issued on login and read from cookies on protected API calls. |
| **Password reset** | Forgot-password flow with email token (Nodemailer + Gmail-compatible SMTP). |
| **Events** | CRUD-style operations: create events (title, description, schedule, venue, price, category), list, detail view, update/delete for organizers, join as attendee. |
| **Live video** | **WebRTC** (`RTCPeerConnection`) for organizer → attendee streams; **native WebSocket** (`ws`) on the server for signaling (SDP offers/answers, ICE candidates) and stream lifecycle (`stream-started` / `stream-stopped`). |
| **Chat** | Real-time messages over the same WebSocket server; in-memory history (last ~50 on join, ring buffer ~200 per room on the server). File metadata and uploads for chat attachments use the REST API and local disk storage under `uploads/`. |
| **Payments** | Stripe Checkout session creation; success callback records a **Payment** document and sends confirmation email. |
| **Recommendations** | Rule-based: events whose **category** appears in the user’s **preferences** array, excluding events the user already joined. |
| **Notifications** | MongoDB-backed notifications with read/unread state (`/api/notifications`). |
| **Profiles** | Bio, interests, avatar image (Multer, local `uploads/avatars`). |

Non-goals in the current codebase: there is **no** Redis cache, **no** AWS S3 integration (media is local filesystem), **no** Redux store, and **no** production APM hooks (e.g. New Relic/Sentry) in source. Some npm dependencies (e.g. `mediasoup`, `socket.io` on the server) are present but the live path uses **`ws` + hand-rolled signaling** in `server/src/index.js`.

---

## Architecture

```
Browser (React + Vite)
  ├── HTTPS REST  → Express API (Mongoose, JWT cookies, Stripe)
  └── WebSocket   → Same Node process (/ws) for WebRTC signaling + chat
MongoDB           ← persistent users, events, payments, notifications
Local disk        ← avatars, event-scoped uploads
```

- **Frontend:** `client/my-app` — React 18, TypeScript, Vite, MUI, React Router, Axios, Stripe.js.
- **Backend:** `server` — Express 4, Mongoose 8, `bcryptjs`, `jsonwebtoken`, `stripe`, `nodemailer`, `multer`, **`ws`** (WebSocket).

---

## Repository layout

| Path | Role |
|------|------|
| `server/src/index.js` | Express app, static `/uploads`, Multer routes, **WebSocket server** on `/ws` |
| `server/src/routes/` | `userRoutes`, `eventRoutes`, `paymentRoutes`, `notificationsRoutes` |
| `server/src/controllers/` | Business logic for users, events, payments, notifications |
| `server/src/models/` | Mongoose schemas (`User`, `Event`, `Payment`, `Notification`, …) |
| `server/src/middleware/authMiddleware.js` | JWT verification from cookie |
| `client/my-app/src/` | SPA: `App.tsx`, `pages/`, `components/`, `context/UserContext.tsx` |
| `server/Dockerfile`, `client/my-app/Dockerfile` | Container images for API + static SPA (Nginx) |

---

## API surface (summary)

- **`/user`** — signup, login, logout, profile, preferences, recommendations, forgot/reset password.
- **`/events`** — list, get by id, create/update/delete (protected), add attendee, livestream start/stop/get URL (protected).
- **`/api/payments`** — Stripe checkout and success handling.
- **`/api/notifications`** — list and mark read (protected).
- **WebSocket** `ws://…/ws` — JSON messages: `join-room`, `offer`, `answer`, `ice-candidate`, `chat-message`, stream events (see `server/src/index.js`).

---

## Prerequisites

- **Node.js** 18+ (Dockerfiles use Node 20 LTS).
- **MongoDB** (local or Atlas).
- **Stripe** account (test keys are fine for development).
- SMTP credentials if you use password reset and transactional email (Gmail app password or compatible SMTP).

---

## Local development

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env` (names used in code):

```env
MONGO_URI=mongodb://localhost:27017/virtual-event
SECRET_KEY=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
YOUR_DOMAIN=http://localhost:5173
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
```

```bash
npm run dev
# API and WebSocket on port 5000 (see src/index.js)
```

### 2. Frontend

```bash
cd client/my-app
npm install
```

Create `client/my-app/.env` (Vite variables):

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```bash
npm run dev
# Default Vite dev server: http://localhost:5173
```

CORS in the server allows `http://localhost:5173` and `http://localhost:3000`.

---

## Testing

Backend uses **Jest** + **Supertest**:

```bash
cd server
npm test
```

> Note: `server/src/__tests__/event.test.js` imports `../app`; there is no `app.js` module in the tree—only `index.js` exports `{ app, server }`. You may need a thin `app.js` re-export or to point tests at `index` for event tests to run cleanly.

---

## Docker

Multi-stage **frontend** image (Node build → Nginx on port 80): `client/my-app/Dockerfile`.

**Backend** image: `server/Dockerfile` (Node 20, exposes 5000).

Example (from repo root, after configuring env as required by each Dockerfile):

```bash
docker build -t virtual-event-api ./server
docker run -p 5000:5000 virtual-event-api

docker build -t virtual-event-web ./client/my-app
docker run -p 8080:80 virtual-event-web
```

---

## Deployment notes

There is **no** GitHub Actions workflow in this repository (no `.github/` folder). Ship the **Docker** images above to any host you control (VM, container service, or Kubernetes). For production:

- Set **`VITE_API_URL`** and **`VITE_WS_URL`** to your public API and WebSocket URLs (use `wss://` behind TLS).
- Configure **`MONGO_URI`**, **`SECRET_KEY`**, Stripe, and SMTP on the API container or process manager.
- WebSocket and HTTP must reach the **same** Node process (or a correctly configured reverse proxy with upgrade support for `/ws`).

---

## Team & acknowledgments

- **Development team:** Tommy Lam Luu, Ansh, Pranet, Nikhil (roles as coordinated for the academic project).
- **Faculty advisor:** Carol Demas (demasc@ufl.edu).

---

## License

See repository default; add a `LICENSE` file if you intend open-source distribution.
