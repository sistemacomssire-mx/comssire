import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { comprasRemisionApi } from "../api/comprasRemision.api";
import { getAuthFromStorage } from "../utils/auth";

function formatMoney(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEstadoRemision(row) {
  return String(row?.estado || row?.estatus || row?.status || "Borrador").trim();
}

function getProveedorLabel(row) {
  return (
    row?.proveedorNombre ||
    row?.proveedor?.nombre ||
    row?.razonSocialProveedor ||
    row?.nombreProveedor ||
    row?.cveClpv ||
    "—"
  );
}

function getModLabel(row) {
  const value = row?.modConsecutivo ?? row?.mod ?? row?.modFolio ?? row?.consecutivoMod;
  if (!value && value !== 0) return null;
  return String(value).padStart(9, "0");
}

function getTotalRemision(row) {
  if (row?.total != null) return Number(row.total || 0);
  const partidas = Array.isArray(row?.partidas) ? row.partidas : [];
  const subtotal = partidas.reduce((acc, p) => {
    const cantidad = Number(p?.cantTotal ?? p?.cantidad ?? p?.cant ?? 0);
    const costo = Number(p?.costoUnitario ?? p?.costo ?? 0);
    return acc + cantidad * costo;
  }, 0);
  const iva = subtotal * 0.16;
  return subtotal + iva;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "archivo";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function getErrorMessage(e, fallback = "Ocurrió un error.") {
  return e?.response?.data?.message || e?.message || fallback;
}

const swalBase = {
  backdrop: "rgba(15, 23, 42, 0.22)",
  background: "#ffffff",
  heightAuto: false,
  allowOutsideClick: false,
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

function showError(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#dc2626",
  });
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

function confirmAction({ title, text, confirmButtonText = "Sí", cancelButtonText = "Cancelar", icon = "warning" }) {
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

function getStatusStyles(estadoValue) {
  switch (String(estadoValue || "").trim()) {
    case "Borrador":
      return {
        badge: { backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1" },
        dot: { backgroundColor: "#94a3b8" },
        label: "Borrador",
      };
    case "Enviada":
      return {
        badge: { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #93c5fd" },
        dot: { backgroundColor: "#3b82f6" },
        label: "Enviada",
      };
    case "Aprobada":
      return {
        badge: { backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #86efac" },
        dot: { backgroundColor: "#10b981" },
        label: "Aprobada",
      };
    case "Rechazada":
      return {
        badge: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" },
        dot: { backgroundColor: "#ef4444" },
        label: "Rechazada",
      };
    case "Exportada":
      return {
        badge: { backgroundColor: "#fff7ed", color: "#ea580c", border: "1px solid #fdba74" },
        dot: { backgroundColor: "#f97316" },
        label: "Exportada",
      };
    case "Guardada":
      return {
        badge: { backgroundColor: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" },
        dot: { backgroundColor: "#6366f1" },
        label: "Guardada",
      };
    default:
      return {
        badge: { backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1" },
        dot: { backgroundColor: "#94a3b8" },
        label: estadoValue || "—",
      };
  }
}

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dbe4ee",
  borderRadius: "20px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  border: "1px solid #bfd0e2",
  borderRadius: "16px",
  minHeight: "52px",
  boxShadow: "0 4px 14px rgba(148, 163, 184, 0.08)",
};

const orangeButtonStyle = {
  backgroundColor: "#f97316",
  color: "#ffffff",
  borderRadius: "14px",
  boxShadow: "0 6px 18px rgba(249, 115, 22, 0.28)",
};

function ActionButton({ title, onClick, disabled, tone = "slate", children }) {
  const tones = {
    slate: { backgroundColor: "#f8fafc", color: "#475569", borderColor: "#dbe4ee" },
    blue: { backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" },
    orange: { backgroundColor: "#fff7ed", color: "#ea580c", borderColor: "#fed7aa" },
    green: { backgroundColor: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" },
    red: { backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" },
  };

  return (
    <button
      type="button"
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border p-2 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={tones[tone] || tones.slate}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function PdfViewerModal({ open, title, url, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 sm:p-4" onClick={onClose}>
      <div
        className="relative flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border bg-white shadow-2xl"
        style={{ borderColor: "#cbd5e1" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5" style={{ backgroundColor: "#f8fafc", borderColor: "#dbe4ee" }}>
          <div className="min-w-0 pr-2">
            <div className="truncate text-lg font-bold" style={{ color: "#0f172a" }}>
              {title || "PDF de remisión"}
            </div>
            <div className="text-sm font-medium" style={{ color: "#64748b" }}>
              Vista previa · toca Cerrar o presiona ESC
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded flex items-center gap-1.5"
            style={{ ...orangeButtonStyle, minHeight: "48px", minWidth: "110px" }}
            title="Cerrar PDF"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 bg-slate-200 p-2 sm:p-3">
          {url ? (
            <iframe title={title || "PDF"} src={url} className="h-full w-full rounded-2xl border bg-white" style={{ borderColor: "#cbd5e1" }} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border bg-white" style={{ borderColor: "#cbd5e1" }}>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: "#0f172a" }}>No se pudo cargar el PDF</div>
                <div className="mt-1 text-sm" style={{ color: "#64748b" }}>Intenta abrirlo nuevamente.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistorialComprasRemisionPage() {
  const navigate = useNavigate();
  const auth = useMemo(() => getAuthFromStorage(), []);
  const isAdmin = !!auth?.isAdmin;

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageSize, setPageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (pageSize || 1))), [total, pageSize]);

  const applyFilters = (source, requestedPage = 1) => {
    const qValue = q.trim().toLowerCase();

    const filtered = (Array.isArray(source) ? source : []).filter((row) => {
      const rowEstado = getEstadoRemision(row);
      const rowDate = row?.fecha ? new Date(row.fecha) : null;
      const hayFrom = !!from;
      const hayTo = !!to;
      const fromDate = hayFrom ? new Date(`${from}T00:00:00`) : null;
      const toDate = hayTo ? new Date(`${to}T23:59:59`) : null;

      if (estado !== "Todos" && rowEstado !== estado) return false;
      if (fromDate && rowDate && rowDate < fromDate) return false;
      if (toDate && rowDate && rowDate > toDate) return false;

      if (!qValue) return true;

      const haystack = [
        row?.folioRemision,
        row?.id,
        getProveedorLabel(row),
        row?.numAlmaDefault,
        row?.observaciones,
        rowEstado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(qValue);
    });

    const start = (requestedPage - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    setItems(paginated);
    setTotal(filtered.length);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await comprasRemisionApi.getAll();
      const arr = Array.isArray(data) ? data : [];
      setAllItems(arr);
    } catch (e) {
      showError("No se pudo cargar el historial", getErrorMessage(e, "No se pudo cargar el historial de remisiones."));
      setAllItems([]);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      showError("Acceso restringido", "Este módulo solo está disponible para administradores.");
      navigate("/home", { replace: true });
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      applyFilters(allItems, 1);
    }, 350);
    return () => clearTimeout(timer);
  }, [q, estado, from, to, pageSize, allItems]);

  const onLimpiar = () => {
    setQ("");
    setEstado("Todos");
    setFrom("");
    setTo("");
    setPageSize(20);
    setPage(1);
  };

  const closePdf = () => {
    setPdfOpen(false);
    setPdfTitle("");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const onViewPdf = async (row) => {
    try {
      const { blob } = await comprasRemisionApi.downloadPdf(row.id);
      const url = URL.createObjectURL(blob);
      setPdfTitle(`Remisión ${row.folioRemision || row.id}`);
      setPdfUrl(url);
      setPdfOpen(true);
    } catch (e) {
      showError("No se pudo abrir el PDF", getErrorMessage(e, "No se pudo abrir el PDF."));
    }
  };

  const onDownloadPdf = async (row) => {
    try {
      const { blob, filename } = await comprasRemisionApi.downloadPdf(row.id);
      downloadBlob(blob, filename || `Remision_${row.folioRemision || row.id}.pdf`);
    } catch (e) {
      showError("No se pudo descargar el PDF", getErrorMessage(e, "No se pudo descargar el PDF."));
    }
  };

  const onDownloadMod = async (row) => {
    try {
      const { blob, filename } = await comprasRemisionApi.downloadMod(row.id);
      downloadBlob(blob, filename || `Remision_${getModLabel(row) || row.id}.mod`);
    } catch (e) {
      showError("No se pudo descargar el MOD", getErrorMessage(e, "No se pudo descargar el MOD."));
    }
  };

  const onEditar = (row) => {
    navigate("/compras-remision", { state: { editCompraRemisionId: row.id } });
  };

  const onEliminar = async (row) => {
    const ok = await confirmAction({
      title: "Eliminar remisión",
      text: `¿Deseas eliminar la remisión ${row.folioRemision || row.id}?`,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!ok.isConfirmed) return;

    try {
      setLoading(true);
      await comprasRemisionApi.remove(row.id);
      await showSuccess("Remisión eliminada", "El registro fue eliminado correctamente.");
      await loadData();
    } catch (e) {
      await showError("No se pudo eliminar", getErrorMessage(e, "Error al eliminar la remisión."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PdfViewerModal open={pdfOpen} title={pdfTitle} url={pdfUrl} onClose={closePdf} />

      <div className="w-full space-y-5 pb-3">
        <div className="p-5" style={cardStyle}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold" style={{ color: "#0f172a" }}>
                <svg className="h-6 w-6" style={{ color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
                Historial de compras remisión
              </h2>
              <p className="mt-1 text-sm font-medium" style={{ color: "#64748b" }}>
                Misma estructura visual de Historial Compras con filtros automáticos y acciones por icono.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 self-start">
              <span
                className="inline-flex min-h-[44px] items-center rounded-full border px-3 text-sm font-semibold"
                style={{ backgroundColor: "#f8fafc", borderColor: "#dbe4ee", color: "#475569" }}
              >
                {isAdmin ? "Admin: todas las remisiones" : "Operador: solo tus remisiones"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5" style={cardStyle}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>Buscar</label>
              <input
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
                placeholder="Folio o proveedor"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>Estado</label>
              <select className="w-full px-4 py-3 text-base outline-none" style={inputStyle} value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Borrador">Borrador</option>
                <option value="Guardada">Guardada</option>
                <option value="Enviada">Enviada</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
                <option value="Exportada">Exportada</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>Desde</label>
              <input className="w-full px-4 py-3 text-base outline-none" style={inputStyle} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>Hasta</label>
              <input className="w-full px-4 py-3 text-base outline-none" style={inputStyle} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>Registros</label>
              <select className="w-full px-4 py-3 text-base outline-none" style={inputStyle} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="px-3 py-1.5 text-sm rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" style={orangeButtonStyle} onClick={onLimpiar} disabled={loading}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar
            </button>

            <div className="flex min-h-[44px] items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold" style={{ backgroundColor: loading ? "#fff7ed" : "#f8fafc", borderColor: loading ? "#fdba74" : "#dbe4ee", color: loading ? "#ea580c" : "#475569" }}>
              {loading ? "Buscando automáticamente..." : `Resultados: ${total}`}
            </div>
          </div>
        </div>

        <div style={cardStyle} className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ backgroundColor: "#eef4fa", borderColor: "#dbe4ee" }}>
            <span className="text-lg font-bold" style={{ color: "#1e3a5f" }}>Remisiones registradas ({total})</span>

            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#ea580c" }}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Cargando...
                </div>
              )}

              <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#bfd0e2", backgroundColor: "#ffffff", color: "#557397" }}>
                Página {page} de {totalPages}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead style={{ backgroundColor: "#f8fbff" }}>
                <tr>
                  {[
                    ["Fecha", "left"],
                    ["Folio", "left"],
                    ["Proveedor", "left"],
                    ["Estado", "left"],
                    ["Total", "right"],
                    ["MOD", "left"],
                    ["Acciones", "right"],
                  ].map(([label, align]) => (
                    <th key={label} className={`px-5 py-4 text-${align}`} style={{ color: "#36567c", fontSize: "15px", fontWeight: 800 }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {!loading && (!items || items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="h-10 w-10" style={{ color: "#94a3b8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-base font-semibold" style={{ color: "#475569" }}>No hay resultados</span>
                      </div>
                    </td>
                  </tr>
                )}

                {items.map((row, index) => {
                  const statusStyles = getStatusStyles(getEstadoRemision(row));
                  const modLabel = getModLabel(row);

                  return (
                    <tr key={row.id || index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#fbfdff", borderTop: "1px solid #e6edf5" }}>
                      <td className="px-5 py-5 align-middle text-sm font-medium" style={{ color: "#334155" }}>{formatDateTime(row.fecha)}</td>

                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-base font-bold" style={{ color: "#0f172a" }}>{row.folioRemision || "—"}</span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="max-w-[260px] truncate text-sm font-semibold" style={{ color: "#36567c" }} title={getProveedorLabel(row)}>
                          {getProveedorLabel(row)}
                        </div>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={statusStyles.badge}>
                          <span className="h-2 w-2 rounded-full" style={statusStyles.dot} />
                          {statusStyles.label}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right align-middle">
                        <span className="text-base font-bold" style={{ color: "#0f172a" }}>{formatMoney(getTotalRemision(row))}</span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        {modLabel ? (
                          <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "#bfd0e2", backgroundColor: "#f5f9fd", color: "#557397" }}>
                            {modLabel}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="flex justify-end gap-2">
                          <ActionButton tone="green" onClick={() => onViewPdf(row)} disabled={loading} title="Ver PDF">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </ActionButton>

                          <ActionButton tone="slate" onClick={() => onDownloadPdf(row)} disabled={loading} title="Descargar PDF">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </ActionButton>

                          <ActionButton tone="orange" onClick={() => onEditar(row)} disabled={loading} title="Editar remisión">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </ActionButton>

                          <ActionButton tone="blue" onClick={() => onDownloadMod(row)} disabled={loading} title="Descargar MOD">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </ActionButton>

                          <ActionButton tone="red" onClick={() => onEliminar(row)} disabled={loading} title="Eliminar remisión">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M6 7h12" strokeWidth="2" strokeLinecap="round" />
                              <path d="M9 7V5h6v2" strokeWidth="2" strokeLinecap="round" />
                              <path d="m8 7 1 12h6l1-12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="text-sm font-medium" style={{ color: "#64748b" }}>Cargando...</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 border-t px-5 py-4" style={{ backgroundColor: "#eef4fa", borderColor: "#dbe4ee" }}>
            <button
              className="inline-flex items-center gap-1 rounded-2xl border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "#cbd5e1", backgroundColor: "#ffffff", color: "#475569" }}
              disabled={page <= 1}
              onClick={() => {
                const p = Math.max(1, page - 1);
                setPage(p);
                applyFilters(allItems, p);
              }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>

            <button
              className="inline-flex items-center gap-1 rounded-2xl border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "#fdba74", backgroundColor: "#fff7ed", color: "#ea580c" }}
              disabled={page >= totalPages}
              onClick={() => {
                const p = Math.min(totalPages, page + 1);
                setPage(p);
                applyFilters(allItems, p);
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
    </AppLayout>
  );
}
