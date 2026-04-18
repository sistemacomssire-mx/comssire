import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { apiListarTomas, apiPdfToma } from "../api/tomas.api";
import { apiGetAlmacenes } from "../api/inventarios.api";
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

function getStatusStyles(status) {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "ABIERTA":
      return {
        badge: {
          backgroundColor: "#eff6ff",
          color: "#2563eb",
          border: "1px solid #93c5fd",
        },
        dot: { backgroundColor: "#3b82f6" },
      };
    case "CERRADA":
      return {
        badge: {
          backgroundColor: "#ecfdf5",
          color: "#047857",
          border: "1px solid #86efac",
        },
        dot: { backgroundColor: "#10b981" },
      };
    case "CANCELADA":
      return {
        badge: {
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fca5a5",
        },
        dot: { backgroundColor: "#ef4444" },
      };
    default:
      return {
        badge: {
          backgroundColor: "#f8fafc",
          color: "#475569",
          border: "1px solid #cbd5e1",
        },
        dot: { backgroundColor: "#94a3b8" },
      };
  }
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
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
  backgroundColor: "#fff7ed",
  color: "#ea580c",
  border: "1px solid #fdba74",
  borderRadius: "14px",
  boxShadow: "0 6px 18px rgba(234, 88, 12, 0.12)",
};

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
              {title || "PDF de toma"}
            </div>
            <div className="text-sm font-medium" style={{ color: "#64748b" }}>
              Vista para tablet · toca Cerrar o presiona ESC
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
             className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex h-full items-center justify-center rounded-2xl border bg-white" style={{ borderColor: "#cbd5e1" }}>
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

function ActionButton({ title, onClick, disabled, tone = "slate", children }) {
  const tones = {
    slate: { backgroundColor: "#f8fafc", color: "#475569", borderColor: "#dbe4ee" },
    blue: { backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" },
    orange: { backgroundColor: "#fff7ed", color: "#ea580c", borderColor: "#fed7aa" },
    green: { backgroundColor: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" },
  };

  return (
    <button
      type="button"
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border p-2 transition active:scale-[0.98] disabled:opacity-60"
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

  const firstAutoLoad = useRef(true);

  const closePdf = () => {
    setPdfOpen(false);
    setPdfTitle("");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  useEffect(() => {
    if (!canView) {
      showError("Acceso denegado", "No tienes permiso para ver el historial de tomas.");
      nav("/inventario");
      return;
    }

    (async () => {
      try {
        const a = await apiGetAlmacenes();
        setAlmacenes(a || []);
      } catch {
        // no bloquea la vista
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
      await showError("Error al cargar historial", e, "No se pudo consultar el historial de tomas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (firstAutoLoad.current) {
      firstAutoLoad.current = false;
      return;
    }

    const timer = setTimeout(() => {
      cargar();
    }, 350);

    return () => clearTimeout(timer);
  }, [cveAlm, status, from, to]);

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
      await showError("No se pudo abrir el PDF", e, "No fue posible generar la vista previa del PDF de la toma.");
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
      await showSuccess("PDF descargado", `El PDF de la toma #${row.id} se descargó correctamente.`);
    } catch (e) {
      await showError("No se pudo descargar el PDF", e, "No fue posible descargar el PDF de la toma seleccionada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <PdfViewerModal open={pdfOpen} title={pdfTitle} url={pdfUrl} onClose={closePdf} />

      <div className="w-full space-y-5 pb-3">
        <div className="p-5" style={cardStyle}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold" style={{ color: "#0f172a" }}>
                <svg className="h-6 w-6" style={{ color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial de tomas
              </h2>
               
            </div>

            <div className="flex flex-wrap gap-2 self-start">
              <button
                type="button"
                 className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={orangeButtonStyle}
                onClick={() => nav("/inventario")}
                title="Volver a inventario"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </button>

              <button
                type="button"
                className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={orangeButtonStyle}
                onClick={cargar}
                disabled={loading}
                title="Recargar historial"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>

        <div className="p-5" style={cardStyle}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Almacén
              </label>
              <select
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
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

            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "#475569" }}>
                Estado
              </label>
              <select
                className="w-full px-4 py-3 text-base outline-none"
                style={inputStyle}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ABIERTA">BORRADOR</option>
                <option value="CERRADA">COMPLETADA</option>
                <option value="CANCELADA">CANCELADA</option>
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

            <div className="flex items-end">
              <div
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: loading ? "#fff7ed" : "#f8fafc",
                  borderColor: loading ? "#fdba74" : "#dbe4ee",
                  color: loading ? "#ea580c" : "#475569",
                }}
              >
                {loading ? "Actualizando historial..." : `Resultados: ${items.length}`}
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle} className="overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ backgroundColor: "#eef4fa", borderColor: "#dbe4ee" }}
          >
            <span className="text-lg font-bold" style={{ color: "#1e3a5f" }}>
              Tomas físicas ({items.length})
            </span>
            {loading && (
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#ea580c" }}>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Cargando...
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead style={{ backgroundColor: "#f8fbff" }}>
                <tr>
                  {[
                    ["ID", "left"],
                    ["Almacén", "left"],
                    ["Estado", "left"],
                    ["Creada", "left"],
                    ["Cerrada", "left"],
                    ["Capturados", "right"],
                    ["Diferencias", "right"],
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
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="h-10 w-10" style={{ color: "#94a3b8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-base font-semibold" style={{ color: "#475569" }}>
                          No hay tomas registradas con esos filtros
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {items.map((t, index) => {
                  const statusStyles = getStatusStyles(t.status);
                  return (
                    <tr
                      key={t.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#fbfdff",
                        borderTop: "1px solid #e6edf5",
                      }}
                    >
                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-base font-bold" style={{ color: "#0f172a" }}>
                          #{t.id}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="text-sm font-semibold uppercase" style={{ color: "#36567c" }}>
                          {t.almacenDescr || t.cveAlm || "—"}
                        </div>
                        {t.cveAlm && t.almacenDescr && (
                          <div className="mt-1 text-xs" style={{ color: "#64748b" }}>
                            {t.cveAlm}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
                          style={statusStyles.badge}
                        >
                          <span className="h-2 w-2 rounded-full" style={statusStyles.dot} />
                          {statusLabel(t.status)}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle text-sm font-medium" style={{ color: "#334155" }}>
                        {formatDate(t.creadaEn)}
                      </td>

                      <td className="px-5 py-5 align-middle text-sm font-medium" style={{ color: "#334155" }}>
                        {formatDate(t.cerradaEn)}
                      </td>

                      <td className="px-5 py-5 text-right align-middle">
                        <span className="text-base font-bold" style={{ color: "#0f172a" }}>
                          {t.capturados ?? 0}
                        </span>
                        <span className="ml-1 text-sm font-medium" style={{ color: "#64748b" }}>
                          /{t.totalProductos ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right align-middle">
                        <span
                          className="text-base font-bold"
                          style={{ color: (t.conDiferencia ?? 0) > 0 ? "#ea580c" : "#64748b" }}
                        >
                          {t.conDiferencia ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-5 align-middle">
                        <div className="flex justify-end gap-2">
                          {isDraft(t.status) ? (
                            <>
                              <ActionButton
                                tone="blue"
                                onClick={() => nav(`/inventario/tomas/${t.id}?resume=1`)}
                                title="Continuar toma"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </ActionButton>

                              <ActionButton
                                tone="orange"
                                onClick={() => nav(`/inventario/tomas/${t.id}?edit=1`)}
                                title="Editar toma"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </ActionButton>
                            </>
                          ) : (
                            <ActionButton
                              tone="slate"
                              onClick={() => nav(`/inventario/tomas/${t.id}`)}
                              title="Ver detalles"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </ActionButton>
                          )}

                          <ActionButton
                            tone="green"
                            onClick={() => onViewPdf(t)}
                            disabled={loading}
                            title="Ver PDF"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3v5h5" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6M9 17h6" />
                            </svg>
                          </ActionButton>

                          <ActionButton
                            tone="slate"
                            onClick={() => onDownloadPdf(t)}
                            disabled={loading}
                            title="Descargar PDF"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
