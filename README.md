# Music Rating App

This is a full-stack project with a React frontend and Node.js/Express backend. Users can rate music and see ratings from friends and others.

## Structure
- `frontend/` (React + Vite)
- `backend/` (Node.js + Express + MongoDB)

## Getting Started

### Frontend
1. Run `npm run dev` in the root directory to start the React app.

### Backend
1. Go to the `backend` folder: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with your MongoDB URI:
   ```
   MONGO_URI=mongodb://localhost:27017/musicratingapp
   ```
4. Start the backend: `npm run dev`

## Features
- User authentication (to be implemented)
- Music rating
- View friends' and public ratings

## Next Steps
- Implement user, music, rating, and friends APIs in the backend
- Build React components for rating and viewing music
