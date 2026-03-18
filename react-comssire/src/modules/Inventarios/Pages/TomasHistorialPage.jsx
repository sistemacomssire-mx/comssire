import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { apiListarTomas, apiPdfToma } from "../api/tomas.api";
import { apiGetAlmacenes } from "../api/inventarios.api";
import { authStorage } from "../../Auth/store/auth.storage";
import PdfModal from "../components/PdfModal";

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "ABIERTA") return "BORRADOR";
  if (s === "CERRADA") return "COMPLETADA";
  if (s === "CANCELADA") return "CANCELADA";
  return s || "N/D";
}

function isDraft(status) {
  return String(status || "").toUpperCase() === "ABIERTA";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getStatusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  switch(s) {
    case "ABIERTA": return "bg-blue-600/20 text-blue-300 border border-blue-500/30";
    case "CERRADA": return "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30";
    case "CANCELADA": return "bg-red-600/20 text-red-300 border border-red-500/30";
    default: return "bg-slate-700 text-slate-300";
  }
}

function getStatusDot(status) {
  const s = String(status || "").toUpperCase();
  switch(s) {
    case "ABIERTA": return "bg-blue-400";
    case "CERRADA": return "bg-emerald-400";
    case "CANCELADA": return "bg-red-400";
    default: return "bg-slate-400";
  }
}

export default function TomasHistorialPage() {
  const nav = useNavigate();

  const canView = useMemo(() => {
    return authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.reporte");
  }, []);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [almacenes, setAlmacenes] = useState([]);
  const [cveAlm, setCveAlm] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);

  const closePdf = () => {
    setPdfOpen(false);
    setPdfTitle("");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  useEffect(() => {
    if (!canView) {
      toast.error("No tienes permiso para ver historial.");
      nav("/inventario");
      return;
    }

    (async () => {
      try {
        const a = await apiGetAlmacenes();
        setAlmacenes(a);
      } catch {
        // no bloquea
      }
    })();
  }, [canView, nav]);

  async function cargar() {
    try {
      setLoading(true);
      const data = await apiListarTomas({
        cveAlm: cveAlm ? Number(cveAlm) : undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setItems(data || []);
    } catch (e) {
      toast.error(e?.response?.data || "Error cargando historial");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onViewPdf(row) {
    try {
      setLoading(true);
      const blob = await apiPdfToma(row.id);
      const pdfBlob =
        blob?.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);

      setPdfTitle(`Toma #${row.id}`);
      setPdfUrl(url);
      setPdfOpen(true);
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo abrir el PDF.");
    } finally {
      setLoading(false);
    }
  }

  async function onDownloadPdf(row) {
    try {
      setLoading(true);
      const blob = await apiPdfToma(row.id);
      const pdfBlob =
        blob?.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
      downloadBlob(pdfBlob, `toma_${row.id}.pdf`);
      toast.success("PDF descargado");
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo descargar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <PdfModal open={pdfOpen} title={pdfTitle} url={pdfUrl} onClose={closePdf} />

      <div className="w-full space-y-4">
        {/* Header */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial de Tomas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtra, consulta detalles y reimprime PDF
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                onClick={() => nav("/inventario")}
                title="Volver a inventario"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button 
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5" 
                onClick={cargar} 
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Almacén</label>
              <select 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                value={cveAlm} 
                onChange={(e) => setCveAlm(e.target.value)}
              >
                <option value="">Todos</option>
                {almacenes.map((a) => (
                  <option key={a.cveAlm} value={a.cveAlm}>
                    {a.cveAlm} - {a.descr}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Estado</label>
              <select 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ABIERTA">BORRADOR</option>
                <option value="CERRADA">COMPLETADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <input 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <input 
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <button 
                className="w-full px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center justify-center gap-1" 
                onClick={cargar} 
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Aplicar filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de resultados */}
        <div className="bg-slate-800/30 rounded overflow-hidden">
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
            <span className="text-sm font-medium text-white">
              Tomas físicas ({items.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 text-slate-400 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Almacén</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-left px-3 py-2">Creada</th>
                  <th className="text-left px-3 py-2">Cerrada</th>
                  <th className="text-right px-3 py-2">Capturados</th>
                  <th className="text-right px-3 py-2">Diferencias</th>
                  <th className="text-right px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-2 font-mono text-xs text-white">#{t.id}</td>
                    <td className="px-3 py-2 text-xs">
                      <div className="text-white">{t.cveAlm}</div>
                      {t.almacenDescr && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{t.almacenDescr}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(t.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(t.status)}`} />
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-white/60">
                      {t.creadaEn ? String(t.creadaEn).replace("T", " ").slice(0, 16) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-white/60">
                      {t.cerradaEn ? String(t.cerradaEn).replace("T", " ").slice(0, 16) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span className="font-medium text-white">{t.capturados}</span>
                      <span className="text-slate-500">/{t.totalProductos}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span className={`font-medium ${
                        t.conDiferencia > 0 ? 'text-orange-400' : 'text-slate-400'
                      }`}>
                        {t.conDiferencia ?? 0}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        {isDraft(t.status) ? (
                          <>
                            <button 
                              className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-600/50 rounded transition-colors"
                              onClick={() => nav(`/inventario/tomas/${t.id}?resume=1`)}
                              title="Continuar toma"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button 
                              className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600/50 rounded transition-colors"
                              onClick={() => nav(`/inventario/tomas/${t.id}?edit=1`)}
                              title="Editar toma"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button 
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            onClick={() => nav(`/inventario/tomas/${t.id}`)}
                            title="Ver detalles"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}

                        <button 
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          onClick={() => onViewPdf(t)} 
                          disabled={loading}
                          title="Ver PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        <button 
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          onClick={() => onDownloadPdf(t)} 
                          disabled={loading}
                          title="Descargar PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>No hay tomas registradas</span>
                      </div>
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}