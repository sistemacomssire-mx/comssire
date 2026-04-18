function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
}

export default function RightCardsRemision({
  saving = false,
  totals = { items: 0, subtotal: 0, iva: 0, total: 0 },
  compraEstado = "Borrador",
  onSaveDraft,
  onDownloadMod,
}) {
  const getEstadoColor = () => {
    const estado = String(compraEstado).toLowerCase();
    switch (estado) {
      case "borrador":
      case "1":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "guardada":
      case "enviada":
      case "2":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "aprobada":
      case "3":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rechazada":
      case "4":
        return "bg-red-50 text-red-700 border-red-200";
      case "exportada":
      case "5":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getEstadoTexto = () => {
    const estado = String(compraEstado).toLowerCase();
    const estadoMap = {
      "1": "Borrador",
      "2": "Guardada",
      "3": "Aprobada",
      "4": "Rechazada",
      "5": "Exportada (MOD generado)",
      borrador: "Borrador",
      guardada: "Guardada",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
      exportada: "Exportada (MOD generado)",
    };
    return estadoMap[estado] || compraEstado;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.35rem] border border-slate-300 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
        <div className="px-5 py-4 border-b border-slate-200 bg-[#fffaf4]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Resumen</p>
              <h3 className="mt-1 text-[1.15rem] md:text-[1.25rem] leading-none font-semibold text-slate-900">
                Control de compra
              </h3>
            </div>

            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getEstadoColor()}`}>
              {getEstadoTexto()}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Partidas</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{totals.items}</div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm">
              <div className="text-[11px] uppercase tracking-wide text-orange-700">Total</div>
              <div className="mt-2 text-2xl font-semibold text-orange-600">{money(totals.total)}</div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Subtotal</div>
              <div className="mt-2 text-[1.15rem] leading-none font-semibold text-slate-900">
                {money(totals.subtotal)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">IVA</div>
              <div className="mt-2 text-[1.15rem] leading-none font-semibold text-slate-900">
                {money(totals.iva)}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <button
              onClick={onSaveDraft || undefined}
              disabled={saving || !onSaveDraft}
              className="btn-save-draft w-full rounded-2xl px-4 py-3 text-sm flex items-center justify-center gap-2 font-medium"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {saving ? "Guardando..." : "Guardar borrador"}
            </button>

            <button
              onClick={onDownloadMod || undefined}
              disabled={saving || !onDownloadMod}
              className="right-card-primary w-full rounded-2xl px-4 py-3 text-sm flex items-center justify-center gap-2 font-medium shadow-[0_10px_22px_rgba(250,137,26,0.18)]"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Generar MOD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
