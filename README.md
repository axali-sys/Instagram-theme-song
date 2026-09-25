# Music Pro

**Your profile. Your sound.**

Music Pro is a listener-first music identity and project-tracking platform. A user can express their identity through music while following the development and release journey of songs, episodes and albums from the musicians they care about.

## Product identity

- **Product:** Music Pro
- **Tagline:** Your profile. Your sound.
- **Core idea:** The listener is the center of the music relationship.
- **Theme Song:** The defining song attached to a Music Pro profile.
- **Project layer:** Musicians can announce, develop, release and track projects; listeners can follow projects, set expectations, react, evaluate and see progress.
- **Instagram relationship:** Instagram Theme Song is an integration/use case, not the product name.

## Listener-first project model

```text
MUSICIAN                    MUSIC PRO                    LISTENER
   |                            |                           |
   |-- Create Project --------->|                           |
   |   Song / Episode / Album   |                           |
   |                            |<-- Follow Project --------|
   |                            |<-- Set Expectations -------|
   |<-- Project Signals --------|<-- Listen / Save / Like ---|
   |                            |<-- Evaluate / Review ------|
   |                            |                           |
   |<----------- Progress / release updates ---------------|
```

The musician remains the creator and owner of the project story. The listener becomes an active participant in its journey rather than only a final consumer.

## Project lifecycle

Every project can move through visible stages:

1. **Idea** — project announced
2. **Planning** — concept, format, target release window
3. **Creating** — recording, writing, filming or production underway
4. **Preview** — snippets, artwork, trailers or previews
5. **Ready** — project prepared for release
6. **Released** — public release
7. **After Release** — listener response, evaluation and continuing engagement

Progress should be shown as a simple timeline or progress overview rather than exposing private production information.

## Project types

Music Pro treats a project as a common object so the same experience works for:

- **Song**
- **Episode**
- **Album**
- Future project formats can extend the same model.

## What listeners can do

For every followed project, a listener can:

- **Follow** the project
- **Save** the project
- **Expect** — mark what they are looking forward to
- **Notify me** — receive release/progress updates
- **Listen / preview** available material
- **Like** or react
- **Evaluate** after or during release
- **Review** when reviews are enabled
- **Share** the project
- See **project progress**
- See **release status** and expected release window
- See a **project overview** without needing to visit the musician's entire profile

## Expectations layer

A project has a listener-facing expectation area:

```text
WHAT I AM LOOKING FORWARD TO

☑ Release date
☑ New episode
☑ Full album
☑ New sound / direction
☑ Collaboration
☑ Story continuation
```

This lets Music Pro measure anticipation separately from popularity.

## Evaluation layer

Evaluation should not reduce a project to one popularity number. Music Pro can collect structured listener signals such as:

- **Overall** — how the listener experienced the project
- **Quality** — production/content quality
- **Connection** — emotional or personal connection
- **Replay / Return** — likelihood of coming back
- **Expectation** — whether the project met what the listener expected
- **Recommendation** — whether the listener would recommend it

For albums and episodes, listeners can evaluate both the overall project and individual releases where appropriate.

The platform should distinguish **audience evaluation** from **professional/critic evaluation** so one does not silently replace the other.

## Musician project dashboard

A musician should have a dedicated project workspace:

```text
MY PROJECT

Project: New Album
Type: Album
Status: Creating
Progress: 68%
Expected release: October

AUDIENCE
1,842 following
742 expecting
318 saved

RELEASE JOURNEY
✓ Announced
✓ Cover revealed
✓ Preview released
● Final production
○ Release
○ Post-release evaluation

AUDIENCE SIGNALS
Anticipation      91%
Expectation       88%
Connection        —
Evaluation        —
```

Progress percentages are creator-controlled project milestones, not claims about artistic quality.

## Listener project tracking

A listener's Music Pro profile can include:

- **Following** — projects they track
- **Coming Soon** — projects they expect
- **Recently Released** — projects that reached release
- **My Evaluations** — projects they have evaluated
- **My Music Moments** — personal posts/memories attached to releases

This connects the user's music identity to the projects they actively care about.

## Core architecture

```text
MUSIC PRO
  |
  +-- USER / LISTENER IDENTITY
  |     +-- Theme Song
  |     +-- Favorites
  |     +-- Listening
  |     +-- Playlists
  |     +-- Music Moments
  |     +-- Music Circle
  |
  +-- MUSICIAN / CREATOR
  |     +-- Artist Profile
  |     +-- Projects
  |     +-- Release Timeline
  |     +-- Progress
  |     +-- Audience Signals
  |
  +-- PROJECT LAYER
  |     +-- Song
  |     +-- Episode
  |     +-- Album
  |     +-- Expectations
  |     +-- Release Status
  |     +-- Evaluation
  |     +-- Reviews
  |
  +-- MUSIC PRO API
        +-- catalog
        +-- authentication
        +-- database
        +-- notifications
        +-- analytics
        +-- mobile clients
        +-- social integrations
```

## Core data model

```text
User
MusicProfile
ThemeSong
Song
Artist
Album
Episode
MusicProject
ProjectMilestone
ProjectFollower
ProjectExpectation
ProjectUpdate
ListeningEvent
ProjectEvaluation
ProjectReview
Playlist
PlaylistSong
Follow
Like
MusicMoment
```

## Planned API boundary

```text
/api/auth
/api/profile
/api/profile/:username
/api/theme-song
/api/projects
/api/projects/:id
/api/projects/:id/follow
/api/projects/:id/expectations
/api/projects/:id/milestones
/api/projects/:id/updates
/api/projects/:id/evaluations
/api/projects/:id/reviews
/api/songs
/api/artists
/api/albums
/api/episodes
/api/playlists
/api/follow
/api/likes
/api/search
/api/listening
/api/notifications
```

## V1 interface direction

The current prototype should evolve into three connected views:

1. **My Music Profile** — the listener remains the protagonist.
2. **Project Page** — a focused page for following, expectations, progress, release and evaluation.
3. **Musician Studio** — the creator's workspace for managing project releases and audience signals.

The musician should be visible and respected as the creator, but the project page should make the relationship between **creator → project → listener** clear.

## Music licensing boundary

The V1 prototype stores music identity and selected-track metadata only. Production playback should use an authorized/licensed catalog provider rather than hosting copyrighted recordings without the required rights.

## Instagram relationship

The original Instagram Theme Song concept remains an integration target. Music Pro owns the music identity and project layer, while Instagram and other social platforms can consume supported Music Pro data through an API or integration.

## Deployment

GitHub is the source of truth. The current project can be deployed as a static prototype while the Music Pro database/API layer is introduced. Vercel can provide the web deployment and preview workflow.

## Status

**Music Pro V1 interface foundation — listener-first profile + musician project/release tracking model.**


## Production V1 implementation status

The repository now contains the first production runtime boundary:

- PostgreSQL schema for accounts, profiles, projects, followers and evaluations.
- Secure HTTP-only session cookies using signed JWTs.
- Password hashing with Node scrypt.
- Registration, login, session and logout APIs.
- Database-backed profile and project APIs.
- Production readiness health reporting.
- Environment template and automated Node smoke tests.
- Account UI wired to the authentication API.
- Free-first listener/creator model remains the product rule.

### Required deployment configuration

Set DATABASE_URL to the production PostgreSQL connection string and AUTH_SECRET to a long random secret in the deployment environment, then run db/schema.sql once against the database. Optional music-provider, OAuth and storage variables should only be configured when those integrations are actually enabled.

Until those environment values are present, the application intentionally reports configuration_required instead of pretending that data is persistent.



## V1 completion and runtime

The V1 implementation keeps the existing web application and adds the production runtime boundary without creating a second project.

### Listener data
Authenticated listener data is persisted in PostgreSQL for:
- Music Moments (private by default)
- Favorites
- Listening activity
- Playlists and playlist items
- Project follows, likes and expectations

The listener home loads For You, Coming Soon, People Like Me and Music Moments from the authenticated API. It does not fabricate private listening history or sensitive profiling.

### Local setup

1. Install Node.js 24 for the web/Vercel runtime.
2. Run `npm install --no-audit --no-fund --no-package-lock`.
3. Copy `.env.example` to `.env` and configure the required values.
4. Apply `db/schema.sql` to the PostgreSQL database.
5. Serve the static web root with a local HTTP server that routes `/api/*` to the Vercel-style API handlers, or use the Vercel CLI for local serverless testing.
6. Run `npm test`.

Required production variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- AI provider credentials only when the configured AI provider is enabled.

### Android APK

The repository uses the existing Capacitor configuration (`com.musicpro.app`, webDir `www`) and does not maintain a second Android project.

GitHub Actions workflow: `.github/workflows/android-build.yml`

The workflow:
1. Uses Node 20.
2. Installs the existing Capacitor 7.4.3 packages.
3. Builds the `www/` web asset directory from the existing app.
4. Creates the Android project only when the repository does not already contain one, then runs Capacitor sync.
5. Uses Java 21.
6. Runs Gradle `assembleDebug`.
7. Verifies `app-debug.apk`.
8. Uploads the APK as the `music-pro-v1-debug-apk` artifact.

### Vercel

The existing Vercel project remains the deployment target. The repository config uses Node 24 for API functions and does not contain production secrets.

Production deployment requires human approval.

### AI integration

The existing Music Pro Intelligence endpoint supports discovery, project, audience, profile, moment, release and approval-gated build modes. It uses only supplied context and does not claim that code changed unless a development tool actually changes it.

WronAI/OpenAI-compatible provider settings are documented in `.env.example`. AI requests have a bounded upstream timeout and basic serverless rate limiting.

### Security

Authentication uses HTTP-only secure SameSite cookies and Node scrypt password hashing. API authorization is checked server-side. Private authenticated API responses are excluded from the service-worker cache.

## V1 status

**CODE COMPLETE → TESTED → VALIDATED → PULL REQUEST READY → WAITING FOR HUMAN APPROVAL**

Production deployment requires human approval.
