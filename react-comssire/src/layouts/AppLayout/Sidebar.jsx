import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import logo from "../../../public/img/LogoComssire.png";
import { authStorage } from "../../modules/Auth/store/auth.storage";
import { toast } from "sonner";

function ModalShell({ open, children }) {
  if (!open) return null;

  return createPortal(
    <div 
      style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "1rem"
      }}
    >
      <div style={{ 
        width: "100%",
        maxWidth: "28rem",
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        border: "3px solid #dc2626",
        boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.5)",
        overflow: "hidden"
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ModalHeader({ icon, title, description, variant = "warning" }) {
  const getIconBgColor = () => {
    switch (variant) {
      case "danger":
        return { backgroundColor: "#dc2626", color: "#ffffff", border: "2px solid #b91c1c" };
      case "warning":
        return { backgroundColor: "#f59e0b", color: "#ffffff", border: "2px solid #d97706" };
      case "info":
        return { backgroundColor: "#3b82f6", color: "#ffffff", border: "2px solid #2563eb" };
      default:
        return { backgroundColor: "#fa891a", color: "#ffffff", border: "2px solid #ea7607" };
    }
  };

  const iconStyle = getIconBgColor();

  return (
    <div className="px-6 pt-6 pb-3">
      <div className="flex items-start gap-4">
        <div 
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={iconStyle}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black uppercase tracking-wide" style={{ color: "#991b1b" }}>
            {title}
          </h3>
          <p 
            className="mt-2 text-sm font-semibold leading-relaxed p-3 rounded-lg"
            style={{ 
              backgroundColor: "transparent", 
              color: "#991b1b", 
              border: "1px solid #dc2626"
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div className="px-6 pb-6 pt-2">
      <div className="flex flex-wrap justify-end gap-3">{children}</div>
    </div>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      style={{ 
        backgroundColor: "transparent", 
        color: "#fa891a", 
        border: "2px solid #fa891a",
        boxShadow: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#fa891a";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#fa891a";
      }}
    >
      {children}
    </button>
  );
}

function SoftOrangeButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      style={{ 
        backgroundColor: "transparent", 
        color: "#f97316", 
        border: "2px solid #f97316",
        boxShadow: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f97316";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#f97316";
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      style={{ 
        backgroundColor: "transparent", 
        color: "#fa891a", 
        border: "2px solid #fa891a",
        boxShadow: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#fa891a";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#fa891a";
      }}
    >
      {children}
    </button>
  );
}

function DangerButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
      style={{ 
        backgroundColor: "transparent", 
        color: "#dc2626", 
        border: "2px solid #dc2626",
        boxShadow: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#dc2626";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#dc2626";
      }}
    >
      {children}
    </button>
  );
}

function ConfirmLeaveComprasModal({ open, onCancel, onConfirm }) {
  return (
    <ModalShell open={open}>
      <ModalHeader
        variant="danger"
        icon={
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
      />

      <ModalFooter>
        <SecondaryButton onClick={onCancel}>Cancelar</SecondaryButton>
        <DangerButton onClick={onConfirm}>Salir</DangerButton>
      </ModalFooter>
    </ModalShell>
  );
}

function ConfirmLeaveTomaModal({ open, onStay, onDiscard, onSaveAndLeave }) {
  return (
    <ModalShell open={open}>
      <ModalHeader
        variant="warning"
        icon={
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        }
        title="⚠️ Toma de inventario en progreso"
        description="Hay una toma de inventario activa. Si cambias de módulo sin guardar, perderás el progreso. Elige una opción:"
      />

      <ModalFooter>
        <SecondaryButton onClick={onStay}>📌 Seguir aquí</SecondaryButton>
        <SoftOrangeButton onClick={onDiscard}>🗑️ Descartar progreso</SoftOrangeButton>
        <PrimaryButton onClick={onSaveAndLeave}>💾 Guardar y continuar</PrimaryButton>
      </ModalFooter>
    </ModalShell>
  );
}

function SidebarContent({ onNavigate }) {
  const year = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();

  const [openMenus, setOpenMenus] = useState({ compras: false, inventario: false });
  const [confirmComprasOpen, setConfirmComprasOpen] = useState(false);
  const [confirmTomaOpen, setConfirmTomaOpen] = useState(false);
  const [pendingTo, setPendingTo] = useState(null);

  const auth = useMemo(
    () => ({
      isAdmin: authStorage.isAdmin(),
      hasPerm: (p) => authStorage.hasPerm(p),
    }),
    []
  );

  const canSeeInventario =
    auth.isAdmin ||
    auth.hasPerm("inventarios.ver") ||
    auth.hasPerm("inventarios.toma.crear") ||
    auth.hasPerm("inventarios.toma.reporte");

  const canSeeHistorialTomas =
    auth.isAdmin || auth.hasPerm("inventarios.toma.reporte");

  const canSeeAprobaciones =
    auth.isAdmin ||
    auth.hasPerm("compras.ver_aprobaciones") ||
    auth.hasPerm("compras.aprobar") ||
    auth.hasPerm("compras.rechazar");

  useEffect(() => {
    const path = location.pathname;
    setOpenMenus((prev) => ({
      ...prev,
      compras: path.startsWith("/compras"),
      inventario: path.startsWith("/inventario"),
    }));
  }, [location.pathname]);

  const toggleMenu = (menu) =>
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));

  const go = (to) => {
    navigate(to);
    if (onNavigate) onNavigate();
  };

  const handleGuardedNav = (e, to) => {
    if (window.__COMSSIRE_TOMA_GUARD?.active) {
      e.preventDefault();
      setPendingTo(to);
      setConfirmTomaOpen(true);
      return;
    }
    if (window.__COMSSIRE_DIRTY) {
      e.preventDefault();
      setPendingTo(to);
      setConfirmComprasOpen(true);
      return;
    }
    if (onNavigate) onNavigate();
  };

  const confirmLeaveCompras = () => {
    setConfirmComprasOpen(false);
    window.__COMSSIRE_DIRTY = false;
    if (pendingTo) go(pendingTo);
    setPendingTo(null);
  };

  const cancelLeaveCompras = () => {
    setConfirmComprasOpen(false);
    setPendingTo(null);
  };

  const stayToma = () => {
    setConfirmTomaOpen(false);
    setPendingTo(null);
  };

  const discardToma = () => {
    setConfirmTomaOpen(false);
    if (window.__COMSSIRE_TOMA_GUARD?.discard) window.__COMSSIRE_TOMA_GUARD.discard();
    if (pendingTo) go(pendingTo);
    setPendingTo(null);
  };

  const saveAndLeaveToma = async () => {
    try {
      setConfirmTomaOpen(false);
      if (window.__COMSSIRE_TOMA_GUARD?.saveDraft) {
        await window.__COMSSIRE_TOMA_GUARD.saveDraft();
      }
      if (pendingTo) go(pendingTo);
      setPendingTo(null);
    } catch (e) {
      setPendingTo(null);
    }
  };

  const handleLogout = () => {
    const isActiveToma = window.__COMSSIRE_TOMA_GUARD?.active;
    const hasChanges = window.__COMSSIRE_DIRTY;

    if (isActiveToma || hasChanges) {
      toast.warning("Guarda los cambios antes de salir", { duration: 3000 });
      return;
    }

    authStorage.clear();
    navigate("/login", { replace: true });
  };

  const getMenuItemClass = (isActive) =>
    `group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
      isActive
        ? "bg-white/10 text-white border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.16)]"
        : "text-slate-300 hover:bg-white/6 hover:text-white border border-transparent"
    }`;

  const getSubMenuItemClass = (isActive) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-sm ${
      isActive
        ? "!bg-white/15 !text-white border border-white/20"
        : "text-slate-400 hover:bg-white/10 hover:text-white border border-transparent"
    }`;

  const getMenuButtonClass = (isActive) =>
    `w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
      isActive
        ? "bg-white/10 text-white border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.16)]"
        : "text-slate-300 hover:bg-white/6 hover:text-white border border-transparent"
    }`;

  return (
    <>
      <ConfirmLeaveComprasModal
        open={confirmComprasOpen}
        onCancel={cancelLeaveCompras}
        onConfirm={confirmLeaveCompras}
      />
      <ConfirmLeaveTomaModal
        open={confirmTomaOpen}
        onStay={stayToma}
        onDiscard={discardToma}
        onSaveAndLeave={saveAndLeaveToma}
      />

      <div className="px-5 py-6 border-b border-white/10 bg-transparent">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Comssire" className="h-10 w-auto" />
          <div>
            <p className="text-lg font-bold text-white">Comssire</p>
            <p className="text-xs text-slate-400">Sistema operativo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto bg-transparent px-3 py-5">
        <NavLink
          to="/home"
          className={({ isActive }) => getMenuItemClass(isActive)}
          onClick={(e) => handleGuardedNav(e, "/home")}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/herramientas"
          className={({ isActive }) => getMenuItemClass(isActive)}
          onClick={(e) => handleGuardedNav(e, "/herramientas")}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.7 6.3l3 3m0 0l-9.4 9.4H5.3v-3l9.4-9.4m3 3L16 4.3a1.414 1.414 0 00-2 0l-1.3 1.3"
            />
          </svg>
          <span>Herramientas</span>
        </NavLink>

        <div className="space-y-0.5">
          <button
            className={getMenuButtonClass(location.pathname.startsWith("/compras"))}
            onClick={() => toggleMenu("compras")}
            type="button"
          >
            <span className="flex items-center gap-3">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span>Compras</span>
            </span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${openMenus.compras ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`overflow-hidden pl-9 space-y-0.5 transition-all duration-200 ${
              openMenus.compras ? "max-h-40" : "max-h-0"
            }`}
          >
            <NavLink
              to="/compras"
              end
              className={({ isActive }) => getSubMenuItemClass(isActive)}
              onClick={(e) => handleGuardedNav(e, "/compras")}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span>Nueva Compra</span>
            </NavLink>

            <NavLink
              to="/compras/historial"
              className={({ isActive }) => getSubMenuItemClass(isActive)}
              onClick={(e) => handleGuardedNav(e, "/compras/historial")}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span>Historial</span>
            </NavLink>

            {canSeeAprobaciones && (
              <NavLink
                to="/compras/aprobaciones"
                className={({ isActive }) => getSubMenuItemClass(isActive)}
                onClick={(e) => handleGuardedNav(e, "/compras/aprobaciones")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                <span>Aprobaciones</span>
              </NavLink>
            )}
          </div>
        </div>

        {canSeeInventario && (
          <div className="space-y-0.5">
            <button
              className={getMenuButtonClass(location.pathname.startsWith("/inventario"))}
              onClick={() => toggleMenu("inventario")}
              type="button"
            >
              <span className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span>Inventario</span>
              </span>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${openMenus.inventario ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`overflow-hidden pl-9 space-y-0.5 transition-all duration-200 ${
                openMenus.inventario ? "max-h-40" : "max-h-0"
              }`}
            >
              <NavLink
                to="/inventario"
                end
                className={({ isActive }) => getSubMenuItemClass(isActive)}
                onClick={(e) => handleGuardedNav(e, "/inventario")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                <span>Ver inventario</span>
              </NavLink>

              {canSeeHistorialTomas && (
                <NavLink
                  to="/inventario/tomas"
                  className={({ isActive }) => getSubMenuItemClass(isActive)}
                  onClick={(e) => handleGuardedNav(e, "/inventario/tomas")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  <span>Historial de Tomas</span>
                </NavLink>
              )}
            </div>
          </div>
        )}

        {(auth.isAdmin || auth.hasPerm("usuarios.ver")) && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) => getMenuItemClass(isActive)}
            onClick={(e) => handleGuardedNav(e, "/usuarios")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Usuarios</span>
          </NavLink>
        )}
      </nav>

      <div className="space-y-3 border-t border-white/10 bg-transparent px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.15)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/12">
            <svg className="h-4 w-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {authStorage.getUsername() || "Usuario"}
            </p>
            <p className="truncate text-xs text-slate-400">
              {auth.isAdmin ? "Administrador" : "Trabajador"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 transition-colors hover:!bg-orange-500 hover:!border-orange-500 hover:!text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>

        <div className="pt-2 text-center text-[10px] text-slate-500">
          © {year} Comssire
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ open = false, onClose }) {
  return (
    <>
      <aside className={`app-sidebar hidden md:block ${open ? "open" : "closed"}`}>
        {open && (
          <div className="sidebar-content">
            <SidebarContent onNavigate={onClose} />
          </div>
        )}
      </aside>

      <div
        className={`sidebar-backdrop md:hidden ${open ? "is-open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar-drawer md:hidden ${open ? "is-open" : ""}`}>
        <div className="flex h-full flex-col bg-transparent">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Comssire" className="h-8 w-auto" />
              <span className="text-base font-bold text-white">Comssire</span>
            </div>
            <button
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SidebarContent onNavigate={onClose} />
          </div>
        </div>
      </aside>
    </>
  );
}