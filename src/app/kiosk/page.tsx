import { supabaseAdmin } from '@/lib/supabase'
import KioskClient from './KioskClient'

export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const { data: queues, error } = await supabaseAdmin
    .from('queues')
    .select('*')
    .order('prefix')

  if (error || !queues) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-4">⚠️</p>
          <p>No se pudo conectar con el servidor.</p>
          <p className="text-sm mt-2">Verificá la conexión e intentá de nuevo.</p>
        </div>
      </div>
    )
  }

  return <KioskClient queues={queues} />
}
