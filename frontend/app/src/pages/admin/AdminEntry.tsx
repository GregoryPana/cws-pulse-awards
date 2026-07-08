import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, PenLine, Users } from 'lucide-react'
import { Toaster } from 'sonner'
import { usePanelTransition } from '../../lib/animations'
import AnimatedBackground from '../../components/shared/AnimatedBackground'
import CwsLogoMark from '../../components/shared/CwsLogoMark'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useAuth } from '../../hooks/useAuth'
import { isMsalConfigured } from '../../msalConfig'
import SettingsTab from './tabs/SettingsTab'
import WinnerDirectoryTab from './tabs/WinnerDirectoryTab'
import WinnerEntryTab from './tabs/WinnerEntryTab'

const TAB_COPY = {
  entry: {
    eyebrow: 'Add a winner',
    title: 'Add a Winner',
    description:
      'Four simple steps: fill in the details, check the email preview, save, and send. The preview updates by itself while you type — nothing is sent until you press send.',
  },
  directory: {
    eyebrow: 'All winners',
    title: 'All Winners',
    description:
      'Everyone who has been saved, including everyone shown on the Wall of Fame. Pick a name to change their details, send their email again, hide them, or send a Golden Ticket.',
  },
  settings: {
    eyebrow: 'Recipients',
    title: 'Email Recipients',
    description:
      'The people who receive the award emails. Add someone, pause them with the switch, or remove them. This list is used every time an email is sent.',
  },
} as const

type TabId = keyof typeof TAB_COPY

export default function AdminEntry() {
  const { isSignedIn, isDevAuthEnabled, signIn, getAccessToken, account } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('entry')
  const copy = TAB_COPY[activeTab]
  const titleRef = usePanelTransition<HTMLDivElement>(activeTab)
  const panelRef = usePanelTransition<HTMLDivElement>(activeTab)

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep text-white">
      <AnimatedBackground variant="gold" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#0B1C30',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#fff',
          },
        }}
      />

      <main className="relative z-10 mx-auto max-w-[1320px] px-5 py-6 md:px-8">
        <div className="flex items-center justify-between gap-4 rounded-card border border-white/[0.05] bg-white/[0.03] px-5 py-3.5 shadow-xl shadow-black/20 backdrop-blur">
          <div className="flex items-center gap-4">
            <CwsLogoMark variant="gold" size="md" />
            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <p className="hidden font-label text-[11px] font-semibold uppercase tracking-[2.5px] text-white/55 sm:block">
              Admin Portal
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {account && (
              <Badge className="hidden md:inline-flex">
                {account.username || account.name || 'admin'}
              </Badge>
            )}
            <Button variant="secondary" size="sm" asChild>
              <Link to="/charter-champions">View The Wall of Fame</Link>
            </Button>
            {!isSignedIn && (
              <Button size="sm" onClick={signIn}>
                Sign in
              </Button>
            )}
          </div>
        </div>

        {!isMsalConfigured() && !isDevAuthEnabled && (
          <div className="mt-5 rounded-card border border-amber/30 bg-amber/10 p-4 text-sm text-gold-soft">
            Sign-in is not set up yet on this environment. Ask the IT team to configure the
            Microsoft sign-in settings (VITE_ENTRA variables) before using the admin portal.
          </div>
        )}

        {isDevAuthEnabled && (
          <div className="mt-5 rounded-card border border-sky/30 bg-sky/10 p-4 text-sm text-sky">
            Test mode is on — sign-in is skipped on this build. This never happens on the live
            system.
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
          <header className="mt-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div ref={titleRef}>
              <p className="font-label text-[11px] font-semibold uppercase tracking-[3.5px] text-gold">
                {copy.eyebrow}
              </p>
              <h1 className="mt-2 font-display text-4xl font-black leading-[0.95] md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                {copy.description}
              </p>
            </div>
            <TabsList className="self-start lg:self-auto">
              <TabsTrigger value="entry">
                <PenLine />
                <span className="hidden sm:inline">Add Winner</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
              <TabsTrigger value="directory">
                <Users />
                <span className="hidden sm:inline">All Winners</span>
                <span className="sm:hidden">Winners</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Mail />
                <span className="hidden sm:inline">Recipients</span>
                <span className="sm:hidden">Emails</span>
              </TabsTrigger>
            </TabsList>
          </header>

          {/* forceMount keeps every tab mounted so nothing you typed is lost when switching */}
          <div className="mt-7" ref={panelRef}>
            <TabsContent value="entry" forceMount className="data-[state=inactive]:hidden">
              <WinnerEntryTab isSignedIn={isSignedIn} getAccessToken={getAccessToken} />
            </TabsContent>
            <TabsContent value="directory" forceMount className="data-[state=inactive]:hidden">
              <WinnerDirectoryTab isSignedIn={isSignedIn} getAccessToken={getAccessToken} />
            </TabsContent>
            <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden">
              <SettingsTab isSignedIn={isSignedIn} getAccessToken={getAccessToken} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}
