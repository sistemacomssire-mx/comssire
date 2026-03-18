const MOCK = [
  { codigo: "PZ-1001", desc: "Filtro hidráulico", precio: 350.0 },
  { codigo: "PZ-1002", desc: "Banda de transmisión", precio: 520.0 },
  { codigo: "PZ-1003", desc: "Sensor de presión", precio: 890.0 },
  { codigo: "PZ-1004", desc: "Rodamiento industrial", precio: 240.0 },
];

export default function CameraModal({ open, onClose, onDetected }) {
  if (!open) return null;

  const simulate = () => {
    const pick = MOCK[Math.floor(Math.random() * MOCK.length)];
    onDetected?.(pick);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose}></div>

      <div className="relative w-[92%] max-w-3xl panel overflow-hidden">
        <div className="px-6 py-5 border-b sep flex items-center justify-between">
          <div>
            <p className="text-base font-extrabold">Escaneo de pieza (Mock IA)</p>
            <p className="text-xs text-white/55">Simulación para llenar el formulario.</p>
          </div>

          <button className="btn btn-glass text-sm" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-2">
          <div className="panel panel-strong p-4">
            <div className="aspect-video rounded-2xl bg-black/35 ring-1 ring-white/10 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-semibold">Vista de cámara</p>
                <p className="text-xs text-white/55 mt-1">(mock)</p>
              </div>
            </div>

            <button className="btn btn-primary mt-4 w-full" type="button" onClick={simulate}>
              Detectar pieza
            </button>
          </div>

          <div className="panel panel-strong p-5">
            <p className="text-sm font-semibold">Resultado</p>
            <p className="text-xs text-white/55 mt-1">Se llenará código, desc y precio.</p>

            <button className="btn btn-primary mt-5 w-full" type="button" onClick={simulate}>
              Usar detección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
