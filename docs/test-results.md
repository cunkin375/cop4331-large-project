# Test Results

Run on November 13, 2026 against `main` plus the profile-page branch, with Node.js 22. The same API tests, plus the frontend build and lint, run on GitHub Actions for every pull request and before every deploy.

## Summary

| Suite | Kind | Tests | Result |
| --- | --- | --- | --- |
| `server/app.test.js` | API routes, search, CORS, access control | 13 | ✅ 13 passed |
| `server/auth.test.js` | Register, verify, login, reset and change password, JWT | 14 | ✅ 14 passed |
| `server/game.test.js` | Game engine and game routes | 6 | ✅ 6 passed |
| `server/rules.test.js` | Scoring rules and a 20,000-round cross-check | 4 | ✅ 4 passed |
| `server/integrationDb.test.js` | Safety of the database integration scripts | 2 | ✅ 2 passed |
| **Total (`npm test`)** | | **39** | **✅ 39 passed, 0 failed** |
| Frontend | TypeScript type-check and production build | | ✅ Pass |
| Frontend | ESLint | | ✅ 0 problems |

## Unit tests

The API tests run the real Express app against an in-memory stand-in for MongoDB and a fake mailer, so they need no database or email account.

**Authentication (`auth.test.js`)**
- Registering creates an unverified account, stores only a hash of the email token, and sends the email
- Missing or invalid fields return 400; a duplicate username or email returns 409
- Verify-email marks the account verified and rejects bad or expired links
- Login returns 403 before verification and a JWT after; a wrong password returns 401
- Expired tokens, unsupported signing algorithms and invalid user ids are rejected
- Forgot-password gives the same reply whether or not the email exists
- Reset-password works once, then the link stops working
- Change-password requires a login and the current password, and the old password stops working afterwards

**Game (`game.test.js`, `rules.test.js`)**
- The deck has 52 distinct cards, and aces count as 11 or 1, whichever avoids a bust
- The dealer stands on soft and hard 17, and the hole card stays hidden until the round ends
- Busting ends the round; ties and blackjacks score correctly (win 3, tie 1, loss 0)
- Hitting exactly 21 plays the dealer and ends the round automatically
- Exactly ten rounds save one attempt, and two quick moves can't score a round twice
- 20,000 random rounds score the same as a separately written reference scorer

**API and access control (`app.test.js`)**
- Every game and attempt route rejects requests without a login
- A player can't read or change another player's game
- Leaderboard search is partial, ignores case and treats input as plain text
- Only the configured SwaggerHub origins may call the API from a browser

## Integration tests against the live server

Requests sent to the deployed API at https://cruddylit.com on November 13, 2026. None of them create an account or a game.

| Request | Expected | Result |
| --- | --- | --- |
| `GET /api/health` | 200, database connected | ✅ 200 |
| `GET /api/leaderboard` | 200 | ✅ 200 |
| `GET /api/leaderboard?q=har` (partial search) | Only matching players | ✅ 200, returned `harengannarapu` |
| `POST /api/register` with a short password | 400 | ✅ 400 |
| `POST /api/login` with a wrong password | 401 | ✅ 401 |
| `GET /api/verify-email` with a bad token | 400 | ✅ 400 |
| `POST /api/reset-password` with a bad token | 400 | ✅ 400 |
| `POST /api/game/start` without a login | 401 | ✅ 401 |
| `GET /api/me` without a login | 401 | ✅ 401 |
| Browser preflight from SwaggerHub | 204, allowed | ✅ 204 |
| Web pages `/`, `/login`, `/register`, `/leaderboard` | 200 | ✅ 200 |

The full sign-up flow (register, receive the email, verify, log in, play ten rounds, appear on the leaderboard) was also tested by hand on the live site.

## How to run them

```sh
npm test                          # all API and game tests
npm --prefix frontend run build   # type-check and build the web app
npm --prefix frontend run lint
```

`npm run test:db` and `npm run test:api:db` run further checks against a real MongoDB. They refuse to run unless `MONGODB_DB` ends in `_test`, so they can never touch the live database.
