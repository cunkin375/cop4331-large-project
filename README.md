# MERN lab

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
