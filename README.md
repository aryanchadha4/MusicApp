# Music Diary

Music Diary is a full-stack music journaling app for tracking albums and songs you have listened to, rating them, writing notes, and organizing them into custom lists. The project includes a React + Vite web frontend and a Node.js + Express backend backed by MongoDB.

## What The App Does

- Log albums and tracks into a personal diary
- Rate music and attach short notes to entries
- Build custom album and track lists
- View profile data, followers, and following
- Browse public-facing profile and music pages
- Sign up and log in with email/password authentication
- Search Spotify data through backend proxy routes

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Plain CSS with a custom design system

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- bcrypt
- JSON Web Tokens

## Project Structure

```text
.
├── src/                     # Vite web app
│   ├── App.jsx              # Router and app shell
│   ├── Diary.jsx            # Diary/listen log experience
│   ├── Lists.jsx            # Custom music lists
│   ├── Login.jsx            # Web login screen
│   ├── Signup.jsx           # Web signup screen
│   ├── Profile.jsx          # Logged-in profile view
│   ├── PublicProfile.jsx    # Public profile view
│   ├── services/            # API helpers
│   └── components/          # Shared UI pieces
├── backend/                 # Express API
│   ├── index.js             # Server entry point
│   ├── models/              # Mongoose models
│   ├── routes/              # Auth, diary, lists, Spotify routes
│   └── migrate_user_auth_schema.js
├── public/                  # Static assets
└── MusicRatingAppNative/    # Native/mobile project files
```

## Local Development

### 1. Install dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create `backend/.env` with at least:

```env
MONGO_URI=mongodb://localhost:27017/musicratingapp
JWT_SECRET=replace_this_with_a_long_random_secret
PORT=5001
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

If your API does not run on `http://localhost:5001`, create a root `.env` file for the frontend:

```env
VITE_API_BASE_URL=http://localhost:5001
```

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Start the frontend

```bash
npm run dev
```

To run Vite on a different port:

```bash
npm run dev -- --port 5174
```

## Authentication Notes

- Passwords are stored hashed with bcrypt
- Login returns a JWT
- The web app uses the authenticated session to restore the current user on load
- The backend exposes auth routes under `/api/auth`

## Backend Routes

Main route groups:

- `/api/auth`
- `/api/diary`
- `/api/lists`
- `/api/spotify`

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
cd backend
npm run dev
npm start
npm run migrate:users-auth
npm run migrate:normalized-schema
```

## Normalized Schema

The backend now also includes a normalized schema for the long-term database shape under `backend/models/`:

- `UserAccount` and `AuthCredential` separate profile data from authentication data
- `Artist`, `Album`, and `Track` store canonical music metadata
- `MusicEntry` is the single source of truth for diary ratings, reviews, and logged music activity
- `Follow`, `FriendRequest`, and `Friendship` model social relationships explicitly
- `ActivityEvent` supports a feed without storing duplicate review data on users
- `ListCollection` and `ListItem` normalize custom lists around canonical music entities

To backfill the normalized collections from the current legacy schema:

```bash
cd backend
npm run migrate:normalized-schema
```

To rebuild the normalized collections from scratch during local development:

```bash
cd backend
node migrate_normalized_schema.js --reset
```

## Status

This repo contains the Vite web app and backend currently used for the Music Diary project. There is also a `MusicRatingAppNative/` directory with native project files, but the root app in this repo is the Vite web frontend.
