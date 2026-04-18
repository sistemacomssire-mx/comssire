import { useEffect, useRef, useState } from "react";

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
  const v = a?.numAlm ?? a?.NumAlm ?? a?.cveAlm ?? a?.CveAlm ?? "";
  return String(v ?? "").trim();
}

function pickWarehouseLabel(a) {
  const value = pickWarehouseValue(a);
  return String(a?.descr ?? a?.Descr ?? value);
}

export default function LinesSectionRemision({
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
  piezaCosto,
  setPiezaCosto,
  setPiezaPrecio,
  onLookup,
  onAddLine,
  lines,
  onRemoveLine,
  onChangeLineWarehouse,
  onSearchProducts,
  almacenHeader,
}) {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const debounceRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (almacenHeader && !almacenLineaSel) {
      setAlmacenLineaSel?.(almacenHeader);
    }
  }, [almacenHeader, almacenLineaSel, setAlmacenLineaSel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const term = norm(q);

    if (!term) {
      setResults([]);
      setShowResults(false);
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
        setShowResults(arr.length > 0);
      } catch (e) {
        console.error("[LinesSectionRemision] onSearchProducts error:", e);
        setResults([]);
        setShowResults(false);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, onSearchProducts]);

  const safeMoney = (n) => {
    const x = Number(n || 0);
    return "$" + x.toFixed(2);
  };

  const handleSelectProduct = (product) => {
    const code = pickCode(product);
    const descr = pickDescr(product);
    const cost = pickCost(product);

    setPiezaCodigo?.(code);
    setPiezaDesc?.(descr === "(Sin descripción)" ? "" : descr);
    if (cost !== null) {
      setPiezaCosto?.(cost);
      setPiezaPrecio?.(cost);
    }

    setQ(descr === "(Sin descripción)" ? code : `${code} - ${descr}`);
    setShowResults(false);
    Promise.resolve().then(() => onLookup?.());
  };

  const handleAddLineClick = () => {
    if (!piezaCodigo || !piezaCant || Number(piezaCant) <= 0) return;
    onAddLine?.();
    setQ("");
    setResults([]);
    setShowResults(false);
  };

  const handleWarehouseChange = (idx, value) => {
    if (!value || typeof onChangeLineWarehouse !== "function") return;
    onChangeLineWarehouse(idx, value);
  };

  const inputClass =
    "w-full px-4 py-3 text-base bg-white border-[1.7px] border-slate-300 rounded-2xl text-slate-900 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400";

  const disabledInputClass =
    "w-full px-4 py-3 text-base bg-slate-50 border-[1.7px] border-slate-300 rounded-2xl text-slate-500 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] cursor-not-allowed";

  const sectionCard = "compra-card";

  const primaryButton =
    "w-full px-4 py-3 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-[0_10px_22px_rgba(250,137,26,0.18)]";

  return (
    <div className="space-y-5">
      <div className={`${sectionCard} p-5`}>
        <div className="mb-5 relative" ref={searchContainerRef}>
          <div className="relative">
            <input
              className={`${inputClass} pl-11`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto por clave o descripción..."
              disabled={saving || readOnly}
              onFocus={() => q && results.length > 0 && setShowResults(true)}
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

          {showResults && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
              {results.map((product, idx) => {
                const code = pickCode(product);
                const descr = pickDescr(product);
                const cost = pickCost(product);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-b-0"
                    type="button"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{code}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-sm text-slate-700 truncate">{descr}</span>
                        </div>
                      </div>
                      {cost !== null && (
                        <span className="text-sm font-semibold text-orange-600 whitespace-nowrap">
                          {safeMoney(cost)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-[0.95rem] font-semibold text-slate-600 mb-2">Cantidad</label>
            <input
              type="number"
              min="0"
              step="1"
              className={inputClass}
              value={piezaCant}
              onChange={(e) => setPiezaCant?.(e.target.value)}
              disabled={saving || readOnly}
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[0.95rem] font-semibold text-slate-600 mb-2">Costo</label>
            <input
              type="number"
              className={disabledInputClass}
              value={piezaCosto}
              disabled
              readOnly
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleAddLineClick}
              disabled={saving || readOnly || !piezaCodigo}
              className={`${primaryButton} disabled:opacity-60 disabled:cursor-not-allowed`}
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
          </div>
        </div>
      </div>

      <div className={`${sectionCard} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <h3 className="text-[1.15rem] font-semibold text-slate-800">Partidas ({lines.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Clave</th>
                <th className="px-5 py-4 text-left font-semibold">Descripción</th>
                <th className="px-5 py-4 text-left font-semibold">Almacén</th>
                <th className="px-5 py-4 text-right font-semibold">Cant</th>
                <th className="px-5 py-4 text-right font-semibold">Costo</th>
                <th className="px-5 py-4 text-right font-semibold">Importe</th>
                <th className="px-5 py-4 text-center font-semibold w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {!lines.length ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400 text-[1.05rem]">
                    Sin partidas
                  </td>
                </tr>
              ) : (
                lines.map((l, idx) => (
                  <tr key={l.backendPartidaId || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-5 text-slate-900 font-medium">{l.codigo}</td>
                    <td className="px-5 py-5 text-slate-900">{l.desc}</td>
                    <td className="px-5 py-5">
                      <select
                        className="w-full min-w-[180px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400"
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
                    <td className="px-5 py-5 text-right text-slate-900">{safeMoney(l.costo)}</td>
                    <td className="px-5 py-5 text-right text-slate-900 font-semibold">
                      {safeMoney(Number(l.cant) * Number(l.costo))}
                    </td>
                    <td className="px-5 py-5 text-center">
                      <button
                        onClick={() => onRemoveLine?.(l, idx)}
                        disabled={saving || readOnly}
                        className="text-slate-400 hover:text-orange-700 transition-colors"
                        title="Eliminar"
                        type="button"
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
