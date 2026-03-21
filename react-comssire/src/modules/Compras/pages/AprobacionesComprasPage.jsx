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
      
      <style>{`
        /* Estilos personalizados para tema claro con naranja y azul */
        .bg-naranja-claro {
          background-color: #FFF7F0;
        }
        .border-naranja-suave {
          border-color: #FFE4CC;
        }
        .text-naranja-principal {
          color: #F97316;
        }
        .bg-naranja-principal {
          background-color: #F97316;
        }
        .hover-bg-naranja-oscuro:hover {
          background-color: #EA580C;
        }
        .bg-azul-claro {
          background-color: #EFF6FF;
        }
        .border-azul-suave {
          border-color: #DBEAFE;
        }
        .text-azul-principal {
          color: #3B82F6;
        }
        .bg-azul-principal {
          background-color: #3B82F6;
        }
        .hover-bg-azul-oscuro:hover {
          background-color: #2563EB;
        }
        .sombra-suave {
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="w-full max-w-7xl mx-auto bg-gray-50 min-h-screen p-4">
        {/* Selector de aprobaciones horizontal */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800">Aprobaciones pendientes</h2>
            <button 
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm" 
              onClick={loadAprobaciones} 
              disabled={loading}
            >
              Recargar
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-3">
            {aprobaciones.map((c) => (
              <button
                key={c.id}
                className={`px-4 py-3 rounded-xl border transition-all flex-shrink-0 w-48 text-left ${
                  selectedId === c.id
                    ? "border-orange-400 bg-orange-50 shadow-md ring-2 ring-orange-200"
                    : "border-gray-200 bg-white hover:bg-gray-50 hover:border-orange-200 shadow-sm"
                }`}
                onClick={() => loadSelectedCompra(c.id)}
              >
                <div className="font-bold text-gray-800 text-sm truncate">{c.folioFactura}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.enviadoAt ? new Date(c.enviadoAt).toLocaleDateString("es-MX") : ""}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {c.cveClpv}
                </div>
              </button>
            ))}
            
            {!aprobaciones.length && !loading && (
              <div className="text-sm text-gray-500 py-3 px-4 border border-gray-200 rounded-xl bg-white">
                No hay compras enviadas
              </div>
            )}
          </div>
        </div>

        {selectedId && (
          <>
            {/* HEADER COMPACTO */}
            <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Folio:</span>
                    <span className="font-mono font-semibold text-gray-800 text-sm">{folioFactura || "Sin folio"}</span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-200"></div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Fecha:</span>
                    <span className="text-sm text-gray-700">{fecha}</span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-200"></div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Estatus:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      compraEstado === "Aprobada" ? "bg-green-100 text-green-700" :
                      compraEstado === "Rechazada" ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {compraEstado || "Enviada"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
                    onClick={handleGuardarCambios}
                    disabled={!selectedId || saving}
                  >
                    Guardar
                  </button>
                  <button
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
                    onClick={() => setDevolverOpen(true)}
                    disabled={!selectedId || saving}
                  >
                    Devolver
                  </button>
                  <button
                    className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
                    onClick={handleAprobar}
                    disabled={!selectedId || saving}
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>

            {/* MITAD Y MITAD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LADO IZQUIERDO: Factura */}
              <div className="w-full">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-4">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">FACTURA</h3>
                    <span className="text-xs text-gray-500">Zoom • Arrastrar</span>
                  </div>
                  <div className="flex-1 bg-gray-50 overflow-hidden">
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
                                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => zoomOut()}
                                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => resetTransform()}
                                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
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
                        <div className="h-full flex items-center justify-center text-center p-6">
                          <div>
                            <div className="mb-3 text-gray-500 text-sm">No se puede previsualizar</div>
                            <a
                              href={facturaInfo.viewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Abrir archivo
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 p-6 text-center text-sm">
                          Sin URL disponible
                        </div>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 p-6 text-center text-sm">
                        Sin factura adjunta
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DERECHO: Formulario */}
              <div className="w-full space-y-4 pb-4 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Formulario de cabecera - COMPACTO */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">DATOS DE LA COMPRA</h3>
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">PARTIDAS</h3>
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500 text-xs">Partidas: </span>
                      <span className="font-bold text-gray-800 text-sm">{totals.items}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500 text-xs">Subtotal: </span>
                      <span className="font-bold text-gray-800 text-sm">{money(totals.subtotal)}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500 text-xs">IVA: </span>
                      <span className="font-bold text-gray-800 text-sm">{money(totals.iva)}</span>
                    </div>
                    <div className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
                      <span className="text-orange-600 text-xs">Total: </span>
                      <span className="font-bold text-orange-600 text-sm">{money(totals.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                      onClick={handleGuardarCambios}
                      disabled={!selectedId || saving}
                    >
                      Guardar
                    </button>
                    <button
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                      onClick={() => setDevolverOpen(true)}
                      disabled={!selectedId || saving}
                    >
                      Devolver
                    </button>
                    <button
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-800">Devolver compra</div>
              <button className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1" onClick={() => setDevolverOpen(false)}>
                ✕
              </button>
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-700 mb-2 block font-medium">Motivo</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                rows="4"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Escribe el motivo para devolver..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm" onClick={() => setDevolverOpen(false)}>
                Cancelar
              </button>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium" onClick={handleDevolver} disabled={saving}>
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