import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { fetchWindGeneration } from './api/windGeneration.js'
import './App.css'

const GenerationChart = lazy(() => import('./components/GenerationChart.jsx'))

const numberFormat = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
})

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
})

function formatTime(value) {
  return dateTimeFormat.format(new Date(value))
}

function formatMegawatts(value) {
  return `${numberFormat.format(value)} MW`
}

function calculateMetrics(rows) {
  const matched = rows.filter(
    (row) => Number.isFinite(row.forecast) && Number.isFinite(row.actual),
  )

  if (matched.length === 0) {
    return { mae: null, rmse: null, matchedCount: 0 }
  }

  const errors = matched.map((row) => row.forecast - row.actual)
  const meanAbsoluteError =
    errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length
  const rootMeanSquareError = Math.sqrt(
    errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length,
  )

  return {
    mae: meanAbsoluteError,
    rmse: rootMeanSquareError,
    matchedCount: matched.length,
  }
}

function MetricCard({ label, value, detail, icon }) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span className="metric-label">{label}</span>
        <span className="metric-icon" aria-hidden="true">{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  )
}

function LoadingState() {
  return (
    <div className="feedback-state" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <strong>Loading generation data</strong>
      <span>Fetching forecast and actual records from the backend.</span>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="feedback-state error-state" role="alert">
      <span className="state-symbol" aria-hidden="true">!</span>
      <strong>We couldn’t load the dashboard</strong>
      <span>{message}</span>
      <button className="button button-secondary" type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="feedback-state">
      <span className="state-symbol empty-symbol" aria-hidden="true">—</span>
      <strong>No January data available</strong>
      <span>{message}</span>
    </div>
  )
}

function GenerationTable({ rows }) {
  if (rows.length === 0) {
    return <EmptyState message="Delivery periods will appear here when the backend provides them." />
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Delivery time</th>
            <th scope="col">Forecast</th>
            <th scope="col">Actual</th>
            <th scope="col">Forecast error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const error = Number.isFinite(row.forecast) && Number.isFinite(row.actual)
              ? row.forecast - row.actual
              : null

            return (
              <tr key={row.startTime}>
                <th scope="row">{formatTime(row.startTime)}</th>
                <td>{Number.isFinite(row.forecast) ? formatMegawatts(row.forecast) : '—'}</td>
                <td>{Number.isFinite(row.actual) ? formatMegawatts(row.actual) : '—'}</td>
                <td className={error === null ? '' : error > 0 ? 'error-positive' : 'error-negative'}>
                  {error === null ? '—' : `${error > 0 ? '+' : ''}${numberFormat.format(error)} MW`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function App() {
  const [period, setPeriod] = useState('2026-01')
  const [data, setData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [request, setRequest] = useState({
    period: '',
    refreshKey: -1,
    status: 'loading',
    error: '',
  })

  useEffect(() => {
    if (!period) {
      return undefined
    }

    const controller = new AbortController()

    fetchWindGeneration(period, controller.signal)
      .then((result) => {
        setData(result)
        setRequest({ period, refreshKey, status: 'success', error: '' })
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') {
          setRequest({ period, refreshKey, status: 'error', error: fetchError.message })
        }
      })

    return () => controller.abort()
  }, [period, refreshKey])

  const isLoading = request.period !== period
    || request.refreshKey !== refreshKey
    || request.status === 'loading'
  const error = request.period === period
    && request.refreshKey === refreshKey
    && request.status === 'error'
    ? request.error
    : ''
  const periodLabel = period
    ? new Intl.DateTimeFormat('en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1, 1))
    : ''
  const metrics = useMemo(
    () => calculateMetrics(data?.rows ?? []),
    [data],
  )

  const refresh = () => setRefreshKey((current) => current + 1)

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="/" aria-label="WindScope dashboard home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 3v13m0 0L5.5 9.5M16 16l10.5-6.5M16 16l-4 13m4-13 11 8" />
              <circle cx="16" cy="16" r="2.4" />
            </svg>
          </span>
          <span>Wind<span className="brand-light">Scope</span></span>
        </a>
        <div className="topbar-meta">
          <span className="national-badge"><span /> Great Britain</span>
          <span className="topbar-divider" />
          <span>Generation insights</span>
        </div>
        <button className="button button-refresh" type="button" onClick={refresh} disabled={isLoading}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M16.2 8A6.4 6.4 0 0 0 5.1 5.1L3.5 6.7M3.5 6.7V3.8m0 2.9h2.9M3.8 12a6.4 6.4 0 0 0 11.1 2.9l1.6-1.6m0 0v2.9m0-2.9h-2.9" />
          </svg>
          Refresh data
        </button>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> WIND GENERATION</div>
            <h1>Forecast performance</h1>
            <p className="page-description">
              See how day-ahead forecasts compared with actual wind generation.
            </p>
          </div>
          <label className="period-selector" htmlFor="analysis-period">
            <span className="calendar-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4.5" width="14" height="12" rx="2" />
                <path d="M6.5 2.8v3.4M13.5 2.8v3.4M3 8h14" />
              </svg>
            </span>
            <span className="period-selection">
              <small>ANALYSIS PERIOD</small>
              <select
                id="analysis-period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const month = String(index + 1).padStart(2, '0')
                  const value = `2026-${month}`
                  const label = new Intl.DateTimeFormat('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(2026, index, 1))

                  return <option key={value} value={value}>{label}</option>
                })}
              </select>
            </span>
            <span className="period-chevron" aria-hidden="true">⌄</span>
          </label>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <>
            <section className="metrics-grid" aria-label="Forecast summary">
              <MetricCard
                label="Mean absolute error"
                value={metrics.mae === null ? '—' : formatMegawatts(metrics.mae)}
                detail={metrics.mae === null ? 'No matched periods available' : 'Average forecast deviation'}
                icon="±"
              />
              <MetricCard
                label="Root mean square error"
                value={metrics.rmse === null ? '—' : formatMegawatts(metrics.rmse)}
                detail={metrics.rmse === null ? 'No matched periods available' : 'Penalizes larger misses'}
                icon="∑"
              />
              <MetricCard
                label="Matched periods"
                value={numberFormat.format(metrics.matchedCount)}
                detail="Forecast and actual pairs"
                icon="↔"
              />
              <MetricCard
                label="Forecast coverage"
                value={numberFormat.format(data?.forecastCount ?? 0)}
                detail="Eligible delivery periods"
                icon="◷"
              />
            </section>

            <section className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Forecast vs actual</h2>
                  <p>Wind generation across {periodLabel} delivery periods</p>
                </div>
                <div className="chart-legend">
                  <span><i className="legend-dot forecast-dot" /> Forecast</span>
                  <span><i className="legend-dot actual-dot" /> Actual</span>
                </div>
              </div>
              <Suspense fallback={<div className="chart-loading">Preparing interactive chart…</div>}>
                <GenerationChart rows={data?.rows ?? []} />
              </Suspense>
              <div className="chart-footnote">
                <span className="info-mark" aria-hidden="true">i</span>
                Forecasts are the latest values selected by the backend before its day-ahead cutoff.
              </div>
            </section>

            <section className="panel table-panel">
              <div className="panel-heading table-heading">
                <div>
                  <h2>Delivery periods</h2>
                  <p>Forecast, actual generation and error for each period</p>
                </div>
                <span className="row-count">{data?.rows.length ?? 0} periods</span>
              </div>
              <GenerationTable rows={data?.rows ?? []} />
            </section>

            <footer className="dashboard-footer">
              <span>Source: FastAPI generation data service</span>
              <span>All times shown in Europe/London · Generation in MW</span>
            </footer>
          </>
        )}
      </section>
    </main>
  )
}

export default App
