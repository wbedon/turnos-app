export type TicketStatus = 'waiting' | 'called' | 'attended' | 'cancelled'

export interface Queue {
  id: string
  name: string
  prefix: string
  icon: string
  current_serving: number
  is_active: boolean
  created_at: string
}

export interface Ticket {
  id: string
  token: string
  queue_id: string
  number: number
  status: TicketStatus
  push_sub: PushSubscriptionJSON | null
  created_at: string
  called_at: string | null
  queue?: Queue
}

export interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}
