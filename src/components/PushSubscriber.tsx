'use client'

import { useState, useEffect } from 'react'
import { savePushSubscription } from '@/app/ticket/[token]/actions'

interface Props {
  ticketId: string
}

type PushState = 'loading' | 'unsupported' | 'blocked' | 'idle' | 'subscribing' | 'active' | 'error'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer  = new ArrayBuffer(rawData.length)
  const output  = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export default function PushSubscriber({ ticketId }: Props) {
  const [state, setState] = useState<PushState>('loading')

  // Al montar: registrar SW y verificar estado actual
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        setState('active')
        return
      }
      const perm = Notification.permission
      if (perm === 'denied') {
        setState('blocked')
      } else {
        setState('idle')
      }
    }).catch(() => setState('unsupported'))
  }, [])

  async function handleSubscribe() {
    setState('subscribing')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const subJson = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      const result = await savePushSubscription(ticketId, subJson)
      setState(result.ok ? 'active' : 'error')
    } catch {
      // El usuario rechazó el permiso u otro error
      const perm = Notification.permission
      setState(perm === 'denied' ? 'blocked' : 'error')
    }
  }

  if (state === 'loading' || state === 'unsupported') return null

  if (state === 'active') {
    return (
      <div role="status" className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
        <span className="text-2xl">🔔</span>
        <div>
          <p className="font-semibold text-green-700 text-sm">Alertas activas</p>
          <p className="text-xs text-green-500">Te avisamos cuando falten 2 turnos</p>
        </div>
        <span className="ml-auto text-green-500 text-lg">✓</span>
      </div>
    )
  }

  if (state === 'blocked') {
    return (
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <span className="text-2xl">🔕</span>
        <div>
          <p className="font-semibold text-gray-600 text-sm">Alertas bloqueadas</p>
          <p className="text-xs text-gray-400">Habilitá notificaciones en la configuración del navegador</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={state === 'subscribing'}
      aria-busy={state === 'subscribing'}
      aria-label={state === 'subscribing' ? 'Activando alertas de turno…' : 'Activar alertas de turno'}
      className="w-full flex items-center gap-3 bg-orange-50 border-2 border-dashed border-orange-200
                 rounded-2xl p-4 hover:border-orange-400 hover:bg-orange-100
                 transition-all disabled:opacity-60 text-left"
    >
      <span className="text-2xl">{state === 'subscribing' ? '⏳' : '🔔'}</span>
      <div className="flex-1">
        <p className="font-semibold text-orange-700 text-sm">
          {state === 'subscribing' ? 'Activando...' : 'Activar alertas'}
        </p>
        <p className="text-xs text-orange-400">
          {state === 'error'
            ? 'Ocurrió un error. Intentá de nuevo.'
            : 'Te avisamos cuando falten 2 turnos para el tuyo'}
        </p>
      </div>
      {state !== 'subscribing' && (
        <span className="text-orange-400 font-bold text-sm">Activar →</span>
      )}
    </button>
  )
}
