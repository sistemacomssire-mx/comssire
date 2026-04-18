import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import Swal from "sweetalert2";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import {
  apiVerToma,
  apiCapturarFisico,
  apiCerrarToma,
  apiReporteToma,
  apiPdfToma,
  apiCancelarToma,
} from "../api/tomas.api";
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


function isNumericLike(v) {
  if (v === "" || v === null || v === undefined) return false;
  const n = Number(v);
  return !Number.isNaN(n) && Number.isFinite(n);
}

function formatNum(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString();
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "ABIERTA") return "BORRADOR";
  if (s === "CERRADA") return "COMPLETADA";
  if (s === "CANCELADA") return "CANCELADA";
  return s || "N/D";
}

function diffRisk(existSistema, existFisico) {
  const sys = Number(existSistema || 0);
  const phy = Number(existFisico || 0);
  const diff = phy - sys;
  const abs = Math.abs(diff);
  const ratio = sys === 0 ? (phy === 0 ? 0 : 999) : abs / Math.max(sys, 1);
  const suspicious = phy >= 10000 || abs >= 50 || ratio >= 0.5;
  const strong = phy >= 50000 || abs >= 500 || ratio >= 1.0;
  return { diff, abs, ratio, suspicious, strong };
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

/* ─────────────────────── Botón de acción del header ─────────────────────── */
function HeaderBtn({ onClick, disabled, title, icon, label, variant = "ghost" }) {
  const variants = {
    ghost: "bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 border border-slate-200",
    blue: "bg-blue-600/80 hover:bg-blue-500 text-white border border-blue-500/40",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40",
    orange: "bg-orange-600 hover:bg-orange-500 text-white border border-orange-500/40",
    red: "bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

/* ─────────────────────── Card producto ─────────────────────── */
function ProductCard({ it, idx, draftFisico, loading, canCapturar, setFisico, inputRefs, onRequestConfirm }) {
  const raw = draftFisico[it.cveArt];
  const valid = raw === undefined || raw === "" ? true : isNumericLike(raw) && Number(raw) >= 0;

  const sys = Number(it.existSistema || 0);
  const phy = raw === "" || raw === undefined ? null : isNumericLike(raw) ? Number(raw) : null;
  const risk = phy === null ? null : diffRisk(sys, phy);

  // Estado visual de la card
  const cardState = it.capturado
    ? risk?.strong
      ? "danger"
      : risk?.suspicious
      ? "warn"
      : "done"
    : "pending";

  const stateStyles = {
    done: {
      border: "border-emerald-500/30",
      glow: "shadow-emerald-900/20",
      badge: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
      badgeLabel: "✓ Capturado",
      accent: "bg-emerald-500",
    },
    warn: {
      border: "border-yellow-500/40",
      glow: "shadow-yellow-900/20",
      badge: "bg-yellow-500/15 text-yellow-700 border-yellow-300",
      badgeLabel: "⚠ Revisar",
      accent: "bg-yellow-500",
    },
    danger: {
      border: "border-red-500/40",
      glow: "shadow-red-900/20",
      badge: "bg-red-500/15 text-red-700 border-red-300",
      badgeLabel: "⚡ Diferencia alta",
      accent: "bg-red-500",
    },
    pending: {
      border: "border-slate-200",
      glow: "",
      badge: "bg-white text-slate-700 border-slate-200",
      badgeLabel: "Pendiente",
      accent: "bg-slate-600",
    },
  };

  const s = stateStyles[cardState];

  return (
    <div
      className={`relative bg-white rounded-2xl border ${s.border} shadow-sm ${s.glow} hover:scale-[1.01] hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Barra de color izquierda */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} rounded-l-2xl`} />

      <div className="pl-4 pr-4 pt-3 pb-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 tracking-wide">{it.cveArt}</span>
              {it.uniMed && (
                <span className="text-[10px] bg-white text-slate-700 px-1.5 py-0.5 rounded-md font-medium">
                  {it.uniMed}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-0.5 leading-snug line-clamp-2" title={it.descr}>
              {it.descr || "Sin descripción"}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${s.badge}`}>
            {s.badgeLabel}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl px-2.5 py-2 text-center">
            <div className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Sistema</div>
            <div className="text-sm font-bold text-slate-900">{formatNum(it.existSistema)}</div>
          </div>

          <div className={`rounded-xl px-2.5 py-2 text-center ${it.capturado ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
            <div className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Físico</div>
            <div className={`text-sm font-bold ${it.capturado ? 'text-emerald-700' : 'text-slate-400'}`}>
              {it.capturado ? formatNum(it.existFisico) : "—"}
            </div>
          </div>

          <div className={`rounded-xl px-2.5 py-2 text-center ${it.capturado ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
            <div className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Dif.</div>
            <div className={`text-sm font-bold ${
              !it.capturado ? 'text-slate-500' :
              it.diferencia > 0 ? 'text-emerald-700' :
              it.diferencia < 0 ? 'text-red-600' :
              'text-slate-700'
            }`}>
              {it.capturado ? (it.diferencia > 0 ? `+${formatNum(it.diferencia)}` : formatNum(it.diferencia)) : "—"}
            </div>
          </div>
        </div>

        {/* Input captura */}
        <div>
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                ref={(r) => (inputRefs.current[it.cveArt] = r)}
                className={`w-full px-3 py-2 text-sm bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  !valid
                    ? 'border-red-500/60 focus:ring-red-500/20'
                    : raw !== undefined && raw !== ""
                    ? 'border-orange-500/50 focus:ring-orange-500/20'
                    : 'border-slate-200 focus:ring-slate-500/20'
                }`}
                value={raw ?? ""}
                onChange={(e) => setFisico(it.cveArt, e.target.value)}
                inputMode="decimal"
                placeholder="Ingresa conteo físico..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRequestConfirm(it, idx);
                }}
              />
              {raw !== undefined && raw !== "" && valid && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-400" />
              )}
            </div>
            <button
              className="w-10 h-10 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-900/30 flex-shrink-0"
              disabled={loading || !canCapturar}
              onClick={() => onRequestConfirm(it, idx)}
              title="Confirmar captura (Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
          {!valid && <p className="text-xs text-red-400 mt-1.5 pl-1">Número inválido</p>}
          {risk?.suspicious && valid && (
            <p className="text-xs text-yellow-400/80 mt-1.5 pl-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              Diferencia: {formatNum(risk.diff)} — revisa antes de confirmar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Page principal ─────────────────────── */
export default function TomaPage() {
  const { tomaId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const id = Number(tomaId);

  const qp = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const isEditMode = qp.get("edit") === "1";
  const isResumeMode = qp.get("resume") === "1";

  const canView = useMemo(() => authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.reporte"), []);
  const canCapturar = useMemo(() => authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.capturar"), []);
  const canCerrar = useMemo(() => authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.cerrar"), []);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [step, setStep] = useState("captura");

  const [soloNoCapturados, setSoloNoCapturados] = useState(isEditMode ? false : true);
  const [soloConExistencia, setSoloConExistencia] = useState(true);
  const [orderBy, setOrderBy] = useState("existDesc");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const fetchSize = 1000;

  const [draftFisico, setDraftFisico] = useState({});
  const [dirty, setDirty] = useState(false);
  const inputRefs = useRef({});


  const [review, setReview] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({});
  const [reviewDirty, setReviewDirty] = useState({});
  const reviewRefs = useRef({});

  function setFisico(cveArt, value) {
    setDraftFisico((prev) => ({ ...prev, [cveArt]: value }));
    setDirty(true);
  }

  async function cargar(nextPage = 1) {
    try {
      setLoading(true);
      const r = await apiVerToma(id, {
        page: 1,
        pageSize: fetchSize,
        orderBy: "cveArt",
        orderDir: "asc",
      });

      setData({ ...r, items: r.items || [] });
      setPage(nextPage);
      if (isResumeMode) setStep("captura");
    } catch (e) {
      await showError("Error al cargar toma", e, "No se pudo obtener la información de la toma.");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    if (!data) return;
    const items = data.items || [];
    const mapActual = new Map();
    for (const it of items) mapActual.set(it.cveArt, it);
    const entries = Object.entries(draftFisico).filter(([_, raw]) => raw !== "" && raw !== undefined && raw !== null);
    if (entries.length === 0) { setDirty(false); await showInfo("Sin cambios pendientes", "No hay capturas locales por guardar."); return; }
    const toSave = [];
    for (const [cveArt, raw] of entries) {
      if (!isNumericLike(raw)) continue;
      const v = Number(raw);
      if (v < 0) continue;
      const it = mapActual.get(cveArt);
      const saved = it?.existFisico;
      if (saved !== null && saved !== undefined && Number(saved) === v) continue;
      toSave.push([cveArt, v]);
    }
    if (toSave.length === 0) { setDirty(false); await showInfo("Sin cambios nuevos", "No hay capturas nuevas para guardar en el sistema."); return; }
    for (const [cveArt, v] of toSave) await apiCapturarFisico(id, cveArt, v);
    setDraftFisico({});
    setDirty(false);
    await showSuccess("Borrador guardado", `Se guardaron ${toSave.length} capturas correctamente.`);
    await cargar(page);
  }

  function discardDraft() {
    setDraftFisico({});
    setDirty(false);
    showInfo("Cambios descartados", "Las capturas locales se descartaron correctamente.");
  }

  useEffect(() => {
    const isActive = data?.toma?.status?.toUpperCase?.() === "ABIERTA";
    window.__COMSSIRE_TOMA_GUARD = { active: !!isActive, saveDraft, discard: discardDraft, tomaId: id };
    return () => { if (window.__COMSSIRE_TOMA_GUARD?.tomaId === id) window.__COMSSIRE_TOMA_GUARD = null; };
  }, [data?.toma?.status, id, draftFisico]);

  useEffect(() => {
    function onBeforeUnload(e) {
      const isActive = data?.toma?.status?.toUpperCase?.() === "ABIERTA";
      if (!isActive || !dirty) return;
      e.preventDefault(); e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, data?.toma?.status]);

  useEffect(() => {
    if (!canView) { showError("Acceso denegado", "No tienes permiso para ver tomas físicas."); nav("/inventario"); return; }
    if (!id) { showError("Toma inválida", "La toma solicitada no es válida o no existe."); nav("/inventario"); return; }
    cargar(1);
  }, [canView, id]);

  useEffect(() => {
    if (!id || step !== "captura") return;
    cargar(1);
  }, [id]);

  useEffect(() => {
    if (step !== "captura") return;
    setPage(1);
  }, [q, soloNoCapturados, soloConExistencia, orderBy, step]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        const el = document.getElementById("toma-search");
        if (el) { e.preventDefault(); el.focus(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") { e.preventDefault(); onRevision(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); onPdf(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, step]);

  async function requestConfirm(item, idx) {
    if (!canCapturar) {
      await showError("Acceso denegado", "No tienes permiso para capturar existencias.");
      return;
    }
    if (data?.toma?.status === "CERRADA") {
      await showWarning("Toma cerrada", "La toma ya fue finalizada y no admite más capturas.");
      return;
    }
    if (data?.toma?.status === "CANCELADA") {
      await showWarning("Toma cancelada", "La toma está cancelada y no admite cambios.");
      return;
    }
    const cveArt = item.cveArt;
    const raw = draftFisico[cveArt];
    if (raw === undefined || raw === "") {
      await showWarning("Captura requerida", "Ingresa la existencia física antes de confirmar.");
      return;
    }
    if (!isNumericLike(raw)) {
      await showWarning("Cantidad inválida", "La existencia física debe ser un número válido.");
      return;
    }
    const existFisico = Number(raw);
    if (existFisico < 0) {
      await showWarning("Cantidad inválida", "No se permiten cantidades negativas en la captura física.");
      return;
    }
    const { suspicious, strong, diff } = diffRisk(item.existSistema, existFisico);
    const prod = item.descr ? item.descr : cveArt;
    const confirmation = await confirmAction({
      title: "Confirmación de captura",
      text: strong
        ? `Se guardarán ${formatNum(existFisico)} unidades de ${prod}. La diferencia contra sistema es muy alta (${formatNum(diff)}).`
        : suspicious
        ? `Se guardarán ${formatNum(existFisico)} unidades de ${prod}. La diferencia contra sistema es considerable (${formatNum(diff)}).`
        : `¿Confirmas ${formatNum(existFisico)} unidades de ${prod}?`,
      confirmButtonText: "Sí, guardar captura",
      cancelButtonText: "Corregir",
      icon: suspicious || strong ? "warning" : "question",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      await apiCapturarFisico(id, item.cveArt, existFisico);
      await showSuccess("Captura guardada", `La captura del producto ${item.cveArt} se guardó correctamente.`);
      setDraftFisico((prev) => { const copy = { ...prev }; delete copy[item.cveArt]; return copy; });
      await cargar(page);
    } catch (e) {
      await showError("No se pudo guardar la captura", e, "No fue posible guardar la existencia física capturada.");
    } finally {
      setLoading(false);
    }
  }

  async function onRevision() {
    try {
      setLoading(true);
      const r = await apiReporteToma(id, { soloCapturados: false, soloDiferencias: false });
      setReview(r);
      setStep("revision");
      const nextDraft = {}, nextDirty = {};
      for (const it of r?.items || []) {
        nextDraft[it.cveArt] = it.existFisico === null || it.existFisico === undefined ? "" : String(it.existFisico);
        nextDirty[it.cveArt] = false;
      }
      setReviewDraft(nextDraft);
      setReviewDirty(nextDirty);
      await showSuccess("Revisión cargada", "La revisión de la toma está lista para validar diferencias.");
    } catch (e) {
      await showError("No se pudo cargar la revisión", e, "No fue posible preparar la revisión de la toma.");
    } finally {
      setLoading(false);
    }
  }

  async function onVolverCaptura() {
    setStep("captura");
    setReview(null);
    await cargar(1);
  }

  async function onFinalizar() {
    if (!canCerrar) {
      await showError("Acceso denegado", "No tienes permiso para finalizar la toma.");
      return;
    }
    if (data?.toma?.status === "CERRADA") {
      await showInfo("Toma completada", "La toma ya fue finalizada anteriormente.");
      return;
    }
    if (data?.toma?.status === "CANCELADA") {
      await showWarning("Toma cancelada", "La toma está cancelada y ya no puede finalizarse.");
      return;
    }

    const confirmation = await confirmAction({
      title: "¿Finalizar toma?",
      text: "La toma se marcará como completada y dejará de admitir capturas.",
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      icon: "warning",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      await apiCerrarToma(id);
      await showSuccess("Toma finalizada", "La toma fue finalizada correctamente.");
      setDraftFisico({}); setDirty(false);
      await cargar(1);
      setStep("captura");
    } catch (e) {
      await showError("No se pudo finalizar la toma", e, "No fue posible finalizar la toma seleccionada.");
    } finally {
      setLoading(false);
    }
  }

  async function onCancelar() {
    if (!canCerrar) {
      await showError("Acceso denegado", "No tienes permiso para cancelar la toma.");
      return;
    }

    const confirmation = await confirmAction({
      title: "¿Cancelar toma?",
      text: "La toma se cancelará y ya no podrá seguir capturándose.",
      confirmButtonText: "Sí, cancelar toma",
      cancelButtonText: "Regresar",
      icon: "warning",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      await apiCancelarToma(id);
      await showSuccess("Toma cancelada", "La toma fue cancelada correctamente.");
      setDraftFisico({}); setDirty(false);
      await cargar(1);
    } catch (e) {
      await showError("No se pudo cancelar la toma", e, "No fue posible cancelar la toma seleccionada.");
    } finally {
      setLoading(false);
    }
  }

  async function onPdf() {
    try {
      setLoading(true);
      const blob = await apiPdfToma(id);
      downloadBlob(blob, `toma_${id}.pdf`);
      await showSuccess("PDF generado", `El PDF de la toma #${id} se generó correctamente.`);
    } catch (e) {
      await showError("No se pudo generar el PDF", e, "No fue posible generar el PDF de la toma.");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveReviewRow(it) {
    if (!canCapturar) {
      await showError("Acceso denegado", "No tienes permiso para capturar existencias.");
      return;
    }
    if (data?.toma?.status === "CERRADA") {
      await showWarning("Toma cerrada", "La toma ya fue finalizada y no admite más ajustes.");
      return;
    }
    if (data?.toma?.status === "CANCELADA") {
      await showWarning("Toma cancelada", "La toma está cancelada y no admite cambios.");
      return;
    }
    const raw = reviewDraft[it.cveArt];
    if (raw === "" || raw === undefined || raw === null) {
      await showWarning("Captura requerida", "Ingresa la existencia física antes de guardar el ajuste.");
      return;
    }
    if (!isNumericLike(raw)) {
      await showWarning("Cantidad inválida", "La existencia física debe ser un número válido.");
      return;
    }
    const existFisico = Number(raw);
    if (existFisico < 0) {
      await showWarning("Cantidad inválida", "No se permiten cantidades negativas en la revisión.");
      return;
    }
    const { suspicious, strong, diff } = diffRisk(it.existSistema, existFisico);
    const prod = it.descr ? it.descr : it.cveArt;
    if (strong || suspicious) {
      const confirmation = await confirmAction({
        title: "Confirmación de ajuste",
        text: strong
          ? `Se guardarán ${formatNum(existFisico)} unidades de ${prod}. La diferencia es muy alta (${formatNum(diff)}).`
          : `Se guardarán ${formatNum(existFisico)} unidades de ${prod}. La diferencia es considerable (${formatNum(diff)}).`,
        confirmButtonText: "Sí, guardar ajuste",
        cancelButtonText: "Corregir",
        icon: "warning",
      });

      if (!confirmation.isConfirmed) return;
    }
    await saveReviewDirect(it.cveArt, existFisico);
  }

  async function saveReviewDirect(cveArt, existFisico) {
    try {
      setLoading(true);
      await apiCapturarFisico(id, cveArt, existFisico);
      await showSuccess("Ajuste guardado", `El ajuste del producto ${cveArt} se guardó correctamente.`);
      const r = await apiReporteToma(id, { soloCapturados: false, soloDiferencias: false });
      setReview(r);
      setReviewDirty((prev) => ({ ...prev, [cveArt]: false }));
    } catch (e) {
      await showError("No se pudo guardar el ajuste", e, "No fue posible guardar el ajuste de revisión.");
    } finally {
      setLoading(false);
    }
  }


  /* ── Loading ── */
  if (!data) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center gap-3 text-slate-700">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando toma #{tomaId}…</span>
        </div>
      </AppLayout>
    );
  }

  const toma = data.toma;
  const resumen = data.resumen;
  const items = data.items || [];
  const progress = resumen.totalProductos > 0 ? (resumen.capturados / resumen.totalProductos) * 100 : 0;

  const statusCfg = {
    ABIERTA: { bar: "bg-blue-500", ring: "bg-blue-400", pill: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    CERRADA: { bar: "bg-emerald-500", ring: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-700 border-emerald-300" },
    CANCELADA: { bar: "bg-red-500", ring: "bg-red-400", pill: "bg-red-500/15 text-red-700 border-red-300" },
  };
  const sc = statusCfg[toma.status] || statusCfg.ABIERTA;

  const normalizedQ = q.trim().toLowerCase();
  const filteredItems = (() => {
    let arr = Array.isArray(items) ? [...items] : [];

    if (soloNoCapturados) {
      arr = arr.filter((it) => !it.capturado);
    }

    if (soloConExistencia) {
      arr = arr.filter((it) => Number(it.existSistema || 0) > 0);
    }

    if (normalizedQ) {
      arr = arr.filter((it) => {
        const code = String(it.cveArt || "").toLowerCase();
        const descr = String(it.descr || "").toLowerCase();
        return code.includes(normalizedQ) || descr.includes(normalizedQ);
      });
    }

    arr.sort((a, b) => {
      if (orderBy === "existDesc") return Number(b.existSistema || 0) - Number(a.existSistema || 0);
      if (orderBy === "existAsc") return Number(a.existSistema || 0) - Number(b.existSistema || 0);
      return String(a.cveArt || "").localeCompare(String(b.cveArt || ""), "es", { numeric: true, sensitivity: "base" });
    });

    return arr;
  })();

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <AppLayout>

      <div className="w-full space-y-4">

        {/* ── Header ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Info izquierda */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Toma #{toma.id}</h2>
                  <p className="text-xs text-slate-500">Almacén {toma.cveAlm}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${sc.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.ring}`} />
                  {statusLabel(toma.status)}
                </span>

                <div className="flex items-center gap-1 bg-slate-50 rounded-full px-2.5 py-1 border border-slate-200">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Capturados:</span>
                  <span className="text-slate-900 font-semibold">{resumen.capturados}</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-900 font-semibold">{resumen.totalProductos}</span>
                </div>

                <div className="flex items-center gap-1 bg-yellow-500/10 rounded-full px-2.5 py-1 border border-yellow-500/20">
                  <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-yellow-700 font-semibold">{resumen.pendientes}</span>
                  <span className="text-yellow-700/70">pendientes</span>
                </div>

                {dirty && (
                  <div className="flex items-center gap-1 bg-orange-500/10 rounded-full px-2.5 py-1 border border-orange-500/20 animate-pulse">
                    <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                    <span className="text-orange-700 font-medium">Sin guardar</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Progreso de captura</span>
                  <span className="text-slate-900 font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${sc.bar}`}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              {/* Navegación */}
              <HeaderBtn
                onClick={() => nav("/inventario")}
                title="Volver al inventario"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>}
                label="Volver"
              />
              <HeaderBtn
                onClick={() => nav("/inventario/tomas")}
                title="Historial de tomas"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Historial"
              />

              {/* Separador visual */}
              <div className="w-px bg-slate-600 self-stretch" />

              {/* PDF */}
              <HeaderBtn
                onClick={onPdf}
                disabled={loading}
                title="Exportar PDF (Ctrl+P)"
                variant="ghost"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                label="PDF"
              />

              {/* Guardar borrador */}
              {toma.status === "ABIERTA" && (
                <HeaderBtn
                  onClick={saveDraft}
                  disabled={loading}
                  title="Guardar borrador"
                  variant={dirty ? "orange" : "ghost"}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                  label="Guardar"
                />
              )}

              {/* Revisión / Captura */}
              {step === "captura" ? (
                <HeaderBtn
                  onClick={onRevision}
                  disabled={loading}
                  title="Ir a revisión (Ctrl+R)"
                  variant="blue"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  label="Revisar"
                />
              ) : (
                <HeaderBtn
                  onClick={onVolverCaptura}
                  disabled={loading}
                  title="Volver a captura"
                  variant="ghost"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>}
                  label="Captura"
                />
              )}

              {/* Finalizar / Cancelar */}
              {toma.status !== "CERRADA" && toma.status !== "CANCELADA" && (
                <>
                  <HeaderBtn
                    onClick={onFinalizar}
                    disabled={loading || !canCerrar || step !== "revision"}
                    title="Finalizar toma"
                    variant="emerald"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    label="Finalizar"
                  />
                  <HeaderBtn
                    onClick={onCancelar}
                    disabled={loading || !canCerrar}
                    title="Cancelar toma"
                    variant="red"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                    label="Cancelar"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {step === "captura" ? (
          <>
            {/* ── Filtros ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                    Buscar producto
                    <span className="ml-1 text-slate-500">(Ctrl+F)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="toma-search"
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Descripción o código…"
                    />
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Opciones</label>
                  <div className="flex gap-4 flex-wrap pt-0.5">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-200 bg-white text-orange-500 focus:ring-orange-500/20"
                        checked={soloNoCapturados}
                        onChange={(e) => setSoloNoCapturados(e.target.checked)}
                      />
                      <span>Solo pendientes</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-200 bg-white text-orange-500 focus:ring-orange-500/20"
                        checked={soloConExistencia}
                        onChange={(e) => setSoloConExistencia(e.target.checked)}
                      />
                      <span>Con existencia</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Ordenar</label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
                    value={orderBy}
                    onChange={(e) => setOrderBy(e.target.value)}
                  >
                    <option value="existDesc">Mayor existencia</option>
                    <option value="existAsc">Menor existencia</option>
                    <option value="az">Código A-Z</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Lo que confirmes se guarda en BD. Los cambios sin confirmar los puedes guardar con <span className="text-slate-800 font-medium">Guardar borrador</span>.</span>
              </div>
            </div>

            {/* ── Grid de productos ── */}
            <div className="bg-white/95 border border-slate-200 rounded-2xl p-4">
              {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="font-medium">No hay resultados</p>
                  <p className="text-xs mt-1">Ajusta los filtros de búsqueda</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-slate-500">
                      Página <span className="text-slate-900 font-semibold">{safePage}</span> ·{" "}
                      <span className="text-slate-900 font-semibold">{filteredItems.length}</span> productos
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        disabled={loading || safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        title="Página anterior"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        disabled={loading || safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        title="Página siguiente"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleItems.map((it, idx) => (
                      <ProductCard
                        key={it.cveArt}
                        it={it}
                        idx={idx}
                        draftFisico={draftFisico}
                        loading={loading}
                        canCapturar={canCapturar}
                        setFisico={setFisico}
                        inputRefs={inputRefs}
                        onRequestConfirm={requestConfirm}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* ── Revisión ── */
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revisión antes de finalizar</h3>
                  <p className="text-xs text-slate-500">Corrige existencias físicas y guarda cada fila antes de finalizar.</p>
                </div>
              </div>

              {review?.resumen && (
                <div className="flex gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl px-3 py-1.5 text-center border border-slate-200">
                    <div className="text-slate-700">Capturados</div>
                    <div className="text-slate-900 font-bold">{review.resumen.capturados}</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-xl px-3 py-1.5 text-center border border-yellow-500/20">
                    <div className="text-yellow-700/70">Sin capturar</div>
                    <div className="text-yellow-300 font-bold">{review.resumen.sinCapturar}</div>
                  </div>
                  <div className="bg-orange-500/10 rounded-xl px-3 py-1.5 text-center border border-orange-500/20">
                    <div className="text-orange-400/70">Diferencias</div>
                    <div className="text-orange-300 font-bold">{review.resumen.conDiferencia}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs">
                  <tr>
                    <th className="text-left px-4 py-2.5">Producto</th>
                    <th className="text-left px-4 py-2.5">Código</th>
                    <th className="text-right px-4 py-2.5">Sistema</th>
                    <th className="text-right px-4 py-2.5">Físico</th>
                    <th className="text-right px-4 py-2.5">Diferencia</th>
                    <th className="text-right px-4 py-2.5">Guardar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {(review?.items || []).map((it, index) => {
                    const raw = reviewDraft[it.cveArt] ?? "";
                    const valid = raw === "" ? false : isNumericLike(raw) && Number(raw) >= 0;
                    const sys = Number(it.existSistema || 0);
                    const phy = valid ? Number(raw) : null;
                    const diff = phy === null ? null : phy - sys;
                    const dirtyRow = !!reviewDirty[it.cveArt];

                    return (
                      <tr key={it.cveArt} className="hover:bg-white/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="text-xs text-slate-900 font-medium">{it.descr || "—"}</div>
                          {it.uniMed && <div className="text-[10px] text-slate-500">{it.uniMed}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-800">{it.cveArt}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-800">{formatNum(it.existSistema)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <input
                            ref={(r) => (reviewRefs.current[it.cveArt] = r)}
                            className={`w-24 px-2 py-1.5 text-xs bg-white border rounded-lg text-right text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                              raw === "" ? "border-slate-200 focus:ring-slate-500/20"
                              : valid ? "border-slate-200 focus:ring-emerald-500/20"
                              : "border-red-500/60 focus:ring-red-500/20"
                            }`}
                            value={raw}
                            onChange={(e) => {
                              setReviewDraft((prev) => ({ ...prev, [it.cveArt]: e.target.value }));
                              setReviewDirty((prev) => ({ ...prev, [it.cveArt]: true }));
                            }}
                            inputMode="decimal"
                            placeholder="0"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") onSaveReviewRow(it);
                              if (e.key === "ArrowDown") {
                                const next = (review?.items || [])[index + 1];
                                if (next?.cveArt && reviewRefs.current[next.cveArt]) reviewRefs.current[next.cveArt].focus();
                              }
                              if (e.key === "ArrowUp") {
                                const prev = (review?.items || [])[index - 1];
                                if (prev?.cveArt && reviewRefs.current[prev.cveArt]) reviewRefs.current[prev.cveArt].focus();
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs">
                          {phy === null ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <span className={`font-bold ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-700"}`}>
                              {diff > 0 ? `+${formatNum(diff)}` : formatNum(diff)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={loading || !dirtyRow || !valid || !canCapturar}
                            onClick={() => onSaveReviewRow(it)}
                            title={!dirtyRow ? "Sin cambios" : "Guardar ajuste"}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Guardar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {(review?.items || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">Sin datos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
              </svg>
              Usa <kbd className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-900 text-[10px]">Enter</kbd> para guardar y{" "}
              <kbd className="mx-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-900 text-[10px]">↑ ↓</kbd> para navegar entre filas.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
