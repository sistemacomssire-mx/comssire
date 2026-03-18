import { useMemo } from "react";
import { authStorage } from "../../Auth/store/auth.storage";

export default function ComprasTopbar({
  roleText,
  statusText = "Nueva",
  hasActiveCompra = false,
  onScan,
  onNew,
  onMenu,
  sidebarOpen,
}) {
  const displayName = useMemo(() => {
    const payload = authStorage.getPayload();
    const nameFromJwt =
      payload?.name ||
      payload?.unique_name ||
      payload?.given_name ||
      payload?.preferred_username;
    return String(roleText || nameFromJwt || authStorage.getUsername() || "Usuario").trim() || "Usuario";
  }, [roleText]);

  return (
    <header className="bg-slate-900 border-b border-slate-800 py-1.5 px-3 w-full">
      <div className="flex items-center justify-between w-full">
        {/* Izquierda */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors shrink-0"
            type="button"
            onClick={onMenu}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {sidebarOpen ? (
                <>
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>

          <div>
            <h1 className="text-base font-bold text-white">Compras</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 truncate max-w-[150px]">{displayName}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                hasActiveCompra ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasActiveCompra ? 'bg-orange-400' : 'bg-slate-500'}`} />
                {hasActiveCompra ? `Compra: ${statusText}` : "Sin compra activa"}
              </span>
            </div>
          </div>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onScan} className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M2 8V6C2 4.89543 2.89543 4 4 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 8V6C22 4.89543 21.1046 4 20 4H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 16V18C2 19.1046 2.89543 20 4 20H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 16V18C22 19.1046 21.1046 20 20 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Escanear
          </button>
          <button onClick={onNew} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nueva
          </button>
        </div>
      </div>
    </header>
  );
}