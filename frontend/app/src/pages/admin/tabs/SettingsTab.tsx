import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Mail, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useStaggerReveal } from '../../../lib/animations'
import {
  createEmailRecipient,
  deleteEmailRecipient,
  fetchEmailRecipients,
  toggleEmailRecipient,
  type EmailRecipient,
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
import { Field, Spinner, type AdminTabProps } from '../shared'

export default function SettingsTab({ isSignedIn, getAccessToken }: AdminTabProps) {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await getAccessToken()
      setRecipients(await fetchEmailRecipients(token))
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (!isSignedIn) return
    void refresh().catch(() =>
      toast.error('Could not load the recipients list', { description: 'Refresh the page to try again.' }),
    )
  }, [isSignedIn, refresh])

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAdding(true)

    try {
      const token = await getAccessToken()
      await createEmailRecipient({ email, name: name || null, active: true }, token)
      setEmail('')
      setName('')
      await refresh()
      toast.success('Recipient added', {
        description: `${email} will now receive every award email.`,
      })
    } catch (err) {
      toast.error('Could not add this recipient', {
        description: err instanceof Error ? err.message : 'Please check the email address and try again.',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggle = async (recipient: EmailRecipient) => {
    setBusyId(recipient.id)

    try {
      const token = await getAccessToken()
      await toggleEmailRecipient(recipient.id, token)
      await refresh()
      toast.success(recipient.active ? 'Recipient paused' : 'Recipient switched on', {
        description: recipient.active
          ? `${recipient.email} will not receive emails until switched back on.`
          : `${recipient.email} will receive award emails again.`,
      })
    } catch (err) {
      toast.error('Could not update this recipient', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (recipient: EmailRecipient) => {
    setBusyId(recipient.id)

    try {
      const token = await getAccessToken()
      await deleteEmailRecipient(recipient.id, token)
      await refresh()
      toast.success('Recipient removed', {
        description: `${recipient.email} has been taken off the list.`,
      })
    } catch (err) {
      toast.error('Could not remove this recipient', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = recipients.filter((recipient) => recipient.active).length
  const listRef = useStaggerReveal<HTMLDivElement>('[data-recipient-row]', [recipients])

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className="space-y-6 lg:sticky lg:top-6">
        <Card className="border-gold/15 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.10),transparent_38%)]">
          <CardHeader>
            <CardEyebrow>Recipients</CardEyebrow>
            <CardTitle>Add Someone</CardTitle>
            <CardDescription>
              Everyone on this list with the switch turned on receives the award and Golden
              Ticket emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4">
              <Field label="Email address" required done={Boolean(email.trim())}>
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  placeholder="e.g. pc-team@cwseychelles.com"
                />
              </Field>
              <Field label="Name" done={Boolean(name.trim())}>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="So you know who this is (optional)"
                />
              </Field>
              <Button type="submit" disabled={!isSignedIn || isAdding}>
                {isAdding ? <Spinner /> : <UserPlus className="h-4 w-4" />}
                {isAdding ? 'Adding...' : 'Add To The List'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="font-display text-3xl font-bold text-gold">{activeCount}</p>
              <p className="mt-1 font-label text-[10px] font-bold uppercase tracking-wider text-white/35">
                Receiving emails
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="font-display text-3xl font-bold text-white">{recipients.length}</p>
              <p className="mt-1 font-label text-[10px] font-bold uppercase tracking-wider text-white/35">
                On the list
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardEyebrow>The list</CardEyebrow>
          <CardTitle>Who Gets The Emails</CardTitle>
          <CardDescription>
            Use the switch to pause someone without removing them. The bin removes them
            completely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5" ref={listRef}>
            {isLoading && recipients.length === 0 && (
              <div className="flex items-center justify-center gap-2 rounded-card border border-white/[0.05] bg-deep/35 p-6 text-sm text-white/40">
                <Spinner /> Loading the list...
              </div>
            )}
            {!isLoading && recipients.length === 0 && (
              <div className="rounded-card border border-dashed border-white/[0.09] bg-deep/35 p-8 text-center">
                <Mail className="mx-auto h-8 w-8 text-gold/50" />
                <p className="mt-3 text-sm text-white/40">
                  Nobody is on the list yet. Add the first recipient on the left — emails cannot
                  be sent until at least one person is on the list.
                </p>
              </div>
            )}
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                data-recipient-row
                className="flex items-center justify-between gap-4 rounded-card border border-white/[0.08] bg-deep/35 p-4 transition hover:border-white/[0.16]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{recipient.email}</p>
                  <p className="truncate text-xs text-white/40">
                    {recipient.name || 'No name given'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {busyId === recipient.id && <Spinner className="h-3.5 w-3.5" />}
                  <Badge variant={recipient.active ? 'success' : 'muted'}>
                    {recipient.active ? 'Receiving' : 'Paused'}
                  </Badge>
                  <Switch
                    checked={recipient.active}
                    onCheckedChange={() => void handleToggle(recipient)}
                    disabled={busyId !== null}
                    aria-label={`Turn emails ${recipient.active ? 'off' : 'on'} for ${recipient.email}`}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => void handleDelete(recipient)}
                    disabled={busyId !== null}
                    aria-label={`Remove ${recipient.email} from the list`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
