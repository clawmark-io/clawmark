# Device Auth Flow

Polling-based device authorization flow for desktop app authentication, modeled after OAuth 2.0 Device Authorization
Grant (RFC 8628).

## Flow

1. Desktop app calls `POST /api/auth/device/code` → receives `{ deviceCode, userCode, verificationUrl }`
2. Desktop app opens `verificationUrl` in the user's browser
3. User confirms the code and signs
4. Server stores tokens against the `deviceCode` in Convex
5. Desktop app polls `POST /api/auth/device/token` with `{ deviceCode }` every 5s
6. Once auth completes, poll returns `{ accessToken, refreshToken, expiresAt, cloudSyncUrl }`

## Endpoints

| Endpoint                   | Method | Description                                                                                  |
|----------------------------|--------|----------------------------------------------------------------------------------------------|
| `/api/auth/device/code`    | POST   | Generates `deviceCode` + `userCode`, stores in Convex with 10-min TTL                        |
| `/api/auth/device/token`   | POST   | Polled by desktop app. Returns 202 while pending, 200 + tokens on completion, 410 if expired |
| `/api/auth/device/refresh` | POST   | Accepts `{ refreshToken }`, returns `{ accessToken, expiresAt }`                             |

## Token Refresh

- `expiresAt` (Unix timestamp) is included in the token response so the desktop app knows when to refresh.
- Desktop app calls `POST /api/auth/device/refresh` with its `refreshToken` before expiry.




