import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import logo from "../../../public/img/LogoComssire.png";
import { authStorage } from "../../modules/Auth/store/auth.storage";
import { toast } from "sonner";

function ModalShell({ open, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[4px]">
      <div className="w-full max-w-lg overflow-hidden rounded-[1.65rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ icon, title, description }) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600">
          {icon}
        </div>

        <div className="min-w-0">
          {/* 🔥 FIX AQUÍ */}
          <h3 className="text-[1.08rem] font-semibold leading-tight !text-[#1f3f63] !opacity-100">
            {title}
          </h3>

          <p className="mt-1.5 text-sm leading-6 !text-[#5f7ea3] !opacity-100">
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
      className="inline-flex min-w-[150px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition hover:border-slate-400 hover:bg-slate-50"
    >
      <span className="!text-slate-700">{children}</span>
    </button>
  );
}

function SoftOrangeButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-w-[150px] items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold shadow-[0_8px_18px_rgba(250,137,26,0.08)] transition hover:border-orange-300 hover:bg-orange-100"
    >
      <span className="!text-orange-700">{children}</span>
    </button>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-w-[190px] items-center justify-center rounded-2xl border border-transparent bg-[#FA891A] px-5 py-3 text-sm font-semibold shadow-[0_12px_28px_rgba(250,137,26,0.22)] transition hover:bg-[#EA7607]"
    >
      <span className="!text-white">{children}</span>
    </button>
  );
}

function ConfirmLeaveComprasModal({ open, onCancel, onConfirm }) {
  return (
    <ModalShell open={open}>
      <ModalHeader
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar en Compras. Si sales ahora, se perderán."
      />

      <ModalFooter>
        <SecondaryButton onClick={onCancel}>Quedarme</SecondaryButton>
        <PrimaryButton onClick={onConfirm}>Salir sin guardar</PrimaryButton>
      </ModalFooter>
    </ModalShell>
  );
}

function ConfirmLeaveTomaModal({ open, onStay, onDiscard, onSaveAndLeave }) {
  return (
    <ModalShell open={open}>
      <ModalHeader
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        }
        title="Toma de inventario en progreso"
        description="Hay una toma de inventario en progreso. Elige si quieres continuar aquí, salir sin guardar o guardar antes de salir."
      />

      <ModalFooter>
        <SecondaryButton onClick={onStay}>Continuar aquí</SecondaryButton>
        <SoftOrangeButton onClick={onDiscard}>Salir sin guardar</SoftOrangeButton>
        <PrimaryButton onClick={onSaveAndLeave}>Guardar y salir</PrimaryButton>
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
        ? "bg-orange-500/14 text-orange-100 border border-orange-400/20"
        : "text-slate-400 hover:bg-white/6 hover:text-white border border-transparent"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
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