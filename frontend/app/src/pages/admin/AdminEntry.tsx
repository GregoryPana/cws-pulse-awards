import { type CSSProperties, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { archiveWinner, createEmailRecipient, createWinner, deleteEmailRecipient, fetchAdminWinners, fetchAwardEmailPreview, fetchEmailRecipients, sendAwardEmail, toggleEmailRecipient, updateWinner, type EmailPreviewResponse, type EmailRecipient, type WinnerAdmin, type WinnerCreatePayload } from '../../api/admin'
import { fetchPillars, fetchSubcategories, fetchValues, type CompanyValue, type Pillar, type Subcategory } from '../../api/config'
import AnimatedBackground from '../../components/shared/AnimatedBackground'
import CwsLogoMark from '../../components/shared/CwsLogoMark'
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
const awardPeriods = years.flatMap((year) => MONTHS_SHORT.map((month) => `${month} ${year}`))
const controlClass = 'rounded-btn border border-white/8 bg-[#0B1C30] px-3 py-2.5 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-white/35 [color-scheme:dark] hover:border-white/15 focus:border-gold focus:ring-4 focus:ring-gold/15'
const selectClass = `${controlClass} !bg-[#0B1C30] text-white appearance-none`
const optionClass = 'bg-[#0B1C30] text-white'
const darkControlStyle: CSSProperties = { backgroundColor: '#0B1C30', color: '#fff' }

const payloadFromWinner = (winner: WinnerAdmin): WinnerCreatePayload => ({
  award_type: winner.award_type as WinnerCreatePayload['award_type'],
  first_name: winner.first_name,
  last_name: winner.last_name,
  job_title: winner.job_title,
  department: winner.department,
  subcategory: winner.subcategory,
  charter_pillar: winner.charter_pillar,
  company_value: winner.company_value,
  story: winner.story,
  nominated_by: winner.nominated_by,
  award_month: winner.award_month,
  award_year: winner.award_year,
  photo_url: winner.photo_url,
  status: winner.status as WinnerCreatePayload['status'],
})

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
        className={controlClass}
      />
    </label>
  )
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-4 border-b border-white/6 pb-3">
      <p className="font-label text-[10px] font-bold uppercase tracking-[2.4px] text-gold">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-white/45">{text}</p>
    </div>
  )
}

export default function AdminEntry() {
  const { isSignedIn, isDevAuthEnabled, signIn, getAccessToken, account } = useAuth()
  const [payload, setPayload] = useState<WinnerCreatePayload>(emptyPayload)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [values, setValues] = useState<CompanyValue[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [recentWinners, setRecentWinners] = useState<WinnerAdmin[]>([])
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null)
  const [savedWinner, setSavedWinner] = useState<WinnerAdmin | null>(null)
  const [editingWinnerId, setEditingWinnerId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRecipientBusy, setIsRecipientBusy] = useState(false)

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
      .then(async (token) => {
        const [winnerData, recipientData] = await Promise.all([
          fetchAdminWinners(token, { year: payload.award_year }),
          fetchEmailRecipients(token),
        ])
        setRecentWinners(winnerData.winners.slice(0, 5))
        setRecipients(recipientData)
      })
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
      const saved = editingWinnerId
        ? await updateWinner(editingWinnerId, payload, token)
        : await createWinner(payload, token)
      const renderedPreview = await fetchAwardEmailPreview(saved.id, token)
      const latest = await fetchAdminWinners(token, { year: payload.award_year })

      setSavedWinner(saved)
      setPreview(renderedPreview)
      setRecentWinners(latest.winners.slice(0, 5))
      setEditingWinnerId(saved.id)
      setStatusMessage(
        editingWinnerId
          ? 'Winner updated. Email preview refreshed from the database record.'
          : 'Winner saved. Email preview rendered from the database record.',
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save winner'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditWinner = async (winner: WinnerAdmin) => {
    setError(null)
    setStatusMessage(null)
    setPreview(null)
    setSavedWinner(winner)
    setEditingWinnerId(winner.id)
    setPayload(payloadFromWinner(winner))

    try {
      const token = await getAccessToken()
      const renderedPreview = await fetchAwardEmailPreview(winner.id, token)
      setPreview(renderedPreview)
      setStatusMessage(`Editing record #${winner.id}. Save changes to refresh the record.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load winner preview'
      setError(message)
    }
  }

  const handleArchiveWinner = async (winnerId: number) => {
    setError(null)
    setStatusMessage(null)

    try {
      const token = await getAccessToken()
      const archived = await archiveWinner(winnerId, token)
      const latest = await fetchAdminWinners(token, { year: payload.award_year })
      setRecentWinners(latest.winners.slice(0, 5))
      if (editingWinnerId === winnerId || savedWinner?.id === winnerId) {
        setPayload(payloadFromWinner(archived))
        setSavedWinner(archived)
        setEditingWinnerId(archived.id)
        setPreview(null)
      }
      setStatusMessage(`Record #${winnerId} archived.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive winner'
      setError(message)
    }
  }

  const handleSendEmail = async () => {
    if (!savedWinner) return
    setError(null)
    setStatusMessage(null)
    setIsSending(true)

    try {
      const token = await getAccessToken()
      const result = await sendAwardEmail(savedWinner.id, token)
      setStatusMessage(
        `Email sent to ${result.recipients.length} recipient${result.recipients.length === 1 ? '' : 's'}.`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send email'
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  const refreshRecipients = async () => {
    const token = await getAccessToken()
    const recipientData = await fetchEmailRecipients(token)
    setRecipients(recipientData)
  }

  const handleAddRecipient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatusMessage(null)
    setIsRecipientBusy(true)

    try {
      const token = await getAccessToken()
      await createEmailRecipient(
        { email: recipientEmail, name: recipientName || null, active: true },
        token,
      )
      setRecipientEmail('')
      setRecipientName('')
      await refreshRecipients()
      setStatusMessage('Recipient added.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add recipient'
      setError(message)
    } finally {
      setIsRecipientBusy(false)
    }
  }

  const handleToggleRecipient = async (recipientId: number) => {
    setError(null)
    setStatusMessage(null)
    setIsRecipientBusy(true)

    try {
      const token = await getAccessToken()
      await toggleEmailRecipient(recipientId, token)
      await refreshRecipients()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle recipient'
      setError(message)
    } finally {
      setIsRecipientBusy(false)
    }
  }

  const handleDeleteRecipient = async (recipientId: number) => {
    setError(null)
    setStatusMessage(null)
    setIsRecipientBusy(true)

    try {
      const token = await getAccessToken()
      await deleteEmailRecipient(recipientId, token)
      await refreshRecipients()
      setStatusMessage('Recipient deleted.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete recipient'
      setError(message)
    } finally {
      setIsRecipientBusy(false)
    }
  }

  const activeRecipientCount = recipients.filter((recipient) => recipient.active).length
  const workflowSteps = [
    { label: 'Configure', value: payload.award_type.replace('_', ' ') },
    { label: 'Save', value: savedWinner ? `Record #${savedWinner.id}` : 'Draft' },
    { label: 'Preview', value: preview ? 'Rendered' : 'Pending' },
    { label: 'Recipients', value: `${activeRecipientCount} active` },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep text-white">
      <AnimatedBackground variant="gold" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <main className="relative z-10 mx-auto max-w-[1240px] px-5 py-8 md:px-8">
        <header className="mb-7 overflow-hidden rounded-card border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(244,196,48,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <CwsLogoMark variant="gold" size="lg" />
            <span className="hidden rounded-badge border border-gold/20 bg-gold/10 px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[2px] text-gold-soft sm:inline-flex">
              Admin Portal
            </span>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[3.5px] text-gold">
                Admin MVP Cockpit
              </p>
              <h1 className="mt-3 max-w-3xl font-display text-5xl font-black leading-[0.9] md:text-7xl">
                Winner Entry <span className="block text-gold">& Email Preview</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
                Enter a vetted winner, save the record, inspect the designed email, then send it to the active recognition distribution list.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/charter-champions" className="rounded-btn border border-white/8 bg-white/5 px-4 py-2 font-label text-xs font-semibold uppercase tracking-wide text-white/65 transition hover:border-gold/30 hover:text-white">
                Hall of Fame
              </Link>
              {!isSignedIn && (
                <button type="button" onClick={signIn} className="rounded-btn bg-gradient-to-r from-amber to-gold px-4 py-2 font-label text-xs font-bold uppercase tracking-wide text-navy shadow-lg shadow-gold/25 transition hover:scale-[1.01]">
                  Sign in
                </button>
              )}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div key={step.label} className="rounded-card border border-white/6 bg-deep/45 p-4 shadow-inner shadow-white/5">
                <p className="font-label text-[10px] font-bold uppercase tracking-[2px] text-white/35">0{index + 1} / {step.label}</p>
                <p className="mt-2 truncate font-display text-xl font-bold text-white">{step.value}</p>
              </div>
            ))}
          </div>
        </header>

        {!isMsalConfigured() && !isDevAuthEnabled && (
          <div className="mb-6 rounded-card border border-amber/30 bg-amber/10 p-4 text-sm text-gold-soft">
            Entra frontend variables are not configured yet. Set VITE_ENTRA_CLIENT_ID, VITE_ENTRA_AUTHORITY, VITE_ENTRA_API_SCOPE, and VITE_APP_URL to use the admin MVP.
          </div>
        )}

        {isDevAuthEnabled && (
          <div className="mb-6 rounded-card border border-sky/30 bg-sky/10 p-4 text-sm text-sky">
            Local dev auth is enabled. Admin API calls use the fixed test token and bypass MSAL only for this build.
          </div>
        )}

        {account && (
          <p className="mb-6 rounded-badge border border-gold/20 bg-gold/10 px-4 py-2 text-sm text-gold-soft">
            Signed in as {account.username || account.name || 'admin'}
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <form onSubmit={handleSave} className="rounded-card border border-white/7 bg-gradient-to-br from-white/8 to-white/[0.025] p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-7">
            <SectionTitle eyebrow="Winner Record" title="Recognition Details" text="Capture the publish-ready details that power the Hall of Fame listing and the award email template." />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Award type *</span>
                <select
                  value={payload.award_type}
                  onChange={(event) => updatePayload('award_type', event.target.value as WinnerCreatePayload['award_type'])}
                  className={selectClass}
                  style={darkControlStyle}
                >
                  <option className={optionClass} style={darkControlStyle} value="CHARTER_CHAMPION">Charter Champion</option>
                  <option className={optionClass} style={darkControlStyle} value="INSTANT_IMPACT">Instant Impact</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Award period *</span>
                <select
                  value={payload.award_month}
                  onChange={(event) => {
                    const period = event.target.value
                    const year = Number(period.slice(-4))
                    updatePayload('award_year', year)
                    updatePayload('award_month', period)
                  }}
                  className={selectClass}
                  style={darkControlStyle}
                >
                  {awardPeriods.map((period) => <option className={optionClass} style={darkControlStyle} key={period} value={period}>{period}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Status *</span>
                <select
                  required
                  value={payload.status || 'PUBLISHED'}
                  onChange={(event) => updatePayload('status', event.target.value as WinnerCreatePayload['status'])}
                  className={selectClass}
                  style={darkControlStyle}
                >
                  <option className={optionClass} style={darkControlStyle} value="PUBLISHED">Published</option>
                  <option className={optionClass} style={darkControlStyle} value="ARCHIVED">Archived</option>
                  <option className={optionClass} style={darkControlStyle} value="REMOVED">Removed</option>
                </select>
              </label>

              <TextField label="First name" required value={payload.first_name} onChange={(value) => updatePayload('first_name', value)} />
              <TextField label="Last name" required value={payload.last_name} onChange={(value) => updatePayload('last_name', value)} />
              <TextField label="Job title" required value={payload.job_title} onChange={(value) => updatePayload('job_title', value)} />
              <TextField label="Department" required value={payload.department} onChange={(value) => updatePayload('department', value)} />

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Subcategory *</span>
                <select required value={payload.subcategory} onChange={(event) => updatePayload('subcategory', event.target.value)} className={selectClass} style={darkControlStyle}>
                  {subcategories.map((item) => <option className={optionClass} style={darkControlStyle} key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Charter pillar *</span>
                <select required value={payload.charter_pillar} onChange={(event) => updatePayload('charter_pillar', event.target.value)} className={selectClass} style={darkControlStyle}>
                  {pillars.map((item) => <option className={optionClass} style={darkControlStyle} key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Company value *</span>
                <select required value={payload.company_value} onChange={(event) => updatePayload('company_value', event.target.value)} className={selectClass} style={darkControlStyle}>
                  {values.map((item) => <option className={optionClass} style={darkControlStyle} key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>

              <TextField label="Nominated by" value={payload.nominated_by || ''} onChange={(value) => updatePayload('nominated_by', value)} placeholder="Optional" />
            </div>

            <div className="mt-7 rounded-card border border-gold/15 bg-gold/8 p-4">
              <SectionTitle eyebrow="Email Copy" title="Recognition Story" text="This message appears inside the designed email, so write it exactly as colleagues should read it." />
              <label className="flex flex-col gap-1.5">
                <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-white/60">Comments / story / message *</span>
                <textarea
                  value={payload.story}
                  onChange={(event) => updatePayload('story', event.target.value)}
                  required
                  rows={8}
                  className={`${controlClass} leading-relaxed`}
                  placeholder="Write the recognition story exactly as it should appear in the email preview."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/6 pt-5">
              <button disabled={!isSignedIn || isSaving} className="rounded-btn bg-gradient-to-r from-amber to-gold px-5 py-3 font-label text-sm font-bold uppercase tracking-wide text-navy shadow-lg shadow-gold/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                {isSaving ? 'Saving...' : editingWinnerId ? 'Update & Preview Email' : 'Save & Preview Email'}
              </button>
              <button type="button" onClick={() => { setPayload(emptyPayload()); setPreview(null); setSavedWinner(null); setEditingWinnerId(null); setStatusMessage(null); setError(null) }} className="rounded-btn border border-white/8 bg-white/5 px-5 py-3 font-label text-sm font-semibold uppercase tracking-wide text-white/60 transition hover:border-white/15 hover:text-white">
                {editingWinnerId ? 'New Record' : 'Clear'}
              </button>
            </div>

            {statusMessage && <p className="mt-4 rounded-btn border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{statusMessage}</p>}
            {error && <p className="mt-4 rounded-btn border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          </form>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-card border border-gold/15 bg-[radial-gradient(circle_at_top_right,rgba(244,196,48,0.15),transparent_34%),rgba(244,196,48,0.07)] p-5 shadow-2xl shadow-black/25">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-[2.4px] text-gold">Distribution</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">Email Recipients</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Active recipients receive award emails when you press send.
                  </p>
                </div>
                <div className="rounded-card border border-white/6 bg-deep/45 px-4 py-3 text-center">
                  <p className="font-display text-2xl font-bold text-gold">{activeRecipientCount}</p>
                  <p className="font-label text-[9px] font-bold uppercase tracking-wider text-white/35">Active</p>
                </div>
              </div>

              <form onSubmit={handleAddRecipient} className="mt-4 grid gap-3">
                <input
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  required
                  type="email"
                  placeholder="pc-team@cwseychelles.com"
                  className={controlClass}
                />
                <input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Display name (optional)"
                  className={controlClass}
                />
                <button
                  disabled={!isSignedIn || isRecipientBusy}
                  className="rounded-btn border border-gold/30 bg-gold/15 px-4 py-2 font-label text-xs font-bold uppercase tracking-wide text-gold-soft transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRecipientBusy ? 'Working...' : 'Add Recipient'}
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {recipients.length === 0 && <p className="text-sm text-white/35">No recipients configured.</p>}
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="rounded-btn border border-white/6 bg-deep/35 p-3 transition hover:border-white/15">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{recipient.email}</p>
                        <p className="text-xs text-white/40">{recipient.name || 'No display name'}</p>
                      </div>
                      <span className={`rounded-badge px-2 py-1 font-label text-[10px] font-bold uppercase tracking-wide ${recipient.active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-white/35'}`}>
                        {recipient.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleRecipient(recipient.id)}
                        disabled={isRecipientBusy}
                        className="rounded-btn border border-white/8 bg-white/5 px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-wide text-white/60 transition hover:text-white disabled:opacity-50"
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRecipient(recipient.id)}
                        disabled={isRecipientBusy}
                        className="rounded-btn border border-red-400/25 bg-red-400/10 px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-wide text-red-200 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-card border border-white/7 bg-white/5 p-5 shadow-2xl shadow-black/25 backdrop-blur">
              <p className="font-label text-[10px] font-bold uppercase tracking-[2.4px] text-gold">Review</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-white">Email Preview</h2>
              {savedWinner && <p className="mt-1 text-sm text-white/45">Saved record #{savedWinner.id}: {savedWinner.first_name} {savedWinner.last_name}</p>}
              {preview ? (
                <>
                  <div className="mt-4 overflow-hidden rounded-card border border-white/8 bg-white shadow-xl shadow-black/20">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">{preview.subject}</div>
                    <iframe title="Award email preview" srcDoc={preview.html} className="h-[420px] w-full bg-white" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={!savedWinner || isSending}
                    className="mt-4 w-full rounded-btn bg-gradient-to-r from-amber to-gold px-5 py-3 font-label text-sm font-bold uppercase tracking-wide text-navy shadow-lg shadow-gold/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSending ? 'Sending...' : 'Send Email To Active Recipients'}
                  </button>
                </>
              ) : (
                <div className="mt-4 rounded-card border border-dashed border-white/10 bg-deep/35 p-6 text-center">
                  <p className="font-display text-2xl font-bold text-white/70">Preview waiting</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">Save a winner to render the award email preview from the database record.</p>
                </div>
              )}
            </section>

            <section className="rounded-card border border-white/7 bg-white/5 p-5 shadow-xl shadow-black/15">
              <p className="font-label text-[10px] font-bold uppercase tracking-[2.4px] text-gold">Audit Trail</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">Recent Records</h2>
              <div className="mt-4 space-y-3">
                {recentWinners.length === 0 && <p className="text-sm text-white/35">No recent records loaded yet.</p>}
                {recentWinners.map((winner) => (
                  <div key={winner.id} className="rounded-btn border border-white/6 bg-deep/35 p-3 transition hover:border-gold/15">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-label text-xs font-bold uppercase tracking-wide text-gold">{winner.award_type.replace('_', ' ')}</p>
                        <p className="font-display text-xl font-bold text-white">{winner.first_name} {winner.last_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="rounded-badge bg-white/8 px-2 py-1 font-label text-[10px] font-bold uppercase tracking-wide text-white/40">#{winner.id}</span>
                        <span className={`rounded-badge px-2 py-1 font-label text-[9px] font-bold uppercase tracking-wide ${winner.status === 'PUBLISHED' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-white/35'}`}>
                          {winner.status}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-white/45">{winner.award_month} · {winner.subcategory}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleEditWinner(winner)}
                        className="rounded-btn border border-white/8 bg-white/5 px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-wide text-white/60 transition hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleArchiveWinner(winner.id)}
                        disabled={winner.status === 'ARCHIVED'}
                        className="rounded-btn border border-amber/25 bg-amber/10 px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-wide text-gold-soft transition hover:bg-amber/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Archive
                      </button>
                    </div>
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
