import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Eraser, Eye, PenLine, Save, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { popIn, useStaggerReveal } from '../../../lib/animations'
import {
  createWinner,
  fetchAwardEmailPreview,
  sendAwardEmail,
  type WinnerAdmin,
  type WinnerCreatePayload,
} from '../../../api/admin'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import {
  EmailPreviewFrame,
  ErrorNote,
  LiveBadge,
  Spinner,
  emptyPayload,
  missingFields,
  useAwardConfig,
  useLivePreview,
  withConfigDefaults,
  WinnerFormFields,
  type AdminTabProps,
} from '../shared'

type StepState = 'done' | 'current' | 'waiting'

function StepIndicator({ steps }: { steps: { label: string; hint: string; icon: JSX.Element; state: StepState }[] }) {
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([])
  const prevStates = useRef<StepState[]>([])
  const statesKey = steps.map((step) => step.state).join('|')

  useEffect(() => {
    steps.forEach((step, index) => {
      if (step.state === 'done' && prevStates.current[index] !== 'done') {
        popIn(circleRefs.current[index])
      }
    })
    prevStates.current = steps.map((step) => step.state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statesKey])

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={`flex items-center gap-3 rounded-card border p-3.5 transition ${
            step.state === 'current'
              ? 'border-gold/40 bg-gold/[0.07] shadow-lg shadow-gold/10'
              : step.state === 'done'
                ? 'border-emerald-400/20 bg-emerald-400/[0.05]'
                : 'border-white/[0.05] bg-white/[0.02]'
          }`}
        >
          <span
            ref={(el) => { circleRefs.current[index] = el }}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-label text-sm font-bold ${
              step.state === 'done'
                ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
                : step.state === 'current'
                  ? 'border-gold/40 bg-gold/15 text-gold'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/35'
            }`}
            aria-hidden="true"
          >
            {step.state === 'done' ? <Check className="h-4 w-4" /> : index + 1}
          </span>
          <div className="min-w-0">
            <p
              className={`truncate font-label text-xs font-bold uppercase tracking-wide ${
                step.state === 'waiting' ? 'text-white/40' : 'text-white'
              }`}
            >
              {step.label}
            </p>
            <p className="truncate text-[11px] text-white/40">{step.hint}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WinnerEntryTab({ isSignedIn, getAccessToken }: AdminTabProps) {
  const [payload, setPayload] = useState<WinnerCreatePayload>(emptyPayload)
  const config = useAwardConfig(payload.award_type)
  const [savedWinner, setSavedWinner] = useState<WinnerAdmin | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [hasSent, setHasSent] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const { preview, setPreview, isRendering, isReady } = useLivePreview(payload, isSignedIn, getAccessToken)
  const missing = missingFields(payload)
  const revealRef = useStaggerReveal<HTMLDivElement>('[data-reveal]', [])

  useEffect(() => {
    setPayload((current) => withConfigDefaults(current, config))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.pillars, config.values, config.subcategories])

  const updateField = <K extends keyof WinnerCreatePayload>(key: K, value: WinnerCreatePayload[K]) => {
    setPayload((current) => ({ ...current, [key]: value }))
    if (savedWinner) setIsDirty(true)
  }

  const handleClear = () => {
    setPayload(emptyPayload())
    setPreview(null)
    setSavedWinner(null)
    setIsDirty(false)
    setHasSent(false)
    toast('Form cleared', { description: 'You can start entering a new winner.' })
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const token = await getAccessToken()
      const saved = await createWinner(payload, token)
      const renderedPreview = await fetchAwardEmailPreview(saved.id, token)
      setSavedWinner(saved)
      setPreview(renderedPreview)
      setIsDirty(false)
      setHasSent(false)
      toast.success('Winner saved', {
        description: `${saved.first_name} ${saved.last_name} is now on the Wall of Fame. You can send the email whenever you are ready.`,
      })
    } catch (err) {
      toast.error('Could not save the winner', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!savedWinner) return
    setIsSending(true)

    try {
      const token = await getAccessToken()
      const result = await sendAwardEmail(savedWinner.id, token)
      setHasSent(true)
      toast.success('Email sent', {
        description: `Sent to ${result.recipients.length} ${result.recipients.length === 1 ? 'person' : 'people'} on the recipients list.`,
      })
    } catch (err) {
      toast.error('Could not send the email', {
        description: err instanceof Error ? err.message : 'Check the Recipients tab, then try again.',
      })
    } finally {
      setIsSending(false)
    }
  }

  const canSend = Boolean(savedWinner) && !isDirty && !isSending

  const steps: { label: string; hint: string; icon: JSX.Element; state: StepState }[] = (() => {
    const detailsDone = missing.length === 0
    const previewDone = detailsDone && Boolean(preview)
    const saveDone = Boolean(savedWinner) && !isDirty
    const sendDone = hasSent && saveDone

    const states: StepState[] = [
      detailsDone ? 'done' : 'current',
      previewDone ? 'done' : detailsDone ? 'current' : 'waiting',
      saveDone ? 'done' : previewDone ? 'current' : 'waiting',
      sendDone ? 'done' : saveDone ? 'current' : 'waiting',
    ]

    return [
      { label: 'Fill in the details', hint: detailsDone ? 'All done' : `${missing.length} field${missing.length === 1 ? '' : 's'} left`, icon: <PenLine />, state: states[0] },
      { label: 'Check the preview', hint: previewDone ? 'Looks good?' : 'Appears on the right', icon: <Eye />, state: states[1] },
      { label: 'Save the winner', hint: saveDone ? `Saved as #${savedWinner?.id}` : isDirty ? 'You changed something — save again' : 'Adds them to the Wall of Fame', icon: <Save />, state: states[2] },
      { label: 'Send the email', hint: sendDone ? 'Sent' : 'Goes to the recipients list', icon: <Send />, state: states[3] },
    ]
  })()

  return (
    <div className="space-y-6" ref={revealRef}>
      <div data-reveal>
        <StepIndicator steps={steps} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <form onSubmit={handleSave} data-reveal>
          <Card>
            <CardHeader>
              <CardEyebrow>Step 1 · The winner</CardEyebrow>
              <CardTitle className="text-3xl">Who won, and why?</CardTitle>
              <CardDescription>
                Fill in every field marked with a star (*). A green tick appears next to each
                field once it is filled in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WinnerFormFields payload={payload} onChange={updateField} config={config} />
            </CardContent>
            <CardFooter className="flex-wrap border-t border-white/[0.05] pt-5">
              <Button type="submit" size="lg" disabled={!isSignedIn || isSaving || missing.length > 0}>
                {isSaving ? <Spinner /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : isDirty ? 'Save Again' : 'Save Winner'}
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={handleClear}>
                <Eraser className="h-4 w-4" />
                Start Over
              </Button>
              {missing.length > 0 && (
                <span className="text-xs text-white/40">
                  Save unlocks when every starred field is filled in.
                </span>
              )}
              {savedWinner && !isDirty && <Badge variant="success"><Check className="h-3 w-3" /> Saved as record #{savedWinner.id}</Badge>}
              {savedWinner && isDirty && <Badge>Changes not saved yet</Badge>}
            </CardFooter>
            {config.configError && (
              <div className="px-5 pb-5 md:px-6 md:pb-6">
                <ErrorNote message={config.configError} />
              </div>
            )}
          </Card>
        </form>

        <div className="space-y-6 xl:sticky xl:top-6" data-reveal>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardEyebrow>Step 2 · The email</CardEyebrow>
                  <CardTitle className="text-3xl">Email Preview</CardTitle>
                </div>
                {preview && <LiveBadge isRendering={isRendering} />}
              </div>
              <CardDescription>
                {savedWinner && !isDirty
                  ? 'This is exactly what will be sent.'
                  : 'This preview updates by itself a moment after you stop typing. Nothing is saved or sent yet.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-4">
                  <EmailPreviewFrame preview={preview} title="Award email preview" />
                  <Button className="w-full" size="lg" onClick={handleSend} disabled={!canSend}>
                    {isSending ? <Spinner /> : <Send className="h-4 w-4" />}
                    {isSending ? 'Sending...' : hasSent ? 'Send Again' : 'Send The Email'}
                  </Button>
                  {!savedWinner && (
                    <p className="text-center text-xs leading-relaxed text-white/40">
                      Save the winner first (Step 3) — then this button unlocks.
                    </p>
                  )}
                  {savedWinner && isDirty && (
                    <p className="text-center text-xs leading-relaxed text-gold-soft/80">
                      You changed something after saving. Press &ldquo;Save Again&rdquo; so the email
                      matches what you see here.
                    </p>
                  )}
                  {hasSent && !isDirty && (
                    <p className="text-center text-xs leading-relaxed text-emerald-300/80">
                      <Check className="mr-1 inline h-3 w-3" />
                      Email sent. You can send it again if needed.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-card border border-dashed border-white/[0.09] bg-deep/35 p-8 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-gold/50" />
                  <p className="mt-3 font-display text-2xl font-bold text-white/70">
                    {isReady ? 'Building your preview...' : 'Your email will appear here'}
                  </p>
                  {missing.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm text-white/45">Still to fill in:</p>
                      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                        {missing.map((field) => (
                          <Badge key={field} variant="outline">{field}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-white/45">
                      One moment — the designed email is being prepared.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
