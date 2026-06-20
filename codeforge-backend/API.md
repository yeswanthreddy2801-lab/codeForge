# CodeForge API Documentation

Base URL: `/api/v1`

## Authentication (`/auth`)
- `POST /register`: Register a new user
- `POST /login`: Login and receive JWT access token + HttpOnly cookie
- `POST /logout`: Clear cookies
- `POST /refresh`: Get new access token
- `POST /forgot-password`: Send password reset email
- `POST /reset-password`: Reset password
- `POST /verify-email`: Verify email

## Users (`/users`)
- `GET /me`: Get current user profile
- `PATCH /me`: Update profile
- `POST /me/avatar`: Upload avatar (Cloudinary)
- `GET /me/stats`: Get user statistics (Redis cached)
- `GET /me/achievements`: Get user achievements
- `GET /me/submissions`: Get user submissions
- `GET /:username`: Get public profile

## Problems (`/problems`)
- `GET /`: Get paginated problems list
- `GET /:id`: Get problem details
- `POST /`: Create problem (Admin)
- `PATCH /:id`: Update problem (Admin)
- `DELETE /:id`: Delete problem (Admin)

## Submissions (`/submissions`)
- `POST /`: Submit code to judge
- `POST /run`: Run code without saving (custom input)
- `GET /:id`: Get single submission result
- `GET /problem/:problemId`: Get user submissions for a specific problem

## Leaderboard (`/leaderboard`)
- `GET /`: Get paginated leaderboard (params: `period=all|month|week`)
- `GET /me`: Get current user's relative ranking

## Contests (`/contests`)
- `GET /`: Get contests
- `GET /:id`: Get contest details
- `POST /:id/register`: Register for contest
- `GET /:id/rankings`: Get contest leaderboard
- `POST /`: Create contest (Admin)
- `PATCH /:id`: Update contest (Admin)

## Learn (`/learn`)
- `GET /`: List all lessons
- `GET /progress`: Get user learning progress
- `GET /:slug`: Get lesson content
- `POST /:slug/complete`: Mark lesson as complete

## AI (`/ai`)
- `POST /translate`: Translate English to MyLang
- `GET /history`: Get user's translation history
