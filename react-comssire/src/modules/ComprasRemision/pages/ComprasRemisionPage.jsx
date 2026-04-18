import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { comprasRemisionApi } from "../api/comprasRemision.api";

import ComprasRemisionTopbar from "../components/ComprasRemisionTopbar";
import OrderHeaderRemision from "../components/OrderHeaderRemision";
import OrderFormRemision from "../components/OrderFormRemision";
import LinesSectionRemision from "../components/LinesSectionRemision";
import RightCardsRemision from "../components/RightCardsRemision";
import SplitModalRemision from "../components/SplitModalRemision";
import { getAuthFromStorage } from "../utils/auth";

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

function truncate(value, max) {
  const text = String(value || "");
  return text.length <= max ? text : text.slice(0, max);
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

async function swalSuccess(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "success",
    title,
    text,
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#ea580c",
  });
}

async function swalError(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#dc2626",
  });
}

async function swalConfirm(title, text) {
  const res = await Swal.fire({
    ...swalBase,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ea580c",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: true,
  });

  return res.isConfirmed;
}

function mapCompraToLines(compra, fallbackWarehouse = "") {
  const partidas = compra?.partidas || [];
  return partidas.map((p, idx) => {
    const repartos = p?.repartos || [];
    const firstWarehouse =
      repartos?.[0]?.numAlm ??
      fallbackWarehouse ??
      "";

    return {
      backendPartidaId: p?.id ?? `tmp-${idx}`,
      codigo: String(p?.cveArt ?? "").trim(),
      desc: String(p?.descripcion ?? "").trim(),
      cant: Number(p?.cantTotal ?? 0),
      costo: Number(p?.costoUnitario ?? 0),
      precio: Number(p?.precioUnitario ?? 0),
      warehouse: String(firstWarehouse ?? "").trim(),
      repartos: repartos.map((r, ridx) => ({
        id: r?.id ?? `${idx}-${ridx}`,
        numAlm: String(r?.numAlm ?? "").trim(),
        cant: Number(r?.cant ?? 0),
      })),
    };
  });
}

export default function ComprasRemisionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useMemo(() => getAuthFromStorage(), []);
  const isAdmin = !!auth?.isAdmin;

  const editCompraRemisionId =
    location.state?.editCompraRemisionId ||
    location.state?.compraRemisionId ||
    null;

  const [proveedores, setProveedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);

  const [compraId, setCompraId] = useState(null);
  const [compraEstado, setCompraEstado] = useState("Borrador");

  const [folioRemision, setFolioRemision] = useState("");
  const [fecha, setFecha] = useState(todayLocalDateInput());
  const [proveedorSel, setProveedorSel] = useState("");
  const [almacenSel, setAlmacenSel] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [lines, setLines] = useState([]);
  const [existencias, setExistencias] = useState([]);

  const [piezaCodigo, setPiezaCodigo] = useState("");
  const [piezaDesc, setPiezaDesc] = useState("");
  const [piezaCant, setPiezaCant] = useState(1);
  const [piezaCosto, setPiezaCosto] = useState(0);
  const [piezaPrecio, setPiezaPrecio] = useState(0);
  const [almacenLineaSel, setAlmacenLineaSel] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  const [splitOpen, setSplitOpen] = useState(false);
  const [splitDraft, setSplitDraft] = useState(null);

  const snapshotRef = useRef("");

  const totals = useMemo(() => {
    const items = lines.length;
    const subtotal = lines.reduce((acc, x) => acc + Number(x.cant || 0) * Number(x.costo || 0), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    return { items, subtotal, iva, total };
  }, [lines]);

  const pageStatus = useMemo(() => {
    if (!compraId) return "Borrador";
    if (lines.length > 0) return "Guardada";
    return "Borrador";
  }, [compraId, lines.length]);

  const currentSnapshot = () =>
    JSON.stringify({
      compraId,
      folioRemision,
      fecha,
      proveedorSel,
      almacenSel,
      observaciones,
      lines,
    });

  const markSaved = () => {
    snapshotRef.current = currentSnapshot();
    window.__COMSSIRE_DIRTY = false;
  };

  const syncDirtyFlag = () => {
    if (!snapshotRef.current) return;
    window.__COMSSIRE_DIRTY = snapshotRef.current !== currentSnapshot();
  };

  useEffect(() => {
    syncDirtyFlag();
  }, [compraId, folioRemision, fecha, proveedorSel, almacenSel, observaciones, lines]);

  useEffect(() => {
    if (!isAdmin) {
      swalError("Acceso restringido", "Este módulo solo está disponible para administradores.");
      navigate("/home", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    window.__COMSSIRE_TOMA_GUARD = window.__COMSSIRE_TOMA_GUARD || null;
    return () => {
      window.__COMSSIRE_DIRTY = false;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCatalogos(true);
        const [prov, alm] = await Promise.all([
          comprasRemisionApi.getProveedores(),
          comprasRemisionApi.getAlmacenes(),
        ]);
        setProveedores(prov);
        setAlmacenes(alm);
      } catch (e) {
        await swalError("No se pudieron cargar catálogos", getErrorMessage(e, "Revisa la conexión con el backend."));
      } finally {
        setLoadingCatalogos(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!editCompraRemisionId) {
      markSaved();
      return;
    }

    let cancelled = false;

    const loadCompra = async () => {
      try {
        setSaving(true);
        const compra = await comprasRemisionApi.getById(editCompraRemisionId);
        if (cancelled) return;

        setCompraId(compra.id);
        setCompraEstado("Guardada");
        setFolioRemision(compra.folioRemision || "");
        setFecha(toDateInputValue(compra.fecha));
        setProveedorSel(String(compra.cveClpv || ""));
        setAlmacenSel(String(compra.numAlmaDefault || ""));
        setObservaciones(compra.observaciones || "");
        setLines(mapCompraToLines(compra, String(compra.numAlmaDefault || "")));
        setAlmacenLineaSel(String(compra.numAlmaDefault || ""));

        setTimeout(markSaved, 0);
      } catch (e) {
        await swalError("No se pudo cargar la remisión", getErrorMessage(e, "Error al obtener la remisión."));
      } finally {
        if (!cancelled) setSaving(false);
      }
    };

    loadCompra();

    return () => {
      cancelled = true;
    };
  }, [editCompraRemisionId]);

  const resetLineDraft = () => {
    setPiezaCodigo("");
    setPiezaDesc("");
    setPiezaCant(1);
    setPiezaCosto(0);
    setPiezaPrecio(0);
    setExistencias([]);
  };

  const handleNew = async () => {
    if (window.__COMSSIRE_DIRTY) {
      const ok = await swalConfirm("Cambios sin guardar", "Tienes cambios sin guardar. ¿Deseas limpiar la captura actual?");
      if (!ok) return;
    }

    setCompraId(null);
    setCompraEstado("Borrador");
    setFolioRemision("");
    setFecha(todayLocalDateInput());
    setProveedorSel("");
    setAlmacenSel("");
    setObservaciones("");
    setLines([]);
    setAlmacenLineaSel("");
    resetLineDraft();
    navigate("/compras-remision", { replace: true, state: {} });
    setTimeout(markSaved, 0);
  };

  const handleLookup = async (code) => {
    if (!code) return;
    try {
      const [producto, ex] = await Promise.all([
        comprasRemisionApi.getProductoByCodigo(code),
        comprasRemisionApi.getExistencias(code),
      ]);

      const descripcion =
        producto?.descr ??
        producto?.Descr ??
        producto?.descripcion ??
        producto?.Descripcion ??
        piezaDesc;

      const costo =
        producto?.ultCosto ??
        producto?.UltCosto ??
        producto?.costo ??
        producto?.Costo ??
        piezaCosto;

      const precio =
        producto?.precio ??
        producto?.Precio ??
        producto?.precioUnitario ??
        producto?.PrecioUnitario ??
        piezaPrecio;

      setPiezaCodigo(truncate(code, 16));
      setPiezaDesc(truncate(descripcion || "", 40));
      setPiezaCosto(Number(costo || 0));
      setPiezaPrecio(Number(precio || 0));
      setExistencias(Array.isArray(ex) ? ex : []);
    } catch (e) {
      await swalError("No se pudo consultar el producto", getErrorMessage(e, "Error al consultar el producto."));
    }
  };

  const handleSearchProducts = async (term) => {
    return await comprasRemisionApi.getProductos(term);
  };

  const validateHeader = () => {
    if (!folioRemision.trim()) return "Captura el folio de remisión.";
    if (!fecha) return "Selecciona una fecha.";
    if (!proveedorSel) return "Selecciona un proveedor.";
    if (!almacenSel) return "Selecciona un almacén default.";
    return null;
  };

  const buildHeaderPayload = () => ({
    folioRemision: folioRemision.trim(),
    fecha,
    cveClpv: String(proveedorSel || "").trim(),
    numAlmaDefault: Number(almacenSel || 0),
    observaciones: observaciones?.trim() || null,
  });

  const ensureCompraSaved = async () => {
    if (compraId) return compraId;

    const validation = validateHeader();
    if (validation) {
      await swalError("Faltan datos", validation);
      throw new Error(validation);
    }

    const created = await comprasRemisionApi.create(buildHeaderPayload());

    setCompraId(created.id);
    setCompraEstado("Guardada");
    if (!almacenLineaSel) setAlmacenLineaSel(String(created.numAlmaDefault || almacenSel || ""));
    return created.id;
  };

  const handleSaveDraft = async () => {
    try {
      const validation = validateHeader();
      if (validation) {
        await swalError("Faltan datos", validation);
        return;
      }

      setSaving(true);

      if (!compraId) {
        const created = await comprasRemisionApi.create(buildHeaderPayload());
        setCompraId(created.id);
        setCompraEstado("Guardada");
        await swalSuccess("Remisión guardada", "El encabezado se guardó correctamente.");
      } else {
        const updated = await comprasRemisionApi.update(compraId, buildHeaderPayload());
        setCompraEstado("Guardada");
        if (updated?.partidas) {
          setLines(mapCompraToLines(updated, String(updated.numAlmaDefault || almacenSel || "")));
        }
        await swalSuccess("Cambios guardados", "La remisión se actualizó correctamente.");
      }

      setTimeout(markSaved, 0);
    } catch (e) {
      await swalError("No se pudo guardar", getErrorMessage(e, "Error al guardar la remisión."));
    } finally {
      setSaving(false);
    }
  };

  const handleAddLine = async () => {
    try {
      if (!piezaCodigo.trim()) {
        await swalError("Falta código", "Selecciona o captura un producto.");
        return;
      }

      if (!piezaDesc.trim()) {
        await swalError("Falta descripción", "Captura la descripción del producto.");
        return;
      }

      if (!piezaCant || Number(piezaCant) <= 0) {
        await swalError("Cantidad inválida", "La cantidad debe ser mayor a cero.");
        return;
      }

      if (!almacenLineaSel && !almacenSel) {
        await swalError("Falta almacén", "Selecciona un almacén para la partida.");
        return;
      }

      setSaving(true);

      const id = await ensureCompraSaved();

      const warehouse = String(almacenLineaSel || almacenSel || "").trim();

      const payload = {
        cveArt: truncate(piezaCodigo, 16),
        descripcion: truncate(piezaDesc, 40),
        cantTotal: Number(piezaCant),
        costoUnitario: Number(piezaCosto || 0),
        precioUnitario: Number(piezaPrecio || 0),
        uniVenta: "PZ",
        ivaPct: 16,
        observaciones: null,
        repartos: [
          {
            numAlm: Number(warehouse),
            cant: Number(piezaCant),
          },
        ],
      };

      const compra = await comprasRemisionApi.addPartida(id, payload);
      setLines(mapCompraToLines(compra, String(compra.numAlmaDefault || warehouse)));
      resetLineDraft();

      await swalSuccess("Partida agregada", "La partida se registró correctamente.");
      setTimeout(markSaved, 0);
    } catch (e) {
      await swalError("No se pudo agregar la partida", getErrorMessage(e, "Error al agregar la partida."));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLine = async (line) => {
    if (!compraId || !line?.backendPartidaId) return;

    const ok = await swalConfirm("Eliminar partida", "¿Deseas eliminar esta partida?");
    if (!ok) return;

    try {
      setSaving(true);
      const compra = await comprasRemisionApi.deletePartida(compraId, line.backendPartidaId);
      setLines(mapCompraToLines(compra, String(compra.numAlmaDefault || almacenSel || "")));
      await swalSuccess("Partida eliminada", "La partida fue eliminada correctamente.");
      setTimeout(markSaved, 0);
    } catch (e) {
      await swalError("No se pudo eliminar", getErrorMessage(e, "Error al eliminar la partida."));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeLineWarehouse = async (idx, value) => {
    const target = lines[idx];
    if (!target || !compraId || !target.backendPartidaId) return;

    const nextLines = [...lines];
    nextLines[idx] = {
      ...target,
      warehouse: value,
      repartos: [
        {
          id: `${target.backendPartidaId}-0`,
          numAlm: value,
          cant: Number(target.cant || 0),
        },
      ],
    };
    setLines(nextLines);

    try {
      setSaving(true);

      const payload = {
        cveArt: truncate(target.codigo, 16),
        descripcion: truncate(target.desc, 40),
        cantTotal: Number(target.cant || 0),
        costoUnitario: Number(target.costo || 0),
        precioUnitario: Number(target.precio || 0),
        uniVenta: "PZ",
        ivaPct: 16,
        observaciones: null,
        repartos: [
          {
            numAlm: Number(value),
            cant: Number(target.cant || 0),
          },
        ],
      };

      const compra = await comprasRemisionApi.updatePartida(compraId, target.backendPartidaId, payload);
      setLines(mapCompraToLines(compra, String(compra.numAlmaDefault || almacenSel || "")));
      setTimeout(markSaved, 0);
    } catch (e) {
      await swalError("No se pudo actualizar el almacén", getErrorMessage(e, "Error al actualizar la partida."));
    } finally {
      setSaving(false);
    }
  };

  const handleSyncWarehouses = async () => {
    if (!almacenSel || !lines.length) return;

    const ok = await swalConfirm(
      "Sincronizar almacenes",
      "Esto cambiará todas las partidas al almacén default seleccionado."
    );
    if (!ok) return;

    try {
      setSaving(true);

      let currentCompra = null;
      for (const line of lines) {
        if (!line.backendPartidaId) continue;

        currentCompra = await comprasRemisionApi.updatePartida(compraId, line.backendPartidaId, {
          cveArt: truncate(line.codigo, 16),
          descripcion: truncate(line.desc, 40),
          cantTotal: Number(line.cant || 0),
          costoUnitario: Number(line.costo || 0),
          precioUnitario: Number(line.precio || 0),
          uniVenta: "PZ",
          ivaPct: 16,
          observaciones: null,
          repartos: [
            {
              numAlm: Number(almacenSel),
              cant: Number(line.cant || 0),
            },
          ],
        });
      }

      if (currentCompra) {
        setLines(mapCompraToLines(currentCompra, String(currentCompra.numAlmaDefault || almacenSel)));
      }

      await swalSuccess("Partidas sincronizadas", "Todas las partidas usan ahora el almacén default.");
      setTimeout(markSaved, 0);
    } catch (e) {
      await swalError("No se pudo sincronizar", getErrorMessage(e, "Error al sincronizar almacenes."));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSplit = (line) => {
    setSplitDraft(line);
    setSplitOpen(true);
  };

  const handleConfirmSplit = async (rows) => {
    if (!compraId || !splitDraft?.backendPartidaId) {
      setSplitOpen(false);
      setSplitDraft(null);
      return;
    }

    const total = rows.reduce((acc, x) => acc + Number(x.cant || 0), 0);
    if (Number(total) !== Number(splitDraft.cant || 0)) {
      await swalError(
        "Reparto inválido",
        `La suma del reparto (${total}) debe ser igual a la cantidad de la partida (${splitDraft.cant}).`
      );
      return;
    }

    try {
      setSaving(true);

      const compra = await comprasRemisionApi.updatePartida(compraId, splitDraft.backendPartidaId, {
        cveArt: truncate(splitDraft.codigo, 16),
        descripcion: truncate(splitDraft.desc, 40),
        cantTotal: Number(splitDraft.cant || 0),
        costoUnitario: Number(splitDraft.costo || 0),
        precioUnitario: Number(splitDraft.precio || 0),
        uniVenta: "PZ",
        ivaPct: 16,
        observaciones: null,
        repartos: rows.map((r) => ({
          numAlm: Number(r.numAlm),
          cant: Number(r.cant),
        })),
      });

      setLines(mapCompraToLines(compra, String(compra.numAlmaDefault || almacenSel || "")));
      setSplitOpen(false);
      setSplitDraft(null);

      await swalSuccess("Reparto actualizado", "La partida fue repartida correctamente.");
      setTimeout(markSaved, 0);
    } catch (e) {
      await swalError("No se pudo guardar el reparto", getErrorMessage(e, "Error al guardar el reparto."));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadMod = async () => {
    if (!compraId) {
      await swalError("Sin remisión", "Guarda la remisión antes de descargar el MOD.");
      return;
    }

    if (!lines.length) {
      await swalError("Sin partidas", "Agrega al menos una partida antes de descargar el MOD.");
      return;
    }

    try {
      setSaving(true);
      const { blob, filename } = await comprasRemisionApi.downloadMod(compraId);
      downloadBlob(blob, filename);
      setCompraEstado("Exportada");
      await swalSuccess("MOD descargado", "El archivo MOD se descargó correctamente.");
    } catch (e) {
      await swalError("No se pudo descargar el MOD", getErrorMessage(e, "Error al descargar el archivo MOD."));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!compraId) {
      await swalError("Sin remisión", "Guarda la remisión antes de descargar el PDF.");
      return;
    }

    try {
      setSaving(true);
      const { blob, filename } = await comprasRemisionApi.downloadPdf(compraId);
      downloadBlob(blob, filename);
      await swalSuccess("PDF descargado", "El archivo PDF se descargó correctamente.");
    } catch (e) {
      await swalError("No se pudo descargar el PDF", getErrorMessage(e, "Error al descargar el PDF."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      topbar={
        <ComprasRemisionTopbar
          hasActiveCompra={!!compraId}
          statusText={compraEstado || pageStatus}
          onNew={handleNew}
          onScan={() => {}}
        />
      }
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-shrink-0 mb-4 w-full px-4 md:px-5">
          <OrderHeaderRemision
            folio={folioRemision}
            fecha={fecha}
            status={compraEstado || pageStatus}
            partidasCount={lines.length}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 w-full min-h-0 px-4 md:px-5 pb-6">
          <div className="lg:col-span-8 space-y-4 overflow-y-auto pr-2 w-full">
              <OrderFormRemision
                readOnly={saving}
                loading={loadingCatalogos || saving}
                folio={folioRemision}
                setFolio={setFolioRemision}
                fecha={fecha}
                setFecha={setFecha}
                notas={observaciones}
                setNotas={setObservaciones}
                proveedores={proveedores}
                proveedorSel={proveedorSel}
                setProveedorSel={setProveedorSel}
                almacenes={almacenes}
                almacenSel={almacenSel}
                setAlmacenSel={(v) => {
                  setAlmacenSel(v);
                  if (!almacenLineaSel) setAlmacenLineaSel(v);
                }}
              />

              <LinesSectionRemision
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
                piezaCosto={piezaCosto}
                setPiezaCosto={setPiezaCosto}
                piezaPrecio={piezaPrecio}
                setPiezaPrecio={setPiezaPrecio}
                onLookup={handleLookup}
                existencias={existencias}
                onAddLine={handleAddLine}
                lines={lines}
                onRemoveLine={handleRemoveLine}
                onChangeLineWarehouse={handleChangeLineWarehouse}
                onSearchProducts={handleSearchProducts}
                onSyncWarehouses={handleSyncWarehouses}
                almacenHeader={almacenSel}
              />
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-4 space-y-4">
                <RightCardsRemision
                saving={saving}
                totals={totals}
                compraEstado={compraEstado || pageStatus}
                onSaveDraft={handleSaveDraft}
                onDownloadMod={handleDownloadMod}
                onDownloadPdf={handleDownloadPdf}
              />
              </div>
            </div>
          </div>
        </div>

        <SplitModalRemision
          open={splitOpen}
          onClose={() => {
            setSplitOpen(false);
            setSplitDraft(null);
          }}
          line={splitDraft}
          almacenes={almacenes}
          onConfirm={handleConfirmSplit}
        />
    </AppLayout>
  );
}