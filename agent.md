# Wind Generation Dashboard

## Objective
Build a React dashboard for visualizing Great Britain's wind generation forecasts and actual generation for January 2026.

## Requirements
1. Create a clean, modern, responsive dashboard for wind generation data.
2. Display wind generation data using interactive charts.
3. Use **Recharts** to create a line chart comparing forecast generation against actual generation over time.
4. Retrieve data from the existing FastAPI backend rather than calling the Elexon API directly from React.
5. Integrate the backend API endpoints:
   - `/api/forecasts` — retrieves wind generation forecasts.
   - `/api/actual-generation` — retrieves actual wind generation.
6. Match forecast and actual records using their delivery time (`startTime`).
7. Display summary metrics such as Mean Absolute Error (MAE) and Root Mean Square Error (RMSE), when the required matched data is available.
8. Include loading indicators, error messages, and empty-data states.
9. Add a data table showing delivery time, forecast generation, actual generation, and forecast error.
10. Use reusable React components and keep API-fetching logic separate from presentation components.

## Technical Guidelines
- Use React and Vite.
- Use JavaScript unless the existing project uses TypeScript.
- Use Recharts for data visualization.
- Keep the backend base URL configurable through a Vite environment variable, such as `VITE_API_BASE_URL`.
- Do not hardcode sample values as real data.
- Do not fabricate missing forecast or actual values.
- Ensure the dashboard works on desktop and mobile screens.
- Follow the existing project structure and avoid unnecessary dependencies.

## Important Data Rules
- Restrict the analysis to delivery periods in January 2026.
- Use national-level wind generation data.
- Forecast selection must respect the day-ahead purchasing decision cutoff: choose the latest forecast published by that cutoff for each delivery period.
- Match forecasts and actual generation using `startTime`.
- Calculate accuracy metrics only from valid matched records.
- Do not calculate metrics from illustrative or mock data.

## Implementation Approach
1. Inspect the existing project and backend API response structures.
2. Build the dashboard layout.
3. Implement API integration.
4. Transform and match forecast and actual records.
5. Add charts, metrics, and the data table.
6. Test loading, error, empty-data, and responsive states.

Do not rewrite or duplicate the existing FastAPI backend unless necessary. Clearly identify any backend changes required for correct forecast selection or accuracy calculations.


Make a log.md file and log each changes made.