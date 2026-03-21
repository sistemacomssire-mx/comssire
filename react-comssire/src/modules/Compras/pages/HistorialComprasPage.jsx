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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

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

  const getEstadoBadgeClass = (estadoValue) => {
    switch (estadoValue) {
      case "Borrador":
        return "bg-slate-100 text-slate-700 border border-slate-300";
      case "Enviada":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Aprobada":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Rechazada":
        return "bg-red-50 text-red-700 border border-red-200";
      case "Exportada":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-300";
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10";

  const softButton =
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 hover:border-orange-300 shadow-[0_8px_18px_rgba(250,137,26,0.08)]";

  const neutralButton =
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 shadow-[0_6px_16px_rgba(15,23,42,0.05)]";

  const iconButtonBase =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all";

  return (
    <AppLayout>
      <Toaster position="top-right" richColors closeButton />

      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-[1.35rem] border border-[#c7d6e6] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="border-b border-[#c7d6e6] bg-[linear-gradient(180deg,#fffaf4_0%,#fff6ea_100%)] px-5 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#5f7ea3]">
                  Historial
                </p>
                <h2 className="mt-1 text-[1.25rem] font-semibold text-[#0f2742]">
                  Historial de compras
                </h2>
              </div>

              <span className="inline-flex w-fit items-center rounded-full border border-[#bfd0e2] bg-[#f5f9fd] px-3 py-1.5 text-xs font-semibold text-[#557397]">
                {isAdmin ? "Admin: todas las compras" : "Operador: solo tus compras"}
              </span>
            </div>
          </div>

          <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <input
                  className={inputClass}
                  placeholder="Folio o proveedor"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <select
                  className={inputClass}
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
                  className={inputClass}
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <input
                  className={inputClass}
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="md:col-span-1">
                <select
                  className={inputClass}
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
                  className={`${softButton} flex-1`}
                  onClick={onBuscar}
                  disabled={loading}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>{loading ? "..." : "Buscar"}</span>
                </button>

                <button
                  className={`${neutralButton} flex-1`}
                  onClick={onLimpiar}
                  disabled={loading}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Limpiar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.35rem] border border-[#c7d6e6] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-[#c7d6e6] bg-[linear-gradient(180deg,#f7fbff_0%,#eef5fc_100%)] px-5 py-4">
            <span className="text-base font-semibold text-[#243f63]">
              Compras registradas ({total})
            </span>
            <div className="rounded-full border border-[#bfd0e2] bg-white px-3 py-1 text-xs font-semibold text-[#557397]">
              Página {page} de {totalPages}
            </div>
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#dfe9f3] text-[12px] uppercase tracking-wide text-[#49678f]">
                <tr>
                  <th className="px-4 py-4 text-left font-bold">Fecha</th>
                  <th className="px-4 py-4 text-left font-bold">Folio</th>
                  <th className="px-4 py-4 text-left font-bold">Proveedor</th>
                  <th className="px-4 py-4 text-left font-bold">Estado</th>
                  <th className="px-4 py-4 text-right font-bold">Total</th>
                  <th className="px-4 py-4 text-left font-bold">MOD</th>
                  <th className="px-4 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#d8e3ee]">
                {items.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-[#fff8f1] ${idx % 2 === 0 ? "bg-white" : "bg-[#fcfdff]"}`}
                  >
                    <td className="whitespace-nowrap px-4 py-5 text-xs text-[#557397]">
                      {formatDateTime(row.fecha)}
                    </td>

                    <td className="px-4 py-5 text-xs font-semibold text-[#0f2742]">
                      {row.folioFactura || "—"}
                    </td>

                    <td className="max-w-[240px] truncate px-4 py-5 text-xs text-[#48688f]">
                      {row.proveedorNombre}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getEstadoBadgeClass(row.estado)}`}
                      >
                        {row.estado || "—"}
                      </span>

                      {row.estado === "Rechazada" && row.motivoRechazo && (
                        <div
                          className="mt-1 max-w-[160px] truncate text-[10px] text-red-500"
                          title={row.motivoRechazo}
                        >
                          {row.motivoRechazo}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-5 text-right text-sm font-semibold text-[#0f2742]">
                      {formatMoney(row.total)}
                    </td>

                    <td className="px-4 py-5">
                      {row.modConsecutivo ? (
                        <span className="inline-flex rounded-full border border-[#bfd0e2] bg-[#f5f9fd] px-3 py-1 text-xs font-semibold text-[#557397]">
                          {String(row.modConsecutivo).padStart(9, "0")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          className={`${iconButtonBase} border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40`}
                          onClick={() => onViewPdf(row)}
                          disabled={!canUserDownload(row)}
                          title={!canUserDownload(row) ? "No disponible" : "Ver PDF"}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        <button
                          className={`${iconButtonBase} border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40`}
                          onClick={() => onDownloadPdf(row)}
                          disabled={!canUserDownload(row)}
                          title={!canUserDownload(row) ? "No disponible" : "Descargar PDF"}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>

                        {canEditCompra(isAdmin, row.estado) ? (
                          <button
                            className={`${iconButtonBase} border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100`}
                            onClick={() => onEditar(row)}
                            title={isAdmin ? "Editar compra" : "Seguir editando"}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        ) : null}

                        {isAdmin && canAdminDownloadMod(row) && (
                          <button
                            className={`${iconButtonBase} border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100`}
                            onClick={() => onDownloadMod(row)}
                            title="Descargar MOD"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      No hay resultados
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      Cargando...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#c7d6e6] bg-[linear-gradient(180deg,#f7fbff_0%,#eef5fc_100%)] px-5 py-4">
            <button
              className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => {
                const p = Math.max(1, page - 1);
                setPage(p);
                loadData(p);
              }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>

            <button
              className="inline-flex items-center gap-1 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => {
                const p = Math.min(totalPages, page + 1);
                setPage(p);
                loadData(p);
              }}
            >
              <span>Siguiente</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {pdfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[4px]">
          <div className="w-full max-w-5xl overflow-hidden rounded-[1.4rem] border border-[#c7d6e6] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[#c7d6e6] bg-[linear-gradient(180deg,#fffaf4_0%,#fff6ea_100%)] px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0f2742]">
                <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {pdfTitle}
              </h3>

              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                onClick={closePdf}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="h-[70vh] bg-white">
              {pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-full w-full" />}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}