import { useMemo } from "react";
import { useLocation } from "react-router-dom";

function getRouteMeta(pathname) {
  const rules = [
    { test: (p) => p.startsWith("/compras/aprobaciones"), title: "Aprobaciones", subtitle: "Compras" },
    { test: (p) => p.startsWith("/compras/historial"), title: "Historial de compras", subtitle: "Compras" },
    { test: (p) => p.startsWith("/compras"), title: "Compras", subtitle: "Órdenes de compra" },
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

  const { title, subtitle } = useMemo(
    () => getRouteMeta(location.pathname || ""),
    [location.pathname]
  );

  return (
    <header className="app-topbar px-4 py-2.5 md:px-5">
      <div className="flex items-center justify-between gap-3 min-h-[60px]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white shrink-0"
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

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(250,137,26,0.75)]" />
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 truncate">
                {subtitle || "Sistema"}
              </p>
            </div>
            <h1 className="text-base md:text-lg font-semibold text-white leading-tight truncate">
              {title}
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}