import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-orange-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-3xl font-bold text-orange-600">Sistema de Turnos</h1>
        <p className="text-gray-500 mt-2">Seleccioná la pantalla a usar</p>
      </div>

      <nav aria-label="Pantallas del sistema" className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <Link
          href="/kiosk"
          aria-label="Kiosco — pantalla para tomar turno"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow border-2 border-transparent hover:border-orange-400 transition"
        >
          <span className="text-4xl" aria-hidden="true">🖨️</span>
          <span className="font-semibold text-gray-700">Kiosco</span>
          <span className="text-xs text-gray-400 text-center">Pantalla para tomar turno</span>
        </Link>

        <Link
          href="/display"
          aria-label="Display — pantalla TV para la sala de espera"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow border-2 border-transparent hover:border-orange-400 transition"
        >
          <span className="text-4xl" aria-hidden="true">📺</span>
          <span className="font-semibold text-gray-700">Display</span>
          <span className="text-xs text-gray-400 text-center">Pantalla TV sala de espera</span>
        </Link>

        <Link
          href="/admin"
          aria-label="Admin — panel del operador"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow border-2 border-transparent hover:border-orange-400 transition"
        >
          <span className="text-4xl" aria-hidden="true">⚙️</span>
          <span className="font-semibold text-gray-700">Admin</span>
          <span className="text-xs text-gray-400 text-center">Panel del operador</span>
        </Link>

        <div
          aria-disabled="true"
          aria-label="Móvil — no disponible, accedé por QR del kiosco"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow opacity-50 cursor-not-allowed"
        >
          <span className="text-4xl" aria-hidden="true">📱</span>
          <span className="font-semibold text-gray-700">Móvil</span>
          <span className="text-xs text-gray-400 text-center">Acceso via QR del kiosco</span>
        </div>
      </nav>

    </main>
  );
}
