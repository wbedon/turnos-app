'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
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
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3
                    bg-white border border-orange-200 rounded-2xl shadow-xl px-4 py-3
                    animate-in slide-in-from-bottom-4 duration-300">
      <span className="text-2xl shrink-0">📲</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">Instalá la app</p>
        <p className="text-xs text-gray-500 truncate">Accedé rápido desde tu pantalla de inicio</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 text-xs px-2 py-1 hover:text-gray-600"
        >
          Ahora no
        </button>
        <button
          onClick={handleInstall}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm
                     font-semibold px-4 py-1.5 rounded-xl transition-colors"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}
