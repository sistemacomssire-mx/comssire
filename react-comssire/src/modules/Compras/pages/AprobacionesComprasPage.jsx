import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { comprasApi } from "../api/compras.api";

import OrderHeader from "../components/OrderHeader";
import OrderForm from "../components/OrderForm";
import LinesSection from "../components/LinesSection";
import SplitModal from "../components/SplitModal";
import { getAuthFromStorage } from "../utils/auth";

function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
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

  // cabecera
  const [compraEstado, setCompraEstado] = useState(null);
  const [folioFactura, setFolioFactura] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [proveedorSel, setProveedorSel] = useState("");
  const [almacenSel, setAlmacenSel] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // factura visual
  const [facturaInfo, setFacturaInfo] = useState(null);

  // catálogos
  const [proveedores, setProveedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  // líneas
  const [lines, setLines] = useState([]);
  const linesRef = useRef([]);
  useEffect(() => {
    linesRef.current = lines || [];
  }, [lines]);

  // devolver modal
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
      toast.error("No se pudieron cargar catálogos.");
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
      toast.error("No se pudieron cargar aprobaciones.");
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

      const mapped = arr.map((p) => {
        const partidaId = p?.id ?? p?.Id ?? null;
        const codigo = String(p?.cveArt ?? p?.CveArt ?? "").trim();
        const cant = Number(p?.cantTotal ?? p?.CantTotal ?? 0);
        const precio = Number(p?.costoUnitario ?? p?.CostoUnitario ?? 0);

        const rep = p?.repartos ?? p?.Repartos ?? [];
        const repArr = Array.isArray(rep) ? rep : [];
        const first = repArr.length ? repArr[0] : null;
        const wh = first?.numAlm ?? first?.NumAlm ?? almaDef ?? "";

        return {
          backendPartidaId: partidaId,
          codigo,
          desc: p?.descripcion || p?.Descripcion || "",
          cant,
          precio,
          warehouse: String(wh ?? ""),
        };
      });

      setLines(mapped);

      toast.success("Compra cargada.", { id: t });
    } catch (e) {
      console.error("[APROBACIONES] load selected", getNiceError(e));
      toast.error("No se pudo cargar la compra.", { id: t });
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      toast.error("No tienes permisos para ver aprobaciones.");
      navigate("/");
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
      toast.error("El almacén seleccionado no es válido (NumAlm debe ser número).");
      return;
    }

    const t = toast.loading("Guardando almacén de la partida…");
    try {
      setSaving(true);

      const payload = buildUpdatePartidaPayload(line, numAlm);
      if (payload.CantTotal <= 0) throw new Error("CantTotal inválida.");
      if (payload.CostoUnitario < 0) throw new Error("CostoUnitario inválido.");

      await comprasApi.updatePartida(selectedId, partidaId, payload);
      toast.success("Almacén actualizado.", { id: t });
    } catch (e) {
      console.error("[APROBACIONES] updatePartida almacén", getNiceError(e));
      toast.error(e?.response?.parsedData?.message || "No se pudo guardar el almacén.", { id: t });

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

          return {
            backendPartidaId: partidaId2,
            codigo,
            desc: p?.descripcion || p?.Descripcion || "",
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

    const ok = await confirmToast("¿Guardar cambios de validación?", {
      okText: "Guardar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

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

      toast.success("Cambios guardados.", { id: t });

      const refreshed = await comprasApi.getCompra(selectedId);
      setCompraEstado(String(refreshed?.estado ?? refreshed?.Estado ?? compraEstado));
    } catch (e) {
      console.error("[APROBACIONES] guardar cambios error", getNiceError(e));
      const msg = e?.response?.parsedData?.message || "No se pudo guardar.";
      toast.error(msg, { id: t });
    } finally {
      setSaving(false);
    }
  }

  async function handleAprobar() {
    if (!selectedId) return;

    const ok = await confirmToast("¿Aprobar esta compra? (impacta inventario)", {
      okText: "Aprobar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    const t = toast.loading("Aprobando…");
    try {
      setSaving(true);
      await comprasApi.aprobarCompra(selectedId);

      toast.success("Compra aprobada.", { id: t });

      await loadAprobaciones();
      setSelectedId(null);
      setLines([]);
      setCompraEstado(null);
      setFacturaInfo(null);
    } catch (e) {
      console.error("[APROBACIONES] aprobar", getNiceError(e));
      toast.error(e?.response?.parsedData?.message || "No se pudo aprobar.", { id: t });
    } finally {
      setSaving(false);
    }
  }

  async function handleDevolver() {
    if (!selectedId) return;

    const m = String(motivo || "").trim();
    if (!m) return toast.warning("Escribe el motivo para devolver.");

    const ok = await confirmToast("¿Devolver la compra al trabajador?", {
      okText: "Devolver",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    const t = toast.loading("Devolviendo…");
    try {
      setSaving(true);
      await comprasApi.rechazarCompra(selectedId, { Motivo: m, motivo: m });

      toast.success("Compra devuelta.", { id: t });

      setDevolverOpen(false);
      setMotivo("");

      await loadAprobaciones();
      setSelectedId(null);
      setLines([]);
      setCompraEstado(null);
      setFacturaInfo(null);
    } catch (e) {
      console.error("[APROBACIONES] devolver", getNiceError(e));
      toast.error(e?.response?.parsedData?.message || "No se pudo devolver.", { id: t });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveLine(line, idx) {
    if (!selectedId) return;

    const ok = await confirmToast("¿Eliminar la partida?", {
      okText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

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
      toast.success("Partida eliminada.", { id: t });
    } catch (e) {
      console.error("[APROBACIONES] delete", getNiceError(e));
      toast.error("No se pudo eliminar.", { id: t });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <Toaster position="top-right" richColors closeButton />

      <div className="w-full max-w-7xl mx-auto">
        {/* Selector de aprobaciones horizontal */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Aprobaciones pendientes</h2>
            <button className="btn btn-glass text-xs px-3 py-1.5" onClick={loadAprobaciones} disabled={loading}>
              Recargar
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {aprobaciones.map((c) => (
              <button
                key={c.id}
                className={`px-3 py-2 rounded-lg border min-w-[180px] text-left ${
                  selectedId === c.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
                onClick={() => loadSelectedCompra(c.id)}
              >
                <div className="font-bold text-sm">{c.folioFactura}</div>
                <div className="text-[10px] text-white/60 mt-0.5">
                  {c.enviadoAt ? new Date(c.enviadoAt).toLocaleDateString("es-MX") : ""}
                </div>
                <div className="text-[10px] text-white/60 mt-0.5">
                  {c.cveClpv}
                </div>
              </button>
            ))}
            
            {!aprobaciones.length && !loading && (
              <div className="text-xs text-white/60 py-3 px-4 border border-white/10 rounded-lg">
                No hay compras enviadas
              </div>
            )}
          </div>
        </div>

        {selectedId && (
          <>
            {/* HEADER COMPACTO */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/50">Folio:</span>
                  <span className="font-mono font-bold text-white/90 text-xs">{folioFactura || "Sin folio"}</span>
                </div>
                
                <span className="text-white/30">|</span>
                
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/50">Fecha:</span>
                  <span className="text-xs">{fecha}</span>
                </div>
                
                <span className="text-white/30">|</span>
                
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/50">Estatus:</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    compraEstado === "Aprobada" ? "bg-green-500/20 text-green-300" :
                    compraEstado === "Rechazada" ? "bg-red-500/20 text-red-300" :
                    "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {compraEstado || "Enviada"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="btn btn-glass text-[10px] px-2 py-1"
                  onClick={handleGuardarCambios}
                  disabled={!selectedId || saving}
                >
                  Guardar
                </button>
                <button
                  className="btn btn-glass text-[10px] px-2 py-1"
                  onClick={() => setDevolverOpen(true)}
                  disabled={!selectedId || saving}
                >
                  Devolver
                </button>
                <button
                  className="btn btn-primary text-[10px] px-3 py-1"
                  onClick={handleAprobar}
                  disabled={!selectedId || saving}
                >
                  Aprobar
                </button>
              </div>
            </div>

            {/* MITAD Y MITAD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LADO IZQUIERDO: Factura */}
              <div className="w-full">
                <div className="bg-black/20 rounded-lg border border-white/10 overflow-hidden flex flex-col h-[calc(100vh-180px)] sticky top-4">
                  <div className="p-2 border-b border-white/10 bg-white/5 flex-shrink-0 flex justify-between items-center">
                    <h3 className="font-bold text-sm">FACTURA</h3>
                    <span className="text-[10px] text-white/50">Zoom • Arrastrar</span>
                  </div>
                  <div className="flex-1 bg-black/40 overflow-hidden">
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
                              <div className="absolute bottom-2 right-2 z-10 flex gap-1">
                                <button
                                  onClick={() => zoomIn()}
                                  className="btn btn-glass bg-black/50 backdrop-blur-sm text-[10px] px-2 py-1"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => zoomOut()}
                                  className="btn btn-glass bg-black/50 backdrop-blur-sm text-[10px] px-2 py-1"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => resetTransform()}
                                  className="btn btn-glass bg-black/50 backdrop-blur-sm text-[10px] px-2 py-1"
                                >
                                  ↺
                                </button>
                              </div>
                              <TransformComponent
                                wrapperStyle={{
                                  width: "100%",
                                  height: "100%",
                                  overflow: "auto"
                                }}
                                contentStyle={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <img
                                  src={facturaInfo.viewUrl}
                                  alt="Factura"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                    display: "block"
                                  }}
                                />
                              </TransformComponent>
                            </>
                          )}
                        </TransformWrapper>
                      ) : facturaInfo.viewUrl ? (
                        <div className="h-full flex items-center justify-center text-center p-4">
                          <div>
                            <div className="mb-2 text-white/70 text-xs">No se puede previsualizar</div>
                            <a
                              href={facturaInfo.viewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary text-xs px-3 py-1.5"
                            >
                              Abrir archivo
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/60 p-4 text-center text-xs">
                          Sin URL disponible
                        </div>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-white/60 p-4 text-center text-xs">
                        Sin factura adjunta
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: Formulario */}
              <div className="w-full space-y-3 pb-3 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Formulario de cabecera - COMPACTO */}
                <div className="bg-black/20 rounded-lg border border-white/10 p-3">
                  <h3 className="font-bold text-sm mb-2">DATOS DE LA COMPRA</h3>
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

                {/* Líneas - COMPACTO */}
                <div className="bg-black/20 rounded-lg border border-white/10 p-3">
                  <h3 className="font-bold text-sm mb-2">PARTIDAS</h3>
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

                {/* Totales - COMPACTO */}
                <div className="bg-black/20 rounded-lg border border-white/10 p-3">
                  <div className="flex flex-wrap gap-3 mb-2">
                    <div className="bg-white/5 rounded px-3 py-1.5">
                      <span className="text-white/60 text-[10px]">Partidas: </span>
                      <span className="font-bold text-sm">{totals.items}</span>
                    </div>
                    <div className="bg-white/5 rounded px-3 py-1.5">
                      <span className="text-white/60 text-[10px]">Subtotal: </span>
                      <span className="font-bold text-sm">{money(totals.subtotal)}</span>
                    </div>
                    <div className="bg-white/5 rounded px-3 py-1.5">
                      <span className="text-white/60 text-[10px]">IVA: </span>
                      <span className="font-bold text-sm">{money(totals.iva)}</span>
                    </div>
                    <div className="bg-white/5 rounded px-3 py-1.5">
                      <span className="text-white/60 text-[10px]">Total: </span>
                      <span className="font-bold text-sm">{money(totals.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn btn-glass text-xs px-3 py-1.5"
                      onClick={handleGuardarCambios}
                      disabled={!selectedId || saving}
                    >
                      Guardar
                    </button>
                    <button
                      className="btn btn-glass text-xs px-3 py-1.5"
                      onClick={() => setDevolverOpen(true)}
                      disabled={!selectedId || saving}
                    >
                      Devolver
                    </button>
                    <button
                      className="btn btn-primary text-xs px-4 py-1.5"
                      onClick={handleAprobar}
                      disabled={!selectedId || saving}
                    >
                      Aprobar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de devolución */}
      {devolverOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-black/80 rounded-lg border border-white/10 w-full max-w-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-sm">Devolver compra</div>
              <button className="btn btn-glass text-xs px-2 py-1" onClick={() => setDevolverOpen(false)}>
                Cerrar
              </button>
            </div>
            <div className="mb-3">
              <label className="text-xs text-white/80 mb-1 block">Motivo</label>
              <textarea
                className="bg-black/30 border border-white/10 rounded w-full min-h-[80px] text-xs p-2"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Escribe el motivo para devolver..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-glass text-xs px-3 py-1.5" onClick={() => setDevolverOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary text-xs px-3 py-1.5" onClick={handleDevolver} disabled={saving}>
                {saving ? "..." : "Devolver"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SplitModal />
    </AppLayout>
  );
}