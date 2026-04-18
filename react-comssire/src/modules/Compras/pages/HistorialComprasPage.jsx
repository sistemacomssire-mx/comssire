import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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

function niceErrorText(e, fallback) {
  const data = getNiceError(e);
  if (typeof data === "string") return data;
  return data?.message || data?.Message || fallback;
}

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

/* ─── ESTADOS UNIFICADOS ───────────────────────────────────── */
function getStatusStyles(estadoValue) {
  switch (String(estadoValue || "").trim()) {
    case "Borrador":
      return {
        badge: {
          backgroundColor: "#f8fafc",
          color: "#475569",
          border: "1px solid #cbd5e1",
        },
        dot: { backgroundColor: "#94a3b8" },
        label: "Borrador",
      };
    case "Enviada":
      return {
        badge: {
          backgroundColor: "#eff6ff",
          color: "#2563eb",
          border: "1px solid #93c5fd",
        },
        dot: { backgroundColor: "#3b82f6" },
        label: "Enviada",
      };
    case "Aprobada":
      return {
        badge: {
          backgroundColor: "#ecfdf5",
          color: "#047857",
          border: "1px solid #86efac",
        },
        dot: { backgroundColor: "#10b981" },
        label: "Aprobada",
      };
    case "Rechazada":
      return {
        badge: {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fca5a5",
        },
        dot: { backgroundColor: "#ef4444" },
        label: "Rechazada",
      };
    case "Exportada":
      return {
        badge: {
          backgroundColor: "#fff7ed",
          color: "#ea580c",
          border: "1px solid #fdba74",
        },
        dot: { backgroundColor: "#f97316" },
        label: "Exportada",
      };
    default:
      return {
        badge: {
          backgroundColor: "#f8fafc",
          color: "#475569",
          border: "1px solid #cbd5e1",
        },
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
  backgroundColor: "#f97316", // orange-500
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border bg-white shadow-2xl"
        style={{ borderColor: "#cbd5e1" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ backgroundColor: "#f8fafc", borderColor: "#dbe4ee" }}
        >
          <div className="min-w-0 pr-2">
            <div className="truncate text-lg font-bold" style={{ color: "#0f172a" }}>
              {title || "PDF de compra"}
            </div>
            <div className="text-sm font-medium" style={{ color: "#64748b" }}>
              Vista previa · toca Cerrar o presiona ESC
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded flex items-center gap-1.5"
            style={{
              ...orangeButtonStyle,
              minHeight: "48px",
              minWidth: "110px",
            }}
            title="Cerrar PDF"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 bg-slate-200 p-2 sm:p-3">
          {url ? (
            <iframe
              title={title || "PDF"}
              src={url}
              className="h-full w-full rounded-2xl border bg-white"
              style={{ borderColor: "#cbd5e1" }}
            />
          ) : (
            <div
              className="flex h-full items-center justify-center rounded-2xl border bg-white"
              style={{ borderColor: "#cbd5e1" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: "#0f172a" }}>
                  No se pudo cargar el PDF
                </div>
                <div className="mt-1 text-sm" style={{ color: "#64748b" }}>
                  Intenta abrirlo nuevamente.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
      showError("No se pudo cargar el historial", niceErrorText(e, "No se pudo cargar el historial."));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  /* ✅ BÚSQUEDA AUTOMÁTICA */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [q, estado, from, to, pageSize]);

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
      showError("No se pudo abrir el PDF", niceErrorText(e, "No se pudo abrir el PDF."));
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
      showError("No se pudo descargar el PDF", niceErrorText(e, "No se pudo descargar el PDF."));
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
      showError("No se pudo descargar el MOD", niceErrorText(e, "No se pudo descargar el MOD."));
    }
  };

  const onEditar = async (row) => {
    const est = String(row?.estado || "");
    const isExport = est.toLowerCase() === "exportada";

    if (isAdmin && isExport) {
      const ok = await confirmAction({
        title: "¿Actualizar compra exportada?",
        text: `La compra ${row.folioFactura || row.id} ya fue enviada a Aspel. ¿Deseas abrirla para actualizarla?`,
        confirmButtonText: "Sí, actualizar",
        cancelButtonText: "Cancelar",
      });

      if (!ok.isConfirmed) return;
    }

    navigate("/compras", { state: { editCompraId: row.id } });
  };

  return (
    <AppLayout>
      <Toaster position="top-right" richColors closeButton />
      <PdfViewerModal open={pdfOpen} title={pdfTitle} url={pdfUrl} onClose={closePdf} />

      <div className="w-full space-y-5 pb-3">
        <div className="p-5" style={cardStyle}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold" style={{ color: "#0f172a" }}>
                <svg className="h-6 w-6" style={{ color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
                Historial de compras
              </h2>
              
            </div>

            <div className="flex flex-wrap gap-2 self-start">
              <span
                className="inline-flex min-h-[44px] items-center rounded-full border px-3 text-sm font-semibold"
                style={{
                  backgroundColor: "#f8fafc",
                  borderColor: "#dbe4ee",
                  color: "#475569",
                }}
              >
                {isAdmin ? "Admin: todas las compras" : "Operador: solo tus compras"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5" style={cardStyle}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Buscar
              </label>
              <input
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
                placeholder="Folio o proveedor"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Estado
              </label>
              <select
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
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

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Desde
              </label>
              <input
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Hasta
              </label>
              <input
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Registros
              </label>
              <select
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={orangeButtonStyle}
              onClick={onLimpiar}
              disabled={loading}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpiar
            </button>

            <div
              className="flex min-h-[44px] items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: loading ? "#fff7ed" : "#f8fafc",
                borderColor: loading ? "#fdba74" : "#dbe4ee",
                color: loading ? "#ea580c" : "#475569",
              }}
            >
              {loading ? "Buscando automáticamente..." : `Resultados: ${total}`}
            </div>
          </div>
        </div>

        <div style={cardStyle} className="overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ backgroundColor: "#eef4fa", borderColor: "#dbe4ee" }}
          >
            <span className="text-lg font-bold" style={{ color: "#1e3a5f" }}>
              Compras registradas ({total})
            </span>

            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#ea580c" }}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Cargando...
                </div>
              )}

              <div
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: "#bfd0e2",
                  backgroundColor: "#ffffff",
                  color: "#557397",
                }}
              >
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
                    <th
                      key={label}
                      className={`px-5 py-4 text-${align}`}
                      style={{ color: "#36567c", fontSize: "15px", fontWeight: 800 }}
                    >
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
                        <span className="text-base font-semibold" style={{ color: "#475569" }}>
                          No hay resultados
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {items.map((row, index) => {
                  const statusStyles = getStatusStyles(row.estado);

                  return (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#fbfdff",
                        borderTop: "1px solid #e6edf5",
                      }}
                    >
                      <td className="px-5 py-5 align-middle text-sm font-medium" style={{ color: "#334155" }}>
                        {formatDateTime(row.fecha)}
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-base font-bold" style={{ color: "#0f172a" }}>
                          {row.folioFactura || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="max-w-[260px] truncate text-sm font-semibold" style={{ color: "#36567c" }}>
                          {row.proveedorNombre}
                        </div>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
                          style={statusStyles.badge}
                        >
                          <span className="h-2 w-2 rounded-full" style={statusStyles.dot} />
                          {statusStyles.label}
                        </span>

                        {row.estado === "Rechazada" && row.motivoRechazo && (
                          <div
                            className="mt-1 max-w-[180px] truncate text-[11px] font-medium"
                            style={{ color: "#dc2626" }}
                            title={row.motivoRechazo}
                          >
                            {row.motivoRechazo}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-5 text-right align-middle">
                        <span className="text-base font-bold" style={{ color: "#0f172a" }}>
                          {formatMoney(row.total)}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        {row.modConsecutivo ? (
                          <span
                            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{
                              borderColor: "#bfd0e2",
                              backgroundColor: "#f5f9fd",
                              color: "#557397",
                            }}
                          >
                            {String(row.modConsecutivo).padStart(9, "0")}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "#94a3b8" }}>
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            tone="green"
                            onClick={() => onViewPdf(row)}
                            disabled={!canUserDownload(row)}
                            title={!canUserDownload(row) ? "No disponible" : "Ver PDF"}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </ActionButton>

                          <ActionButton
                            tone="slate"
                            onClick={() => onDownloadPdf(row)}
                            disabled={!canUserDownload(row)}
                            title={!canUserDownload(row) ? "No disponible" : "Descargar PDF"}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </ActionButton>

                          {canEditCompra(isAdmin, row.estado) ? (
                            <ActionButton
                              tone="orange"
                              onClick={() => onEditar(row)}
                              title={isAdmin ? "Editar compra" : "Seguir editando"}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </ActionButton>
                          ) : null}

                          {isAdmin && canAdminDownloadMod(row) && (
                            <ActionButton
                              tone="blue"
                              onClick={() => onDownloadMod(row)}
                              title="Descargar MOD"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="text-sm font-medium" style={{ color: "#64748b" }}>
                        Cargando...
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            className="flex justify-end gap-2 border-t px-5 py-4"
            style={{ backgroundColor: "#eef4fa", borderColor: "#dbe4ee" }}
          >
            <button
              className="inline-flex items-center gap-1 rounded-2xl border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "#cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
              }}
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
              className="inline-flex items-center gap-1 rounded-2xl border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "#fdba74",
                backgroundColor: "#fff7ed",
                color: "#ea580c",
              }}
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
    </AppLayout>
  );
}