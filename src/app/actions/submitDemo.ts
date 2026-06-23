'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export type DemoFormData = {
  name: string
  company: string
  email: string
  phone: string
  industry: string
  message: string
}

export async function submitDemoRequest(
  data: DemoFormData
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from('demo_requests').insert([{
    name:     data.name.trim(),
    company:  data.company.trim(),
    email:    data.email.trim().toLowerCase(),
    phone:    data.phone.trim() || null,
    industry: data.industry,
    message:  data.message.trim() || null,
  }])

  if (error) {
    console.error('[submitDemoRequest]', error.message)
    return { ok: false, error: 'No pudimos procesar tu solicitud. Intentá de nuevo.' }
  }

  return { ok: true }
}
