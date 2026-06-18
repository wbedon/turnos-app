export default function TicketLoading() {
  return (
    <div role="status" aria-label="Cargando información del turno" aria-busy="true" className="min-h-screen bg-orange-50 flex flex-col animate-pulse">
      {/* Header */}
      <div className="bg-orange-300 px-6 py-5 text-center space-y-2">
        <div className="h-3 w-20 bg-orange-200 rounded-full mx-auto" />
        <div className="h-12 w-44 bg-orange-200 rounded-xl mx-auto" />
        <div className="h-3 w-24 bg-orange-200 rounded-full mx-auto" />
      </div>

      <div className="flex-1 flex flex-col gap-4 p-6">
        {/* Card: estado actual */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-gray-100 rounded-full" />
            <div className="h-9 w-24 bg-gray-100 rounded-lg" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-3 w-16 bg-gray-100 rounded-full" />
            <div className="h-9 w-12 bg-gray-100 rounded-lg" />
          </div>
        </div>

        {/* Card: barra de progreso */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="h-3 w-24 bg-gray-100 rounded-full mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 bg-gray-100 rounded-full" />
            ))}
          </div>
        </div>

        {/* Card: tiempo estimado */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="h-3 w-28 bg-gray-100 rounded-full" />
            <div className="h-7 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>

        {/* Card: alertas */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-gray-100 rounded-full" />
            <div className="h-3 w-36 bg-gray-100 rounded-full" />
          </div>
          <div className="w-20 h-8 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
