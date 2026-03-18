import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function SplitModal({ open, onClose, almacenes = [], draft, onSave }) {
  const [rows, setRows] = useState([]);
  const lastInitKeyRef = useRef("");

  const target = Number(draft?.cantTotal || 0);

  const safeKey = (a) => String(a?.cveAlm ?? a?.CveAlm ?? "");
  const safeLabel = (a) => String(a?.descr ?? a?.Descr ?? safeKey(a));

  const fallbackWh = useMemo(() => (almacenes?.length ? safeKey(almacenes[0]) : ""), [almacenes]);

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

  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx, patch) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

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

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md overflow-hidden border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="font-medium text-white">Repartir a almacenes</div>
            <div className="text-xs text-slate-400">
              {draft?.codigo} · Total: {draft?.cantTotal}
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Suma:</span>
            <span className={total === target ? "text-white font-medium" : "text-red-400 font-medium"}>
              {total} / {target}
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-auto">
            {rows.map((r, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  className="flex-1 px-2 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded text-white"
                  value={String(r.warehouse || "")}
                  onChange={(e) => updateRow(idx, { warehouse: e.target.value })}
                >
                  {almacenes.map((a) => (
                    <option key={safeKey(a)} value={safeKey(a)}>
                      {safeLabel(a)}
                    </option>
                  ))}
                </select>
                <input
                  className="w-20 px-2 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded text-white text-right"
                  type="number"
                  min="0"
                  value={Number(r.qty || 0)}
                  onChange={(e) => updateRow(idx, { qty: Number(e.target.value) })}
                />
                <button
                  onClick={() => removeRow(idx)}
                  className="px-2 py-1.5 text-sm text-slate-400 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={addRow}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded"
            >
              + Agregar almacén
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}