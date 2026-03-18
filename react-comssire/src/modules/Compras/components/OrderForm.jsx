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
  return (
    <div className="bg-slate-800/30 rounded p-3">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <label className="text-xs text-slate-400 block mb-1">Folio factura</label>
          <input
            className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            disabled={loading || readOnly}
            placeholder="Folio"
          />
        </div>
        
        <div className="col-span-2">
          <label className="text-xs text-slate-400 block mb-1">Fecha</label>
          <input
            className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={loading || readOnly}
          />
        </div>
        
        <div className="col-span-4">
          <label className="text-xs text-slate-400 block mb-1">Proveedor</label>
          <select
            className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
            value={String(proveedorSel || "")}
            onChange={(e) => setProveedorSel(e.target.value)}
            disabled={loading || readOnly}
          >
            <option value="">Seleccionar...</option>
            {proveedores.map((p) => (
              <option key={p.clave ?? p.Clave} value={String(p.clave ?? p.Clave)}>
                {String(p.nombre ?? p.Nombre ?? p.razonSocial ?? p.RazonSocial ?? p.clave ?? p.Clave)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-span-3">
          <label className="text-xs text-slate-400 block mb-1">Almacén default</label>
          <select
            className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
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
          <label className="text-xs text-slate-400 block mb-1">Notas</label>
          <input
            className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
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