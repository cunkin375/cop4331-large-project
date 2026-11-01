# API demonstration

Use the deployed domain and a real inbox you control. Rehearse email delivery
and verification links before presenting. Keep environment files and credentials
out of the demonstration.

## API lab

1. Connect to the remote server and show the authentication routes and JWT middleware.
2. Import `blackjack.postman_collection.json` into Postman, or prepare equivalent ARC requests.
3. Set unique username, email, and password variables. Passwords need 12-128 characters.
4. Send `POST /api/register`; expect 201.
5. Send `POST /api/login` before verification; expect 403.
6. Open the verification email link, then log in again; expect 200 and a JWT.
7. Send `GET /api/me` with the bearer token; expect 200. Without it, expect 401.

If time permits, show password recovery and `/api/leaderboard?q=...` with part
of a username belonging to a player with a completed attempt.

## Final presentation

Import `openapi-demo.yaml` into SwaggerHub for the two-endpoint registration and
login demo. `openapi.yaml` is the full reference. Select the production server,
disable mocking, and verify the new email through the web app between requests.
Demonstrate one or two endpoints, with at least one successful live request.
Ensure the deployed API allows the actual SwaggerHub origin in `CORS_ORIGINS`.

## Database tests

Never run integration tests against the shared live `blackjack` database.
Set `MONGODB_DB=blackjack_test` in the test environment before running
`npm run test:db` or `npm run test:api:db`. Both refuse database names without
the `_test` suffix and use a separate, uniquely named database per run.
That database is dropped after completion, failure, or handled SIGINT/SIGTERM.
Forced termination or machine failure cannot execute cleanup; any abandoned
database stays separate from live data and must be removed by its owner.
The HTTP tests capture email tokens; they do not establish inbox delivery.
