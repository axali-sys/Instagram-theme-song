# Music Pro — Live V1 Architecture

Music Pro is moving from a browser-only prototype toward a live platform while preserving the existing listener-first interface.

## Current live boundary

```text
Browser
  |
  +--> Static Music Pro UI
  |
  +--> /api/health
  +--> /api/profile
  +--> /api/projects
            |
            +--> Production database (next integration)
            +--> Authentication (next integration)
            +--> Notifications (next integration)
            +--> Analytics (next integration)
```

## V1 services

### Web
The existing `index.html`, `styles.css` and `app.js` remain the first client.

### API
Vercel serverless API routes provide the first backend boundary:

- `GET /api/health`
- `GET /api/profile`
- `POST /api/profile`
- `GET /api/projects`
- `POST /api/projects`

The current write endpoints intentionally report `persistence: not-configured`. They are API contracts and validation points, not a substitute for a production database.

## Production data layer — next step

Connect a managed PostgreSQL-compatible database and migrate these entities:

```text
User
MusicProfile
ThemeSong
Artist
MusicProject
ProjectMilestone
ProjectFollower
ProjectExpectation
ProjectUpdate
ProjectEvaluation
ProjectReview
Playlist
PlaylistSong
ListeningEvent
MusicMoment
Notification
```

## Authentication — next step

Authentication must be introduced before durable user writes. The first authenticated flows should be:

1. Create account
2. Create Music Pro profile
3. Select Theme Song metadata
4. Follow project
5. Set expectation
6. Save evaluation
7. Artist creates project
8. Artist updates milestone

## Live project flow

```text
ARTIST
  |
  | create/update project
  v
MUSIC PRO API
  |
  v
DATABASE
  |
  +--> LISTENER PROJECT PAGE
  |
  +--> NOTIFICATION EVENT
  |
  +--> AUDIENCE SIGNAL
  |
  +--> ARTIST DASHBOARD
```

## Free-first rule

The core listener and basic artist experience remains free. Monetization sits around optional value-generating activity:

- Artist Promotion
- Streaming Partnerships
- Music Marketplace
- Clearly labeled sponsorships

## Deployment

GitHub `main` is the source of truth. Vercel is the intended web/API deployment layer. Production deployment should be connected to the GitHub repository so each approved `main` change can become a production deployment after build/verification.

## Security baseline

- Never place API keys in frontend JavaScript.
- Authenticate all user-specific writes.
- Validate project and evaluation input server-side.
- Add rate limiting before public launch.
- Keep private listener data separate from public profile data.
- Use authorized/licensed music catalog providers for playback.
- Keep sponsored content clearly labeled.

## Definition of Live V1

Music Pro V1 is live when a real user can:

- create an account,
- create and edit a profile,
- choose a Theme Song,
- follow another user/artist/project,
- create or follow a Song/Episode/Album project,
- receive release/progress notifications,
- submit an audience evaluation,
- and see those changes persist across devices.
