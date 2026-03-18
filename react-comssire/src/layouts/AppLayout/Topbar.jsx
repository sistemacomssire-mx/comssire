import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authStorage } from "../../modules/Auth/store/auth.storage";

function getRouteMeta(pathname) {
  // Orden importa: rutas más específicas primero
  const rules = [
    { test: (p) => p.startsWith("/compras/aprobaciones"), title: "Aprobaciones", subtitle: "Compras" },
    { test: (p) => p.startsWith("/compras/historial"), title: "Historial de compras", subtitle: "Compras" },
    { test: (p) => p.startsWith("/compras"), title: "Compras", subtitle: "Órdenes de compra" },

    // ✅ Inventario (más específico primero)
    { test: (p) => p === "/inventario/tomas", title: "Historial de tomas", subtitle: "Inventario" },
    { test: (p) => p.startsWith("/inventario/tomas/"), title: "Toma física", subtitle: "Inventario" },
    { test: (p) => p.startsWith("/inventario/tomas"), title: "Tomas físicas", subtitle: "Inventario" },
    { test: (p) => p.startsWith("/inventario"), title: "Inventario", subtitle: "Stock" },

    { test: (p) => p.startsWith("/usuarios"), title: "Usuarios", subtitle: "Gestión" },

    { test: (p) => p.startsWith("/cuenta/cambiar-password"), title: "Cuenta", subtitle: "Seguridad" },
    { test: (p) => p.startsWith("/home"), title: "Dashboard", subtitle: "Inicio" },
    { test: (p) => p === "/" || p === "", title: "Dashboard", subtitle: "Inicio" },
  ];

  for (const r of rules) {
    if (r.test(pathname)) return { title: r.title, subtitle: r.subtitle };
  }
  return { title: "Panel", subtitle: "" };
}

export default function Topbar({ onMenu, sidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { title, subtitle } = useMemo(
    () => getRouteMeta(location.pathname || ""),
    [location.pathname]
  );

  const displayName = useMemo(() => {
    const payload = authStorage.getPayload();
    const nameFromJwt =
      payload?.name ||
      payload?.unique_name ||
      payload?.given_name ||
      payload?.preferred_username;

    return (
      String(nameFromJwt || authStorage.getUsername() || "Usuario").trim() ||
      "Usuario"
    );
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 py-1.5 px-3">
      <div className="flex items-center justify-between">
        {/* IZQUIERDA */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Botón menú - SIEMPRE VISIBLE pero con diseño compacto */}
          <button
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors shrink-0"
            type="button"
            onClick={onMenu}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {sidebarOpen ? (
                // Icono X cuando está abierto (para cerrar)
                <>
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                // Icono hamburguesa cuando está cerrado (para abrir)
                <>
                  <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="text-base font-bold text-white leading-tight truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-slate-400 hidden sm:block truncate max-w-[180px]">
            {displayName}
          </span>
          <button 
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-md flex items-center gap-1.5 transition-colors" 
            type="button" 
            onClick={handleLogout}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
      
      {/* Versión móvil del nombre (solo visible en móvil) */}
      <div className="sm:hidden mt-1 text-xs text-slate-500 truncate">
        {displayName}
      </div>
    </header>
  );
}