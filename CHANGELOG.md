# Changelog

## Music Pro V1 — completion
- Completed listener-first home data flow with For You, Coming Soon, People Like Me and Music Moments.
- Added PostgreSQL persistence for Music Moments, playlists, favorites, listening activity and project likes.
- Added authenticated listener APIs and connected Theme Song save/listening interactions.
- Connected project follow, like and expectation actions to backend persistence.
- Added deterministic Capacitor Android CI for Node 20, Capacitor 7.4.3 and Java 21.
- Added APK artifact verification/upload.
- Added PWA service-worker registration with authenticated API cache exclusion.
- Added production validation checks and Vercel runtime alignment.
- Added rate limiting for authentication and AI endpoints.
- Updated documentation for local, Vercel and Android workflows.

Production deployment requires human approval.
