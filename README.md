# Music Pro

**Your profile. Your sound.**

Music Pro is a standalone music-identity platform built around a user-selected **Theme Song**. This repository began as the Instagram Theme Song prototype and now serves as the V1 interface foundation for Music Pro.

## Product identity

- **Product:** Music Pro
- **Tagline:** Your profile. Your sound.
- **Core idea:** Give every person a persistent music identity.
- **Theme Song:** The defining song attached to a Music Pro profile.
- **Instagram relationship:** Instagram Theme Song is an integration/use case, not the product name.

## V1 interface

- Music Pro landing page
- Public-style music profile card
- Theme Song player interaction
- Username, genre and Theme Song builder
- Music identity chips
- Discoverable music-profile cards
- Local prototype persistence
- Responsive mobile-first layout

## Product architecture

```text
MUSIC PRO
  |
  +-- Music Identity
  |     +-- Theme Song
  |     +-- songs
  |     +-- artists
  |     +-- genres
  |     +-- playlists
  |
  +-- Social Layer
  |     +-- followers
  |     +-- likes
  |     +-- activity
  |
  +-- Music Pro API
        |
        +-- licensed music catalog
        +-- authentication
        +-- database
        +-- mobile clients
        +-- social integrations
```

## Planned production stack

- Next.js App Router + React for the full-stack web application
- PostgreSQL for profile, social and music metadata
- Authentication provider for accounts
- Object storage for profile images and artwork
- Licensed music/catalog provider for playback and metadata
- Vercel for deployment
- REST/JSON Music Pro API for future integrations
- Flutter client after the web MVP is validated

## Core data model

```text
User
MusicProfile
ThemeSong
Song
Artist
Album
Playlist
PlaylistSong
Follow
Like
ListeningEvent
```

## API boundary

Planned routes:

```text
/api/auth
/api/profile
/api/profile/:username
/api/theme-song
/api/songs
/api/artists
/api/albums
/api/playlists
/api/follow
/api/likes
/api/search
/api/listening
```

## Music licensing boundary

The V1 prototype stores music identity and selected-track metadata only. Production playback should use an authorized/licensed catalog provider rather than hosting copyrighted recordings without the required rights.

## Instagram relationship

The original Instagram Theme Song concept remains an integration target. Music Pro owns the music identity layer, while Instagram and other social platforms can consume it through an API or supported integration. Direct audio injection into Instagram is not assumed and requires capabilities supported by Meta's current APIs and review process.

## Deployment

GitHub is the source of truth. The current project can be deployed as a static prototype while the Music Pro database/API layer is introduced. Vercel can provide the web deployment and preview workflow.

## Status

**Music Pro V1 interface foundation — ready for backend architecture.**
