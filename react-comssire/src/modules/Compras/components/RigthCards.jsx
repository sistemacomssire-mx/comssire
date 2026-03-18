function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
}

export default function RigthCards(props) {
  const isAdmin = !!props.isAdmin;
  const saving = !!props.saving;
  const forceMode = !!props.forceMode;

  const compraEstado = props.compraEstado ?? "—";
  const motivoRechazo = props.motivoRechazo ?? null;

  const totals = props.totals ?? { items: 0, subtotal: 0, iva: 0, total: 0 };

  const onSaveDraft = props.onSaveDraft ?? null;
  const onSendApproval = props.onSendApproval ?? null;
  const onAdminSaveDraft = props.onAdminSaveDraft ?? null;
  const onAdminSaveAndDownloadMod = props.onAdminSaveAndDownloadMod ?? null;

  const isEnviada = String(compraEstado) === "Enviada";
  const isExportada = String(compraEstado) === "Exportada";
  const isRechazada = String(compraEstado) === "Rechazada";

  const getFinalizarButtonText = () => {
    if (saving) return "Procesando...";
    if (isExportada) {
      return forceMode ? "Forzar MOD" : "Actualizar MOD";
    }
    return "Generar MOD";
  };

  return (
    <div className="space-y-3 sticky top-3">
      {/* Tarjeta unificada de estatus y acciones */}
      <div className="bg-slate-800/30 rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Estatus</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isExportada ? 'bg-amber-500/20 text-amber-300' :
            isEnviada ? 'bg-blue-500/20 text-blue-300' :
            isRechazada ? 'bg-red-500/20 text-red-300' :
            'bg-slate-600 text-slate-300'
          }`}>
            {compraEstado}
          </span>
        </div>

        {isRechazada && motivoRechazo && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
            <span className="text-red-300 block">{motivoRechazo}</span>
          </div>
        )}

        {isAdmin && isExportada && (
          <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
            <span className="text-amber-300">
              {forceMode ? "🔓 Modo forzado" : "⚠️ Compra exportada"}
            </span>
          </div>
        )}

        {/* Totales compactos */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Partidas</div>
            <div className="font-bold text-white">{totals.items}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Subtotal</div>
            <div className="font-bold text-white">{money(totals.subtotal)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">IVA</div>
            <div className="font-bold text-white">{money(totals.iva)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total</div>
            <div className="font-bold text-blue-400">{money(totals.total)}</div>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-1.5">
          {isAdmin ? (
            <>
              <button
                onClick={onAdminSaveDraft || undefined}
                disabled={saving || !onAdminSaveDraft}
                className="w-full px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded"
              >
                {saving ? "Guardando..." : "Guardar borrador"}
              </button>
              <button
                onClick={onAdminSaveAndDownloadMod || undefined}
                disabled={saving || !onAdminSaveAndDownloadMod}
                className={`w-full px-3 py-1.5 text-sm rounded ${
                  forceMode 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {getFinalizarButtonText()}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onSaveDraft || undefined}
                disabled={saving || !onSaveDraft}
                className="w-full px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded"
              >
                {saving ? "Guardando..." : "Guardar borrador"}
              </button>
              <button
                onClick={onSendApproval || undefined}
                disabled={saving || !onSendApproval || isEnviada}
                className={`w-full px-3 py-1.5 text-sm rounded ${
                  isEnviada 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isEnviada ? "Enviada" : "Enviar aprobación"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}