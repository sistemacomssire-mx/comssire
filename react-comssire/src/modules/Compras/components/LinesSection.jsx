import { useEffect, useMemo, useRef, useState } from "react";

function norm(s) {
  return String(s || "").trim();
}

function pickDescr(p) {
  return (
    norm(p?.descr ?? p?.Descr ?? p?.descripcion ?? p?.Descripcion ?? "") ||
    "(Sin descripción)"
  );
}

function pickCode(p) {
  return norm(
    p?.cveArt ??
      p?.CveArt ??
      p?.codigo ??
      p?.Codigo ??
      p?.cve ??
      p?.Cve ??
      ""
  );
}

function pickCost(p) {
  const v =
    p?.ultCosto ??
    p?.UltCosto ??
    p?.costo ??
    p?.Costo ??
    p?.precio ??
    p?.Precio ??
    null;
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickWarehouseValue(a) {
  const v =
    a?.numAlm ??
    a?.NumAlm ??
    a?.cveAlm ??
    a?.CveAlm ??
    "";
  return String(v ?? "").trim();
}

function pickWarehouseLabel(a) {
  const value = pickWarehouseValue(a);
  return String(a?.descr ?? a?.Descr ?? value);
}

export default function LinesSection({
  readOnly = false,
  saving,
  almacenes,
  almacenLineaSel,
  setAlmacenLineaSel,
  piezaCodigo,
  setPiezaCodigo,
  piezaDesc,
  setPiezaDesc,
  piezaCant,
  setPiezaCant,
  piezaPrecio,
  setPiezaPrecio,
  onLookup,
  existencias,
  onAddLine,
  lines,
  onRemoveLine,
  onChangeLineWarehouse,
  onChangeWarehouse,
  onUpdateWarehouseDirect,
  money,
  onSearchProducts,
  hideAddForm = false,
  onSyncWarehouses,
  almacenHeader,
}) {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [selectedCode, setSelectedCode] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    if (almacenHeader && !almacenLineaSel) {
      setAlmacenLineaSel?.(almacenHeader);
    }
  }, [almacenHeader, almacenLineaSel, setAlmacenLineaSel]);

  const safeMoney = (n) => {
    if (typeof money === "function") return money(n);
    const x = Number(n || 0);
    return "$" + x.toFixed(2);
  };

  useEffect(() => {
    const term = norm(q);

    if (!term) {
      setResults([]);
      setSelectedGroupKey("");
      setSelectedCode("");
      return;
    }

    if (!onSearchProducts) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await onSearchProducts(term);
        const arr = Array.isArray(res) ? res : [];
        setResults(arr);
        setSelectedGroupKey("");
        setSelectedCode("");
      } catch (e) {
        console.error("[LinesSection] onSearchProducts error:", e);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, onSearchProducts]);

  const groups = useMemo(() => {
    const map = new Map();

    for (const p of results || []) {
      const code = pickCode(p);
      if (!code) continue;

      const descr = pickDescr(p);
      const key = descr.toLowerCase();

      if (!map.has(key)) map.set(key, { key, descr, items: [] });

      map.get(key).items.push({
        raw: p,
        code,
        descr,
        cost: pickCost(p),
      });
    }

    return Array.from(map.values()).sort((a, b) => a.descr.localeCompare(b.descr));
  }, [results]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupKey) return null;
    return groups.find((g) => g.key === selectedGroupKey) || null;
  }, [groups, selectedGroupKey]);

  const codesInGroup = useMemo(() => {
    if (!selectedGroup) return [];
    return [...selectedGroup.items].sort((a, b) => a.code.localeCompare(b.code));
  }, [selectedGroup]);

  const handlePickGroup = (key) => {
    setSelectedGroupKey(key);
    setSelectedCode("");
  };

  const handlePickCode = (code) => {
    setSelectedCode(code);
    const item = codesInGroup.find((x) => x.code === code);
    if (!item) return;

    setPiezaCodigo?.(item.code);
    setPiezaDesc?.(item.descr === "(Sin descripción)" ? "" : item.descr);

    if (item.cost !== null) setPiezaPrecio?.(item.cost);

    Promise.resolve().then(() => onLookup?.());
  };

  const handleWarehouseChange = (idx, value) => {
    if (!value) return;

    const line = lines[idx];

    if (typeof onUpdateWarehouseDirect === "function" && line?.backendPartidaId) {
      onUpdateWarehouseDirect(line.backendPartidaId, value, idx);
      return;
    }

    if (typeof onChangeLineWarehouse === "function") {
      onChangeLineWarehouse(idx, value);
      return;
    }

    if (typeof onChangeWarehouse === "function") {
      onChangeWarehouse(idx, value);
      return;
    }
  };

  const handleRemove = (line, idx) => {
    if (typeof onRemoveLine !== "function") return;
    onRemoveLine(line, idx);
  };

  const inputClass =
    "w-full px-4 py-3 text-base bg-white border-[1.7px] border-slate-300 rounded-2xl text-slate-900 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400";

  const sectionCard =
    "compra-card";

  const softButton =
    "btn-soft-orange px-5 py-3 text-sm rounded-2xl transition-colors border font-semibold shadow-[0_8px_18px_rgba(250,137,26,0.08)]";

  const primaryButton =
    "w-full px-4 py-3 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-[0_10px_22px_rgba(250,137,26,0.18)]";

  return (
    <div className="space-y-5">
      {!hideAddForm && (
        <div className={`${sectionCard} p-5`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <input
                className={`${inputClass} pl-11`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar producto (clave/descripción)..."
                disabled={saving || readOnly}
              />
              <svg
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <button
              onClick={onLookup}
              disabled={saving || readOnly}
              className={softButton}
            >
              Buscar
            </button>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-5">
            <div className="col-span-5">
              <select
                className={inputClass}
                value={selectedGroupKey}
                onChange={(e) => handlePickGroup(e.target.value)}
                disabled={saving || readOnly || !groups.length}
              >
                <option value="">Descripción (agrupada)</option>
                {groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.descr} ({g.items.length})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-5">
              <select
                className={inputClass}
                value={selectedCode}
                onChange={(e) => handlePickCode(e.target.value)}
                disabled={saving || readOnly || !selectedGroup}
              >
                <option value="">Clave (variante)</option>
                {codesInGroup.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.code} {x.cost !== null && `- ${safeMoney(x.cost)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <select
                className={inputClass}
                value={String(almacenLineaSel || "")}
                onChange={(e) => setAlmacenLineaSel?.(e.target.value)}
                disabled={saving || readOnly}
              >
                <option value="">Almacén</option>
                {(almacenes || []).map((a) => {
                  const value = pickWarehouseValue(a);
                  const label = pickWarehouseLabel(a);
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-3">
              <label className="compra-label">Código</label>
              <input
                className={inputClass}
                value={piezaCodigo}
                onChange={(e) => setPiezaCodigo?.(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLookup?.()}
                placeholder="Código"
                disabled={saving || readOnly}
              />
            </div>

            <div className="col-span-3">
              <label className="compra-label">Descripción</label>
              <input
                className={inputClass}
                value={piezaDesc}
                onChange={(e) => setPiezaDesc?.(e.target.value)}
                placeholder="Descripción"
                disabled={saving || readOnly}
              />
            </div>

            <div className="col-span-2">
              <label className="compra-label">Cantidad</label>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={piezaCant}
                onChange={(e) => setPiezaCant?.(Number(e.target.value))}
                disabled={saving || readOnly}
              />
            </div>

            <div className="col-span-2">
              <label className="compra-label">Costo</label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                value={piezaPrecio}
                onChange={(e) => setPiezaPrecio?.(Number(e.target.value))}
                disabled={saving || readOnly}
              />
            </div>

            <div className="col-span-2">
              <button
                onClick={onAddLine}
                disabled={saving || readOnly}
                className={primaryButton}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5V19" strokeWidth="2" strokeLinecap="round" />
                  <path d="M5 12H19" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Agregar
              </button>
            </div>
          </div>

          {existencias?.length > 0 && (
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="font-semibold">Existencias:</span>
              {existencias.map((x, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-slate-50 rounded-2xl text-slate-700 border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                >
                  Alm {x.numAlm ?? x.NumAlm}: {x.existencia ?? x.Existencia ?? 0}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`${sectionCard} overflow-hidden`}>
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-[1rem] font-semibold text-slate-700">
            Partidas ({lines.length})
          </span>

          {lines.length > 0 && almacenHeader && onSyncWarehouses && (
            <button
              onClick={onSyncWarehouses}
              disabled={saving || readOnly}
              className="text-sm text-slate-500 hover:text-orange-700 flex items-center gap-2 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sincronizar
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs">
              <tr>
                <th className="text-left px-5 py-4 font-semibold">Clave</th>
                <th className="text-left px-5 py-4 font-semibold">Descripción</th>
                <th className="text-left px-5 py-4 font-semibold">Almacén</th>
                <th className="text-right px-5 py-4 font-semibold">Cant</th>
                <th className="text-right px-5 py-4 font-semibold">Costo</th>
                <th className="text-right px-5 py-4 font-semibold">Importe</th>
                <th className="text-center px-5 py-4"></th>
              </tr>
            </thead>

            <tbody>
              {!lines?.length ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-12 text-base">
                    Sin partidas
                  </td>
                </tr>
              ) : (
                lines.map((l, idx) => (
                  <tr
                    key={l.backendPartidaId || `${l.codigo}-${idx}`}
                    className="transition-colors hover:bg-orange-50/40"
                  >
                    <td className="px-5 py-5 text-slate-900 font-semibold">{l.codigo}</td>
                    <td className="px-5 py-5 text-slate-600 truncate max-w-[240px]">{l.desc}</td>
                    <td className="px-5 py-5">
                      <select
                        className="w-40 px-3 py-2.5 text-sm bg-white border-[1.6px] border-slate-300 rounded-2xl text-slate-900 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400"
                        value={String(l.warehouse ?? "")}
                        onChange={(e) => handleWarehouseChange(idx, e.target.value)}
                        disabled={saving || readOnly}
                      >
                        {(almacenes || []).map((a) => {
                          const value = pickWarehouseValue(a);
                          const label = pickWarehouseLabel(a);
                          return (
                            <option key={value} value={value}>
                              {label.length > 18 ? `${label.substring(0, 18)}…` : label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-5 py-5 text-right text-slate-900">{l.cant}</td>
                    <td className="px-5 py-5 text-right text-slate-900">{safeMoney(l.precio)}</td>
                    <td className="px-5 py-5 text-right text-slate-900 font-semibold">
                      {safeMoney(Number(l.cant) * Number(l.precio))}
                    </td>
                    <td className="px-5 py-5 text-center">
                      <button
                        onClick={() => handleRemove(l, idx)}
                        disabled={saving || readOnly}
                        className="text-slate-400 hover:text-orange-700 transition-colors"
                        title="Eliminar"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4 7H20" strokeWidth="2" strokeLinecap="round" />
                          <path d="M10 11V17" strokeWidth="2" strokeLinecap="round" />
                          <path d="M14 11V17" strokeWidth="2" strokeLinecap="round" />
                          <path d="M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}