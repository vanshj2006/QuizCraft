# Quiz Craft

A full-stack quiz platform with AI-powered question generation, live real-time sessions, a reusable question bank, and community quiz sharing.

---

## Features

- **AI Generation** — generate questions or a full quiz from a topic or uploaded file (PDF, image, Word, TXT) using Google Gemini
- **Live Sessions** — host real-time quiz sessions; players join with a code and compete on a live leaderboard via Socket.IO
- **Question Bank** — build a reusable library of questions and add them to any quiz
- **Community Quizzes** — publish quizzes publicly and discover quizzes from other users
- **Auth** — email/password with JWT refresh tokens, Google OAuth, email verification, forgot/reset password
- **Dashboard & Stats** — accuracy, XP, streaks, and quiz attempt history
- **Quiz Creator** — manual question builder with difficulty, options, explanations, tags and visibility settings

---

## Tech Stack

| | Package | Purpose |
|---|---|---|
| **Backend** | Express 4 | HTTP server & routing |
| | Mongoose 8 | MongoDB ODM |
| | Socket.IO 4 | Real-time live sessions |
| | JSON Web Token | Access + refresh token auth |
| | @google/generative-ai | Gemini API for question generation |
| | Nodemailer | Transactional email |
| **Frontend** | React 18 | UI framework |
| | React Router 6 | Client-side routing |
| | Zustand | Global state |
| | Axios | HTTP client with token interceptors |
| | Socket.IO Client | Real-time connection |
| | Tailwind CSS 3 | Styling |
| | Vite 5 | Build tool & dev server |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database ([MongoDB Atlas](https://cloud.mongodb.com) recommended)
- [Google Cloud](https://console.cloud.google.com) project with OAuth 2.0 credentials and Gemini API enabled
- Gmail App Password for transactional email

### Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

JWT_SECRET=your_long_random_secret
JWT_REFRESH_SECRET=your_other_long_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=you@gmail.com

GEMINI_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173
```

**`frontend/.env`**

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Installation & Running

```bash
# Backend (port 5000)
cd backend
npm install
npm run dev

# Frontend (port 5173)
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login with email + password |
| POST | `/google` | — | Login with Google ID token |
| POST | `/refresh` | — | Refresh access token via cookie |
| POST | `/logout` | ✓ | Revoke refresh token |
| POST | `/forgot-password` | — | Send password reset email |
| POST | `/reset-password` | — | Reset password with token |

### Quizzes — `/api/quizzes`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/mine` | ✓ | Get my quizzes |
| GET | `/public` | ✓ | Get public community quizzes |
| POST | `/` | ✓ | Create quiz |
| PUT | `/:id` | ✓ | Update quiz |
| DELETE | `/:id` | ✓ | Delete quiz |
| POST | `/:id/attempt` | ✓ | Submit quiz attempt |

### Questions — `/api/questions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List questions |
| POST | `/` | ✓ | Create question |
| PUT | `/:id` | ✓ | Update question |
| DELETE | `/:id` | ✓ | Delete question |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generate/topic` | ✓ | Generate questions from a topic |
| POST | `/generate/file` | ✓ | Generate questions from a file |
| POST | `/generate/full-quiz` | ✓ | Generate and save a complete quiz |

### Live Sessions — `/api/live`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/session` | ✓ | Create a session and get join code |
| GET | `/session/:code` | ✓ | Get session state |
| DELETE | `/session/:code` | ✓ | End session |

---

## Key Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | Stats, recent quizzes, community feed |
| `/quizzes` | My quizzes + community tab |
| `/quizzes/create` | Build manually, via AI, or from question bank |
| `/quizzes/:id/play` | Take a quiz solo |
| `/bank` | Question bank |
| `/live/:code/lobby` | Host/join waiting room |
| `/live/:code/session` | Real-time quiz with leaderboard |
| `/profile` | Account settings and attempt history |
