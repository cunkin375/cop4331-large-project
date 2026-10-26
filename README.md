# Large Project

React + TypeScript + Vite frontend with an Express API and MongoDB driver.

## Setup

Requires Node.js 22.12+ or 24+ and local MongoDB or MongoDB Atlas.
Run from the repository root:

```powershell
npm install
npm --prefix frontend install
Copy-Item .env.example .env
```

Set `MONGODB_URI` in `.env` to your database connection string. Set `MONGODB_DB`
(default `mern_lab`) and `PORT` (default `5000`) as needed. Never put database
credentials in a `VITE_` variable.

In separate terminals at the repository root, run `npm run server:dev` and
`npm run client`. Use `npm start` to run the API without watch mode.
The root `server.js` loads the API in `server/index.js`; API routes and tests
live in `server/`. The `frontend/` directory contains the React app and Vite configuration.

The API connects and pings MongoDB before listening, reuses a connection pool,
and closes it on shutdown. Vite proxies `/api` to port 5000; update
`frontend/vite.config.ts` if you change the API port. Production hosting needs its own
reverse proxy for `/api`. The API binds to loopback and provides an
unauthenticated sample collection. The existing login UI remains a placeholder.

## API

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Pings MongoDB; returns 200 or 503 |
| GET | `/api/items` | Reads the latest 100 items |
| POST | `/api/items` | Inserts an item and returns it with status 201 |

POST accepts `{ "name": "Example" }`. Names must contain 1–100 characters
when trimmed. The server accepts only the name field and generates createdAt;
MongoDB generates the document ID.

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
Invoke-RestMethod http://127.0.0.1:5000/api/items -Method Post -ContentType 'application/json' -Body '{"name":"Example"}'
Invoke-RestMethod http://127.0.0.1:5000/api/items
```

React can call `fetch('/api/items')` through the Vite proxy.

## Verification

From the repository root, run `npm test`, `npm --prefix frontend run build`,
and `npm --prefix frontend run lint`.
API tests inject a database double. For a real MongoDB check, start the database
and API, then run the example requests above.

References: [MongoDB driver](https://www.mongodb.com/docs/drivers/node/current/connect/)
and [Express error handling](https://expressjs.com/en/guide/error-handling/).

## Blackjack data models and deployment

Production runs from `/opt/blackjack` on the host configured by `SERVER_IP`, served by nginx at
https://cruddylit.com. The `blackjack` systemd service runs the API as an
unprivileged user. MongoDB listens on localhost with authentication enabled;
its application credentials are in `/opt/blackjack/.env` (mode 600).

`server/models/User.js` provides `create`, `authenticate`, and `recordGame`.
Users have a case-insensitive unique username and email, a salted scrypt password
hash, timestamps, net `earningsCents`, `gamesPlayed`, `wins`, `losses`, and `pushes`.
Passwords must be 12–128 characters. Monetary values are integer cents; losses
subtract from earnings. Call `recordGame(userId, netEarningsCents)` once per
settled game from trusted server code. No public earnings-write endpoint exists.
The existing frontend login remains a placeholder; these model methods do not
create HTTP sessions or connect the login form.

`server/models/Leaderboard.js` reads a MongoDB `leaderboard` view containing the
top ten users by net earnings, breaking ties by user ID. It exposes only public
player statistics and always reflects current User totals. Read it via
`GET /api/leaderboard`, which returns `{ players: [...] }` with ranks 1–10.
Models, schema validation, and indexes initialize before the API starts.

`deploy/bootstrap.sh` provisions a fresh Ubuntu 24.04 server with Node.js 24
already installed. It installs MongoDB 8, builds the frontend, configures systemd
and nginx, and initially creates a self-signed IP certificate. It replaces the
nginx default site, saving the previous configuration. Export `SERVER_IP` in the
shell running either deployment script (the server IPv4 address; no default is
embedded in the codebase). For example:

```sh
export SERVER_IP="<server-ipv4-address>"
bash deploy/bootstrap.sh
bash deploy/domain.sh cruddylit.com
```

The domain script runs afterward to install a trusted Let's Encrypt certificate and
activate automatic renewal. The domain must resolve to this server. Production
has been configured with this domain step.

Verification on the server:

```sh
cd /opt/blackjack
npm test
npm --prefix frontend run lint
node --env-file=.env server/models.integration.js
systemctl status blackjack mongod nginx
certbot certificates
```

The integration check temporarily creates test players, verifies password checks,
uniqueness, game totals, and live rankings, then removes the test players.

## Seed example users

With Node.js 22.12+ and the database configured in `.env`, run:

```sh
read -r -s -p 'Example user password (12–128 characters): ' SEED_PASSWORD
printf '\n'
export SEED_PASSWORD
npm run seed:users
unset SEED_PASSWORD
```

This inserts 12 example accounts (`demo_ace` through `demo_lane`) with emails
such as `demo_ace@example.com`, individually salted scrypt password hashes, and
consistent blackjack win/loss/push counts and net earnings in integer cents.
All new accounts use the supplied password. The leaderboard view immediately
reflects their earnings. Existing matching accounts are skipped without changing
their passwords or game totals; conflicting usernames/emails stop the script.
The script uses `MONGODB_URI` and `MONGODB_DB` (default `blackjack`) and never
clears the database. Run it against the database you intend to populate.

## Game logic (Person 2)

The game engine uses the existing MongoDB driver and the application's
authentication middleware. Authenticated requests derive the user from
`req.user`; clients never submit a score or user ID. The opaque game ID acts as
a capability for subsequent requests and must be kept private.

- `POST /api/game/start` creates an active session and deals round 1 from a
  newly shuffled 52-card deck.
- `POST /api/game/hit` with `{ "gameId": "<returned gameId>" }` deals one card.
- `POST /api/game/stand` with the same body draws dealer cards until at least 17,
  including standing on soft 17, and resolves the round.
- `GET /api/game/state?gameId=<returned-game-id>` returns the current state with
  the dealer hole card hidden while the round is in progress.
- `GET /api/attempts/me` returns the authenticated user's attempts and best score.
- `GET /api/leaderboard?limit=10` ranks users by their best completed attempt;
  equal scores share a rank.
- `POST /api/game/start` with `{ "gameId": "<returned gameId>" }` starts the next
  round only after the current round ends. Reuse this ID for all ten rounds.

Responses include player cards/value, visible dealer cards, round number,
rounds completed, roundOver, outcome, points, totalPoints, and attemptComplete.
The dealer's hidden card and total are revealed only when the round ends.
Aces count as 1 or 11; two-card naturals settle immediately and beat other 21s.
Wins award 3 points, ties 1, and losses 0. Busting ends a round immediately.
After exactly ten completed rounds, the server upserts one document in `attempts`
with the game ID as `_id`, a User ObjectId reference, all ten round results,
integer `score` (0�30), createdAt, and completedAt. A new attempt requires a new
start request with userId and no gameId. Existing earnings rankings are unchanged.

Game state persists in `games`, including the private deck; conditional version
updates reject concurrent conflicting moves with 409. Invalid input returns 400,
unknown users/games 404, and invalid state transitions 409. If final score saving
fails, retrying an action on that completed game retries the idempotent attempt
write before returning 409. Incomplete attempts remain stored and are not scored.
`npm test` includes deterministic scoring, dealing, dealer, and ten-round API tests
using a database double; these do not require a running MongoDB instance.
