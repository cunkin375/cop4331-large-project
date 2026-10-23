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
