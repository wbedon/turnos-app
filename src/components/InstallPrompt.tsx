'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function IconDownload() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v13M7 11l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setDismissed(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
  }

  return (
    <div
      role="region"
      aria-label="Sugerencia de instalación"
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3
                 border border-zinc-700 bg-zinc-900 px-4 py-3
                 animate-in slide-in-from-bottom-4 duration-300"
    >
      <span className="text-amber-400 shrink-0"><IconDownload /></span>
      <div className="flex-1 min-w-0">
        <p className="font-mono font-bold text-zinc-100 text-xs uppercase tracking-wider">Instalá la app</p>
        <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">Accedé rápido desde tu pantalla de inicio</p>
      </div>
      <div className="flex gap-3 shrink-0 items-center">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar sugerencia de instalación"
          className="text-zinc-600 font-mono text-xs uppercase tracking-widest hover:text-zinc-400 transition-colors"
        >
          No
        </button>
        <button
          onClick={handleInstall}
          className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black font-mono
                     text-xs uppercase tracking-widest px-4 py-2 transition-colors"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}
