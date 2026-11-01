# API lab demo and requirements review

Reviewed November 1, 2026 against the attached Fall 2026 Large Project PDF and
the WebCourses requirements supplied in chat. Mobile implementation is excluded.
The PDF is assignment context, not authorization to edit the team spreadsheet.

## What to show at the API lab

Use the deployed domain, not localhost or an IP address. Keep your server SSH
terminal, editor, Postman (or ARC), browser, and inbox open before the demo.

1. SSH into the actual deployment server and open `/opt/blackjack` in your editor.
   Show `server/routes/auth.js`, `server/models/User.js`,
   `server/middleware/auth.js`, and `server/utils/mailer.js`. Explain Express
   routes, MongoDB persistence, salted scrypt password hashes, hashed single-use
   email tokens, and the two-hour JWT. Do not display `.env` or credentials.
2. Import `docs/blackjack.postman_collection.json` into Postman. Set its
   `username`, `email`, and `password` variables to unique demo details and a
   real inbox you control. Passwords must have 12-128 characters; usernames
   must have 3-20 letters, digits, or underscores. Run requests individually.
3. Call `GET https://cruddylit.com/api/health`: expect 200 and a connected DB.
4. Register: `POST /api/register` with username, email, password. Expect 201
   and public account information, with no password hash or JWT in the response.
5. Log in before verification: expect 403. Open the actual verification email
   and click its link to the web app. Show the successful verification page.
6. Log in again: expect 200, a user object, and a JWT. Postman's successful-login
   request stores the JWT automatically. Show `/api/me` with the bearer token
   (200) and without it (401). Explain why another player's games are inaccessible.
7. If time permits, show password recovery in the browser: request an email,
   open its link, set a new password, and log in. The old password and reused
   reset link must fail. Keep a separate verified account ready as a backup,
   while still demonstrating a fresh signup.
8. For the frontend role, show the React/TypeScript source and perform the
   signup, verification, and login in the browser against the remote server.
   Show the leaderboard search and the corresponding request in the Network tab.

Registration example (replace all example values before sending):

```json
{
  "username": "lab_player_01",
  "email": "your-real-inbox@example.com",
  "password": "a-unique-demo-password"
}
```

Login example:

```json
{
  "email": "your-real-inbox@example.com",
  "password": "a-unique-demo-password"
}
```

The supplied schedule lists the API/frontend lab on October 30 and the mobile
lab on November 6. Confirm your actual attendance slot with the GTA if your
demo was moved. Project managers must choose and attend their assigned role lab.

## SwaggerHub presentation

The final presentation requires SwaggerHub and only one or two demonstrated
endpoints. This limits what you demonstrate, not how many endpoints the app may
implement. The API lab separately asks for login and registration in ARC/Postman.

Import `docs/openapi-demo.yaml` into SwaggerHub for exactly two routes:
`POST /register` and `POST /login`. Select the production server
`https://cruddylit.com/api`, disable any mock server, and rehearse live requests.
Verify the new email through the web flow between registration and login.
At least one demonstrated request must execute successfully against production.
Use `docs/openapi.yaml` as the full reference for all implemented routes.

The API allows the browser origins `https://app.swaggerhub.com` and
`https://editor.swagger.io` by default. If your SwaggerHub deployment uses another
origin, add that exact origin to the server's comma-separated `CORS_ORIGINS`
environment variable and restart the API. Rehearse from the actual SwaggerHub
page; a valid YAML file alone does not establish a working live demo.

## Requirement coverage

| Requirement | Repository evidence / remaining check |
| --- | --- |
| MERN and TypeScript web app | MongoDB driver, Express/Node, React TypeScript, Vite, Tailwind. Build and lint pass. No Python backend. |
| Initial login/register | Protected `/play` sends guests to login; login links to registration. Both call Express asynchronously. |
| Signup and email verification | Implemented; verification is required for new API signups. Actual SMTP delivery and inbox flow still require a live check. |
| Login and JWT | Implemented and tested; game and attempt routes require auth by default. |
| Password recovery | Implemented with expiring, single-use hashed tokens; actual reset email delivery still needs a live check. |
| Independent user information | `/me`, game ownership checks, and `/attempts/me` scope private data to the JWT user. Public leaderboard exposes username and score. |
| Server partial search | Added `GET /api/leaderboard?q=...&limit=10`, connected to the web search. Literal, case-insensitive substring matching happens in MongoDB before limiting. Only users with completed attempts appear; rank is within matching results. Must deploy these changes. |
| REST API / SwaggerHub | Full validated OpenAPI spec plus two-route demo spec supplied. Import and rehearse in the team's SwaggerHub account. |
| Remote DB / domain / HTTPS | Live `https://cruddylit.com` and API health responded successfully on review date. Health reported database connected; MongoDB's actual location was not independently inspected. |
| Gantt / ERD / use case / sequence and activity | Source artifacts exist in `diagrams/`, including the added `activity-auth.puml`. Review accuracy, render UML, and place legible diagrams in slides. The PDF permits either sequence or activity; the pasted rubric names both, so both are supplied. |
| Tests | 27 API/game tests and 2 seed tests pass; frontend build/lint pass. Both the model integration checks and real MongoDB HTTP integration checks pass with the supplied environment. The HTTP suite covers signup, verification/resend, login/JWT, game ownership and ten-round persistence, history, partial search, reset, and sample items; its temporary records are removed. |
| Prototypes / wireframes | No dedicated prototype/wireframe artifact found in this checkout. Supply the team's existing Figma/Adobe XD link or make the required prototype and include it in slides. |
| Team roles / signup sheet | Roles are listed in README. The linked SharePoint sheet was inaccessible, so roles and project title/repository/live-domain entries there are unverified. |
| Slides / participation | No presentation deck found in this checkout. Include required sections, have every member present meaningful work, practice 12 minutes, and ensure every member submits the slides. Bring slides/support files on USB. |
| Campus access | Check the domain on the campus network two days and one day before the final presentation. |

The PDF supports MERN, TypeScript/React, email verification/reset, SwaggerHub,
diagrams, prototypes, tests, and Flutter. It lists JWT as one security option;
the supplied WebCourses text specifically requires JWT. The supplied text also
adds partial search, domain hosting, presentation timing, and detailed grading.
Use both sources; the PDF alone is not the entire checklist.

Legacy/seed accounts without an `emailVerified` flag retain the existing login
compatibility behavior. Use a newly registered account to demonstrate the
verification requirement. The old `/api/items` sample routes remain public and
are not used by the blackjack UI; retire them before production if unnecessary.

## Deployment and verification before the lab

These changes are local until committed, pushed, reviewed, and merged/deployed.
The deployment workflow runs on pushes to `main`; rebasing a feature branch does
not publish it. The deployment SSH user must be allowed to restart `blackjack`
without an interactive sudo prompt. The updated workflow installs locked
dependencies, runs API tests, builds the web app, restarts the service, and checks
health. It does not configure SMTP for you.

Ensure production has `JWT_SECRET`, `CLIENT_URL=https://cruddylit.com`, and correct
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
Email delivery failures are logged asynchronously, so a 201 registration response
does not prove the email was sent. Inspect service logs if mail fails.

```sh
cd /opt/blackjack
git rev-parse --short HEAD
npm test
npm run test:seed
npm --prefix frontend run build
npm --prefix frontend run lint
systemctl status blackjack --no-pager
curl --fail https://cruddylit.com/api/health
curl --fail 'https://cruddylit.com/api/leaderboard?q=test'
```

`npm run test:db` uses the database configured in `.env`, creates temporary users
and attempts, and removes its own test records afterward. Prefer a separate test
database. It tests actual MongoDB models and search; it does not test SMTP.
The default API tests use database doubles and a fake mailer, so they do not
establish a complete deployed browser/database/email integration.

`npm run test:api:db` exercises HTTP endpoints backed by the configured MongoDB.
It creates two temporary accounts, plays an attempt, checks ownership and search,
and tests recovery. Email tokens are captured instead of sending real messages.
It removes its temporary users, games, attempts, and items afterward. SMTP
connection/authentication was verified separately with the supplied environment;
actual inbox delivery and browser link handling still require a rehearsal.

On this Windows machine, Node initially rejected the local certificate chain.
Using the Windows trusted certificate store resolved both MongoDB and SMTP
connectivity without disabling certificate validation. The successful DB commands
were (Node 22.17.1):

```sh
node --use-system-ca --env-file=.env server/models.integration.js
node --use-system-ca --env-file=.env server/api.integration.js
```

Use the same Node flag when starting the local server on this machine if needed.
No machine-specific trust setting is imposed on the deployment server.

For additional production hardening, add login/email-request rate limits and
consider revoking existing JWTs on password reset. Those improvements are not
substitutes for the required live signup, verification, login, reset, and search
rehearsal.
