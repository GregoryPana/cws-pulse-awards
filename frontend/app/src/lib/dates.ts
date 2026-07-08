/**
 * Central date + programme-launch logic for the CWS Pulse Awards.
 *
 * The programme launched in June 2026 — no winners can exist for any period before
 * that, so the UI must (a) never offer future periods as valid, and (b) explain the
 * pre-launch gap rather than showing a bare "no winners" state.
 */

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** Programme launch: June 2026 (month index 5, 0-based). */
export const LAUNCH_YEAR = 2026
export const LAUNCH_MONTH_INDEX = 5
export const LAUNCH_LABEL = `${MONTHS_SHORT[LAUNCH_MONTH_INDEX]} ${LAUNCH_YEAR}`

/** A period expressed as an absolute month number so comparisons are trivial. */
export const periodOrdinal = (year: number, monthIndex: number) => year * 12 + monthIndex

export const LAUNCH_ORDINAL = periodOrdinal(LAUNCH_YEAR, LAUNCH_MONTH_INDEX)

export const currentYear = () => new Date().getFullYear()
export const currentMonthIndex = () => new Date().getMonth()
export const currentOrdinal = () => periodOrdinal(currentYear(), currentMonthIndex())

/** Format a label like "Jul 2026" from parts. */
export const periodLabel = (year: number, monthIndex: number) =>
  `${MONTHS_SHORT[monthIndex]} ${year}`

/** Parse "Jul 2026" back into parts; returns null for "All" or malformed input. */
export const parsePeriod = (label: string): { year: number; monthIndex: number } | null => {
  if (!label || label === 'All') return null
  const [mon, yr] = label.split(' ')
  const monthIndex = MONTHS_SHORT.indexOf(mon as (typeof MONTHS_SHORT)[number])
  const year = Number(yr)
  if (monthIndex < 0 || !Number.isFinite(year)) return null
  return { year, monthIndex }
}

export type PeriodState = 'available' | 'prelaunch' | 'future'

/** Classify a month within a year relative to launch and today. */
export const monthState = (year: number, monthIndex: number): PeriodState => {
  const ord = periodOrdinal(year, monthIndex)
  if (ord < LAUNCH_ORDINAL) return 'prelaunch'
  if (ord > currentOrdinal()) return 'future'
  return 'available'
}

/** True when the label refers to a period earlier than the programme launch. */
export const isPreLaunch = (label: string): boolean => {
  const parsed = parsePeriod(label)
  if (!parsed) return false
  return periodOrdinal(parsed.year, parsed.monthIndex) < LAUNCH_ORDINAL
}

/**
 * Selectable years: launch year through the current year (never the future).
 * As the system grows this list simply extends forward, newest first.
 */
export const selectableYears = (): number[] => {
  const end = Math.max(currentYear(), LAUNCH_YEAR)
  return Array.from({ length: end - LAUNCH_YEAR + 1 }, (_, i) => end - i)
}

/** Can the year stepper move to this year? Bounded by launch and current year. */
export const canGoToYear = (year: number): boolean =>
  year >= LAUNCH_YEAR && year <= Math.max(currentYear(), LAUNCH_YEAR)
