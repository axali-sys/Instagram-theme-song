# Music Pro Live V1 — Database & Authentication

## Goal

Turn the prototype into a real multi-user platform while keeping the listener and basic artist experience free.

## Production stack

- Web: existing Music Pro frontend
- Deployment: Vercel
- API: Vercel serverless API routes
- Database: PostgreSQL-compatible production database
- Authentication: managed authentication provider or secure application auth
- Repository: GitHub `axali-sys/Instagram-theme-song`

## First persistent entities

```text
User
MusicProfile
ArtistProfile
MusicProject
ProjectFollower
ProjectExpectation
ProjectMilestone
ProjectEvaluation
ThemeSong
Notification
```

## Identity model

A single authenticated account can start as a listener and later create or claim an artist/creator profile. Do not force users to choose a permanent role at signup.

```text
Account
  ├── MusicProfile
  ├── Listener activity
  └── optional ArtistProfile
```

## Database rules

1. Every user-owned record has an owner/user identifier.
2. Public profile data is separated from private account/authentication data.
3. Passwords are never stored by Music Pro in plaintext.
4. Authentication secrets are never committed to GitHub.
5. Production database credentials are stored only as deployment environment variables.
6. Listener evaluations are private by default unless the product explicitly enables public reviews.
7. Creator-controlled progress is not treated as an artistic quality score.

## Minimum API behavior

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session

GET  /api/profile
PATCH /api/profile

GET  /api/projects
POST /api/projects
GET  /api/projects/:id
PATCH /api/projects/:id

POST /api/projects/:id/follow
DELETE /api/projects/:id/follow
POST /api/projects/:id/expectations
POST /api/projects/:id/evaluations

GET /api/notifications
```

## Live V1 acceptance test

The platform is considered genuinely persistent when:

1. User A creates an account on Device A.
2. User A creates/updates a Music Pro profile.
3. User A follows a project.
4. User A logs in from Device B.
5. The same profile and followed project are returned from the production database.
6. User B can follow/evaluate the project.
7. User A can see the resulting audience signal after refresh or live update.

## Deployment sequence

```text
GitHub main
   ↓
Vercel deployment
   ↓
Production environment variables
   ↓
PostgreSQL database
   ↓
Authentication
   ↓
Persistent API
   ↓
Real multi-user Music Pro
```

## Current status

The repository already contains the frontend and first API/deployment boundary. This document defines the next production step: connect authentication and PostgreSQL persistence without changing the free-first product model.
