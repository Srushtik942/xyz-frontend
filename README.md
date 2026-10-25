# WindScope

A React dashboard for Great Britain's national wind generation forecast performance in January 2026.

## Run locally

```sh
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in a `.env` file when the FastAPI service is hosted away from the Vite origin:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

When unset, the dashboard requests `/api/forecasts` and `/api/actual-generation` from the current origin. The development server does not proxy API requests by default.

## Backend response contract

The frontend calls `/api/forecasts` with `publishDateTimeFrom` and `publishDateTimeTo` as ISO-8601 timestamps, plus `generation=100`. It calls `/api/actual-generation` with `settlementDateFrom` and `settlementDateTo` as `YYYY-MM-DD` dates and `fuelType=WIND`, derived from the selected analysis month. Both endpoints should return an array of national wind records, either directly or inside a `data`, `items`, `records`, or `results` array. Each record needs an ISO-8601 `startTime` and a numeric generation value. The actual endpoint can use `generation`, `actualGeneration`, `actual`, or `value`; forecasts can use `generation`, `forecastGeneration`, `forecast`, or `value`.

Records may include `fuelType` (it must be `WIND` when present) and forecasts may include `publishTime`. The backend must return one eligible forecast per delivery period, selecting the latest forecast published by the day-ahead purchasing cutoff; the frontend relies on this selection and reports duplicate delivery periods as API errors rather than choosing arbitrarily. It must also provide national-level rather than regional generation data. The frontend filters records to January 2026, joins forecast and actual records by `startTime`, and calculates MAE/RMSE only from matched periods.
