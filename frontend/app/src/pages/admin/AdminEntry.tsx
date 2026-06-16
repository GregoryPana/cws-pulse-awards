import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createWinner, fetchAdminWinners, fetchAwardEmailPreview, type EmailPreviewResponse, type WinnerAdmin, type WinnerCreatePayload } from '../../api/admin'
import { fetchPillars, fetchSubcategories, fetchValues, type CompanyValue, type Pillar, type Subcategory } from '../../api/config'
import AnimatedBackground from '../../components/shared/AnimatedBackground'
import { useAuth } from '../../hooks/useAuth'
import { isMsalConfigured } from '../../msalConfig'

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const emptyPayload = (): WinnerCreatePayload => {
  const now = new Date()
  return {
    award_type: 'CHARTER_CHAMPION',
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    subcategory: '',
    charter_pillar: '',
    company_value: '',
    story: '',
    nominated_by: '',
    award_month: `${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`,
    award_year: now.getFullYear(),
    status: 'PUBLISHED',
  }
}

const years = Array.from({ length: Math.max(new Date().getFullYear(), 2026) - 2026 + 1 }, (_, index) => Math.max(new Date().getFullYear(), 2026) - index)

function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">
        {label}{required ? ' *' : ''}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
      />
    </label>
  )
}

export default function AdminEntry() {
  const { isSignedIn, signIn, getAccessToken, account } = useAuth()
  const [payload, setPayload] = useState<WinnerCreatePayload>(emptyPayload)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [values, setValues] = useState<CompanyValue[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [recentWinners, setRecentWinners] = useState<WinnerAdmin[]>([])
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null)
  const [savedWinner, setSavedWinner] = useState<WinnerAdmin | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    void Promise.all([
      fetchPillars(),
      fetchValues(),
      fetchSubcategories(payload.award_type),
    ]).then(([loadedPillars, loadedValues, loadedSubcategories]) => {
      setPillars(loadedPillars)
      setValues(loadedValues)
      setSubcategories(loadedSubcategories)
      setPayload((current) => ({
        ...current,
        charter_pillar: current.charter_pillar || loadedPillars[0]?.name || '',
        company_value: current.company_value || loadedValues[0]?.name || '',
        subcategory: loadedSubcategories[0]?.name || '',
      }))
    }).catch((err: Error) => setError(err.message || 'Failed to load configuration'))
  }, [payload.award_type])

  useEffect(() => {
    if (!isSignedIn) return
    void getAccessToken()
      .then((token) => fetchAdminWinners(token, { year: payload.award_year }))
      .then((data) => setRecentWinners(data.winners.slice(0, 5)))
      .catch(() => undefined)
  }, [getAccessToken, isSignedIn, payload.award_year])

  const updatePayload = <K extends keyof WinnerCreatePayload>(key: K, value: WinnerCreatePayload[K]) => {
    setPayload((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatusMessage(null)
    setPreview(null)
    setIsSaving(true)

    try {
      const token = await getAccessToken()
      const saved = await createWinner(payload, token)
      const renderedPreview = await fetchAwardEmailPreview(saved.id, token)
      const latest = await fetchAdminWinners(token, { year: payload.award_year })

      setSavedWinner(saved)
      setPreview(renderedPreview)
      setRecentWinners(latest.winners.slice(0, 5))
      setStatusMessage('Winner saved. Email preview rendered from the database record.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save winner'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const months = MONTHS_SHORT.map((month) => `${month} ${payload.award_year}`)

  return (
    <div className="relative min-h-screen bg-deep text-white">
      <AnimatedBackground variant="gold" />
      <main className="relative z-10 mx-auto max-w-[1180px] px-5 py-8 md:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-[11px] font-semibold uppercase tracking-[3.5px] text-gold">
              Admin MVP
            </p>
            <h1 className="font-display text-5xl font-black leading-none md:text-6xl">
              Winner Entry <span className="text-gold">& Email Preview</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
              Enter a vetted winner, save the record, then preview the award email generated from the saved database entry.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/charter-champions" className="rounded-btn border border-white/12 bg-white/7 px-4 py-2 font-label text-xs font-semibold uppercase tracking-wide text-white/60 hover:text-white">
              Hall of Fame
            </Link>
            {!isSignedIn && (
              <button type="button" onClick={signIn} className="rounded-btn bg-gradient-to-r from-amber to-gold px-4 py-2 font-label text-xs font-bold uppercase tracking-wide text-navy shadow-lg shadow-gold/25">
                Sign in
              </button>
            )}
          </div>
        </header>

        {!isMsalConfigured() && (
          <div className="mb-6 rounded-card border border-amber/30 bg-amber/10 p-4 text-sm text-gold-soft">
            Entra frontend variables are not configured yet. Set VITE_ENTRA_CLIENT_ID, VITE_ENTRA_AUTHORITY, VITE_ENTRA_API_SCOPE, and VITE_APP_URL to use the admin MVP.
          </div>
        )}

        {account && (
          <p className="mb-6 rounded-badge border border-gold/20 bg-gold/10 px-4 py-2 text-sm text-gold-soft">
            Signed in as {account.username || account.name || 'admin'}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
          <form onSubmit={handleSave} className="rounded-card border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5 shadow-2xl shadow-black/25 md:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Award type *</span>
                <select
                  value={payload.award_type}
                  onChange={(event) => updatePayload('award_type', event.target.value as WinnerCreatePayload['award_type'])}
                  className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                >
                  <option className="bg-navy" value="CHARTER_CHAMPION">Charter Champion</option>
                  <option className="bg-navy" value="INSTANT_IMPACT">Instant Impact</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Award year *</span>
                <select
                  value={payload.award_year}
                  onChange={(event) => {
                    const year = Number(event.target.value)
                    updatePayload('award_year', year)
                    updatePayload('award_month', `${payload.award_month.slice(0, 3)} ${year}`)
                  }}
                  className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                >
                  {years.map((year) => <option className="bg-navy" key={year} value={year}>{year}</option>)}
                </select>
              </label>

              <TextField label="First name" required value={payload.first_name} onChange={(value) => updatePayload('first_name', value)} />
              <TextField label="Last name" required value={payload.last_name} onChange={(value) => updatePayload('last_name', value)} />
              <TextField label="Job title" required value={payload.job_title} onChange={(value) => updatePayload('job_title', value)} />
              <TextField label="Department" required value={payload.department} onChange={(value) => updatePayload('department', value)} />

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Subcategory *</span>
                <select required value={payload.subcategory} onChange={(event) => updatePayload('subcategory', event.target.value)} className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15">
                  {subcategories.map((item) => <option className="bg-navy" key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Month *</span>
                <select required value={payload.award_month} onChange={(event) => updatePayload('award_month', event.target.value)} className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15">
                  {months.map((month) => <option className="bg-navy" key={month} value={month}>{month}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Charter pillar *</span>
                <select required value={payload.charter_pillar} onChange={(event) => updatePayload('charter_pillar', event.target.value)} className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15">
                  {pillars.map((item) => <option className="bg-navy" key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Company value *</span>
                <select required value={payload.company_value} onChange={(event) => updatePayload('company_value', event.target.value)} className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15">
                  {values.map((item) => <option className="bg-navy" key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>

              <TextField label="Nominated by" value={payload.nominated_by || ''} onChange={(value) => updatePayload('nominated_by', value)} placeholder="Optional" />
            </div>

            <label className="mt-4 flex flex-col gap-1.5">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Comments / story / message *</span>
              <textarea
                value={payload.story}
                onChange={(event) => updatePayload('story', event.target.value)}
                required
                rows={8}
                className="rounded-btn border border-white/12 bg-white/7 px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/25 focus:border-gold focus:ring-4 focus:ring-gold/15"
                placeholder="Write the recognition story exactly as it should appear in the email preview."
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button disabled={!isSignedIn || isSaving} className="rounded-btn bg-gradient-to-r from-amber to-gold px-5 py-3 font-label text-sm font-bold uppercase tracking-wide text-navy shadow-lg shadow-gold/25 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save & Preview Email'}
              </button>
              <button type="button" onClick={() => { setPayload(emptyPayload()); setPreview(null); setSavedWinner(null); setStatusMessage(null); setError(null) }} className="rounded-btn border border-white/12 bg-white/7 px-5 py-3 font-label text-sm font-semibold uppercase tracking-wide text-white/60 hover:text-white">
                Clear
              </button>
            </div>

            {statusMessage && <p className="mt-4 rounded-btn border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{statusMessage}</p>}
            {error && <p className="mt-4 rounded-btn border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          </form>

          <aside className="space-y-6">
            <section className="rounded-card border border-gold/20 bg-gold/8 p-5">
              <h2 className="font-display text-3xl font-bold text-white">Email Preview</h2>
              {savedWinner && <p className="mt-1 text-sm text-white/45">Saved record #{savedWinner.id}: {savedWinner.first_name} {savedWinner.last_name}</p>}
              {preview ? (
                <div className="mt-4 overflow-hidden rounded-btn border border-white/12 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">{preview.subject}</div>
                  <iframe title="Award email preview" srcDoc={preview.html} className="h-[420px] w-full bg-white" />
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-white/45">Save a winner to render the award email preview from the database record.</p>
              )}
            </section>

            <section className="rounded-card border border-white/10 bg-white/6 p-5">
              <h2 className="font-display text-2xl font-bold text-white">Recent Records</h2>
              <div className="mt-4 space-y-3">
                {recentWinners.length === 0 && <p className="text-sm text-white/35">No recent records loaded yet.</p>}
                {recentWinners.map((winner) => (
                  <div key={winner.id} className="rounded-btn border border-white/10 bg-white/6 p-3">
                    <p className="font-label text-xs font-bold uppercase tracking-wide text-gold">{winner.award_type.replace('_', ' ')}</p>
                    <p className="font-display text-xl font-bold text-white">{winner.first_name} {winner.last_name}</p>
                    <p className="text-xs text-white/45">{winner.award_month} · {winner.subcategory}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
