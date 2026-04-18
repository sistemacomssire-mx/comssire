import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { useNavigate } from "react-router-dom";
import { apiGetAlmacenes, apiGetExistenciasPorAlmacen } from "../api/inventarios.api";
import { apiCrearToma } from "../api/tomas.api";
import { authStorage } from "../../Auth/store/auth.storage";

const swalBase = {
  heightAuto: false,
  allowOutsideClick: false,
  backdrop: "rgba(15, 23, 42, 0.22)",
  customClass: {
    popup: "swal2-popup-custom",
    title: "swal2-title-custom",
    htmlContainer: "swal2-text-custom",
    actions: "swal2-actions-custom",
    confirmButton: "swal2-confirm-custom",
    cancelButton: "swal2-cancel-custom",
  },
  buttonsStyling: true,
};

function extractApiError(error, fallback = "Ocurrió un error inesperado.") {
  const status = error?.response?.status;
  const data = error?.response?.parsedData ?? error?.response?.data;

  let message = "";

  if (typeof data === "string") {
    message = data;
  } else if (Array.isArray(data?.errors)) {
    message = data.errors.join(" ");
  } else if (data?.errors && typeof data.errors === "object") {
    message = Object.values(data.errors).flat().join(" ");
  } else {
    message = data?.message || data?.title || data?.detail || data?.error || "";
  }

  if (typeof message === "string") {
    message = message.trim();
  }

  if (message && !/^\d+$/.test(message)) return message;

  const statusMap = {
    400: "La solicitud no es válida. Revisa los datos enviados.",
    401: "Tu sesión expiró o no tienes autorización. Vuelve a iniciar sesión.",
    403: "No tienes permisos para realizar esta acción.",
    404: "No se encontró la información solicitada.",
    405: "La operación no está permitida por el servidor.",
    409: "La operación entró en conflicto con el estado actual de la información.",
    422: "No fue posible procesar la solicitud con los datos enviados.",
    500: "El servidor presentó un problema interno. Intenta nuevamente.",
    502: "El servidor no respondió correctamente. Intenta nuevamente.",
    503: "El servicio no está disponible temporalmente.",
    504: "El servidor tardó demasiado en responder. Intenta nuevamente.",
  };

  return statusMap[status] || fallback;
}

function showSuccess(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "success",
    title,
    text,
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#ea580c",
  });
}

function showInfo(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "info",
    title,
    text,
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#2563eb",
  });
}

function showWarning(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "warning",
    title,
    text,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#ea580c",
  });
}

function showError(title, errorOrText, fallback = "No fue posible completar la operación.") {
  const text = typeof errorOrText === "string"
    ? errorOrText
    : extractApiError(errorOrText, fallback);

  return Swal.fire({
    ...swalBase,
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#dc2626",
  });
}

function confirmAction({
  title,
  text,
  icon = "warning",
  confirmButtonText = "Sí, continuar",
  cancelButtonText = "Cancelar",
}) {
  return Swal.fire({
    ...swalBase,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#ea580c",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: true,
  });
}


const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 350;
const API_PAGE_SIZE = 500;

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
  const [debouncedQ, setDebouncedQ] = useState("");
  const [soloConExistencia, setSoloConExistencia] = useState(false);
  const [orderDir, setOrderDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState([]);

  const canFetch = useMemo(() => Number(cveAlm) > 0, [cveAlm]);

  useEffect(() => {
    if (!canView) {
      showError("Acceso denegado", "No tienes permiso para ver inventarios.");
      nav("/home");
      return;
    }

    (async () => {
      try {
        const data = await apiGetAlmacenes();
        setAlmacenes(data);
      } catch (e) {
        await showError("Error al cargar almacenes", e, "No se pudieron cargar los almacenes disponibles.");
      }
    })();
  }, [canView, nav]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(q.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [q]);

  async function cargarTodo() {
    if (!canFetch) return;

    try {
      setLoading(true);

      let currentPage = 1;
      let total = 0;
      let collected = [];

      do {
        const data = await apiGetExistenciasPorAlmacen(Number(cveAlm), {
          page: currentPage,
          pageSize: API_PAGE_SIZE,
          soloConExistencia,
          orderBy: "exist",
          orderDir,
        });

        total = Number(data?.total || 0);
        collected = collected.concat(Array.isArray(data?.items) ? data.items : []);
        currentPage += 1;
      } while (collected.length < total);

      setAllItems(collected);
      setPage(1);
    } catch (e) {
      await showError("Error al cargar existencias", e, "No se pudieron consultar las existencias del almacén.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canFetch) {
      setAllItems([]);
      setPage(1);
      return;
    }

    cargarTodo();
  }, [cveAlm, soloConExistencia, orderDir]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  async function onCrearToma() {
    if (!canCrearToma) {
      await showError("Acceso denegado", "No tienes permiso para crear una toma física.");
      return;
    }
    if (!canFetch) {
      await showWarning("Almacén requerido", "Selecciona un almacén antes de crear la toma.");
      return;
    }

    const selected = almacenes.find((a) => String(a.cveAlm) === String(cveAlm));
    const confirmation = await confirmAction({
      title: "¿Crear toma física?",
      text: `Se iniciará una nueva toma para ${selected ? `${selected.cveAlm} - ${selected.descr}` : `el almacén ${cveAlm}`}.`,
      icon: "question",
      confirmButtonText: "Sí, crear toma",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      const r = await apiCrearToma(Number(cveAlm));
      await showSuccess("Toma creada", `La toma #${r.tomaId} fue creada correctamente.`);
      nav(`/inventario/tomas/${r.tomaId}`);
    } catch (e) {
      await showError("No se pudo crear la toma", e, "No fue posible crear la toma física para el almacén seleccionado.");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    const term = debouncedQ.toLowerCase();

    if (!term) return allItems;

    return allItems.filter((item) => {
      const codigo = String(item?.cveArt || "").toLowerCase();
      const descripcion = String(item?.descr || "").toLowerCase();
      return codigo.includes(term) || descripcion.includes(term);
    });
  }, [allItems, debouncedQ]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  }, [filteredItems.length]);

  const pagedItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const res = useMemo(() => {
    return {
      total: filteredItems.length,
      page,
      pageSize: PAGE_SIZE,
      items: pagedItems,
    };
  }, [filteredItems.length, page, pagedItems]);

  const getStockStatus = (exist, min, max) => {
    if (exist <= 0) return "text-red-400";
    if (min && exist < min) return "text-orange-400";
    if (max && exist > max) return "text-yellow-400";
    return "text-emerald-400";
  };

  const startRow = res.total === 0 ? 0 : (Math.min(page, totalPages) - 1) * PAGE_SIZE + 1;
  const endRow = res.total === 0 ? 0 : Math.min(Math.min(page, totalPages) * PAGE_SIZE, res.total);

  return (
    <AppLayout>
      <div className="w-full space-y-4">
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
                className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="bg-slate-800/30 rounded p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
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

            <div className="md:col-span-4">
              <label className="block text-xs text-slate-500 mb-1">Buscar producto</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  className="w-full pl-9 pr-10 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por código o descripción..."
                  disabled={!canFetch}
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                La búsqueda se actualiza automáticamente mientras escribes.
              </p>
            </div>

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

            <div className="md:col-span-2 flex items-end">
              <button
                className="w-full px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={cargarTodo}
                disabled={loading || !canFetch}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Total: <span className="text-white font-medium">{res.total}</span> productos
          </div>
        </div>

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
                        <span>{debouncedQ ? "No hay productos que coincidan con la búsqueda" : "No hay datos disponibles"}</span>
                      </div>
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Mostrando {startRow} - {endRow} de {res.total}
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={loading || page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Anterior</span>
              </button>

              <button
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={loading || page >= totalPages || res.total === 0}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
