import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import {
  fetchAwardEmailPreviewFromPayload,
  type EmailPreviewResponse,
  type WinnerAdmin,
  type WinnerCreatePayload,
} from '../../api/admin'
import {
  fetchPillars,
  fetchSubcategories,
  fetchValues,
  type CompanyValue,
  type Pillar,
  type Subcategory,
} from '../../api/config'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { MONTHS_SHORT, currentMonthIndex, currentYear, selectableYears } from '../../lib/dates'

export { MONTHS_SHORT }
/** Full month names, index-aligned with MONTHS_SHORT, for clearer admin labels. */
export const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
/** Years selectable across the admin (launch year → current year, newest first). */
export const years = selectableYears()

export const emptyPayload = (): WinnerCreatePayload => {
  return {
    award_type: 'CHARTER_CHAMPION',
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    subcategory: '',
    charter_pillars: [],
    company_values: [],
    story: '',
    nominated_by: '',
    award_month: `${MONTHS_SHORT[currentMonthIndex()]} ${currentYear()}`,
    award_year: currentYear(),
    status: 'PUBLISHED',
  }
}

export const payloadFromWinner = (winner: WinnerAdmin): WinnerCreatePayload => ({
  award_type: winner.award_type as WinnerCreatePayload['award_type'],
  first_name: winner.first_name,
  last_name: winner.last_name,
  job_title: winner.job_title,
  department: winner.department,
  subcategory: winner.subcategory,
  charter_pillars: winner.charter_pillars,
  company_values: winner.company_values,
  story: winner.story,
  nominated_by: winner.nominated_by,
  award_month: winner.award_month,
  award_year: winner.award_year,
  photo_url: winner.photo_url,
  status: winner.status as WinnerCreatePayload['status'],
})

export interface AdminTabProps {
  isSignedIn: boolean
  getAccessToken: () => Promise<string>
}

export interface AwardConfig {
  pillars: Pillar[]
  values: CompanyValue[]
  subcategories: Subcategory[]
  configError: string | null
}

export function useAwardConfig(awardType: WinnerCreatePayload['award_type']): AwardConfig {
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [values, setValues] = useState<CompanyValue[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([fetchPillars(), fetchValues(), fetchSubcategories(awardType)])
      .then(([loadedPillars, loadedValues, loadedSubcategories]) => {
        setPillars(loadedPillars)
        setValues(loadedValues)
        setSubcategories(loadedSubcategories)
      })
      .catch((err: Error) =>
        setConfigError(err.message || 'The award categories could not be loaded. Refresh the page to try again.'),
      )
  }, [awardType])

  return { pillars, values, subcategories, configError }
}

/** Fill defaults for config-driven fields, keeping existing values when still valid. */
export const withConfigDefaults = (
  payload: WinnerCreatePayload,
  config: AwardConfig,
): WinnerCreatePayload => ({
  ...payload,
  charter_pillars: payload.charter_pillars.length
    ? payload.charter_pillars
    : config.pillars[0]
      ? [config.pillars[0].name]
      : [],
  company_values: payload.company_values.length
    ? payload.company_values
    : config.values[0]
      ? [config.values[0].name]
      : [],
  subcategory: config.subcategories.some((item) => item.name === payload.subcategory)
    ? payload.subcategory
    : config.subcategories[0]?.name || '',
})

const REQUIRED_FIELDS: { key: keyof WinnerCreatePayload; label: string }[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'job_title', label: 'Job title' },
  { key: 'department', label: 'Department' },
  { key: 'subcategory', label: 'Award category' },
  { key: 'charter_pillars', label: 'Charter pillar' },
  { key: 'company_values', label: 'Company value' },
  { key: 'story', label: 'Recognition story' },
]

const isFieldFilled = (value: WinnerCreatePayload[keyof WinnerCreatePayload]): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? '').trim())

/** Friendly names of required fields that are still empty. */
export const missingFields = (payload: WinnerCreatePayload): string[] =>
  REQUIRED_FIELDS.filter(({ key }) => !isFieldFilled(payload[key])).map(({ label }) => label)

/** Debounced live email preview rendered from the in-progress payload. */
export function useLivePreview(
  payload: WinnerCreatePayload,
  enabled: boolean,
  getAccessToken: () => Promise<string>,
) {
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const isReady = missingFields(payload).length === 0

  useEffect(() => {
    if (!enabled || !isReady) return
    setIsRendering(true)
    const timer = setTimeout(() => {
      void getAccessToken()
        .then((token) => fetchAwardEmailPreviewFromPayload(payload, token))
        .then((rendered) => setPreview(rendered))
        .catch(() => undefined)
        .finally(() => setIsRendering(false))
    }, 650)
    return () => {
      clearTimeout(timer)
      setIsRendering(false)
    }
  }, [payload, enabled, isReady, getAccessToken])

  return { preview, setPreview, isRendering, isReady }
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className ?? 'h-4 w-4'}`} />
}

export function Field({
  label,
  required,
  done,
  hint,
  children,
  className,
}: {
  label: string
  required?: boolean
  done?: boolean
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="flex items-center gap-1.5">
        <Label>
          {label}
          {required ? <span className="text-gold/70"> *</span> : null}
        </Label>
        {done && (
          <CheckCircle2
            className="h-3.5 w-3.5 text-emerald-400"
            aria-label={`${label} completed`}
          />
        )}
      </span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-white/40">{hint}</span>}
    </div>
  )
}

export function SelectField({
  label,
  required,
  done,
  hint,
  value,
  onValueChange,
  options,
  placeholder,
}: {
  label: string
  required?: boolean
  done?: boolean
  hint?: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <Field label={label} required={required} done={done} hint={hint}>
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? 'Choose one...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function MultiSelectField({
  label,
  required,
  done,
  hint,
  values,
  onValuesChange,
  options,
}: {
  label: string
  required?: boolean
  done?: boolean
  hint?: string
  values: string[]
  onValuesChange: (values: string[]) => void
  options: { value: string; label: string }[]
}) {
  const toggle = (option: string) => {
    onValuesChange(
      values.includes(option) ? values.filter((item) => item !== option) : [...values, option],
    )
  }

  return (
    <Field label={label} required={required} done={done} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = values.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
              className={`rounded-badge border px-3 py-1.5 font-label text-[11px] font-semibold tracking-wide transition ${
                isSelected
                  ? 'border-gold/40 bg-gold/15 text-gold-soft'
                  : 'border-white/[0.09] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

export function WinnerFormFields({
  payload,
  onChange,
  config,
}: {
  payload: WinnerCreatePayload
  onChange: <K extends keyof WinnerCreatePayload>(key: K, value: WinnerCreatePayload[K]) => void
  config: AwardConfig
}) {
  const filled = (value: string | null | undefined) => Boolean(value && value.trim())

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Award type"
          required
          done
          value={payload.award_type}
          onValueChange={(value) => onChange('award_type', value as WinnerCreatePayload['award_type'])}
          options={[
            { value: 'CHARTER_CHAMPION', label: 'Charter Champion — Peer-to-Peer' },
            { value: 'INSTANT_IMPACT', label: 'Instant Impact — Manager-to-Staff' },
          ]}
          hint="This decides which Wall of Fame the winner appears on: Charter Champion = a colleague nominated a colleague. Instant Impact = a manager recognised a staff member."
        />
        <SelectField
          label="Award year"
          required
          done
          value={String(payload.award_year)}
          onValueChange={(value) => {
            const nextYear = Number(value)
            const month = payload.award_month.split(' ')[0] || MONTHS_SHORT[0]
            onChange('award_year', nextYear)
            onChange('award_month', `${month} ${nextYear}`)
          }}
          options={years.map((year) => ({ value: String(year), label: String(year) }))}
        />
        <SelectField
          label="Award month"
          required
          done
          value={payload.award_month.split(' ')[0] || MONTHS_SHORT[0]}
          onValueChange={(month) => onChange('award_month', `${month} ${payload.award_year}`)}
          options={MONTHS_SHORT.map((month, index) => ({ value: month, label: FULL_MONTHS[index] }))}
        />
        <SelectField
          label="Visibility"
          required
          done
          value={payload.status || 'PUBLISHED'}
          onValueChange={(value) => onChange('status', value as WinnerCreatePayload['status'])}
          options={[
            { value: 'PUBLISHED', label: 'Published — shown on the Wall of Fame' },
            { value: 'ARCHIVED', label: 'Archived — hidden, kept for records' },
            { value: 'REMOVED', label: 'Removed — hidden completely' },
          ]}
        />
        <Field label="Nominated by" done={filled(payload.nominated_by)}>
          <Input
            value={payload.nominated_by || ''}
            onChange={(event) => onChange('nominated_by', event.target.value)}
            placeholder="Who put this person forward? (optional)"
          />
        </Field>
        <Field label="First name" required done={filled(payload.first_name)}>
          <Input
            value={payload.first_name}
            onChange={(event) => onChange('first_name', event.target.value)}
            placeholder="e.g. Marie"
            required
          />
        </Field>
        <Field label="Last name" required done={filled(payload.last_name)}>
          <Input
            value={payload.last_name}
            onChange={(event) => onChange('last_name', event.target.value)}
            placeholder="e.g. Payet"
            required
          />
        </Field>
        <Field label="Job title" required done={filled(payload.job_title)}>
          <Input
            value={payload.job_title}
            onChange={(event) => onChange('job_title', event.target.value)}
            placeholder="e.g. Customer Service Officer"
            required
          />
        </Field>
        <Field label="Department" required done={filled(payload.department)}>
          <Input
            value={payload.department}
            onChange={(event) => onChange('department', event.target.value)}
            placeholder="e.g. Retail"
            required
          />
        </Field>
        <SelectField
          label="Award category"
          required
          done={filled(payload.subcategory)}
          value={payload.subcategory}
          onValueChange={(value) => onChange('subcategory', value)}
          options={config.subcategories.map((item) => ({ value: item.name, label: item.name }))}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MultiSelectField
          label="Charter pillar"
          required
          done={payload.charter_pillars.length > 0}
          hint="Select every pillar this recognition touches on — most awards need just one, but pick more if it applies."
          values={payload.charter_pillars}
          onValuesChange={(values) => onChange('charter_pillars', values)}
          options={config.pillars.map((item) => ({ value: item.name, label: item.name }))}
        />
        <MultiSelectField
          label="Company value"
          required
          done={payload.company_values.length > 0}
          hint="Select every company value this recognition touches on."
          values={payload.company_values}
          onValuesChange={(values) => onChange('company_values', values)}
          options={config.values.map((item) => ({ value: item.name, label: item.name }))}
        />
      </div>

      <div className="mt-6 rounded-card border border-gold/15 bg-gold/[0.05] p-4 md:p-5">
        <div className="flex items-center gap-1.5">
          <p className="font-label text-[10px] font-bold uppercase tracking-[2.4px] text-gold">
            The story
          </p>
          {filled(payload.story) && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-label="Story completed" />
          )}
        </div>
        <h3 className="mt-1 font-display text-xl font-bold text-white">
          What did they do? <span className="text-gold/70">*</span>
        </h3>
        <p className="mb-3 mt-1 text-sm leading-relaxed text-white/45">
          This exact text goes into the email and onto the Wall of Fame.
          Write it the way you want everyone in the company to read it.
        </p>
        <Textarea
          value={payload.story}
          onChange={(event) => onChange('story', event.target.value)}
          required
          rows={8}
          placeholder="Example: Marie stayed late to help a customer resolve a billing issue, then followed up personally the next day to make sure everything was working."
        />
      </div>
    </>
  )
}

export function EmailPreviewFrame({
  preview,
  title,
  height = 460,
  badge,
}: {
  preview: EmailPreviewResponse
  title: string
  height?: number
  badge?: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-card border border-white/[0.08] bg-white shadow-xl shadow-black/25">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="truncate text-sm font-semibold text-slate-900">{preview.subject}</p>
        {badge}
      </div>
      <iframe title={title} srcDoc={preview.html} className="w-full bg-white" style={{ height }} />
    </div>
  )
}

export function LiveBadge({ isRendering }: { isRendering: boolean }) {
  return (
    <Badge variant="success" className="shrink-0">
      <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${isRendering ? 'animate-pulseDot' : ''}`} />
      {isRendering ? 'Updating...' : 'Up to date'}
    </Badge>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-btn border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
      {message}
    </p>
  )
}

export const awardTypeLabel = (awardType: string) => awardType.replace(/_/g, ' ')
