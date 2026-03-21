import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function ModalShell({ children }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[4px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

function Header({ draft, onClose }) {
  return (
    <div className="border-b border-slate-200 px-6 py-5 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
            Reparto
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Repartir a almacenes
          </h3>
          <p className="mt-1.5 text-sm text-slate-500">
            {draft?.codigo} · Total requerido: {draft?.cantTotal}
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-[#FA891A] hover:bg-orange-50 hover:text-[#FA891A]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function SplitModal({ open, onClose, almacenes = [], draft, onSave }) {
  const [rows, setRows] = useState([]);
  const lastInitKeyRef = useRef("");

  const target = Number(draft?.cantTotal || 0);

  const safeKey = (a) => String(a?.cveAlm ?? a?.CveAlm ?? "");
  const safeLabel = (a) => String(a?.descr ?? a?.Descr ?? safeKey(a));

  const fallbackWh = useMemo(
    () => (almacenes?.length ? safeKey(almacenes[0]) : ""),
    [almacenes]
  );

  useEffect(() => {
    if (!open || !draft) return;
    const key = `${draft.codigo}|${draft.cantTotal}|${draft.defaultWarehouse}`;
    if (lastInitKeyRef.current === key) return;
    lastInitKeyRef.current = key;

    const def = String(draft.defaultWarehouse || fallbackWh || "").trim();
    setRows(def ? [{ warehouse: def, qty: Number(draft.cantTotal || 0) }] : []);
  }, [open, draft, fallbackWh]);

  if (!open) return null;

  const total = rows.reduce((a, r) => a + Number(r.qty || 0), 0);

  const addRow = () => {
    const def = String(draft?.defaultWarehouse || fallbackWh || "").trim();
    setRows((prev) => [...prev, { warehouse: def, qty: 0 }]);
  };

  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleSave = () => {
    const sum = rows.reduce((a, r) => a + Number(r.qty || 0), 0);
    if (sum !== target) {
      toast.warning(`La suma debe ser ${target}. Actualmente suma ${sum}.`);
      return;
    }
    onSave?.(rows);
    lastInitKeyRef.current = "";
  };

  const handleClose = () => {
    onClose?.();
    lastInitKeyRef.current = "";
  };

  // Estilos consistentes
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#FA891A] focus:ring-2 focus:ring-[#FA891A]/20 hover:border-slate-400";

  // Botón blanco con borde naranja
  const outlineOrangeButton =
    "inline-flex items-center justify-center rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-medium text-[#FA891A] transition-all hover:bg-orange-50 hover:border-[#FA891A] hover:text-[#FA891A]";

  // Botón naranja sólido
  const solidOrangeButton =
    "inline-flex items-center justify-center rounded-xl border border-transparent bg-[#FA891A] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#E07A12] shadow-md hover:shadow-lg";

  return (
    <ModalShell>
      <Header draft={draft} onClose={handleClose} />

      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-600">Suma actual</span>
          <span
            className={`text-sm font-semibold ${
              total === target ? "text-emerald-600" : "text-[#FA891A]"
            }`}
          >
            {total} / {target}
          </span>
        </div>

        <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
          {rows.map((r, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="col-span-7">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Almacén
                </label>
                <select
                  className={inputClass}
                  value={String(r.warehouse || "")}
                  onChange={(e) => updateRow(idx, { warehouse: e.target.value })}
                >
                  {almacenes.map((a) => (
                    <option key={safeKey(a)} value={safeKey(a)}>
                      {safeLabel(a)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Cantidad
                </label>
                <input
                  className={`${inputClass} text-right`}
                  type="number"
                  min="0"
                  value={Number(r.qty || 0)}
                  onChange={(e) => updateRow(idx, { qty: Number(e.target.value) })}
                />
              </div>

              <div className="col-span-2 flex items-end">
                <button
                  onClick={() => removeRow(idx)}
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-[#FA891A] transition-all hover:bg-orange-50 hover:border-[#FA891A]"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button onClick={addRow} className={outlineOrangeButton}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar almacén
          </button>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleClose} className={outlineOrangeButton}>
              Cancelar
            </button>
            <button onClick={handleSave} className={solidOrangeButton}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}