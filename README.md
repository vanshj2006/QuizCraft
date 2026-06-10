# Quiz Craft

A full-stack quiz platform with AI-powered question generation, live real-time sessions, a reusable question bank, and community quiz sharing.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Seeding Test Data](#seeding-test-data)
- [API Reference](#api-reference)
- [Key Pages](#key-pages)

---

## Features

- **AI Generation** — generate questions or a full quiz from a topic or uploaded file (PDF, image, Word, TXT) using Google Gemini
- **Live Sessions** — host real-time quiz sessions; players join with a code and compete on a live leaderboard via Socket.IO
- **Question Bank** — build a reusable library of questions and add or remove them from any quiz
- **Community Quizzes** — publish quizzes publicly and discover quizzes from other users
- **Auth** — email/password with JWT refresh tokens, Google OAuth, email verification, forgot/reset password
- **Dashboard & Stats** — accuracy, XP, streaks, active sessions and quiz attempt history
- **Quiz Creator** — manual question builder with difficulty, options, explanations, tags and visibility settings

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express 4 | HTTP server & routing |
| Mongoose 8 | MongoDB ODM |
| Socket.IO 4 | Real-time live sessions |
| JSON Web Token | Access + refresh token auth |
| bcryptjs | Password hashing |
| Google Auth Library | Google OAuth token verification |
| @google/generative-ai | Gemini API for question generation |
| Nodemailer | Transactional email (verification, password reset) |
| express-rate-limit | API rate limiting |
| dotenv | Environment configuration |

### Frontend
| Package | Purpose |
|---|---|
| React 18 | UI framework |
| React Router 6 | Client-side routing |
| Zustand | Lightweight global state |
| Axios | HTTP client |
| Socket.IO Client | Real-time connection |
| Tailwind CSS 3 | Utility-first styling |
| Vite 5 | Build tool & dev server |

---

## Project Structure

```
quizCraft/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── ai.controller.js       # Gemini generation endpoints
│   │   │   ├── auth.controller.js     # Register, login, Google OAuth, tokens
│   │   │   ├── live.controller.js     # Live session management
│   │   │   ├── question.controller.js # Question bank CRUD
│   │   │   ├── quiz.controller.js     # Quiz CRUD + attempts
│   │   │   └── user.controller.js     # Profile, stats, attempts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js     # JWT protect middleware
│   │   ├── models/
│   │   │   ├── LiveSession.model.js
│   │   │   ├── Question.model.js
│   │   │   ├── Quiz.model.js
│   │   │   ├── QuizAttempt.model.js
│   │   │   └── User.model.js
│   │   ├── routes/
│   │   │   ├── ai.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── live.routes.js
│   │   │   ├── question.routes.js
│   │   │   ├── quiz.routes.js
│   │   │   └── user.routes.js
│   │   ├── socket/
│   │   │   └── index.js               # Socket.IO live session events
│   │   ├── utils/
│   │   │   ├── email.js               # Nodemailer helpers
│   │   │   ├── generateCode.js        # Room code generator
│   │   │   └── jwt.js                 # Token signing/verification
│   │   ├── index.js                   # App entry point
│   │   └── seed.js                    # Database seed script
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ConfirmModal.jsx        # Shared alert/confirm modals
    │   │   └── layout/
    │   │       ├── AppLayout.jsx
    │   │       └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   ├── RegisterPage.jsx
    │   │   │   ├── VerifyEmailPage.jsx
    │   │   │   ├── ForgotPasswordPage.jsx
    │   │   │   └── ResetPasswordPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── QuizzesPage.jsx
    │   │   ├── QuizCreatorPage.jsx    # Manual + AI + Question Bank builder
    │   │   ├── QuizPlayPage.jsx
    │   │   ├── QuestionBankPage.jsx
    │   │   ├── LiveLobbyPage.jsx
    │   │   ├── LiveSessionPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── LandingPage.jsx
    │   ├── store/
    │   │   ├── authStore.js
    │   │   ├── quizStore.js
    │   │   └── questionStore.js
    │   ├── lib/
    │   │   └── axios.js               # Axios instance with token interceptor
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://cloud.mongodb.com))
- A [Google Cloud](https://console.cloud.google.com) project with:
  - OAuth 2.0 credentials (for Google Sign-In)
  - Gemini API key enabled
- An SMTP server or Gmail app password (for email)

---

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# JWT
JWT_SECRET=your_long_random_secret
JWT_REFRESH_SECRET=your_other_long_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=you@gmail.com

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Frontend URL (for email links)
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Running the App

Run both servers in separate terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

### Seeding Test Data

Populate the database with users, questions, quizzes, and quiz attempts for testing:

```bash
cd backend
node src/seed.js
```

To wipe everything and re-seed:

```bash
node src/seed.js --reset
```

This creates **5 test accounts** (all with password `password123`):

| Email | Name |
|---|---|
| alice@demo.com | Alice Chen |
| bob@demo.com | Bob Sharma |
| carol@demo.com | Carol Martin |
| dave@demo.com | Dave Osei |
| eva@demo.com | Eva Kowalski |

And seeds **27 questions** across Computer Science, Mathematics, Physics, Chemistry, and General Knowledge — grouped into **8 quizzes** with varying visibility, plus realistic quiz attempt history.

---

## API Reference

All routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login with email + password |
| POST | `/google` | — | Login/register with Google ID token |
| GET | `/verify-email?token=` | — | Verify email address |
| POST | `/resend-verification` | — | Resend verification email |
| POST | `/forgot-password` | — | Send password reset email |
| POST | `/reset-password` | — | Reset password with token |
| POST | `/refresh` | — | Refresh access token via cookie |
| POST | `/logout` | ✓ | Revoke refresh token |
| GET | `/me` | ✓ | Get current user |

### Quizzes — `/api/quizzes`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/mine` | ✓ | Get my quizzes |
| GET | `/public` | ✓ | Get public community quizzes |
| POST | `/` | ✓ | Create quiz |
| GET | `/:id` | ✓ | Get quiz by ID |
| PUT | `/:id` | ✓ | Update quiz settings |
| DELETE | `/:id` | ✓ | Delete quiz |
| PATCH | `/:id/publish` | ✓ | Publish quiz |
| POST | `/:id/attempt` | ✓ | Submit quiz attempt |
| POST | `/:id/questions` | ✓ | Add question to quiz |
| DELETE | `/:id/questions/:questionId` | ✓ | Remove question from quiz |

### Questions — `/api/questions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List questions (filter by difficulty, category, search, mine) |
| POST | `/` | ✓ | Create question |
| GET | `/:id` | ✓ | Get question |
| PUT | `/:id` | ✓ | Update question |
| DELETE | `/:id` | ✓ | Delete question |
| POST | `/:id/bookmark` | ✓ | Toggle bookmark |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generate/topic` | ✓ | Generate questions from a topic string |
| POST | `/generate/file` | ✓ | Generate questions from a base64 file |
| POST | `/generate/full-quiz` | ✓ | Generate and save a complete quiz |
| POST | `/save` | ✓ | Save a batch of AI questions |

### Live Sessions — `/api/live`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/session` | ✓ | Create a live session and get join code |
| GET | `/session/:code` | ✓ | Get session state |
| DELETE | `/session/:code` | ✓ | End session |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | ✓ | Get own profile |
| PUT | `/me` | ✓ | Update profile |
| PUT | `/me/password` | ✓ | Change password |
| GET | `/me/stats` | ✓ | Dashboard stats (XP, streak, accuracy) |
| GET | `/me/attempts` | ✓ | Quiz attempt history |
| GET | `/:id` | ✓ | Get user profile by ID |

---

## Key Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Marketing landing page (guests only) |
| `/login` | Login | Email/password + Google sign-in |
| `/register` | Register | Create account |
| `/dashboard` | Dashboard | Stats, recent quizzes, community feed |
| `/quizzes` | Quizzes | My quizzes + community tab with search |
| `/quizzes/create` | Quiz Creator | Build quizzes manually, via AI, or from the question bank |
| `/quizzes/:id/edit` | Quiz Editor | Edit an existing quiz |
| `/quizzes/:id/play` | Quiz Play | Take a quiz solo |
| `/bank` | Question Bank | Browse, filter and manage all questions |
| `/live/:code/lobby` | Live Lobby | Host/join waiting room |
| `/live/:code/session` | Live Session | Real-time quiz with leaderboard |
| `/profile` | Profile | Account settings, stats, attempt history |
