import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
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

function ConfirmModal({
  open,
  title,
  message,
  warning,
  requireDoubleCheck,
  onCancel,
  onConfirm
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-lg p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-lg font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>

        <p className="text-sm text-slate-400 mb-4 leading-relaxed">{message}</p>

        {warning && (
          <div className="bg-orange-500/10 border border-orange-500/30 text-orange-300 p-3 rounded text-sm mb-4">
            {warning}
          </div>
        )}

        {requireDoubleCheck && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded text-sm mb-4">
            Esta cantidad parece muy diferente al sistema. Por favor confirma que el conteo físico es correcto.
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded"
            onClick={onCancel}
          >
            Corregir
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded font-medium"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TomaPage() {
  const { tomaId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const id = Number(tomaId);

  const qp = useMemo(
    () => new URLSearchParams(location.search || ""),
    [location.search]
  );
  const isEditMode = qp.get("edit") === "1";
  const isResumeMode = qp.get("resume") === "1";

  const canView = useMemo(
    () => authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.reporte"),
    []
  );
  const canCapturar = useMemo(
    () => authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.capturar"),
    []
  );
  const canCerrar = useMemo(
    () => authStorage.isAdmin() || authStorage.hasPerm("inventarios.toma.cerrar"),
    []
  );

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [step, setStep] = useState("captura");

  const [soloNoCapturados, setSoloNoCapturados] = useState(isEditMode ? false : true);
  const [soloConExistencia, setSoloConExistencia] = useState(true);
  const [orderBy, setOrderBy] = useState("existDesc");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [draftFisico, setDraftFisico] = useState({});
  const [dirty, setDirty] = useState(false);

  const inputRefs = useRef({});

  const [confirm, setConfirm] = useState({
    open: false,
    item: null,
    existFisico: null,
    idx: null,
    title: "",
    message: "",
    warning: null,
    requireDoubleCheck: false,
  });

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

      const backendOrderBy =
        orderBy === "az" ? "cveArt" : orderBy.includes("exist") ? "exist" : "cveArt";
      const backendOrderDir =
        orderBy === "existAsc" ? "asc" : orderBy === "existDesc" ? "desc" : "asc";

      const r = await apiVerToma(id, {
        q: q || undefined,
        soloNoCapturados,
        page: nextPage,
        pageSize,
        orderBy: backendOrderBy,
        orderDir: backendOrderDir,
      });

      let items = r.items || [];
      if (soloConExistencia) items = items.filter((x) => Number(x.existSistema || 0) > 0);

      setData({ ...r, items });
      setPage(r.page);

      if (isResumeMode) setStep("captura");
    } catch (e) {
      toast.error(e?.response?.data || "Error cargando toma");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    if (!data) return;

    const items = data.items || [];
    const mapActual = new Map();
    for (const it of items) mapActual.set(it.cveArt, it);

    const entries = Object.entries(draftFisico).filter(
      ([_, raw]) => raw !== "" && raw !== undefined && raw !== null
    );

    if (entries.length === 0) {
      setDirty(false);
      toast.success("No hay cambios locales por guardar.");
      return;
    }

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

    if (toSave.length === 0) {
      setDirty(false);
      toast.success("No hay cambios nuevos por guardar.");
      return;
    }

    toast.message(`Guardando ${toSave.length} capturas…`);
    for (const [cveArt, v] of toSave) {
      await apiCapturarFisico(id, cveArt, v);
    }

    setDraftFisico({});
    setDirty(false);
    toast.success("Guardado como borrador.");
    await cargar(page);
  }

  function discardDraft() {
    setDraftFisico({});
    setDirty(false);
    toast.message("Cambios locales descartados.");
  }

  useEffect(() => {
    const isActive = data?.toma?.status?.toUpperCase?.() === "ABIERTA";

    window.__COMSSIRE_TOMA_GUARD = {
      active: !!isActive,
      saveDraft,
      discard: discardDraft,
      tomaId: id,
    };

    return () => {
      if (window.__COMSSIRE_TOMA_GUARD?.tomaId === id) {
        window.__COMSSIRE_TOMA_GUARD = null;
      }
    };
  }, [data?.toma?.status, id, draftFisico]);

  useEffect(() => {
    function onBeforeUnload(e) {
      const isActive = data?.toma?.status?.toUpperCase?.() === "ABIERTA";
      if (!isActive) return;
      if (!dirty) return;

      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, data?.toma?.status]);

  useEffect(() => {
    if (!canView) {
      toast.error("No tienes permiso para ver tomas.");
      nav("/inventario");
      return;
    }
    if (!id) {
      toast.error("Toma inválida.");
      nav("/inventario");
      return;
    }
    cargar(1);
  }, [canView, id]);

  useEffect(() => {
    if (!id) return;
    if (step !== "captura") return;
    cargar(1);
  }, [soloNoCapturados, soloConExistencia, orderBy]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        const el = document.getElementById("toma-search");
        if (el) {
          e.preventDefault();
          el.focus();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        onRevision();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onPdf();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, step]);

  function requestConfirm(item, idx) {
    if (!canCapturar) return toast.error("No tienes permiso para capturar.");
    if (data?.toma?.status === "CERRADA") return toast.error("La toma está cerrada.");
    if (data?.toma?.status === "CANCELADA") return toast.error("La toma está cancelada.");

    const cveArt = item.cveArt;
    const raw = draftFisico[cveArt];

    if (raw === undefined || raw === "") return toast.error("Captura la existencia física.");
    if (!isNumericLike(raw)) return toast.error("Existencia física inválida.");

    const existFisico = Number(raw);
    if (existFisico < 0) return toast.error("No se permite negativo.");

    const { suspicious, strong, diff } = diffRisk(item.existSistema, existFisico);

    const prod = item.descr ? item.descr : cveArt;
    const baseMsg = `¿Estás seguro que tienes ${formatNum(existFisico)} unidades de ${prod}?`;
    const warning = strong
      ? `La diferencia contra sistema es MUY alta (${formatNum(diff)}). Revisa dos veces antes de confirmar.`
      : suspicious
      ? `La diferencia contra sistema es considerable (${formatNum(diff)}). ¿Confirmas que es correcto?`
      : null;

    setConfirm({
      open: true,
      item,
      existFisico,
      idx,
      title: "Confirmación de captura",
      message: baseMsg,
      warning,
      requireDoubleCheck: strong || suspicious,
    });
  }

  async function confirmSave() {
    const item = confirm.item;
    const idx = confirm.idx;
    const existFisico = confirm.existFisico;
    if (!item) return;

    try {
      setLoading(true);
      await apiCapturarFisico(id, item.cveArt, existFisico);
      toast.success(`Guardado ${item.cveArt}`);

      setDraftFisico((prev) => {
        const copy = { ...prev };
        delete copy[item.cveArt];
        return copy;
      });

      setConfirm({
        open: false,
        item: null,
        existFisico: null,
        idx: null,
        title: "",
        message: "",
        warning: null,
        requireDoubleCheck: false,
      });

      await cargar(page);

      const next = data?.items?.[idx + 1];
      if (next?.cveArt && inputRefs.current[next.cveArt]) {
        inputRefs.current[next.cveArt].focus();
      }
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo guardar");
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

      const nextDraft = {};
      const nextDirty = {};
      for (const it of r?.items || []) {
        nextDraft[it.cveArt] =
          it.existFisico === null || it.existFisico === undefined ? "" : String(it.existFisico);
        nextDirty[it.cveArt] = false;
      }
      setReviewDraft(nextDraft);
      setReviewDirty(nextDirty);

      toast.success("Revisión cargada");
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo cargar revisión");
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
    if (!canCerrar) return toast.error("No tienes permiso para finalizar.");
    if (data?.toma?.status === "CERRADA") return toast.error("Ya está completada.");
    if (data?.toma?.status === "CANCELADA") return toast.error("Está cancelada.");

    try {
      setLoading(true);
      await apiCerrarToma(id);
      toast.success("Toma finalizada (cerrada)");
      setDraftFisico({});
      setDirty(false);
      await cargar(1);
      setStep("captura");
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo finalizar");
    } finally {
      setLoading(false);
    }
  }

  async function onCancelar() {
    if (!canCerrar) return toast.error("No tienes permiso.");
    try {
      setLoading(true);
      await apiCancelarToma(id);
      toast.success("Toma cancelada");
      setDraftFisico({});
      setDirty(false);
      await cargar(1);
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo cancelar");
    } finally {
      setLoading(false);
    }
  }

  async function onPdf() {
    try {
      setLoading(true);
      const blob = await apiPdfToma(id);
      downloadBlob(blob, `toma_${id}.pdf`);
      toast.success("PDF generado");
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo generar PDF");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveReviewRow(it) {
    if (!canCapturar) return toast.error("No tienes permiso para capturar.");
    if (data?.toma?.status === "CERRADA") return toast.error("La toma está cerrada.");
    if (data?.toma?.status === "CANCELADA") return toast.error("La toma está cancelada.");

    const raw = reviewDraft[it.cveArt];
    if (raw === "" || raw === undefined || raw === null) {
      return toast.error("Captura la existencia física.");
    }
    if (!isNumericLike(raw)) return toast.error("Existencia física inválida.");

    const existFisico = Number(raw);
    if (existFisico < 0) return toast.error("No se permite negativo.");

    const { suspicious, strong, diff } = diffRisk(it.existSistema, existFisico);
    const prod = it.descr ? it.descr : it.cveArt;

    if (strong || suspicious) {
      setConfirm({
        open: true,
        item: { ...it, cveArt: it.cveArt },
        existFisico,
        idx: null,
        title: "Confirmación de ajuste",
        message: `¿Confirmas ${formatNum(existFisico)} unidades de ${prod}?`,
        warning: strong
          ? `La diferencia contra sistema es MUY alta (${formatNum(diff)}). Revisa dos veces antes de confirmar.`
          : `La diferencia contra sistema es considerable (${formatNum(diff)}). ¿Confirmas que es correcto?`,
        requireDoubleCheck: true,
        __mode: "review",
      });
      return;
    }

    await saveReviewDirect(it.cveArt, existFisico);
  }

  async function saveReviewDirect(cveArt, existFisico) {
    try {
      setLoading(true);
      await apiCapturarFisico(id, cveArt, existFisico);
      toast.success(`Guardado ${cveArt}`);

      const r = await apiReporteToma(id, { soloCapturados: false, soloDiferencias: false });
      setReview(r);

      setReviewDirty((prev) => ({ ...prev, [cveArt]: false }));
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  async function onConfirmModalAction() {
    const item = confirm.item;
    const existFisico = confirm.existFisico;

    if (!item) return;

    const mode = confirm.__mode || "capture";

    setConfirm({
      open: false,
      item: null,
      existFisico: null,
      idx: null,
      title: "",
      message: "",
      warning: null,
      requireDoubleCheck: false,
      __mode: "capture",
    });

    if (mode === "review") {
      await saveReviewDirect(item.cveArt, existFisico);
      return;
    }

    try {
      setLoading(true);
      await apiCapturarFisico(id, item.cveArt, existFisico);
      toast.success(`Guardado ${item.cveArt}`);

      setDraftFisico((prev) => {
        const copy = { ...prev };
        delete copy[item.cveArt];
        return copy;
      });

      await cargar(page);
    } catch (e) {
      toast.error(e?.response?.data || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando toma #{tomaId}...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const toma = data.toma;
  const resumen = data.resumen;
  const items = data.items || [];
  const progress = resumen.totalProductos > 0 ? (resumen.capturados / resumen.totalProductos) * 100 : 0;

  return (
    <AppLayout>
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        warning={confirm.warning}
        requireDoubleCheck={confirm.requireDoubleCheck}
        onCancel={() =>
          setConfirm({
            open: false,
            item: null,
            existFisico: null,
            idx: null,
            title: "",
            message: "",
            warning: null,
            requireDoubleCheck: false,
            __mode: "capture",
          })
        }
        onConfirm={onConfirmModalAction}
      />

      <div className="w-full space-y-4">
        {/* Header con información de la toma */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-base font-bold text-white">
                  Toma #{toma.id} — Almacén {toma.cveAlm}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${
                  toma.status === "ABIERTA" ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                  toma.status === "CERRADA" ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-red-600/20 text-red-300 border border-red-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    toma.status === "ABIERTA" ? 'bg-blue-400' :
                    toma.status === "CERRADA" ? 'bg-emerald-400' :
                    'bg-red-400'
                  }`} />
                  {statusLabel(toma.status)}
                </span>
                
                <span className="text-slate-500">•</span>
                
                <span className="text-slate-400">
                  Capturados: <span className="text-white font-medium">{resumen.capturados}</span>
                </span>
                
                <span className="text-slate-500">/</span>
                
                <span className="text-slate-400">
                  Total: <span className="text-white font-medium">{resumen.totalProductos}</span>
                </span>
                
                <span className="text-slate-500">•</span>
                
                <span className="text-slate-400">
                  Pendientes: <span className="text-yellow-400 font-medium">{resumen.pendientes}</span>
                </span>

                {dirty && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-yellow-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Cambios sin guardar
                    </span>
                  </>
                )}
              </div>

              {/* Barra de progreso */}
              <div className="w-full max-w-md mt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progreso</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 flex-wrap">
              <button 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                onClick={() => nav("/inventario")}
                title="Volver"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <button 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                onClick={() => nav("/inventario/tomas")}
                title="Historial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <button 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                onClick={onPdf} 
                disabled={loading}
                title="PDF (Ctrl+P)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>

              {toma.status === "ABIERTA" && (
                <button 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                  onClick={saveDraft} 
                  disabled={loading}
                  title="Guardar borrador"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </button>
              )}

              {step === "captura" ? (
                <button 
                  className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600/50 rounded transition-colors" 
                  onClick={onRevision} 
                  disabled={loading}
                  title="Revisar (Ctrl+R)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              ) : (
                <button 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                  onClick={onVolverCaptura} 
                  disabled={loading}
                  title="Volver a captura"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                </button>
              )}

              {toma.status !== "CERRADA" && toma.status !== "CANCELADA" && (
                <>
                  <button
                    className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1.5"
                    onClick={onFinalizar}
                    disabled={loading || !canCerrar || step !== "revision"}
                    title="Finalizar toma"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Finalizar</span>
                  </button>
                  
                  <button 
                    className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded flex items-center gap-1.5 border border-red-500/30" 
                    onClick={onCancelar} 
                    disabled={loading || !canCerrar}
                    title="Cancelar toma"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancelar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {step === "captura" ? (
          <>
            {/* Filtros de captura */}
            <div className="bg-slate-800/30 rounded p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <label className="block text-xs text-slate-500 mb-1">Buscar producto (Ctrl+F)</label>
                  <div className="flex gap-2">
                    <input
                      id="toma-search"
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Descripción o código..."
                    />
                    <button 
                      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-1" 
                      type="button" 
                      onClick={() => cargar(1)} 
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Filtrar</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs text-slate-500 mb-1">Opciones</label>
                  <div className="flex gap-3 flex-wrap">
                    <label className="flex items-center gap-1.5 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                        checked={soloNoCapturados}
                        onChange={(e) => setSoloNoCapturados(e.target.checked)}
                      />
                      <span>Solo pendientes</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                        checked={soloConExistencia}
                        onChange={(e) => setSoloConExistencia(e.target.checked)}
                      />
                      <span>Solo con existencia</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Ordenar por</label>
                  <select 
                    className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white" 
                    value={orderBy} 
                    onChange={(e) => setOrderBy(e.target.value)}
                  >
                    <option value="existDesc">Existencia (mayor a menor)</option>
                    <option value="existAsc">Existencia (menor a mayor)</option>
                    <option value="az">Código (A-Z)</option>
                  </select>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                ✅ Borrador: lo que confirmes se guarda en BD. Si escribes y no confirmas, puedes usar "Guardar borrador".
              </p>
            </div>

            {/* Lista de productos para captura */}
            <div className="bg-slate-800/30 rounded p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>No hay resultados</p>
                </div>
              ) : (
                <>
                  {/* Paginación */}
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                    <span>
                      Página <span className="text-white font-medium">{page}</span> • Mostrando{" "}
                      <span className="text-white font-medium">{items.length}</span> items
                    </span>
                    <div className="flex gap-1">
                      <button 
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={loading || page <= 1} 
                        onClick={() => cargar(page - 1)}
                        title="Página anterior"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={loading || items.length < pageSize} 
                        onClick={() => cargar(page + 1)}
                        title="Página siguiente"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Grid de productos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((it, idx) => {
                      const raw = draftFisico[it.cveArt];
                      const valid = raw === undefined || raw === "" ? true : isNumericLike(raw) && Number(raw) >= 0;

                      const sys = Number(it.existSistema || 0);
                      const phy = raw === "" || raw === undefined ? null : (isNumericLike(raw) ? Number(raw) : null);
                      const risk = phy === null ? null : diffRisk(sys, phy);

                      return (
                        <div key={it.cveArt} className="bg-slate-800/50 rounded-lg border border-slate-700 p-3 hover:border-slate-600 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-white">{it.cveArt}</span>
                                <span className="text-xs text-slate-500">{it.uniMed || ""}</span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5" title={it.descr}>
                                {it.descr || "—"}
                              </p>
                            </div>
                            
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              it.capturado 
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {it.capturado ? "Capturado" : "Pendiente"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Sistema:</span>
                              <span className="text-white font-medium">{formatNum(it.existSistema)}</span>
                            </div>

                            {it.capturado && (
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Guardado:</span>
                                <span className="text-white font-medium">{formatNum(it.existFisico)}</span>
                              </div>
                            )}

                            {it.capturado && (
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Diferencia:</span>
                                <span className={`font-medium ${
                                  it.diferencia > 0 ? 'text-emerald-400' : 
                                  it.diferencia < 0 ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                  {formatNum(it.diferencia)}
                                </span>
                              </div>
                            )}

                            <div className="pt-2">
                              <label className="block text-xs text-slate-500 mb-1">Físico contado</label>
                              <div className="flex gap-2">
                                <input
                                  ref={(r) => (inputRefs.current[it.cveArt] = r)}
                                  className={`flex-1 px-2 py-1.5 text-sm bg-slate-800 border rounded text-white ${
                                    valid ? 'border-slate-700' : 'border-red-500/50'
                                  }`}
                                  value={raw ?? ""}
                                  onChange={(e) => setFisico(it.cveArt, e.target.value)}
                                  inputMode="decimal"
                                  placeholder="0"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") requestConfirm(it, idx);
                                  }}
                                />
                                <button
                                  className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50"
                                  disabled={loading || !canCapturar}
                                  onClick={() => requestConfirm(it, idx)}
                                  title="Confirmar captura"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              </div>
                              {!valid && (
                                <p className="text-xs text-red-400 mt-1">Número inválido</p>
                              )}
                              {risk?.suspicious && (
                                <p className="text-xs text-yellow-400/70 mt-1">
                                  ⚠️ Diferencia: {formatNum(risk.diff)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          // Sección de revisión
          <div className="bg-slate-800/30 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Revisión antes de finalizar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aquí puedes corregir la existencia física en la tabla y guardar.
                </p>
              </div>

              {review?.resumen && (
                <div className="text-xs text-slate-400">
                  <span className="mr-3">
                    Capturados: <span className="text-white font-medium">{review.resumen.capturados}</span>
                  </span>
                  <span className="mr-3">
                    Sin capturar: <span className="text-yellow-400 font-medium">{review.resumen.sinCapturar}</span>
                  </span>
                  <span>
                    Con diferencia: <span className="text-orange-400 font-medium">{review.resumen.conDiferencia}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80 text-slate-400 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-left px-3 py-2">Código</th>
                    <th className="text-right px-3 py-2">Sistema</th>
                    <th className="text-right px-3 py-2">Físico</th>
                    <th className="text-right px-3 py-2">Diferencia</th>
                    <th className="text-right px-3 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {(review?.items || []).map((it, index) => {
                    const raw = reviewDraft[it.cveArt] ?? "";
                    const valid = raw === "" ? false : isNumericLike(raw) && Number(raw) >= 0;

                    const sys = Number(it.existSistema || 0);
                    const phy = valid ? Number(raw) : null;
                    const diff = phy === null ? null : phy - sys;

                    const dirtyRow = !!reviewDirty[it.cveArt];

                    return (
                      <tr key={it.cveArt} className="hover:bg-slate-700/30">
                        <td className="px-3 py-2">
                          <div className="text-xs text-white">{it.descr || "—"}</div>
                          <div className="text-[10px] text-slate-500">{it.uniMed || ""}</div>
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-white/80">{it.cveArt}</td>
                        <td className="px-3 py-2 text-right text-xs text-white/80">{formatNum(it.existSistema)}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            ref={(r) => (reviewRefs.current[it.cveArt] = r)}
                            className={`w-24 px-2 py-1 text-xs bg-slate-800 border rounded text-right text-white ${
                              raw === "" ? 'border-slate-700' : valid ? 'border-slate-600' : 'border-red-500/50'
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
                                if (next?.cveArt && reviewRefs.current[next.cveArt]) {
                                  reviewRefs.current[next.cveArt].focus();
                                }
                              }
                              if (e.key === "ArrowUp") {
                                const prev = (review?.items || [])[index - 1];
                                if (prev?.cveArt && reviewRefs.current[prev.cveArt]) {
                                  reviewRefs.current[prev.cveArt].focus();
                                }
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-xs">
                          {phy === null ? (
                            <span className="text-slate-600">—</span>
                          ) : (
                            <span className={`font-medium ${
                              diff > 0 ? 'text-emerald-400' : 
                              diff < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {formatNum(diff)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50 flex items-center gap-1 ml-auto"
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
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500 text-sm">
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Tip: Usa <span className="text-white">Enter</span> para guardar y{" "}
              <span className="text-white">↑/↓</span> para moverte entre filas.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}