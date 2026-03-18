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

  return (
    <div className="space-y-3">
      {/* Formulario de búsqueda compacto */}
      {!hideAddForm && (
        <div className="bg-slate-800/30 rounded p-3">
          {/* Buscador rápido */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <input
                className="w-full px-3 py-1.5 pl-8 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar producto (clave/descripción)..."
                disabled={saving || readOnly}
              />
              <svg className="w-4 h-4 absolute left-2 top-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-2 top-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <button
              onClick={onLookup}
              disabled={saving || readOnly}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded"
            >
              Buscar
            </button>
          </div>

          {/* Selectores compactos */}
          <div className="grid grid-cols-12 gap-2 mb-3">
            <div className="col-span-5">
              <select
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
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
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
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
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
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

          {/* Formulario de entrada compacto */}
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3">
              <label className="text-xs text-slate-400">Código</label>
              <input
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                value={piezaCodigo}
                onChange={(e) => setPiezaCodigo?.(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLookup?.()}
                placeholder="Código"
                disabled={saving || readOnly}
              />
            </div>
            
            <div className="col-span-3">
              <label className="text-xs text-slate-400">Descripción</label>
              <input
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                value={piezaDesc}
                onChange={(e) => setPiezaDesc?.(e.target.value)}
                placeholder="Descripción"
                disabled={saving || readOnly}
              />
            </div>
            
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Cantidad</label>
              <input
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                type="number"
                min="1"
                value={piezaCant}
                onChange={(e) => setPiezaCant?.(Number(e.target.value))}
                disabled={saving || readOnly}
              />
            </div>
            
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Costo</label>
              <input
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
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
                className="w-full px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Agregar
              </button>
            </div>
          </div>

          {/* Existencias en tooltip compacto */}
          {existencias?.length > 0 && (
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
              <span>Existencias:</span>
              {existencias.map((x, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-slate-800 rounded">
                  Alm {x.numAlm ?? x.NumAlm}: {x.existencia ?? x.Existencia ?? 0}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla de partidas compacta */}
      <div className="bg-slate-800/30 rounded overflow-hidden">
        <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
          <span className="text-sm font-medium text-white">
            Partidas ({lines.length})
          </span>
          {lines.length > 0 && almacenHeader && onSyncWarehouses && (
            <button
              onClick={onSyncWarehouses}
              disabled={saving || readOnly}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar
            </button>
          )}
        </div>

        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Clave</th>
                <th className="text-left px-3 py-2">Descripción</th>
                <th className="text-left px-3 py-2">Almacén</th>
                <th className="text-right px-3 py-2">Cant</th>
                <th className="text-right px-3 py-2">Costo</th>
                <th className="text-right px-3 py-2">Importe</th>
                <th className="text-center px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {!lines?.length ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-4 text-sm">
                    Sin partidas
                  </td>
                </tr>
              ) : (
                lines.map((l, idx) => (
                  <tr key={l.backendPartidaId || `${l.codigo}-${idx}`} className="hover:bg-slate-700/30">
                    <td className="px-3 py-1.5 text-white">{l.codigo}</td>
                    <td className="px-3 py-1.5 text-white truncate max-w-[200px]">{l.desc}</td>
                    <td className="px-3 py-1.5">
                      <select
                        className="w-24 px-1.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                        value={String(l.warehouse ?? "")}
                        onChange={(e) => handleWarehouseChange(idx, e.target.value)}
                        disabled={saving || readOnly}
                      >
                        {(almacenes || []).map((a) => {
                          const value = pickWarehouseValue(a);
                          const label = pickWarehouseLabel(a);
                          return (
                            <option key={value} value={value}>
                              {label.length > 15 ? label.substring(0, 15) + '…' : label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-right text-white">{l.cant}</td>
                    <td className="px-3 py-1.5 text-right text-white">{safeMoney(l.precio)}</td>
                    <td className="px-3 py-1.5 text-right text-white font-medium">
                      {safeMoney(Number(l.cant) * Number(l.precio))}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => handleRemove(l, idx)}
                        disabled={saving || readOnly}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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