const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const FUEL_TYPE = 'WIND'

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getPeriodDates(period) {
  const match = /^(\d{4})-(\d{2})$/.exec(period ?? '')
  if (!match) {
    throw new Error('Select a valid analysis period')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) {
    throw new Error('Select a valid analysis period')
  }

  const firstDay = formatDate(year, month, 1)
  const lastDay = formatDate(year, month, new Date(year, month, 0).getDate())
  const previousMonthEnd = new Date(Date.UTC(year, month - 1, 0))
  const nextMonthStart = new Date(Date.UTC(year, month, 1))
  const isoDate = (date) =>
    formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())

  return {
    firstDay,
    lastDay,
    startTime: Date.parse(`${firstDay}T00:00:00Z`),
    endTime: Date.parse(`${formatDate(year + (month === 12 ? 1 : 0), month === 12 ? 1 : month + 1, 1)}T00:00:00Z`),
    forecastFrom: `${isoDate(previousMonthEnd)}T00:00:00Z`,
    forecastTo: `${isoDate(nextMonthStart)}T00:00:00Z`,
  }
}

async function fetchRecords(path, signal, query) {
  const response = await fetch(
    `${API_BASE_URL}${path}${query ? `?${query}` : ''}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  const records = Array.isArray(payload)
    ? payload
    : payload?.data ?? payload?.items ?? payload?.records ?? payload?.results

  if (!Array.isArray(records)) {
    throw new Error(`${path} must return an array of generation records`)
  }

  return records
}

function getGenerationValue(record, kind) {
  const keys = kind === 'forecast'
    ? ['forecastGeneration', 'forecast', 'generation', 'value']
    : ['actualGeneration', 'generation', 'actual', 'value']
  const key = keys.find((candidate) => record[candidate] !== undefined && record[candidate] !== null)
  const value = key === undefined ? NaN : Number(record[key])

  if (!Number.isFinite(value)) {
    throw new Error(`A ${kind} record has no valid generation value`)
  }

  return value
}

function normalizeRecords(records, kind, periodDates) {
  const byStartTime = new Map()

  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`The ${kind} endpoint returned an invalid record`)
    }

    if (record.fuelType && String(record.fuelType).toUpperCase() !== 'WIND') {
      continue
    }

    const startTime = Date.parse(record.startTime)
    if (!Number.isFinite(startTime)) {
      throw new Error(`A ${kind} record has an invalid startTime`)
    }
    if (startTime < periodDates.startTime || startTime >= periodDates.endTime) {
      continue
    }

    const normalized = {
      startTime: new Date(startTime).toISOString(),
      value: getGenerationValue(record, kind),
    }

    if (kind === 'forecast' && record.publishTime !== undefined) {
      const publishTime = Date.parse(record.publishTime)
      if (!Number.isFinite(publishTime)) {
        throw new Error('A forecast record has an invalid publishTime')
      }
      normalized.publishTime = publishTime
    }

    if (byStartTime.has(normalized.startTime)) {
      throw new Error(
        `The ${kind} endpoint returned multiple records for ${normalized.startTime}. ` +
          'Return one national wind record per delivery period.',
      )
    }

    byStartTime.set(normalized.startTime, normalized)
  }

  return byStartTime
}

export async function fetchWindGeneration(period, signal) {
  const periodDates = getPeriodDates(period)
  const forecastQuery = new URLSearchParams({
    publishDateTimeFrom: periodDates.forecastFrom,
    publishDateTimeTo: periodDates.forecastTo,
    generation: '100',
  })
  const actualQuery = new URLSearchParams({
    settlementDateFrom: periodDates.firstDay,
    settlementDateTo: periodDates.lastDay,
    fuelType: FUEL_TYPE,
  })
  const [forecastRecords, actualRecords] = await Promise.all([
    fetchRecords('/api/forecasts', signal, forecastQuery),
    fetchRecords('/api/actual-generation', signal, actualQuery),
  ])
  const forecasts = normalizeRecords(forecastRecords, 'forecast', periodDates)
  const actuals = normalizeRecords(actualRecords, 'actual', periodDates)
  const startTimes = new Set([...forecasts.keys(), ...actuals.keys()])
  const rows = [...startTimes]
    .sort((left, right) => Date.parse(left) - Date.parse(right))
    .map((startTime) => ({
      startTime,
      forecast: forecasts.get(startTime)?.value,
      actual: actuals.get(startTime)?.value,
    }))

  return { rows, forecastCount: forecasts.size }
}
