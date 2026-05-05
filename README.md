# Nexus WiFi Management System

A modern, production-ready full-stack web application for managing WiFi subscriptions, PPPoE credentials, and payments.

## Features

- **Authentication**: Secure JWT-based login/register with HTTP-only cookies.
- **Dashboard**: Real-time account status, PPPoE credentials, and expiration tracking.
- **Subscription**: Interactive pricing cards with recommended plan highlighting.
- **Payment Flow**: Manual bKash/Nagad integration with TrxID verification.
- **Admin Panel**: Manage all users, update credentials, and control access.
- **UI/UX**: Premium glassmorphism design, dark/light mode, smooth animations (Framer Motion).

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Axios, Framer Motion.
- **Backend**: Node.js, Express, JWT, Firebase Admin SDK.
- **Database**: Firebase Firestore.

## Getting Started

### 1. Backend Setup

1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Update `.env` with your Firebase credentials and JWT secret.
4. Start the server: `npm run dev`

### 2. Frontend Setup

1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Create a `.env` file and set `VITE_API_BASE_URL=http://localhost:5000`
4. Start the dev server: `npm run dev`

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default 5000)
- `JWT_SECRET`: Secret for signing tokens
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Your Firebase client email
- `FRONTEND_URL`: URL of the frontend (for CORS)

### Frontend (.env)
- `VITE_API_BASE_URL`: URL of the backend API

## Deployment

- **Frontend**: Ready for Vercel or Netlify.
- **Backend**: Ready for Vercel (using serverless functions) or any Node.js host.

## Author
Nexus WiFi Team
