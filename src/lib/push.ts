import webpush from 'web-push'
import { supabaseAdmin } from './supabase-admin'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushPayload {
  title: string
  body:  string
  url:   string
  tag?:  string
}

/**
 * Envía push a los tickets identificados por sus tokens UUID (campo `token` de la tabla).
 * Ignora tickets sin suscripción. Elimina suscripciones expiradas (HTTP 410).
 */
export async function sendPushToTokens(tokens: string[], payload: PushPayload) {
  if (!tokens.length) return

  const { data: tickets } = await supabaseAdmin
    .from('tickets')
    .select('id, token, push_sub')
    .in('token', tokens)
    .not('push_sub', 'is', null)

  if (!tickets?.length) return

  await Promise.allSettled(
    tickets.map(async (ticket) => {
      try {
        await webpush.sendNotification(
          ticket.push_sub as webpush.PushSubscription,
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        // Suscripción expirada o inválida → se limpia
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          await supabaseAdmin
            .from('tickets')
            .update({ push_sub: null })
            .eq('id', ticket.id)
        }
      }
    })
  )
}
