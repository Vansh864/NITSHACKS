# E.D.I.T.H. Backend

This backend powers the E.D.I.T.H. privacy-monitoring dashboard for the React + Vite frontend in `/frontend`.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` if you need custom settings.
3. Start the server:
   ```bash
   npm start
   ```
4. For development auto-reload:
   ```bash
   npm run dev
   ```

## Database

The backend stores data in `backend/data/edith.db` using `better-sqlite3` when available. The repository is also resilient to SQLite boot failures and can fall back to a JSON store behind the same interface.

## Trust-score formula

The trust score is recomputed after each permission change or suspicious access event.

- Permission risk penalty: HIGH = -20, MEDIUM = -8, LOW = -2 for each allowed permission.
- Category mismatch penalty: permissions outside the expected set for that app category.
- Behaviour penalty: open alerts and suspicious event bursts lower the score.
- Bonus: restricted dangerous permissions and a clean history add back points.
- Final score is clamped to 0–100.

## Important endpoints

- `GET /api/health`
- `GET /api/apps`
- `GET /api/apps/:id`
- `PATCH /api/apps/:id/permissions`
- `POST /api/apps/:id/access`
- `POST /api/apps/:id/action`
- `POST /api/apps/:id/simulate`
- `POST /api/apps/:id/apply-recommendations`
- `GET /api/alerts`
- `PATCH /api/alerts/:id`
- `GET /api/history`
- `GET /api/summary`
- `POST /api/simulation/scenario`
- `POST /api/reset`

## Example curl commands

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/apps
curl -X PATCH http://localhost:5000/api/apps/app_1/permissions \
  -H "Content-Type: application/json" \
  -d '{"permissionName":"Contacts","status":"restricted"}'
curl -X POST http://localhost:5000/api/apps/app_3/access \
  -H "Content-Type: application/json" \
  -d '{"resource":"Location","purpose":"Background access","background":true,"itemCount":35,"count":35}'
curl -X POST http://localhost:5000/api/apps/app_3/simulate
curl -X POST http://localhost:5000/api/reset
```

## Demo walkthrough

Run:

```bash
npm run demo
```

This resets the seed, lists the initial scores, runs the challenge scenario, and prints an after-the-fact table of app scores, alerts, and recommendations.

## Testing

```bash
npm test
```
