export default function ComprasRemisionTopbar({
  statusText = "Nueva",
  hasActiveCompra = false,
  onScan,
  onNew,
  onMenu,
  sidebarOpen,
}) {
  return (
    <header className="app-topbar px-4 py-3 md:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white shrink-0"
            type="button"
            onClick={onMenu}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {sidebarOpen ? (
                <>
                  <path d="M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6L18 18" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M4 6H20" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12H20" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 18H20" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.45rem] md:text-[1.65rem] font-semibold text-white leading-none">
                Compras Remisión
              </h1>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  hasActiveCompra
                    ? "border-orange-300/30 bg-orange-400/10 text-orange-100"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${hasActiveCompra ? "bg-orange-400" : "bg-slate-500"}`} />
                {hasActiveCompra ? `Remisión ${statusText}` : "Sin remisión activa"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onScan}
            type="button"
            className="px-4 py-2.5 text-sm bg-white/10 hover:bg-white/15 text-slate-100 rounded-2xl flex items-center gap-2 border border-white/10 transition-colors shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
            aria-disabled="true"
            title="No disponible en compras remisión"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M2 8V6C2 4.89543 2.89543 4 4 4H8" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 8V6C22 4.89543 21.1046 4 20 4H16" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 16V18C2 19.1046 2.89543 20 4 20H8" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 16V18C22 19.1046 21.1046 20 20 20H16" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 12H18" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Escanear
          </button>

          <button
            onClick={onNew}
            className="px-4 py-2.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center gap-2 shadow-[0_10px_22px_rgba(250,137,26,0.18)]"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5V19" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 12H19" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nueva
          </button>
        </div>
      </div>
    </header>
  );
}
