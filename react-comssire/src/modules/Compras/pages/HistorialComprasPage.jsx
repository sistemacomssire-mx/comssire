// src/modules/Compras/pages/HistorialComprasPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import comprasApi from "../api/compras.api";
import { getAuthFromStorage } from "../utils/auth";
import { Toaster, toast } from "sonner";

// -------------------------
// Helpers
// -------------------------
function formatMoney(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatDateTime(isoOrDate) {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  return d.toLocaleString("es-MX", { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function canDownloadByEstado(estado) {
  return estado !== "Enviada" && estado !== "Rechazada";
}

function workerCanDownload(estado) {
  return estado === "Aprobada" || estado === "Exportada";
}

function canEditCompra(isAdmin, estado) {
  if (isAdmin) return true;
  return estado === "Borrador" || estado === "Rechazada";
}

function getNiceError(e) {
  const parsed = e?.response?.parsedData;
  if (parsed) return parsed;
  const data = e?.response?.data;
  if (data) return data;
  return e?.message || e;
}

function confirmToast(message, opts = {}) {
  return new Promise((resolve) => {
    const id = toast(message, {
      duration: Infinity,
      ...opts,
      action: {
        label: opts.okText || "Sí",
        onClick: () => {
          toast.dismiss(id);
          resolve(true);
        },
      },
      cancel: {
        label: opts.cancelText || "No",
        onClick: () => {
          toast.dismiss(id);
          resolve(false);
        },
      },
    });
  });
}

export default function HistorialComprasPage() {
  const navigate = useNavigate();

  const auth = useMemo(() => getAuthFromStorage(), []);
  const isAdmin = !!auth.isAdmin;

  // filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageSize, setPageSize] = useState(20);

  // data
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // pdf modal
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  }, [total, pageSize]);

  const loadData = async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        search: q?.trim() || null,
        estado: estado !== "Todos" ? estado : null,
        from: from || null,
        to: to || null,
        page: p,
        pageSize: Number(pageSize || 20),
      };

      const data = await comprasApi.getHistorial(params);
      const arr = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);
      setTotal(Number(data?.total ?? 0));
    } catch (e) {
      console.error("[HISTORIAL] error", getNiceError(e));
      toast.error("No se pudo cargar el historial.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  const onBuscar = () => {
    setPage(1);
    loadData(1);
  };

  const onLimpiar = () => {
    setQ("");
    setEstado("Todos");
    setFrom("");
    setTo("");
    setPageSize(20);
    setPage(1);
    loadData(1);
  };

  const closePdf = () => {
    setPdfOpen(false);
    setPdfTitle("");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const canUserDownload = (row) => {
    const est = row?.estado || "—";
    if (!canDownloadByEstado(est)) return false;
    if (isAdmin) return true;
    return workerCanDownload(est);
  };

  const canAdminDownloadMod = (row) => {
    const est = row?.estado || "—";
    return isAdmin && canDownloadByEstado(est);
  };

  const onViewPdf = async (row) => {
    try {
      const res = await comprasApi.getPdf(row.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfTitle(`Compra ${row.folioFactura || row.id}`);
      setPdfUrl(url);
      setPdfOpen(true);
    } catch (e) {
      console.error("[HISTORIAL] ver pdf error", getNiceError(e));
      toast.error("No se pudo abrir el PDF.");
    }
  };

  const onDownloadPdf = async (row) => {
    try {
      const res = await comprasApi.getPdf(row.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Compra_${row.folioFactura || row.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[HISTORIAL] descargar pdf error", getNiceError(e));
      toast.error("No se pudo descargar el PDF.");
    }
  };

  const onDownloadMod = async (row) => {
    try {
      const res = await comprasApi.getMod(row.id);
      const blob = new Blob([res.data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Compra_${String(row.modConsecutivo || "").padStart(9, "0") || row.id}.mod`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[HISTORIAL] descargar mod error", getNiceError(e));
      toast.error("No se pudo descargar el MOD.");
    }
  };

  const onEditar = async (row) => {
    const est = String(row?.estado || "");
    const isExport = est.toLowerCase() === "exportada";

    if (isAdmin && isExport) {
      const ok = await confirmToast(
        "Esta compra ya fue enviada al sistema Aspel. ¿Quieres actualizarla?",
        { okText: "Sí, actualizar", cancelText: "Cancelar" }
      );

      if (!ok) return;
    }

    navigate("/compras", { state: { editCompraId: row.id } });
  };

  const getEstadoBadgeClass = (estado) => {
    switch(estado) {
      case "Borrador": return "bg-slate-600 text-slate-200";
      case "Enviada": return "bg-blue-600/20 text-blue-300 border border-blue-500/30";
      case "Aprobada": return "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30";
      case "Rechazada": return "bg-red-600/20 text-red-300 border border-red-500/30";
      case "Exportada": return "bg-purple-600/20 text-purple-300 border border-purple-500/30";
      default: return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" richColors closeButton />
      
      <div className="w-full space-y-4">
        {/* Panel de filtros - compacto */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Historial de compras</h2>
            <span className="text-xs text-slate-500">
              {isAdmin ? "Admin: todas las compras" : "Operador: solo tus compras"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-3">
              <input
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                placeholder="Folio o proveedor"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <select 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                value={estado} 
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Borrador">Borrador</option>
                <option value="Enviada">Enviada</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
                <option value="Exportada">Exportada</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <input 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
              />
            </div>

            <div className="md:col-span-2">
              <input 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
              />
            </div>

            <div className="md:col-span-1">
              <select
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button 
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-1" 
                onClick={onBuscar} 
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{loading ? "..." : "Buscar"}</span>
              </button>
              <button 
                className="flex-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center gap-1" 
                onClick={onLimpiar} 
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de resultados */}
        <div className="bg-slate-800/30 rounded overflow-hidden">
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm font-medium text-white">
              Compras registradas ({total})
            </span>
            <div className="text-xs text-slate-500">
              Página {page} de {totalPages}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 text-slate-400 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-left px-3 py-2">Folio</th>
                  <th className="text-left px-3 py-2">Proveedor</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-left px-3 py-2">MOD</th>
                  <th className="text-right px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 text-white/80 whitespace-nowrap text-xs">
                      {formatDateTime(row.fecha)}
                    </td>

                    <td className="px-3 py-2 font-medium text-white text-xs">
                      {row.folioFactura || "—"}
                    </td>

                    <td className="px-3 py-2 text-white/70 text-xs max-w-[200px] truncate">
                      {row.proveedorNombre}
                    </td>

                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getEstadoBadgeClass(row.estado)}`}>
                        {row.estado || "—"}
                      </span>
                      {row.estado === "Rechazada" && row.motivoRechazo && (
                        <div className="text-[10px] text-red-400/70 mt-1 max-w-[150px] truncate" title={row.motivoRechazo}>
                          {row.motivoRechazo}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2 text-right text-white font-medium text-xs">
                      {formatMoney(row.total)}
                    </td>

                    <td className="px-3 py-2">
                      {row.modConsecutivo ? (
                        <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
                          {String(row.modConsecutivo).padStart(9, "0")}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        {/* Botón Ver PDF - Icono de ojo */}
                        <button
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          onClick={() => onViewPdf(row)}
                          disabled={!canUserDownload(row)}
                          title={!canUserDownload(row) ? "No disponible" : "Ver PDF"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Botón Descargar PDF - Icono de descarga */}
                        <button
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          onClick={() => onDownloadPdf(row)}
                          disabled={!canUserDownload(row)}
                          title={!canUserDownload(row) ? "No disponible" : "Descargar PDF"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>

                        {/* Botón Editar - Icono de lápiz */}
                        {canEditCompra(isAdmin, row.estado) ? (
                          <button
                            className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600/50 rounded transition-colors"
                            onClick={() => onEditar(row)}
                            title={isAdmin ? "Editar compra" : "Seguir editando"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        ) : null}

                        {/* Botón MOD - Icono de archivo/código */}
                        {isAdmin && canAdminDownloadMod(row) && (
                          <button
                            className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-600/50 rounded transition-colors"
                            onClick={() => onDownloadMod(row)}
                            title="Descargar MOD"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && (!items || items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      No hay resultados
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500 text-sm">
                      Cargando...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-4 py-2 border-t border-slate-700 flex justify-end gap-2">
            <button
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={page <= 1}
              onClick={() => {
                const p = Math.max(1, page - 1);
                setPage(p);
                loadData(p);
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>
            <button
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={page >= totalPages}
              onClick={() => {
                const p = Math.min(totalPages, page + 1);
                setPage(p);
                loadData(p);
              }}
            >
              <span>Siguiente</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal PDF */}
      {pdfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-5xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {pdfTitle}
              </h3>
              <button 
                className="p-1 text-slate-400 hover:text-white rounded"
                onClick={closePdf}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[70vh]">
              {pdfUrl && (
                <iframe 
                  title="pdf-viewer" 
                  src={pdfUrl} 
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}