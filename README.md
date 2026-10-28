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
