import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { comprasApi } from "../api/compras.api";

import ComprasTopbar from "../components/ComprasTopbar";
import OrderHeader from "../components/OrderHeader";
import OrderForm from "../components/OrderForm";
import LinesSection from "../components/LinesSection";
import RigthCards from "../components/RigthCards";
import SplitModal from "../components/SplitModal";
import { getAuthFromStorage } from "../utils/auth";

// ========== UTILIDADES ==========
function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
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

function pickCompraId(obj) {
  return obj?.id ?? obj?.Id ?? obj?.compraId ?? obj?.CompraId ?? null;
}

function getFilenameFromHeaders(headers) {
  const cd = headers?.["content-disposition"] || headers?.["Content-Disposition"];
  if (!cd) return null;
  const match = /filename="([^"]+)"/i.exec(cd);
  return match?.[1] || null;
}

function getNiceError(e) {
  if (e?.isConflict) return { message: e.message, requireForce: true, estado: e.estado };
  const parsed = e?.response?.parsedData;
  if (parsed) return parsed;
  return e?.response?.data || e?.message || e;
}

function todayLocalDateInput() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateInputValue(value) {
  if (!value) return todayLocalDateInput();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === "string" && value.includes("T")) return value.slice(0, 10);

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayLocalDateInput();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

function getErrorMessage(e, fallback) {
  const nice = getNiceError(e);
  if (typeof nice === "string") return nice || fallback;
  return nice?.message || fallback;
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

function confirmToast(message, opts = {}) {
  return Swal.fire({
    ...swalBase,
    icon: opts.icon || "warning",
    title: opts.title || "Confirmar acción",
    text: message,
    showCancelButton: true,
    confirmButtonText: opts.okText || "Sí",
    cancelButtonText: opts.cancelText || "Cancelar",
    confirmButtonColor: opts.confirmButtonColor || "#ea580c",
    cancelButtonColor: opts.cancelButtonColor || "#64748b",
    reverseButtons: true,
    focusCancel: true,
  }).then((r) => r.isConfirmed);
}

// ========== COMPONENTE PRINCIPAL ==========
export default function ComprasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const editCompraId = location.state?.editCompraId || null;

  const auth = useMemo(() => getAuthFromStorage(), []);
  const isAdmin = !!auth?.isAdmin;

  // Estados
  const [proveedores, setProveedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  const [compraId, setCompraId] = useState(null);
  const [compraEstado, setCompraEstado] = useState("Borrador");
  const [motivoRechazo, setMotivoRechazo] = useState(null);

  const [folioFactura, setFolioFactura] = useState("");
  const [fecha, setFecha] = useState(() => todayLocalDateInput());
  const [proveedorSel, setProveedorSel] = useState("");
  const [almacenSel, setAlmacenSel] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [lines, setLines] = useState([]);

  const [piezaCodigo, setPiezaCodigo] = useState("");
  const [piezaDesc, setPiezaDesc] = useState("");
  const [piezaCant, setPiezaCant] = useState(1);
  const [piezaPrecio, setPiezaPrecio] = useState(0);
  const [almacenLineaSel, setAlmacenLineaSel] = useState("");
  const [existencias, setExistencias] = useState([]);

  const [saving, setSaving] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [forceMode, setForceMode] = useState(false);
  const [facturaFile, setFacturaFile] = useState(null);
  const [facturaPreview, setFacturaPreview] = useState("");
  const [facturaInfo, setFacturaInfo] = useState(null);
  const [subiendoFactura, setSubiendoFactura] = useState(false);

  // Refs
  const busyRef = useRef(false);
  const splitBusyRef = useRef(false);
  const editLoadRef = useRef(false);
  const lastSavedRef = useRef(null);

  // Modal split
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitDraft, setSplitDraft] = useState(null);

  // ========== SNAPSHOT PARA DETECTAR CAMBIOS ==========
  const snapshot = () => ({
    compraId,
    compraEstado,
    folioFactura,
    fecha,
    proveedorSel,
    almacenSel,
    observaciones,
    lines: (lines || []).map((l) => ({
      backendPartidaId: l.backendPartidaId || null,
      codigo: l.codigo || "",
      desc: l.desc || "",
      cant: Number(l.cant || 0),
      precio: Number(l.precio || 0),
      warehouse: String(l.warehouse || ""),
    })),
  });

  const markSaved = () => {
    lastSavedRef.current = JSON.stringify(snapshot());
    window.__COMSSIRE_DIRTY = false;
  };

  // Detectar cambios no guardados
  useEffect(() => {
    const current = JSON.stringify(snapshot());

    if (lastSavedRef.current === null) {
      lastSavedRef.current = current;
      window.__COMSSIRE_DIRTY = false;
      return;
    }

    window.__COMSSIRE_DIRTY = current !== lastSavedRef.current;
  }, [
    compraId,
    compraEstado,
    folioFactura,
    fecha,
    proveedorSel,
    almacenSel,
    observaciones,
    lines,
  ]);

  // Prevenir cierre con cambios no guardados
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!window.__COMSSIRE_DIRTY) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ========== CÁLCULOS ==========
  const totals = useMemo(() => {
    const subtotal = (lines || []).reduce((acc, l) => {
      const cant = Number(l?.cant || 0);
      const precio = Number(l?.precio || 0);
      return acc + cant * precio;
    }, 0);

    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return { items: (lines || []).length, subtotal, iva, total };
  }, [lines]);

  const isCompraExportada = useMemo(
    () => String(compraEstado || "").toLowerCase() === "exportada",
    [compraEstado]
  );

  const shouldForceExportada = isAdmin && isCompraExportada;

  const getWarehouseKey = (a) =>
    String(a?.cveAlm ?? a?.CveAlm ?? a?.numAlm ?? a?.NumAlm ?? "").trim();

  const getWarehouseNameByKey = (key) => {
    const normalized = String(key ?? "").trim();
    if (!normalized) return "sin almacén";

    const found = (almacenes || []).find(
      (a) => getWarehouseKey(a) === normalized
    );

    if (!found) return normalized;

    return String(
      found?.descr ??
        found?.Descr ??
        found?.nombre ??
        found?.Nombre ??
        found?.descripcion ??
        found?.Descripcion ??
        normalized
    ).trim();
  };

  const getLineDisplayName = (line) => {
    const descripcion = String(
      line?.desc ??
        line?.descr ??
        line?.descripcion ??
        line?.Descripcion ??
        ""
    ).trim();

    if (descripcion) return descripcion;

    const codigo = String(line?.codigo ?? line?.CveArt ?? "").trim();
    return codigo ? `pieza ${codigo}` : "pieza seleccionada";
  };

  // ========== FUNCIONES DE UTILIDAD ==========
  const clearDraft = () => {
    setCompraId(null);
    setCompraEstado("Borrador");
    setMotivoRechazo(null);
    setForceMode(false);

    setFolioFactura("");
    setFecha(todayLocalDateInput());
    setProveedorSel("");
    setAlmacenSel("");
    setObservaciones("");

    setLines([]);

    setPiezaCodigo("");
    setPiezaDesc("");
    setPiezaCant(1);
    setPiezaPrecio(0);
    setExistencias([]);
    setAlmacenLineaSel("");
    setSplitOpen(false);
    setSplitDraft(null);
    setFacturaFile(null);
    if (facturaPreview) window.URL.revokeObjectURL(facturaPreview);
    setFacturaPreview("");
    setFacturaInfo(null);

    editLoadRef.current = false;
    markSaved();
  };

  const buildCompraPayload = () => {
    const fechaIso = `${fecha}T12:00:00`;

    return {
      FolioFactura: String(folioFactura || "").trim(),
      Fecha: fechaIso,
      CveClpv: String(proveedorSel || "").trim(),
      NumAlmaDefault: Number(almacenSel || 0),
      Observaciones: observaciones || "",
    };
  };

  const buildPartidaPayload = (line) => ({
    CveArt: String(line.codigo || "").trim(),
    CantTotal: Number(line.cant),
    CostoUnitario: Number(line.precio),
    Observaciones: null,
    Repartos: [
      {
        NumAlm: Number(line.warehouse),
        Cant: Number(line.cant),
      },
    ],
  });

  const confirmIfExportada = async (action = "actualizar") => {
    if (!shouldForceExportada && !forceMode) return true;

    const message = forceMode
      ? "Modo forzado activado. ¿Continuar?"
      : `Esta compra ya fue exportada (MOD generado). ¿Deseas ${action}?`;

    return await confirmToast(message, {
      okText: "Sí, continuar",
      cancelText: "Cancelar"
    });
  };

  // ========== OPERACIONES CON MANEJO DE CONFLICTOS ==========
  const executeWithConflictHandler = async (operation, action, ...args) => {
    try {
      if (shouldForceExportada || forceMode) {
        setForceMode(true);
        return await operation(...args, true);
      }
      
      return await operation(...args, false);
    } catch (error) {
      if (error?.isConflict && error?.requireForce) {
        const confirmed = await confirmToast(
          error.message || "Esta compra ya fue exportada. ¿Deseas forzar la actualización?",
          { okText: "Sí, forzar", cancelText: "Cancelar" }
        );

        if (confirmed) {
          setForceMode(true);
          return await operation(...args, true);
        }
        
        throw new Error("Operación cancelada por el usuario");
      }
      
      throw error;
    }
  };

  // ========== OPERACIONES CRUD ==========
  const saveCompraHeader = async (id, payload, force = false) => {
    if (force || shouldForceExportada || forceMode) {
      return await comprasApi.updateCompraForce(id, payload);
    }
    return await comprasApi.updateCompra(id, payload);
  };

  const addCompraPartida = async (id, payload, force = false) => {
    if (force || shouldForceExportada || forceMode) {
      return await comprasApi.addPartidaForce(id, payload);
    }
    return await comprasApi.addPartida(id, payload);
  };

  const updateCompraPartida = async (id, partidaId, payload, force = false) => {
    if (force || shouldForceExportada || forceMode) {
      return await comprasApi.updatePartidaForce(id, partidaId, payload);
    }
    return await comprasApi.updatePartida(id, partidaId, payload);
  };

  const deleteCompraPartida = async (id, partidaId, force = false) => {
    if (force || shouldForceExportada || forceMode) {
      return await comprasApi.deletePartidaForce(id, partidaId);
    }
    return await comprasApi.deletePartida(id, partidaId);
  };

  // ========== ENSURE COMPRA ==========
  const ensureCompra = async () => {
    if (compraId) return compraId;

    const created = await comprasApi.crearCompra(buildCompraPayload());
    const id = pickCompraId(created);

    if (!id) {
      throw new Error("No se pudo obtener compraId al crear.");
    }

    setCompraId(id);
    setCompraEstado(String(created?.estado ?? created?.Estado ?? "Borrador"));
    markSaved();

    return id;
  };

  // ========== REMAPEO DE LÍNEAS (ASYNC: obtiene descripción del catálogo) ==========
  const remapCompraToLines = async (compraActualizada, fallbackAlmacen = "") => {
    const partidas = compraActualizada?.partidas ?? compraActualizada?.Partidas ?? [];
    const arr = Array.isArray(partidas) ? partidas : [];

    const almaDef =
      compraActualizada?.numAlmaDefault ??
      compraActualizada?.NumAlmaDefault ??
      fallbackAlmacen ??
      "";

    const lines = await Promise.all(
      arr.map(async (p) => {
        const partidaId = p?.id ?? p?.Id ?? null;
        const codigo = String(p?.cveArt ?? p?.CveArt ?? "").trim();
        const cant = Number(p?.cantTotal ?? p?.CantTotal ?? 0);
        const precio = Number(p?.costoUnitario ?? p?.CostoUnitario ?? 0);

        // Intentar obtener descripción del propio objeto primero
        let descripcion =
          p?.descr ||
          p?.Descr ||
          p?.descripcion ||
          p?.Descripcion ||
          p?.producto?.descr ||
          p?.producto?.Descr ||
          p?.producto?.descripcion ||
          p?.producto?.Descripcion ||
          "";

        // Si no viene en la partida, consultarla al catálogo de productos
        if (!descripcion && codigo) {
          try {
            const prod = await comprasApi.getProductoByCodigo(codigo);
            descripcion =
              prod?.descr ??
              prod?.Descr ??
              prod?.descripcion ??
              prod?.Descripcion ??
              "";
          } catch (e) {
            console.warn("[COMPRAS] No se pudo obtener descripción para:", codigo, e);
          }
        }

        const rep = p?.repartos ?? p?.Repartos ?? [];
        const repArr = Array.isArray(rep) ? rep : [];
        const first = repArr.length ? repArr[0] : null;
        const wh = first?.numAlm ?? first?.NumAlm ?? almaDef ?? "";

        return {
          backendPartidaId: partidaId,
          codigo,
          desc: descripcion,
          cant,
          precio,
          warehouse: String(wh ?? ""),
        };
      })
    );

    return lines;
  };

  const loadFactura = async (id) => {
    if (!id) {
      setFacturaInfo(null);
      return;
    }

    try {
      const data = await comprasApi.getFactura(id);
      setFacturaInfo(data || null);
    } catch (e) {
      console.error("[COMPRAS] error cargando factura", getNiceError(e));
      setFacturaInfo(null);
    }
  };

  const handleFacturaChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFacturaFile(file);

    if (facturaPreview) {
      window.URL.revokeObjectURL(facturaPreview);
    }

    if (file) {
      setFacturaPreview(window.URL.createObjectURL(file));
    } else {
      setFacturaPreview("");
    }
  };

  const handleUploadFactura = async () => {
    if (isAdmin) {
      await showWarning("Acción no permitida", "El admin no puede anexar factura en esta compra.");
      return;
    }

    if (!facturaFile) {
      await showWarning("Imagen requerida", "Selecciona una imagen primero.");
      return;
    }

    const t = toast.loading("Subiendo factura…");

    try {
      setSubiendoFactura(true);
      const id = await ensureCompra();
      await comprasApi.uploadFactura(id, facturaFile);
      await loadFactura(id);
      setFacturaFile(null);
      if (facturaPreview) window.URL.revokeObjectURL(facturaPreview);
      setFacturaPreview("");
      toast.dismiss(t);
      await showSuccess("Factura subida", "La factura se subió correctamente.");
    } catch (e) {
      console.error("[COMPRAS] upload factura error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo subir la factura", getErrorMessage(e, "No se pudo subir la factura."));
    } finally {
      setSubiendoFactura(false);
    }
  };

  const handleDeleteFactura = async () => {
    if (!compraId) return;

    const ok = await confirmToast("¿Eliminar la factura adjunta?", {
      title: "Eliminar factura",
      okText: "Eliminar",
      cancelText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!ok) return;

    const t = toast.loading("Eliminando factura…");
    try {
      await comprasApi.deleteFactura(compraId);
      setFacturaInfo(null);
      toast.dismiss(t);
      await showSuccess("Factura eliminada", "La factura adjunta se eliminó correctamente.");
    } catch (e) {
      console.error("[COMPRAS] delete factura error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo eliminar la factura", getErrorMessage(e, "No se pudo eliminar la factura."));
    }
  };

  // ========== HANDLER PARA CAMBIO DE ALMACÉN ==========
  const handleChangeAlmacen = async (nuevoAlmacen) => {
    if (!nuevoAlmacen) return;

    if (!compraId) {
      setAlmacenSel(nuevoAlmacen);
      setAlmacenLineaSel(nuevoAlmacen);
      window.__COMSSIRE_DIRTY = true;
      return;
    }

    if (lines.length > 0) {
      const nombreNuevoAlmacen = getWarehouseNameByKey(nuevoAlmacen);
      const ok = await confirmToast(
        `El almacén principal cambiará a ${nombreNuevoAlmacen}. ¿Deseas actualizar también el almacén de todas las partidas existentes?`,
        { 
          title: "Cambiar almacén principal",
          okText: "Sí, actualizar todas", 
          cancelText: "No, solo encabezado" 
        }
      );

      if (ok) {
        setLines(prev => prev.map(line => ({
          ...line,
          warehouse: nuevoAlmacen
        })));
        await showSuccess("Almacenes sincronizados", "Se actualizó el almacén de todas las partidas existentes.");
      }
    }

    setAlmacenSel(nuevoAlmacen);
    setAlmacenLineaSel(nuevoAlmacen);
    window.__COMSSIRE_DIRTY = true;
  };

  // ========== HANDLER PARA SINCRONIZAR ALMACENES ==========
  const handleSyncWarehouses = async () => {
    if (!almacenSel) {
      return showWarning("Almacén requerido", "Selecciona un almacén primero.");
      return;
    }

    if (lines.length === 0) {
      return showInfo("Sin partidas", "No hay partidas para sincronizar.");
      return;
    }

    const nombreAlmacen = getWarehouseNameByKey(almacenSel);
    const ok = await confirmToast(
      `Todas las partidas usarán el almacén ${nombreAlmacen}.`,
      {
        title: "Sincronizar almacenes",
        okText: "Sí, sincronizar",
        cancelText: "Cancelar",
      }
    );

    if (!ok) return;

    setLines(prev => prev.map(line => ({
      ...line,
      warehouse: almacenSel
    })));

    window.__COMSSIRE_DIRTY = true;
    await showSuccess("Partidas sincronizadas", `Todas las partidas ahora usan el almacén: ${nombreAlmacen}.`);
  };

  // ========== ACTUALIZAR ALMACÉN DIRECTAMENTE EN BD ==========
  const handleUpdateWarehouseDirect = async (partidaId, nuevoAlmacen, lineIndex) => {
    if (!compraId || !partidaId) {
      handleChangeLineWarehouse(lineIndex, nuevoAlmacen);
      return;
    }

    const lineToUpdate = lines[lineIndex];
    const nombrePieza = getLineDisplayName(lineToUpdate);
    const nombreNuevoAlmacen = getWarehouseNameByKey(nuevoAlmacen);

    const ok = await confirmToast(
      `La partida "${nombrePieza}" se moverá al almacén ${nombreNuevoAlmacen}.`,
      {
        title: "Actualizar almacén",
        okText: "Sí, actualizar",
        cancelText: "Cancelar",
      }
    );

    if (!ok) return;

    const t = toast.loading("Actualizando almacén...");

    try {
      setSaving(true);
      
      if (!lineToUpdate) return;

      const payload = buildPartidaPayload({
        codigo: lineToUpdate.codigo,
        cant: lineToUpdate.cant,
        precio: lineToUpdate.precio,
        warehouse: nuevoAlmacen,
      });

      await executeWithConflictHandler(
        updateCompraPartida,
        "actualizar almacén",
        compraId,
        partidaId,
        payload
      );

      handleChangeLineWarehouse(lineIndex, nuevoAlmacen);

      toast.dismiss(t);
      await showSuccess("Almacén actualizado", `La partida "${nombrePieza}" ahora usa el almacén ${nombreNuevoAlmacen}.`);
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] error actualizando almacén:", e);
      toast.dismiss(t);
      await showError("No se pudo actualizar el almacén", getErrorMessage(e, "No se pudo actualizar el almacén."));
    } finally {
      setSaving(false);
    }
  };

  // ========== CARGA INICIAL ==========
  useEffect(() => {
    (async () => {
      try {
        setLoadingCatalogos(true);

        const [prov, alm] = await Promise.all([
          comprasApi.getProveedores(),
          comprasApi.getAlmacenes(),
        ]);

        const provArr = Array.isArray(prov) ? prov : [];
        const almArr = Array.isArray(alm) ? alm : [];

        setProveedores(provArr);
        setAlmacenes(almArr);

        const p0 = provArr[0];
        const a0 = almArr[0];

        if (p0 && !proveedorSel) {
          const k = String(p0?.clave ?? p0?.Clave ?? "");
          if (k) setProveedorSel(k);
        }

        if (a0 && !almacenSel) {
          const k = String(a0?.cveAlm ?? a0?.CveAlm ?? "");
          if (k) {
            setAlmacenSel(k);
            setAlmacenLineaSel(k);
          }
        }
      } catch (e) {
        console.error("[COMPRAS] catálogos error", getNiceError(e));
        await showError("Catálogos no disponibles", getErrorMessage(e, "No se pudieron cargar catálogos."));
      } finally {
        setLoadingCatalogos(false);
      }
    })();
  }, []);

  // ========== CARGA PARA EDICIÓN ==========
  useEffect(() => {
    if (!editCompraId) return;
    if (editLoadRef.current) return;

    editLoadRef.current = true;

    (async () => {
      const t = toast.loading("Cargando compra para edición…");

      try {
        const compra = await comprasApi.getCompra(editCompraId);

        const estado = String(compra?.estado ?? compra?.Estado ?? "Borrador");
        const isExport = estado.toLowerCase() === "exportada";

        if (isAdmin && isExport) {
          const ok = await confirmToast(
            "Esta compra ya fue exportada (MOD generado). ¿Deseas actualizarla?",
            { okText: "Sí, actualizar", cancelText: "Cancelar" }
          );

          if (!ok) {
            toast.dismiss(t);
            navigate("/compras/historial", { replace: true });
            return;
          }
          setForceMode(true);
        }

        setCompraId(editCompraId);
        setCompraEstado(estado);
        setMotivoRechazo(compra?.motivoRechazo ?? compra?.MotivoRechazo ?? null);

        setFolioFactura(
          String(compra?.folioFactura ?? compra?.FolioFactura ?? "")
        );

        const f = compra?.fecha ?? compra?.Fecha;
        setFecha(toDateInputValue(f));

        setProveedorSel(String(compra?.cveClpv ?? compra?.CveClpv ?? ""));

        const almaDef = compra?.numAlmaDefault ?? compra?.NumAlmaDefault ?? "";
        if (almaDef !== "" && almaDef !== null && almaDef !== undefined) {
          setAlmacenSel(String(almaDef));
          setAlmacenLineaSel(String(almaDef));
        }

        setObservaciones(
          String(compra?.observaciones ?? compra?.Observaciones ?? "")
        );

        setLines(await remapCompraToLines(compra, almaDef));
        await loadFactura(editCompraId);

        toast.dismiss(t);
        await showSuccess("Compra cargada", "La compra se cargó correctamente para edición.");
        navigate("/compras", { replace: true, state: {} });
        markSaved();
      } catch (e) {
        console.error("[COMPRAS] cargar edición error", getNiceError(e));
        toast.dismiss(t);
        await showError("No se pudo cargar la compra", getErrorMessage(e, "No se pudo cargar la compra."));
        editLoadRef.current = false;
      }
    })();
  }, [editCompraId, isAdmin, navigate]);

  useEffect(() => {
    return () => {
      if (facturaPreview) window.URL.revokeObjectURL(facturaPreview);
    };
  }, [facturaPreview]);

  // ========== HANDLERS PRINCIPALES ==========
  const handleSaveHeader = async () => {
    const t = toast.loading("Guardando...");

    try {
      setSaving(true);
      const id = await ensureCompra();

      await executeWithConflictHandler(
        saveCompraHeader,
        "guardar",
        id,
        buildCompraPayload()
      );

      window.__COMSSIRE_DIRTY = false;
      markSaved();

      toast.dismiss(t);
      await showSuccess("Compra guardada", "Los cambios se guardaron correctamente.");
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] guardar cabecera error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo guardar", getErrorMessage(e, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  const handleLookupProducto = async () => {
    try {
      const code = String(piezaCodigo || "").trim();
      if (!code) return;

      const prod = await comprasApi.getProductoByCodigo(code);
      const descr = prod?.descr ?? prod?.Descr ?? "";
      const costo = prod?.ultCosto ?? prod?.UltCosto ?? prod?.costo ?? prod?.Costo ?? null;

      if (descr) setPiezaDesc(String(descr));
      if (costo !== null && costo !== undefined) {
        setPiezaPrecio(Number(costo));
      }

      const ex = await comprasApi.getExistencias(code);
      setExistencias(Array.isArray(ex) ? ex : []);
    } catch (e) {
      console.error("[COMPRAS] lookup producto error", getNiceError(e));
      await showError("Búsqueda fallida", getErrorMessage(e, "No se pudo buscar el producto."));
      setExistencias([]);
    }
  };

  const openSplit = (draft) => {
    setSplitDraft(draft);
    setSplitOpen(true);
  };

  const closeSplit = () => {
    setSplitOpen(false);
    setSplitDraft(null);
  };

  const handleSplitSave = async (rows) => {
    if (splitBusyRef.current) return;
    if (!splitDraft) return;

    splitBusyRef.current = true;
    const t = toast.loading("Creando partidas por almacén…");

    try {
      setSaving(true);
      const id = await ensureCompra();

      const clean = (rows || [])
        .map((r) => ({
          warehouse: String(r.warehouse || "").trim(),
          qty: Number(r.qty || 0),
        }))
        .filter((r) => r.warehouse && r.qty > 0);

      if (!clean.length) {
        toast.dismiss(t);
        await showWarning("Sin cantidades válidas", "No hay cantidades para repartir.");
        return;
      }

      const descripcionSplit = splitDraft.desc || "";

      for (const r of clean) {
        const payload = buildPartidaPayload({
          codigo: splitDraft.codigo,
          cant: r.qty,
          precio: splitDraft.precio,
          warehouse: r.warehouse,
        });

        await executeWithConflictHandler(
          addCompraPartida,
          "agregar partida",
          id,
          payload
        );
      }

      const compraActualizada = await comprasApi.getCompra(id);
      setCompraEstado(
        String(
          compraActualizada?.estado ??
            compraActualizada?.Estado ??
            compraEstado
        )
      );
      
      const nuevasLineas = await remapCompraToLines(compraActualizada, almacenSel);
      
      const lineasConDesc = nuevasLineas.map(line => {
        if (line.codigo === splitDraft.codigo && !line.desc) {
          return { ...line, desc: descripcionSplit };
        }
        return line;
      });
      
      setLines(lineasConDesc);

      setPiezaCodigo("");
      setPiezaDesc("");
      setPiezaCant(1);
      setPiezaPrecio(0);
      setExistencias([]);

      window.__COMSSIRE_DIRTY = false;
      markSaved();

      toast.dismiss(t);
      await showSuccess("Reparto creado", `La pieza "${descripcionSplit || `pieza ${splitDraft.codigo}`}" se repartió correctamente por almacén.`);
      closeSplit();
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] split save error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo crear el reparto", getErrorMessage(e, "No se pudo crear el reparto."));
    } finally {
      setSaving(false);
      splitBusyRef.current = false;
    }
  };

  const handleAddLine = async () => {
    if (busyRef.current) return;

    const codigo = String(piezaCodigo || "").trim();
    if (!codigo) return showWarning("Clave requerida", "Falta clave del producto.");
    if (!almacenLineaSel) {
      return showWarning("Almacén requerido", "Selecciona almacén para la partida.");
    }

    const cant = Number(piezaCant || 0);
    if (!Number.isFinite(cant) || cant <= 0) {
      return showWarning("Cantidad inválida", "La cantidad debe ser mayor a cero.");
    }

    const descripcionActual = String(piezaDesc || "").trim();

    if (cant >= 2) {
      const nombrePieza = descripcionActual || `pieza ${codigo}`;
      const ok = await confirmToast(
        `Vas a agregar ${cant} unidad(es) de "${nombrePieza}". ¿Quieres repartirlas en varios almacenes?`,
        { okText: "Repartir", cancelText: "No" }
      );

      if (ok) {
        openSplit({
          codigo,
          desc: descripcionActual,
          cantTotal: cant,
          precio: Number(piezaPrecio || 0),
          defaultWarehouse: String(almacenLineaSel || almacenSel || ""),
        });
        return;
      }
    }

    busyRef.current = true;
    const t = toast.loading("Agregando partida…");

    try {
      setSaving(true);
      const id = await ensureCompra();

      const payload = buildPartidaPayload({
        codigo,
        cant,
        precio: Number(piezaPrecio || 0),
        warehouse: String(almacenLineaSel),
      });

      const compraActualizada = await executeWithConflictHandler(
        addCompraPartida,
        "agregar partida",
        id,
        payload
      );

      setCompraEstado(
        String(
          compraActualizada?.estado ??
            compraActualizada?.Estado ??
            compraEstado
        )
      );
      
      const nuevasLineas = await remapCompraToLines(compraActualizada, almacenSel);
      
      const lineasConDesc = nuevasLineas.map(line => {
        if (line.codigo === codigo && !line.desc) {
          return { ...line, desc: descripcionActual };
        }
        return line;
      });
      
      setLines(lineasConDesc);

      setPiezaCodigo("");
      setPiezaDesc("");
      setPiezaCant(1);
      setPiezaPrecio(0);
      setExistencias([]);

      window.__COMSSIRE_DIRTY = false;
      markSaved();

      toast.dismiss(t);
      await showSuccess("Partida agregada", `La partida "${descripcionActual || `pieza ${codigo}`}" se agregó correctamente.`);
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] add partida error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo agregar la partida", getErrorMessage(e, "No se pudo agregar la partida."));
    } finally {
      setSaving(false);
      busyRef.current = false;
    }
  };

  const handleRemoveLine = async (line) => {
    const partidaId = line?.backendPartidaId;

    const nombrePieza = getLineDisplayName(line);
    const ok = await confirmToast(
      `Se eliminará la partida "${nombrePieza}". ¿Deseas continuar?`,
      {
        title: "Eliminar partida",
        okText: "Sí, eliminar",
        cancelText: "Cancelar",
        confirmButtonColor: "#dc2626",
      }
    );

    if (!ok) return;

    if (!compraId || !partidaId) {
      setLines((prev) => prev.filter((x) => x !== line));
      await showSuccess("Partida eliminada", "La partida se eliminó correctamente.");
      return;
    }

    const t = toast.loading("Eliminando partida…");

    try {
      setSaving(true);

      await executeWithConflictHandler(
        deleteCompraPartida,
        "eliminar partida",
        compraId,
        partidaId
      );

      setLines((prev) => prev.filter((x) => x.backendPartidaId !== partidaId));

      window.__COMSSIRE_DIRTY = false;
      markSaved();

      toast.dismiss(t);
      await showSuccess("Partida eliminada", "La partida se eliminó correctamente.");
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] delete partida error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo eliminar la partida", getErrorMessage(e, "No se pudo eliminar."));
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarAprobacion = async () => {
    const ok = await confirmToast(
      "La compra se guardará y se enviará al flujo de aprobación.",
      {
        title: "Enviar a aprobación",
        okText: "Sí, enviar",
        cancelText: "Cancelar",
      }
    );

    if (!ok) return;

    const t = toast.loading("Enviando…");

    try {
      setSaving(true);
      const id = await ensureCompra();

      await executeWithConflictHandler(
        saveCompraHeader,
        "guardar",
        id,
        buildCompraPayload()
      );

      if (!isAdmin) {
        const facturaActual = facturaInfo || (await comprasApi.getFactura(id));
        if (!facturaActual) {
          throw new Error("Debes anexar la imagen de la factura antes de enviar a aprobación.");
        }
        setFacturaInfo(facturaActual);
      }

      await comprasApi.enviarAprobacion(id);

      window.__COMSSIRE_DIRTY = false;
      markSaved();

      toast.dismiss(t);
      await showSuccess("Enviada a aprobación", "La compra fue enviada a aprobación. Ya puedes capturar una nueva compra.");
      clearDraft();
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] enviar aprobación error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo enviar a aprobación", getErrorMessage(e, "No se pudo enviar."));
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSaveAndDownloadMod = async () => {
    const ok = await confirmToast(
      "La compra se guardará y se generará el archivo MOD para descarga.",
      {
        title: "Generar MOD",
        okText: "Sí, generar",
        cancelText: "Cancelar",
      }
    );

    if (!ok) return;

    const t = toast.loading("Guardando y generando MOD…");

    try {
      setSaving(true);
      const id = await ensureCompra();

      await executeWithConflictHandler(
        saveCompraHeader,
        "guardar",
        id,
        buildCompraPayload()
      );

      const res = await comprasApi.getMod(id);
      const filename = getFilenameFromHeaders(res.headers) || "compra.mod";
      const blob = new Blob([res.data], {
        type: "application/octet-stream",
      });

      downloadBlob(blob, filename);

      window.__COMSSIRE_DIRTY = false;
      markSaved();
      setForceMode(false);

      toast.dismiss(t);
      await showSuccess("MOD descargado", "El archivo MOD se generó y descargó correctamente.");
      clearDraft();
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error(
        "[COMPRAS] admin guardar/descargar mod error",
        getNiceError(e)
      );
      toast.dismiss(t);
      await showError("No se pudo generar el MOD", getErrorMessage(e, "No se pudo generar MOD."));
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSaveDraft = async () => {
    const ok = await confirmToast(
      "Se guardará el estado actual de la compra como borrador.",
      {
        title: "Guardar borrador",
        okText: "Sí, guardar",
        cancelText: "Cancelar",
        icon: "question",
      }
    );

    if (!ok) return;

    const t = toast.loading("Guardando borrador...");

    try {
      setSaving(true);
      const id = await ensureCompra();

      await executeWithConflictHandler(
        saveCompraHeader,
        "guardar borrador",
        id,
        buildCompraPayload()
      );

      window.__COMSSIRE_DIRTY = false;
      markSaved();

      toast.dismiss(t);
      await showSuccess("Borrador guardado", "La compra se guardó como borrador.");
    } catch (e) {
      if (e.message === "Operación cancelada por el usuario") {
        toast.dismiss(t);
        return;
      }
      
      console.error("[COMPRAS] admin guardar borrador error", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo guardar el borrador", getErrorMessage(e, "No se pudo guardar el borrador."));
    } finally {
      setSaving(false);
    }
  };
  
  function handleChangeLineWarehouse(idx, newWarehouse) {
    setLines((prev) => {
      const newLines = prev.map((x, i) =>
        i === idx ? { ...x, warehouse: String(newWarehouse) } : x
      );
      return newLines;
    });
    
    window.__COMSSIRE_DIRTY = true;
  }

  const handleSearchProducts = async (term) => {
    const res = await comprasApi.getProductos(term);
    return Array.isArray(res) ? res : [];
  };

  // ========== RENDER ==========
  return (
    <AppLayout
      topbar={
        <ComprasTopbar
          hasActiveCompra={!!compraId}
          statusText={compraEstado}
          onNew={clearDraft}
          onScan={() => {}}
        />
      }
    >
      <Toaster position="top-right" richColors closeButton />
      
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 mb-4 w-full">
          <OrderHeader
            folio={folioFactura}
            fecha={fecha}
            status={compraEstado}
          />
        </div>

        {/* Grid principal */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 w-full min-h-0">
          {/* Columna izquierda */}
          <div className="lg:col-span-8 space-y-4 overflow-y-auto pr-2 w-full">
            <OrderForm
              readOnly={false}
              loading={loadingCatalogos}
              folio={folioFactura}
              setFolio={setFolioFactura}
              fecha={fecha}
              setFecha={setFecha}
              notas={observaciones}
              setNotas={setObservaciones}
              proveedores={proveedores}
              proveedorSel={proveedorSel}
              setProveedorSel={setProveedorSel}
              almacenes={almacenes}
              almacenSel={almacenSel}
              setAlmacenSel={handleChangeAlmacen}
            />

            {/* Factura para no admin */}
            {!isAdmin && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFacturaChange}
                    className="flex-1 min-w-[200px] text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <button
                    onClick={handleUploadFactura}
                    disabled={subiendoFactura}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg whitespace-nowrap"
                  >
                    {subiendoFactura ? "Subiendo..." : "Subir"}
                  </button>
                  
                  {facturaInfo && (
                    <>
                      <a
                        href={facturaInfo.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg whitespace-nowrap"
                      >
                        Ver
                      </a>
                      <button
                        onClick={handleDeleteFactura}
                        className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg whitespace-nowrap"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
                {facturaPreview && (
                  <img
                    src={facturaPreview}
                    alt="Vista previa"
                    className="mt-3 h-20 rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* Factura para admin */}
            {isAdmin && facturaInfo?.viewUrl && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                <span className="text-sm text-gray-500">Factura adjunta</span>
                <a
                  href={facturaInfo.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                >
                  Ver factura
                </a>
              </div>
            )}

            {/* Líneas/Partidas */}
            <LinesSection
              readOnly={false}
              saving={saving}
              almacenes={almacenes}
              almacenLineaSel={almacenLineaSel}
              setAlmacenLineaSel={setAlmacenLineaSel}
              piezaCodigo={piezaCodigo}
              setPiezaCodigo={setPiezaCodigo}
              piezaDesc={piezaDesc}
              setPiezaDesc={setPiezaDesc}
              piezaCant={piezaCant}
              setPiezaCant={setPiezaCant}
              piezaPrecio={piezaPrecio}
              setPiezaPrecio={setPiezaPrecio}
              onLookup={handleLookupProducto}
              existencias={existencias}
              onAddLine={handleAddLine}
              lines={lines}
              onRemoveLine={handleRemoveLine}
              onChangeLineWarehouse={handleChangeLineWarehouse}
              onUpdateWarehouseDirect={handleUpdateWarehouseDirect}
              money={money}
              onSearchProducts={handleSearchProducts}
              onSyncWarehouses={handleSyncWarehouses}
              almacenHeader={almacenSel}
            />
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-4">
            <div className="sticky top-4 space-y-4">
              <RigthCards
                isAdmin={isAdmin}
                saving={saving}
                compraEstado={compraEstado}
                motivoRechazo={motivoRechazo}
                totals={totals}
                onSaveDraft={handleSaveHeader}
                onSendApproval={handleEnviarAprobacion}
                onAdminSaveDraft={handleAdminSaveDraft}
                onAdminSaveAndDownloadMod={handleAdminSaveAndDownloadMod}
                forceMode={forceMode}
              />
            </div>
          </div>
        </div>
      </div>

      <SplitModal
        open={splitOpen}
        onClose={closeSplit}
        almacenes={almacenes}
        draft={splitDraft}
        onSave={handleSplitSave}
      />
    </AppLayout>
  );
}