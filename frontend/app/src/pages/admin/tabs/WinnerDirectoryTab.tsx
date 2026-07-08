import { useCallback, useEffect, useState } from 'react'
import { Archive, Check, RefreshCw, Save, Send, Ticket, Users } from 'lucide-react'
import { toast } from 'sonner'
import { usePanelTransition, useStaggerReveal } from '../../../lib/animations'
import {
  archiveWinner,
  fetchAdminWinners,
  fetchGoldenTicketEmailPreview,
  markGoldenTicket,
  sendAwardEmail,
  sendGoldenTicketEmail,
  updateWinner,
  type EmailPreviewResponse,
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
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Switch } from '../../../components/ui/switch'
import { Textarea } from '../../../components/ui/textarea'
import {
  EmailPreviewFrame,
  Field,
  LiveBadge,
  FULL_MONTHS,
  MONTHS_SHORT,
  SelectField,
  Spinner,
  awardTypeLabel,
  emptyPayload,
  payloadFromWinner,
  useAwardConfig,
  useLivePreview,
  withConfigDefaults,
  WinnerFormFields,
  years,
  type AdminTabProps,
} from '../shared'

type AwardTypeFilter = 'ALL' | WinnerCreatePayload['award_type']
type StatusFilter = 'ALL' | NonNullable<WinnerCreatePayload['status']>

export default function WinnerDirectoryTab({ isSignedIn, getAccessToken }: AdminTabProps) {
  const [awardTypeFilter, setAwardTypeFilter] = useState<AwardTypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [yearFilter, setYearFilter] = useState(Math.max(new Date().getFullYear(), 2026))
  const [periodFilter, setPeriodFilter] = useState('ALL')
  const [goldenOnly, setGoldenOnly] = useState(false)

  const [winners, setWinners] = useState<WinnerAdmin[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [selected, setSelected] = useState<WinnerAdmin | null>(null)
  const [editPayload, setEditPayload] = useState<WinnerCreatePayload | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [goldenOccasion, setGoldenOccasion] = useState('')
  const [goldenCeoMessage, setGoldenCeoMessage] = useState('')
  const [goldenPreview, setGoldenPreview] = useState<EmailPreviewResponse | null>(null)

  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isGoldenSaving, setIsGoldenSaving] = useState(false)
  const [isGoldenSending, setIsGoldenSending] = useState(false)

  const config = useAwardConfig(editPayload?.award_type ?? 'CHARTER_CHAMPION')
  const { preview, isRendering } = useLivePreview(
    editPayload ?? emptyPayload(),
    isSignedIn && editPayload !== null,
    getAccessToken,
  )

  const filterParams = useCallback(
    () => ({
      award_type: awardTypeFilter === 'ALL' ? undefined : awardTypeFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      month: periodFilter === 'ALL' ? undefined : `${periodFilter} ${yearFilter}`,
      year: yearFilter,
      golden_ticket: goldenOnly ? true : undefined,
    }),
    [awardTypeFilter, statusFilter, periodFilter, yearFilter, goldenOnly],
  )

  const refreshList = useCallback(async () => {
    setIsLoadingList(true)
    try {
      const token = await getAccessToken()
      const data = await fetchAdminWinners(token, filterParams())
      setWinners(data.winners)
      return data.winners
    } finally {
      setIsLoadingList(false)
    }
  }, [getAccessToken, filterParams])

  useEffect(() => {
    if (!isSignedIn) return
    void refreshList().catch(() =>
      toast.error('Could not load the winners list', { description: 'Refresh the page to try again.' }),
    )
  }, [isSignedIn, refreshList])

  useEffect(() => {
    setEditPayload((current) => (current ? withConfigDefaults(current, config) : current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.pillars, config.values, config.subcategories])

  const handleSelect = (winner: WinnerAdmin) => {
    setSelected(winner)
    setEditPayload(payloadFromWinner(winner))
    setIsDirty(false)
    setGoldenOccasion(winner.golden_ticket_occasion || '')
    setGoldenCeoMessage(winner.golden_ticket_ceo_message || '')
    setGoldenPreview(null)
  }

  const updateField = <K extends keyof WinnerCreatePayload>(key: K, value: WinnerCreatePayload[K]) => {
    setEditPayload((current) => (current ? { ...current, [key]: value } : current))
    setIsDirty(true)
  }

  const handleUpdate = async () => {
    if (!selected || !editPayload) return
    setIsSavingEdit(true)

    try {
      const token = await getAccessToken()
      const updated = await updateWinner(selected.id, editPayload, token)
      await refreshList()
      setSelected(updated)
      setEditPayload(payloadFromWinner(updated))
      setIsDirty(false)
      toast.success('Changes saved', {
        description: 'The Wall of Fame now shows the updated details.',
      })
    } catch (err) {
      toast.error('Could not save the changes', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleArchive = async () => {
    if (!selected) return
    setIsArchiving(true)

    try {
      const token = await getAccessToken()
      const archived = await archiveWinner(selected.id, token)
      await refreshList()
      setSelected(archived)
      setEditPayload(payloadFromWinner(archived))
      setIsDirty(false)
      toast.success('Winner archived', {
        description: `${archived.first_name} ${archived.last_name} is hidden from the Wall of Fame. You can publish them again from Visibility.`,
      })
    } catch (err) {
      toast.error('Could not archive this winner', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const handleResend = async () => {
    if (!selected) return
    setIsResending(true)

    try {
      const token = await getAccessToken()
      const result = await sendAwardEmail(selected.id, token)
      toast.success('Email sent', {
        description: `Sent to ${result.recipients.length} ${result.recipients.length === 1 ? 'person' : 'people'} on the recipients list.`,
      })
    } catch (err) {
      toast.error('Could not send the email', {
        description: err instanceof Error ? err.message : 'Check the Recipients tab, then try again.',
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleSaveGoldenTicket = async () => {
    if (!selected) return
    setIsGoldenSaving(true)

    try {
      const token = await getAccessToken()
      const updated = await markGoldenTicket(
        selected.id,
        { occasion_label: goldenOccasion, ceo_message: goldenCeoMessage },
        token,
      )
      const rendered = await fetchGoldenTicketEmailPreview(updated.id, token)
      await refreshList()
      setSelected(updated)
      setGoldenPreview(rendered)
      toast.success('Golden Ticket ready', {
        description: 'Check the letter below, then send it when you are happy with it.',
      })
    } catch (err) {
      toast.error('Could not prepare the Golden Ticket', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setIsGoldenSaving(false)
    }
  }

  const handleSendGoldenTicket = async () => {
    if (!selected) return
    setIsGoldenSending(true)

    try {
      const token = await getAccessToken()
      const result = await sendGoldenTicketEmail(selected.id, token)
      toast.success('Golden Ticket sent', {
        description: `Sent to ${result.recipients.length} ${result.recipients.length === 1 ? 'person' : 'people'} on the recipients list.`,
      })
    } catch (err) {
      toast.error('Could not send the Golden Ticket', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setIsGoldenSending(false)
    }
  }

  const anyBusy = isSavingEdit || isArchiving || isResending || isGoldenSaving || isGoldenSending
  const periodOptions = [
    { value: 'ALL', label: 'All months' },
    ...MONTHS_SHORT.map((month, index) => ({ value: month, label: FULL_MONTHS[index] })),
  ]
  const listRef = useStaggerReveal<HTMLDivElement>('[data-winner-item]', [winners])
  const detailRef = usePanelTransition<HTMLDivElement>(String(selected?.id ?? 'none'))

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField
                label="Award type"
                value={awardTypeFilter}
                onValueChange={(value) => setAwardTypeFilter(value as AwardTypeFilter)}
                options={[
                  { value: 'ALL', label: 'All award types' },
                  { value: 'CHARTER_CHAMPION', label: 'Charter Champion' },
                  { value: 'INSTANT_IMPACT', label: 'Instant Impact' },
                ]}
              />
              <SelectField
                label="Visibility"
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                options={[
                  { value: 'ALL', label: 'Everything' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'ARCHIVED', label: 'Archived' },
                  { value: 'REMOVED', label: 'Removed' },
                ]}
              />
              <SelectField
                label="Year"
                value={String(yearFilter)}
                onValueChange={(value) => setYearFilter(Number(value))}
                options={years.map((year) => ({ value: String(year), label: String(year) }))}
              />
              <SelectField
                label="Month"
                value={periodFilter}
                onValueChange={setPeriodFilter}
                options={periodOptions}
              />
            </div>
            <div className="flex items-center gap-4 pb-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/60">
                <Switch checked={goldenOnly} onCheckedChange={setGoldenOnly} />
                Golden Ticket only
              </label>
              <Badge variant="outline">
                {isLoadingList ? <Spinner className="h-3 w-3" /> : null}
                {winners.length} {winners.length === 1 ? 'winner' : 'winners'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardEyebrow>All winners</CardEyebrow>
            <CardTitle>Pick a winner</CardTitle>
            <CardDescription>
              Click a name to see and change their details on the right.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[640px] space-y-2.5 overflow-y-auto pr-1" ref={listRef}>
              {isLoadingList && winners.length === 0 && (
                <div className="flex items-center justify-center gap-2 rounded-card border border-white/[0.05] bg-deep/35 p-6 text-sm text-white/40">
                  <Spinner /> Loading winners...
                </div>
              )}
              {!isLoadingList && winners.length === 0 && (
                <p className="rounded-card border border-dashed border-white/[0.09] bg-deep/35 p-5 text-center text-sm text-white/40">
                  No winners match these filters. Try &ldquo;Everything&rdquo; under Visibility, or a
                  different month.
                </p>
              )}
              {winners.map((winner) => {
                const isActive = selected?.id === winner.id
                return (
                  <button
                    key={winner.id}
                    type="button"
                    data-winner-item
                    onClick={() => handleSelect(winner)}
                    aria-pressed={isActive}
                    className={`w-full rounded-card border p-3.5 text-left transition ${
                      isActive
                        ? 'border-gold/40 bg-gold/[0.08] shadow-lg shadow-gold/10'
                        : 'border-white/[0.08] bg-deep/35 hover:border-gold/25 hover:bg-deep/55'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-label text-[10px] font-bold uppercase tracking-wide text-gold">
                          {awardTypeLabel(winner.award_type)}
                        </p>
                        <p className="truncate font-display text-lg font-bold text-white">
                          {winner.first_name} {winner.last_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/40">
                          {winner.award_month} · {winner.subcategory}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={winner.status === 'PUBLISHED' ? 'success' : 'muted'}>
                          {winner.status === 'PUBLISHED' ? 'On the wall' : winner.status.toLowerCase()}
                        </Badge>
                        {winner.golden_ticket && (
                          <Badge>
                            <Ticket className="h-3 w-3" /> Golden
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div ref={detailRef}>
        {selected && editPayload ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardEyebrow>Record #{selected.id}</CardEyebrow>
                    <CardTitle className="text-3xl">
                      {selected.first_name} {selected.last_name}
                    </CardTitle>
                    <CardDescription>
                      Change anything below, then press &ldquo;Save Changes&rdquo;. The Wall of Fame
                      updates straight away.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleResend()}
                      disabled={anyBusy || selected.status !== 'PUBLISHED'}
                      title={selected.status !== 'PUBLISHED' ? 'Only published winners can receive emails' : undefined}
                    >
                      {isResending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                      Send Email Again
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleArchive()}
                      disabled={anyBusy || selected.status === 'ARCHIVED'}
                    >
                      {isArchiving ? <Spinner className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      Hide From Wall
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <WinnerFormFields payload={editPayload} onChange={updateField} config={config} />
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-5">
                  <Button onClick={() => void handleUpdate()} disabled={anyBusy || !isDirty} size="lg">
                    {isSavingEdit ? <Spinner /> : <Save className="h-4 w-4" />}
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                  {isDirty ? (
                    <Badge>Changes not saved yet</Badge>
                  ) : (
                    <Badge variant="success">
                      <Check className="h-3 w-3" /> All changes saved
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardEyebrow>The email</CardEyebrow>
                    <CardTitle>Email Preview</CardTitle>
                  </div>
                  {preview && <LiveBadge isRendering={isRendering} />}
                </div>
                <CardDescription>
                  This preview follows your edits above. Save your changes before pressing
                  &ldquo;Send Email Again&rdquo; so the sent email matches.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <EmailPreviewFrame preview={preview} title="Award email preview" height={420} />
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-card border border-dashed border-white/[0.09] bg-deep/35 p-6 text-sm text-white/40">
                    <Spinner /> Building the preview...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gold/15 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.10),transparent_38%)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardEyebrow>Optional · Golden Ticket</CardEyebrow>
                    <CardTitle>Send a Golden Ticket</CardTitle>
                    <CardDescription>
                      The Golden Ticket is a special personal letter from the CEO. Fill in both boxes,
                      press &ldquo;Prepare The Letter&rdquo; to see it, then send it.
                    </CardDescription>
                  </div>
                  {selected.golden_ticket && (
                    <Badge>
                      <Ticket className="h-3 w-3" />
                      Has a Golden Ticket
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="What is the occasion?" required done={Boolean(goldenOccasion.trim())}>
                  <Input
                    value={goldenOccasion}
                    onChange={(event) => setGoldenOccasion(event.target.value)}
                    placeholder="e.g. Quarter 3, 2026"
                  />
                </Field>
                <Field label="Personal message from the CEO" required done={Boolean(goldenCeoMessage.trim())}>
                  <Textarea
                    value={goldenCeoMessage}
                    onChange={(event) => setGoldenCeoMessage(event.target.value)}
                    rows={5}
                    placeholder="The closing paragraph of the letter, written in the CEO's voice."
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void handleSaveGoldenTicket()}
                    disabled={anyBusy || !goldenOccasion.trim() || !goldenCeoMessage.trim()}
                  >
                    {isGoldenSaving ? <Spinner /> : <Ticket className="h-4 w-4" />}
                    {isGoldenSaving ? 'Preparing...' : 'Prepare The Letter'}
                  </Button>
                  {(!goldenOccasion.trim() || !goldenCeoMessage.trim()) && (
                    <span className="text-xs text-white/40">
                      Fill in both boxes above to unlock this.
                    </span>
                  )}
                </div>

                {goldenPreview && (
                  <div className="space-y-4 pt-1">
                    <EmailPreviewFrame
                      preview={goldenPreview}
                      title="Golden Ticket email preview"
                      height={380}
                    />
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => void handleSendGoldenTicket()}
                      disabled={anyBusy}
                    >
                      {isGoldenSending ? <Spinner /> : <Send className="h-4 w-4" />}
                      {isGoldenSending ? 'Sending...' : 'Send The Golden Ticket'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center md:p-14">
              <Users className="mx-auto h-9 w-9 text-gold/50" />
              <p className="mt-4 font-display text-3xl font-bold text-white/70">
                Pick a winner from the list
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
                Once you pick someone you can change their details, send their email again,
                hide them from the Wall of Fame, or send them a Golden Ticket.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() =>
                  void refreshList().catch(() =>
                    toast.error('Could not load the winners list', {
                      description: 'Refresh the page to try again.',
                    }),
                  )
                }
                disabled={!isSignedIn || isLoadingList}
              >
                {isLoadingList ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
                Refresh The List
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}
