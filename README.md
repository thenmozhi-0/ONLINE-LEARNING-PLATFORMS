# ONLINE-LEARNING-PLATFORMS
# Backend - Online Learning Platform

**Stack:** Node.js, Express, JWT auth, file-based JSON storage (no external DB required).

## Run locally
```bash
cd backend
npm install
npm start
```
Server runs at `http://localhost:5000`.

## API
- `POST /api/register` { name, email, password }
- `POST /api/login` { email, password } -> { token }
- `GET /api/courses`
- `GET /api/courses/:id/quiz` (Auth: Bearer token)
- `POST /api/courses/:id/quiz` (Auth) body: { answers: [0,1,...] }
- `GET /api/progress` (Auth)

# Online Learning Platform 

This project is a minimal, **runnable** Online Learning Platform for CODTECH Task-2.

- Backend: Node + Express + JWT, file-based JSON storage (no DB install)
- Frontend: Vanilla HTML/CSS/JS (calls the API), HTML5 video, quiz & progress

## How to run

1) Start the backend
```bash
cd backend
npm install
npm start
```
It runs at http://localhost:5000

2) Open the frontend
Open `frontend/index.html` in your browser (double-click).  
Or serve it with a simple server:
```bash
# Option A (Python 3):
cd frontend
python -m http.server 5500
# then visit http://localhost:5500
```

## Features
- Register/Login with JWT
- List courses and play videos
- Take quizzes
- Track and view progress
