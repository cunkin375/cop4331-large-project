# Blackjack

Our COP 4331 large project (UCF, Fall 2026). It's a blackjack game with a React web app and a Flutter mobile app that share one Express API and MongoDB database.

Live site: https://cruddylit.com

## How it works

- Each attempt is 10 rounds of blackjack against the dealer.
- A win is 3 points, a tie is 1 and a loss is 0, so the best score is 30.
- The dealer stands on 17. A natural blackjack ends the round right away.
- The leaderboard ranks players by their best completed attempt.
- The server deals the cards and keeps score, so players can't fake results from the app.

## Team

| Name | Role |
| --- | --- |
| Haren | Project manager |
| Sai | Frontend |
| Devam | API |
| Pranav | API |
| Jeremy | Database |
| Kareem | Mobile |
| Arnov | Mobile |

## Stack

MongoDB Atlas, Express, React (TypeScript, Vite, Tailwind) and Node.js, plus Flutter for mobile.

## Running it locally

You need Node.js 22.12 or newer.

```sh
npm install
npm --prefix frontend install
cp .env.example .env
```

React can call `fetch('/api/items')` through the Vite proxy.

### Auth

Routes live in `server/routes/auth.js` and are documented in
[`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.0, importable into SwaggerHub).

| Method | Endpoint | Behavior |
| --- | --- | --- |
| POST | `/api/register` | Creates an unverified account and emails a 24-hour verification link |
| GET | `/api/verify-email?token=` | Marks the email verified |
| POST | `/api/resend-verification` | Emails a new link; always returns the same message |
| POST | `/api/login` | `username` or `email` plus `password`; returns a 2-hour JWT. 401 bad credentials, 403 unverified |
| POST | `/api/forgot-password` | Emails a 1-hour reset link; always returns the same message |
| POST | `/api/reset-password` | `token` plus new `password` |
| GET | `/api/me` | Requires `Authorization: Bearer <jwt>`; returns id, username, email |

Auth uses the existing User model and its scrypt password hashing (12–128 character
passwords). Only SHA-256 hashes of email tokens are stored. Accounts created before
email verification existed (no `emailVerified` field, such as seeded users) can still log in.
Set `JWT_SECRET`, `CLIENT_URL`, `API_KEY`, `MAILGUN_DOMAIN`, and `MAIL_FROM` from `.env.example`.
Email is sent through Mailgun HTTPS, avoiding outbound SMTP restrictions.
`MAILGUN_API_URL` defaults to `https://api.mailgun.net`; use
`https://api.eu.mailgun.net` for EU domains. For existing deployments, the sending
domain falls back to the domain in `SMTP_USER` if `MAILGUN_DOMAIN` is absent.
Email links open `CLIENT_URL/verify-email` and `CLIENT_URL/reset-password`, which the
frontend must handle.

`npm test` includes the auth tests in `server/auth.test.js`, which use an in-memory
users collection and a fake mailer, so no database or SMTP server is needed.

Game and attempt endpoints require `Authorization: Bearer <jwt>`. For local testing,
`node --env-file=.env server/dev/devToken.js <userId> [username]` prints a token for an
existing user ID; it refuses to run when `NODE_ENV=production`.

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
Fill in `.env`:

- `MONGODB_URI` and `MONGODB_DB`: the database connection. Ask Jeremy.
- `JWT_SECRET`: any long random string, e.g. from `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `CLIENT_URL`: where the frontend runs (`http://localhost:5173` locally). Email links point here.
- `SMTP_*`: email settings for verification and password reset emails.

Then start the API and the frontend in two terminals:

```sh
npm run server:dev
npm run client
```

Open http://localhost:5173. The frontend sends `/api` requests to the API on port 5000.

Heads up: the team database is the same one the live site uses, so accounts and games you make locally show up on cruddylit.com too.

## Tests

```sh
npm test                          # API tests, no database needed
npm --prefix frontend run build
npm --prefix frontend run lint
```

## API

The full spec is in [`docs/openapi.yaml`](docs/openapi.yaml). Routes marked "yes" need an `Authorization: Bearer <token>` header with the token from `/api/login`.

| Method | Endpoint | What it does | Login |
| --- | --- | --- | --- |
| POST | `/api/register` | Creates an account and emails a verification link | |
| GET | `/api/verify-email?token=` | Verifies the email | |
| POST | `/api/resend-verification` | Sends a new verification link | |
| POST | `/api/login` | Logs in with username or email, returns a token that lasts 2 hours | |
| POST | `/api/forgot-password` | Emails a password reset link | |
| POST | `/api/reset-password` | Sets a new password using the token from the reset link | |
| GET | `/api/me` | Returns the logged-in user | yes |
| POST | `/api/game/start` | Starts an attempt, or the next round if you send a `gameId` | yes |
| POST | `/api/game/hit` | Draws a card | yes |
| POST | `/api/game/stand` | Ends your turn, the dealer plays and the round is scored | yes |
| GET | `/api/game/state?gameId=` | Returns the current game | yes |
| GET | `/api/attempts/me` | Your finished attempts and best score | yes |
| GET | `/api/leaderboard?limit=10` | Top players by best attempt | |
| GET | `/api/health` | Checks that the API and database are up | |

You can't log in until your email is verified. Passwords must be 12 to 128 characters.

## Docs

The [`diagrams/`](diagrams/) folder has the Gantt chart, ERD, use-case diagram and sequence diagram. To view a `.puml` file, paste it into https://www.plantuml.com/plantuml or open it with the VS Code PlantUML extension.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which pulls the code on the server and installs packages. Rebuilding the frontend and restarting the API are still done by hand on the server.

A new server is set up with the scripts in `deploy/`:

```sh
export SERVER_IP="<server-ipv4-address>"
bash deploy/bootstrap.sh
bash deploy/domain.sh cruddylit.com
```

## Example users

`npm run seed:users` adds 12 example accounts (`demo_ace` through `demo_lane`) to the database in `.env`. Set the password they should all use first:

```sh
read -r -s -p 'Password for the example users: ' SEED_PASSWORD
export SEED_PASSWORD
npm run seed:users
unset SEED_PASSWORD
```

Accounts that already exist are skipped.
