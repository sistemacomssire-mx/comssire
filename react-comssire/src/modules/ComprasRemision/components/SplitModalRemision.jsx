import { useEffect, useState } from "react";

export default function SplitModalRemision({ open, onClose, line, almacenes = [], onConfirm }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!open || !line) return;

    const current = line?.repartos?.length
      ? line.repartos.map((r, idx) => ({
          id: r.id || `r-${idx}`,
          numAlm: String(r.numAlm || ""),
          cant: Number(r.cant || 0),
        }))
      : [
          {
            id: "r-0",
            numAlm: String(line.warehouse || ""),
            cant: Number(line.cant || 0),
          },
        ];

    setRows(current);
  }, [open, line]);

  if (!open || !line) return null;

  const totalAsignado = rows.reduce((acc, r) => acc + Number(r.cant || 0), 0);
  const restante = Number(line.cant || 0) - totalAsignado;

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}-${prev.length}`,
        numAlm: String(almacenes?.[0]?.numAlm ?? almacenes?.[0]?.NumAlm ?? almacenes?.[0]?.cveAlm ?? almacenes?.[0]?.CveAlm ?? ""),
        cant: 0,
      },
    ]);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-[#fffaf4] flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Repartir partida</h3>
            <p className="text-sm text-slate-500 mt-1">{line.codigo} · {line.desc}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" type="button">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 flex flex-wrap gap-4">
            <span><strong>Cantidad total:</strong> {line.cant}</span>
            <span><strong>Asignado:</strong> {totalAsignado}</span>
            <span className={restante === 0 ? "text-green-600" : "text-orange-600"}><strong>Restante:</strong> {restante}</span>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={`${row.id}-${idx}`} className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4">
                <div className="col-span-7">
                  <label className="compra-label">Almacén</label>
                  <select
                    className="w-full px-4 py-3 text-base bg-white border-[1.7px] border-slate-300 rounded-2xl text-slate-900 outline-none transition focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400"
                    value={row.numAlm}
                    onChange={(e) => updateRow(row.id, { numAlm: e.target.value })}
                  >
                    {almacenes.map((a, i) => {
                      const value = String(a?.numAlm ?? a?.NumAlm ?? a?.cveAlm ?? a?.CveAlm ?? "");
                      const label = String(a?.descr ?? a?.Descr ?? value);
                      return (
                        <option key={`${value}-${i}`} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="compra-label">Cantidad</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-base bg-white border-[1.7px] border-slate-300 rounded-2xl text-slate-900 outline-none transition focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400"
                    value={row.cant}
                    onChange={(e) => updateRow(row.id, { cant: Number(e.target.value) })}
                  />
                </div>

                <div className="col-span-2">
                  <button type="button" onClick={() => removeRow(row.id)} className="w-full px-3 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-orange-700">
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addRow} className="px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50">
            Agregar almacén
          </button>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 bg-white flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(rows.map((r) => ({ numAlm: String(r.numAlm || ""), cant: Number(r.cant || 0) })))}
            className="px-5 py-3 rounded-2xl bg-orange-600 text-white hover:bg-orange-500"
          >
            Guardar reparto
          </button>
        </div>
      </div>
    </div>
  );
}
