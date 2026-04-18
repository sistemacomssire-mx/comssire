import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Toaster, toast } from "sonner";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { comprasApi } from "../api/compras.api";

import OrderForm from "../components/OrderForm";
import LinesSection from "../components/LinesSection";
import SplitModal from "../components/SplitModal";
import { getAuthFromStorage } from "../utils/auth";

function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
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

function getAlmacenLabel(almacenes, value) {
  const key = String(value ?? "").trim();
  const found = (almacenes || []).find((a) => String(a?.numAlm ?? a?.NumAlm ?? a?.id ?? a?.Id ?? "") === key);
  return found?.descr || found?.Descr || found?.nombre || found?.Nombre || found?.descripcion || found?.Descripcion || key || "almacén seleccionado";
}

function getPartidaLabel(line) {
  return String(line?.desc || line?.descr || line?.descripcion || line?.codigo || "la partida").trim();
}

function getNiceError(e) {
  const parsed = e?.response?.parsedData;
  if (parsed) return parsed;
  return e?.response?.data || e?.message || e;
}

function isImageContentType(contentType = "") {
  return String(contentType).toLowerCase().startsWith("image/");
}

export default function AprobacionesComprasPage() {
  const navigate = useNavigate();
  const auth = useMemo(() => getAuthFromStorage(), []);
  const isAdmin = !!auth.isAdmin;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aprobaciones, setAprobaciones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [compraEstado, setCompraEstado] = useState(null);
  const [folioFactura, setFolioFactura] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [proveedorSel, setProveedorSel] = useState("");
  const [almacenSel, setAlmacenSel] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [facturaInfo, setFacturaInfo] = useState(null);

  const [proveedores, setProveedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  const [lines, setLines] = useState([]);
  const linesRef = useRef([]);
  useEffect(() => {
    linesRef.current = lines || [];
  }, [lines]);

  const [devolverOpen, setDevolverOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

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

  function buildCompraPayload() {
    const fechaUtcIso = `${fecha}T00:00:00.000Z`;
    return {
      FolioFactura: String(folioFactura || "").trim(),
      Fecha: fechaUtcIso,
      CveClpv: String(proveedorSel || "").trim(),
      NumAlmaDefault: Number(almacenSel || 0),
      Observaciones: observaciones || "",
    };
  }

  function buildUpdatePartidaPayload(line, overrideWarehouse = null) {
    const wh = overrideWarehouse !== null ? overrideWarehouse : line?.warehouse;
    return {
      CantTotal: Number(line.cant),
      CostoUnitario: Number(line.precio),
      Observaciones: null,
      Repartos: [{ NumAlm: Number(wh), Cant: Number(line.cant) }],
    };
  }

  async function loadCatalogos() {
    try {
      const [prov, alm] = await Promise.all([
        comprasApi.getProveedores(),
        comprasApi.getAlmacenes(),
      ]);
      setProveedores(Array.isArray(prov) ? prov : []);
      setAlmacenes(Array.isArray(alm) ? alm : []);
    } catch (e) {
      console.error("[APROBACIONES] catálogos", getNiceError(e));
      showError("Error al cargar catálogos", niceErrorText(e, "No se pudieron cargar catálogos."));
    }
  }

  async function loadAprobaciones() {
    setLoading(true);
    try {
      const data = await comprasApi.getAprobaciones();
      setAprobaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[APROBACIONES] load", getNiceError(e));
      setAprobaciones([]);
      showError("Error al cargar aprobaciones", niceErrorText(e, "No se pudieron cargar aprobaciones."));
    } finally {
      setLoading(false);
    }
  }

  async function loadFactura(id) {
    try {
      const factura = await comprasApi.getFactura(id);
      setFacturaInfo(factura || null);
    } catch (e) {
      console.error("[APROBACIONES] load factura", getNiceError(e));
      setFacturaInfo(null);
    }
  }

  async function loadSelectedCompra(id) {
    const t = toast.loading("Cargando compra…");
    try {
      const [compra] = await Promise.all([
        comprasApi.getCompra(id),
        loadFactura(id),
      ]);

      setSelectedId(id);
      setCompraEstado(String(compra?.estado ?? compra?.Estado ?? "Enviada"));

      setFolioFactura(String(compra?.folioFactura ?? compra?.FolioFactura ?? ""));
      const f = compra?.fecha ?? compra?.Fecha;
      if (f) setFecha(new Date(f).toISOString().slice(0, 10));

      setProveedorSel(String(compra?.cveClpv ?? compra?.CveClpv ?? ""));

      const almaDef = compra?.numAlmaDefault ?? compra?.NumAlmaDefault ?? "";
      setAlmacenSel(String(almaDef || ""));

      setObservaciones(String(compra?.observaciones ?? compra?.Observaciones ?? ""));

      const partidas = compra?.partidas ?? compra?.Partidas ?? [];
      const arr = Array.isArray(partidas) ? partidas : [];

      const mapped = await Promise.all(
        arr.map(async (p) => {
          const partidaId = p?.id ?? p?.Id ?? null;
          const codigo = String(p?.cveArt ?? p?.CveArt ?? "").trim();
          const cant = Number(p?.cantTotal ?? p?.CantTotal ?? 0);
          const precio = Number(p?.costoUnitario ?? p?.CostoUnitario ?? 0);

          const rep = p?.repartos ?? p?.Repartos ?? [];
          const repArr = Array.isArray(rep) ? rep : [];
          const first = repArr.length ? repArr[0] : null;
          const wh = first?.numAlm ?? first?.NumAlm ?? almaDef ?? "";

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
              console.warn("[APROBACIONES] No se pudo obtener descripción para:", codigo, e);
            }
          }

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

      setLines(mapped);

      toast.success("Compra cargada.", { id: t });
    } catch (e) {
      console.error("[APROBACIONES] load selected", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo cargar la compra", niceErrorText(e, "No se pudo cargar la compra."));
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      showError("Acceso denegado", "No tienes permisos para ver aprobaciones.").finally(() => navigate("/"));
      return;
    }
    loadCatalogos();
    loadAprobaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangeLineWarehouse(idx, newWarehouse) {
    const newWh = String(newWarehouse ?? "").trim();

    setLines((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, warehouse: newWh } : x))
    );

    if (!selectedId) return;

    const currentLines = linesRef.current || [];
    const line = currentLines[idx];
    const partidaId = line?.backendPartidaId;

    if (!partidaId) return;

    const numAlm = Number(newWh);
    if (!Number.isFinite(numAlm) || numAlm <= 0) {
      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, warehouse: String(line?.warehouse ?? "") } : x)));
      await showError("Almacén inválido", "El almacén seleccionado no es válido.");
      return;
    }

    const previousWarehouse = String(line?.warehouse ?? "");
    const result = await confirmAction({
      title: "¿Cambiar almacén?",
      text: `La partida ${getPartidaLabel(line)} cambiará de ${getAlmacenLabel(almacenes, previousWarehouse)} a ${getAlmacenLabel(almacenes, newWh)}.`,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, warehouse: previousWarehouse } : x)));
      return;
    }

    const t = toast.loading("Guardando almacén de la partida…");
    try {
      setSaving(true);

      const payload = buildUpdatePartidaPayload(line, numAlm);
      if (payload.CantTotal <= 0) throw new Error("CantTotal inválida.");
      if (payload.CostoUnitario < 0) throw new Error("CostoUnitario inválido.");

      await comprasApi.updatePartida(selectedId, partidaId, payload);
      toast.dismiss(t);
      await showSuccess("Almacén actualizado", `La partida ${getPartidaLabel(line)} ahora está en ${getAlmacenLabel(almacenes, newWh)}.`);
    } catch (e) {
      console.error("[APROBACIONES] updatePartida almacén", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo guardar el almacén", niceErrorText(e, "No se pudo guardar el almacén."));

      try {
        const compra = await comprasApi.getCompra(selectedId);
        const almaDef = compra?.numAlmaDefault ?? compra?.NumAlmaDefault ?? "";
        const partidas = compra?.partidas ?? compra?.Partidas ?? [];
        const arr = Array.isArray(partidas) ? partidas : [];

        const mapped = arr.map((p) => {
          const partidaId2 = p?.id ?? p?.Id ?? null;
          const codigo = String(p?.cveArt ?? p?.CveArt ?? "").trim();
          const cant = Number(p?.cantTotal ?? p?.CantTotal ?? 0);
          const precio = Number(p?.costoUnitario ?? p?.CostoUnitario ?? 0);

          const rep = p?.repartos ?? p?.Repartos ?? [];
          const repArr = Array.isArray(rep) ? rep : [];
          const first = repArr.length ? repArr[0] : null;
          const wh = first?.numAlm ?? first?.NumAlm ?? almaDef ?? "";

          const descripcion =
            p?.descripcion ||
            p?.Descripcion ||
            p?.producto?.descripcion ||
            p?.producto?.Descripcion ||
            p?.producto?.descr ||
            p?.producto?.Descr ||
            "";

          return {
            backendPartidaId: partidaId2,
            codigo,
            desc: descripcion,
            cant,
            precio,
            warehouse: String(wh ?? ""),
          };
        });

        setLines(mapped);
      } catch {}
    } finally {
      setSaving(false);
    }
  }

  async function handleGuardarCambios() {
    if (!selectedId) return;

    const ok = await confirmAction({
      title: "¿Guardar cambios?",
      text: `Se guardarán los cambios de la compra ${folioFactura || selectedId}.`,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;

    const t = toast.loading("Guardando cambios…");
    try {
      setSaving(true);

      await comprasApi.updateCompra(selectedId, buildCompraPayload());

      for (const line of lines) {
        if (!line?.backendPartidaId) continue;

        await comprasApi.updatePartida(
          selectedId,
          line.backendPartidaId,
          buildUpdatePartidaPayload(line)
        );
      }

      toast.dismiss(t);
      await showSuccess("Cambios guardados", `La compra ${folioFactura || selectedId} se actualizó correctamente.`);

      const refreshed = await comprasApi.getCompra(selectedId);
      setCompraEstado(String(refreshed?.estado ?? refreshed?.Estado ?? compraEstado));
    } catch (e) {
      console.error("[APROBACIONES] guardar cambios error", getNiceError(e));
      const msg = e?.response?.parsedData?.message || "No se pudo guardar.";
      toast.dismiss(t);
      await showError("No se pudo guardar", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAprobar() {
    if (!selectedId) return;

    const ok = await confirmAction({
      title: "¿Aprobar compra?",
      text: `Se aprobará la compra ${folioFactura || selectedId} y esto impactará inventario.`,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;

    const t = toast.loading("Aprobando…");
    try {
      setSaving(true);
      await comprasApi.aprobarCompra(selectedId);

      toast.dismiss(t);
      await showSuccess("Compra aprobada", `La compra ${folioFactura || selectedId} fue aprobada correctamente.`);

      await loadAprobaciones();
      setSelectedId(null);
      setLines([]);
      setCompraEstado(null);
      setFacturaInfo(null);
    } catch (e) {
      console.error("[APROBACIONES] aprobar", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo aprobar", niceErrorText(e, "No se pudo aprobar."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDevolver() {
    if (!selectedId) return;

    const m = String(motivo || "").trim();
    if (!m) return showWarning("Motivo requerido", "Escribe el motivo para devolver.");

    const ok = await confirmAction({
      title: "¿Devolver compra?",
      text: `La compra ${folioFactura || selectedId} se devolverá al trabajador con el motivo capturado.`,
      confirmButtonText: "Sí, devolver",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;

    const t = toast.loading("Devolviendo…");
    try {
      setSaving(true);
      await comprasApi.rechazarCompra(selectedId, { Motivo: m, motivo: m });

      toast.dismiss(t);
      await showSuccess("Compra devuelta", `La compra ${folioFactura || selectedId} fue devuelta correctamente.`);

      setDevolverOpen(false);
      setMotivo("");

      await loadAprobaciones();
      setSelectedId(null);
      setLines([]);
      setCompraEstado(null);
      setFacturaInfo(null);
    } catch (e) {
      console.error("[APROBACIONES] devolver", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo devolver", niceErrorText(e, "No se pudo devolver."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveLine(line, idx) {
    if (!selectedId) return;

    const ok = await confirmAction({
      title: "¿Eliminar partida?",
      text: `Se eliminará la partida ${getPartidaLabel(line)}.`,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;

    const backendId = line?.backendPartidaId;

    if (!backendId) {
      setLines((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    const t = toast.loading("Eliminando…");
    try {
      setSaving(true);
      await comprasApi.deletePartida(selectedId, backendId);
      setLines((prev) => prev.filter((x) => x.backendPartidaId !== backendId));
      toast.dismiss(t);
      await showSuccess("Partida eliminada", `Se eliminó ${getPartidaLabel(line)}.`);
    } catch (e) {
      console.error("[APROBACIONES] delete", getNiceError(e));
      toast.dismiss(t);
      await showError("No se pudo eliminar", niceErrorText(e, "No se pudo eliminar."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <Toaster position="top-right" richColors closeButton />

      <div className="w-full min-h-screen bg-gray-50 px-4 py-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Aprobaciones pendientes</h2>

            <div className="flex flex-wrap gap-2">
              <button
                className="!rounded-lg !bg-orange-500 !px-4 !py-2 !text-sm !font-medium !text-white !shadow-sm !transition-colors hover:!bg-orange-600 active:!bg-orange-700 disabled:!opacity-60"
                onClick={() => navigate(-1)}
              >
                Volver
              </button>

              <button
                className="!rounded-lg !bg-orange-500 !px-4 !py-2 !text-sm !font-medium !text-white !shadow-sm !transition-colors hover:!bg-orange-600 active:!bg-orange-700 disabled:!opacity-60"
                onClick={loadAprobaciones}
                disabled={loading}
              >
                Recargar
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3">
            {aprobaciones.map((c) => (
              <button
                key={c.id}
                className={`!w-56 !flex-shrink-0 !rounded-xl !border !px-4 !py-3 !text-left !transition-all ${
                  selectedId === c.id
                    ? "!border-blue-300 !bg-blue-50 !shadow-md !ring-2 !ring-blue-100"
                    : "!border-slate-200 !bg-white !shadow-sm hover:!border-blue-200 hover:!bg-slate-50"
                }`}
                onClick={() => loadSelectedCompra(c.id)}
              >
                <div className="truncate text-sm font-bold text-slate-800">
                  {c.folioFactura || "Sin folio"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {c.enviadoAt ? new Date(c.enviadoAt).toLocaleDateString("es-MX") : ""}
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {c.cveClpv}
                </div>
              </button>
            ))}

            {!aprobaciones.length && !loading && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                No hay compras enviadas
              </div>
            )}
          </div>
        </div>

        {selectedId && (
          <>
            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Folio:</span>
                  <span className="font-mono text-sm font-semibold text-gray-800">
                    {folioFactura || "Sin folio"}
                  </span>
                </div>

                <div className="h-4 w-px bg-gray-200"></div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Fecha:</span>
                  <span className="text-sm text-gray-700">{fecha}</span>
                </div>

                <div className="h-4 w-px bg-gray-200"></div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Estatus:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      compraEstado === "Aprobada"
                        ? "bg-green-100 text-green-700"
                        : compraEstado === "Rechazada"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {compraEstado || "Enviada"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr] 2xl:grid-cols-[1.25fr_1fr]">
              <div className="w-full">
                <div className="sticky top-4 flex h-[calc(100vh-170px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <h3 className="font-semibold text-gray-800">FACTURA</h3>
                    <span className="text-xs text-gray-500">Zoom • Arrastrar</span>
                  </div>

                  <div className="relative flex-1 overflow-hidden bg-gray-50">
                    {facturaInfo ? (
                      facturaInfo.viewUrl && isImageContentType(facturaInfo.contentType) ? (
                        <TransformWrapper
                          initialScale={1}
                          minScale={0.5}
                          maxScale={3}
                          centerOnInit={true}
                          wheel={{ step: 0.1 }}
                          pinch={{ step: 0.1 }}
                          doubleClick={{ mode: "reset" }}
                        >
                          {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                              <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                                <button
                                  onClick={() => zoomIn()}
                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => zoomOut()}
                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => resetTransform()}
                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
                                >
                                  ↺
                                </button>
                              </div>

                              <TransformComponent
                                wrapperStyle={{
                                  width: "100%",
                                  height: "100%",
                                  overflow: "auto",
                                }}
                                contentStyle={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={facturaInfo.viewUrl}
                                  alt="Factura"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                  }}
                                />
                              </TransformComponent>
                            </>
                          )}
                        </TransformWrapper>
                      ) : facturaInfo.viewUrl ? (
                        <div className="flex h-full items-center justify-center p-6 text-center">
                          <div>
                            <div className="mb-3 text-sm text-gray-500">No se puede previsualizar</div>
                            <a
                              href={facturaInfo.viewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block !rounded-lg !bg-orange-500 !px-4 !py-2 !text-sm !font-medium !text-white !transition-colors hover:!bg-orange-600 active:!bg-orange-700"
                            >
                              Abrir archivo
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
                          Sin URL disponible
                        </div>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
                        Sin factura adjunta
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-[calc(100vh-170px)] w-full overflow-y-auto pb-4">
                <div className="space-y-4 pr-1">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-gray-800">DATOS DE LA COMPRA</h3>
                    <OrderForm
                      readOnly={false}
                      loading={false}
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
                      setAlmacenSel={setAlmacenSel}
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-gray-800">PARTIDAS</h3>
                    <LinesSection
                      readOnly={false}
                      saving={saving}
                      almacenes={almacenes}
                      almacenLineaSel={almacenSel}
                      setAlmacenLineaSel={() => {}}
                      piezaCodigo={""}
                      setPiezaCodigo={() => {}}
                      piezaDesc={""}
                      setPiezaDesc={() => {}}
                      piezaCant={1}
                      setPiezaCant={() => {}}
                      piezaPrecio={0}
                      setPiezaPrecio={() => {}}
                      onLookup={() => {}}
                      existencias={[]}
                      onAddLine={() => {}}
                      onRemoveLine={handleRemoveLine}
                      lines={lines}
                      onChangeLineWarehouse={handleChangeLineWarehouse}
                      money={money}
                      hideAddForm
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-3">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-500">Partidas: </span>
                        <span className="text-sm font-bold text-gray-800">{totals.items}</span>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-500">Subtotal: </span>
                        <span className="text-sm font-bold text-gray-800">{money(totals.subtotal)}</span>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-500">IVA: </span>
                        <span className="text-sm font-bold text-gray-800">{money(totals.iva)}</span>
                      </div>
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                        <span className="text-xs text-orange-600">Total: </span>
                        <span className="text-sm font-bold text-orange-600">{money(totals.total)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        className="!rounded-lg !bg-orange-500 !px-4 !py-2 !text-sm !font-medium !text-white !shadow-sm !transition-colors hover:!bg-orange-600 active:!bg-orange-700 disabled:!opacity-60"
                        onClick={handleGuardarCambios}
                        disabled={!selectedId || saving}
                      >
                        Guardar
                      </button>

                      <button
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                        onClick={() => setDevolverOpen(true)}
                        disabled={!selectedId || saving}
                      >
                        Devolver
                      </button>

                      <button
                        className="!rounded-lg !bg-blue-500 !px-5 !py-2 !text-sm !font-medium !text-white !shadow-sm !transition-colors hover:!bg-blue-600 active:!bg-blue-700 disabled:!opacity-60"
                        onClick={handleAprobar}
                        disabled={!selectedId || saving}
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {devolverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold text-gray-800">Devolver compra</div>
              <button
                className="px-2 py-1 text-sm text-gray-400 hover:text-gray-600"
                onClick={() => setDevolverOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Motivo</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
                rows="4"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Escribe el motivo para devolver..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                onClick={() => setDevolverOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="!rounded-lg !bg-orange-500 !px-4 !py-2 !text-sm !font-medium !text-white !transition-colors hover:!bg-orange-600 active:!bg-orange-700"
                onClick={handleDevolver}
                disabled={saving}
              >
                {saving ? "Procesando..." : "Devolver"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SplitModal />
    </AppLayout>
  );
}