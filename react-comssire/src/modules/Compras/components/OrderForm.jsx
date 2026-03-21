export default function OrderForm({
  readOnly = false,
  loading,
  folio,
  setFolio,
  fecha,
  setFecha,
  notas,
  setNotas,
  proveedores,
  proveedorSel,
  setProveedorSel,
  almacenes,
  almacenSel,
  setAlmacenSel,
}) {
  const inputClass =
    "w-full px-4 py-3 text-base bg-white border-[1.7px] border-slate-300 rounded-2xl text-slate-900 outline-none transition shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400";

  return (
    <div className="compra-card p-5">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <label className="compra-label">Folio factura</label>
          <input
            className={inputClass}
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            disabled={loading || readOnly}
            placeholder="Folio"
          />
        </div>

        <div className="col-span-2">
          <label className="compra-label">Fecha</label>
          <input
            className={inputClass}
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={loading || readOnly}
          />
        </div>

        <div className="col-span-4">
          <label className="compra-label">Proveedor</label>
          <select
            className={inputClass}
            value={String(proveedorSel || "")}
            onChange={(e) => setProveedorSel(e.target.value)}
            disabled={loading || readOnly}
          >
            <option value="">Seleccionar...</option>
            {proveedores.map((p) => (
              <option key={p.clave ?? p.Clave} value={String(p.clave ?? p.Clave)}>
                {String(
                  p.nombre ??
                    p.Nombre ??
                    p.razonSocial ??
                    p.RazonSocial ??
                    p.clave ??
                    p.Clave
                )}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-3">
          <label className="compra-label">Almacén default</label>
          <select
            className={inputClass}
            value={String(almacenSel || "")}
            onChange={(e) => setAlmacenSel(e.target.value)}
            disabled={loading || readOnly}
          >
            <option value="">Seleccionar...</option>
            {almacenes.map((a) => (
              <option key={a.cveAlm ?? a.CveAlm} value={String(a.cveAlm ?? a.CveAlm)}>
                {String(a.descr ?? a.Descr)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12">
          <label className="compra-label">Notas</label>
          <input
            className={inputClass}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            disabled={loading || readOnly}
            placeholder="Observaciones..."
          />
        </div>
      </div>
    </div>
  );
}