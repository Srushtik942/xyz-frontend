# Change log

- Replaced the Vite starter screen with a responsive Great Britain wind generation dashboard for January 2026, including forecast/actual charts, summary metrics, loading/error/empty states, refresh, and a delivery-period table.
- Added a separate API module for configurable FastAPI requests, January 2026 filtering, wind record normalization, delivery-time matching, and explicit malformed/duplicate-data errors. The backend is required to return one cutoff-eligible national wind forecast per delivery period.
- Added Recharts with a lazy-loaded chart chunk and its `react-is` peer dependency; updated the document title, page metadata, global styling, and README with run instructions and the required backend response contract.
- Wired `/api/forecasts` to send the configured publication-time range (`2025-12-31T00:00:00Z` through `2026-02-01T00:00:00Z`) and `generation=100`; retained backend responsibility for day-ahead cutoff selection.
- Added an analysis-month selector and actual-generation query parameters (`settlementDateFrom`, `settlementDateTo`, and `fuelType=WIND`), with month-specific request refetching and range filtering.
- Validation: `npm run build` and `npm run lint` pass. The live FastAPI service was unavailable, so endpoint behavior was not verified against it.
- Validation: `npm run build` and `npm run lint` pass. Browser checks with mocked API payloads previously verified chart rendering, wind-only filtering, `startTime` matching, matched-period MAE/RMSE, empty-data handling, and API-error handling. Live verification of the updated request parameters and FastAPI service was unavailable.
