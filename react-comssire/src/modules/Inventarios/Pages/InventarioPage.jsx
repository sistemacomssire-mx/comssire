import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { useNavigate } from "react-router-dom";
import { apiGetAlmacenes, apiGetExistenciasPorAlmacen } from "../api/inventarios.api";
import { apiCrearToma } from "../api/tomas.api";
import { authStorage } from "../../Auth/store/auth.storage";

export default function InventarioPage() {
  const nav = useNavigate();

  const canView = useMemo(() => {
    return authStorage.isAdmin() || authStorage.hasPerm("inventarios.ver");
  }, []);

  const canCrearToma = useMemo(() => {
    return authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.crear");
  }, []);

  const [loading, setLoading] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [cveAlm, setCveAlm] = useState("");

  const [q, setQ] = useState("");
  const [soloConExistencia, setSoloConExistencia] = useState(false);
  const [orderDir, setOrderDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const [res, setRes] = useState({ total: 0, page: 1, pageSize: 50, items: [] });

  const canFetch = useMemo(() => Number(cveAlm) > 0, [cveAlm]);

  useEffect(() => {
    if (!canView) {
      toast.error("No tienes permiso para ver inventarios.");
      nav("/home");
      return;
    }

    (async () => {
      try {
        const data = await apiGetAlmacenes();
        setAlmacenes(data);
      } catch (e) {
        toast.error(e?.response?.data || "Error cargando almacenes");
      }
    })();
  }, [canView, nav]);

  async function cargar(nextPage = page) {
    if (!canFetch) return;

    try {
      setLoading(true);
      const data = await apiGetExistenciasPorAlmacen(Number(cveAlm), {
        q: q || undefined,
        page: nextPage,
        pageSize,
        soloConExistencia,
        orderBy: "exist",
        orderDir,
      });
      setRes(data);
      setPage(data.page);
    } catch (e) {
      toast.error(e?.response?.data || "Error cargando existencias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canFetch) return;
    setPage(1);
    cargar(1);
  }, [cveAlm]);

  async function onBuscar(e) {
    e.preventDefault();
    setPage(1);
    await cargar(1);
  }

  async function onCrearToma() {
    if (!canCrearToma) return toast.error("No tienes permiso para crear toma.");
    if (!canFetch) return toast.error("Selecciona un almacén.");

    try {
      setLoading(true);
      const r = await apiCrearToma(Number(cveAlm));
      toast.success(`Toma creada (#${r.tomaId})`);
      nav(`/inventario/tomas/${r.tomaId}`);
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo crear la toma");
    } finally {
      setLoading(false);
    }
  }

  const getStockStatus = (exist, min, max) => {
    if (exist <= 0) return "text-red-400";
    if (min && exist < min) return "text-orange-400";
    if (max && exist > max) return "text-yellow-400";
    return "text-emerald-400";
  };

  return (
    <AppLayout>
      <div className="w-full space-y-4">
        {/* Header con título y botón de crear toma */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Inventario por almacén
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona un almacén para ver existencias
              </p>
            </div>

            {canCrearToma && (
              <button 
                className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1.5" 
                onClick={onCrearToma} 
                disabled={loading || !canFetch}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Crear toma</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Selector de almacén */}
            <div className="md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Almacén</label>
              <select
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                value={cveAlm}
                onChange={(e) => setCveAlm(e.target.value)}
              >
                <option value="">-- Selecciona --</option>
                {almacenes.map((a) => (
                  <option key={a.cveAlm} value={a.cveAlm}>
                    {a.cveAlm} - {a.descr}
                  </option>
                ))}
              </select>
            </div>

            {/* Buscador */}
            <div className="md:col-span-4">
              <label className="block text-xs text-slate-500 mb-1">Buscar producto</label>
              <form onSubmit={onBuscar} className="flex gap-2">
                <input
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Código o descripción..."
                />
                <button 
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-1" 
                  type="submit" 
                  disabled={loading || !canFetch}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Buscar</span>
                </button>
              </form>
            </div>

            {/* Filtros adicionales */}
            <div className="md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Opciones</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                    checked={soloConExistencia}
                    onChange={(e) => setSoloConExistencia(e.target.checked)}
                  />
                  <span>Solo &gt; 0</span>
                </label>

                <select
                  className="flex-1 px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                  value={orderDir}
                  onChange={(e) => setOrderDir(e.target.value)}
                  disabled={!canFetch}
                >
                  <option value="desc">Mayor exist.</option>
                  <option value="asc">Menor exist.</option>
                </select>
              </div>
            </div>

            {/* Botón actualizar */}
            <div className="md:col-span-2 flex items-end">
              <button
                className="w-full px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-1"
                type="button"
                onClick={() => cargar(1)}
                disabled={loading || !canFetch}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Total de registros */}
          <div className="mt-3 text-xs text-slate-500">
            Total: <span className="text-white font-medium">{res.total}</span> productos
          </div>
        </div>

        {/* Tabla de existencias */}
        <div className="bg-slate-800/30 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 text-slate-400 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">Código</th>
                  <th className="text-left px-3 py-2">Descripción</th>
                  <th className="text-left px-3 py-2">U.M.</th>
                  <th className="text-right px-3 py-2">Existencia</th>
                  <th className="text-right px-3 py-2">Mínimo</th>
                  <th className="text-right px-3 py-2">Máximo</th>
                  <th className="text-right px-3 py-2">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {res.items.map((it) => (
                  <tr key={`${it.cveArt}-${it.cveAlm}`} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 font-mono text-xs text-white">{it.cveArt}</td>
                    <td className="px-3 py-2 text-white/80 text-xs max-w-[250px] truncate">{it.descr}</td>
                    <td className="px-3 py-2 text-white/60 text-xs">{it.uniMed}</td>
                    <td className={`px-3 py-2 text-right text-xs font-medium ${getStockStatus(it.exist, it.stockMin, it.stockMax)}`}>
                      {it.exist ?? 0}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-white/60">{it.stockMin ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-xs text-white/60">{it.stockMax ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-xs text-white/60">{it.pendSurt ?? "—"}</td>
                  </tr>
                ))}

                {!loading && res.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span>No hay datos disponibles</span>
                      </div>
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, res.total)} de {res.total}
            </div>
            
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={loading || page <= 1}
                onClick={() => cargar(page - 1)}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Anterior</span>
              </button>
              
              <button
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={loading || page * pageSize >= res.total}
                onClick={() => cargar(page + 1)}
              >
                <span>Siguiente</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}