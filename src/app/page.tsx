import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-orange-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-3xl font-bold text-orange-600">Sistema de Turnos</h1>
        <p className="text-gray-500 mt-2">Seleccioná la pantalla a usar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <Link
          href="/kiosk"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow border-2 border-transparent hover:border-orange-400 transition"
        >
          <span className="text-4xl">🖨️</span>
          <span className="font-semibold text-gray-700">Kiosco</span>
          <span className="text-xs text-gray-400 text-center">Pantalla para tomar turno</span>
        </Link>

        <Link
          href="/display"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow border-2 border-transparent hover:border-orange-400 transition"
        >
          <span className="text-4xl">📺</span>
          <span className="font-semibold text-gray-700">Display</span>
          <span className="text-xs text-gray-400 text-center">Pantalla TV sala de espera</span>
        </Link>

        <Link
          href="/admin"
          className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow border-2 border-transparent hover:border-orange-400 transition"
        >
          <span className="text-4xl">⚙️</span>
          <span className="font-semibold text-gray-700">Admin</span>
          <span className="text-xs text-gray-400 text-center">Panel del operador</span>
        </Link>

        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow opacity-50 cursor-not-allowed">
          <span className="text-4xl">📱</span>
          <span className="font-semibold text-gray-700">Móvil</span>
          <span className="text-xs text-gray-400 text-center">Acceso via QR del kiosco</span>
        </div>
      </div>

    </main>
  );
}
