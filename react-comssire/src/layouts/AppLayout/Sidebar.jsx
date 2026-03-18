import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import logo from "../../../public/img/LogoCompleto.png";
import { authStorage } from "../../modules/Auth/store/auth.storage";

function ConfirmLeaveComprasModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-3">
      <div className="bg-slate-800 rounded-lg w-full max-w-md p-4 border border-slate-700">
        <div className="text-base font-bold text-white">Cambios sin guardar</div>
        <p className="text-sm text-slate-400 mt-2">
          Tienes cambios sin guardar en Compras. Si sales ahora, se perderán.
          ¿Qué deseas hacer?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded" onClick={onCancel}>
            Quedarme
          </button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded" onClick={onConfirm}>
            Salir sin guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmLeaveTomaModal({ open, onStay, onDiscard, onSaveAndLeave }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-3">
      <div className="bg-slate-800 rounded-lg w-full max-w-md p-4 border border-slate-700">
        <div className="text-base font-bold text-white">Toma de inventario en progreso</div>
        <p className="text-sm text-slate-400 mt-2">
          Hay una toma de inventario en progreso. ¿Qué deseas hacer?
        </p>
        <div className="mt-4 flex justify-end gap-2 flex-wrap">
          <button className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded" onClick={onStay}>
            Continuar aquí
          </button>
          <button className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded" onClick={onDiscard}>
            Salir sin guardar
          </button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded" onClick={onSaveAndLeave}>
            Guardar y salir
          </button>
        </div>
      </div>
    </div>
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

  const auth = useMemo(() => ({
    isAdmin: authStorage.isAdmin(),
    hasPerm: (p) => authStorage.hasPerm(p),
  }), []);

  const canSeeInventario = auth.isAdmin || auth.hasPerm("inventarios.ver") || auth.hasPerm("inventarios.toma.crear") || auth.hasPerm("inventarios.toma.reporte");
  const canSeeHistorialTomas = auth.isAdmin || auth.hasPerm("inventarios.toma.reporte");
  const canSeeAprobaciones = auth.isAdmin || auth.hasPerm("compras.ver_aprobaciones") || auth.hasPerm("compras.aprobar") || auth.hasPerm("compras.rechazar");

  useEffect(() => {
    const path = location.pathname;
    setOpenMenus(prev => ({
      ...prev,
      compras: path.startsWith("/compras"),
      inventario: path.startsWith("/inventario"),
    }));
  }, [location.pathname]);

  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  
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
      if (window.__COMSSIRE_TOMA_GUARD?.saveDraft) await window.__COMSSIRE_TOMA_GUARD.saveDraft();
      if (pendingTo) go(pendingTo);
      setPendingTo(null);
    } catch (e) {
      setPendingTo(null);
    }
  };

  const getMenuItemClass = (isActive) => 
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
      isActive ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`;

  const getSubMenuItemClass = (isActive) => 
    `flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all ${
      isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
    }`;

  const getMenuButtonClass = (isActive) => 
    `w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
      isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`;

  return (
    <>
      <ConfirmLeaveComprasModal open={confirmComprasOpen} onCancel={cancelLeaveCompras} onConfirm={confirmLeaveCompras} />
      <ConfirmLeaveTomaModal open={confirmTomaOpen} onStay={stayToma} onDiscard={discardToma} onSaveAndLeave={saveAndLeaveToma} />

      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Comssire" className="h-8" />
          <div>
            <p className="font-semibold text-sm text-white">Comssire</p>
            <p className="text-[10px] text-slate-500">Sistema operativo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/home" className={({ isActive }) => getMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/home")}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </NavLink>

        <div className="space-y-0.5">
          <button className={getMenuButtonClass(location.pathname.startsWith("/compras"))} onClick={() => toggleMenu("compras")} type="button">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Compras</span>
            </span>
            <svg className={`w-4 h-4 transition-transform ${openMenus.compras ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`pl-4 space-y-0.5 overflow-hidden transition-all ${openMenus.compras ? 'max-h-40' : 'max-h-0'}`}>
            <NavLink to="/compras" end className={({ isActive }) => getSubMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/compras")}>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Nueva Compra</span>
            </NavLink>
            <NavLink to="/compras/historial" className={({ isActive }) => getSubMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/compras/historial")}>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Historial</span>
            </NavLink>
            {canSeeAprobaciones && (
              <NavLink to="/compras/aprobaciones" className={({ isActive }) => getSubMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/compras/aprobaciones")}>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Aprobaciones</span>
              </NavLink>
            )}
          </div>
        </div>

        {canSeeInventario && (
          <div className="space-y-0.5">
            <button className={getMenuButtonClass(location.pathname.startsWith("/inventario"))} onClick={() => toggleMenu("inventario")} type="button">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Inventario</span>
              </span>
              <svg className={`w-4 h-4 transition-transform ${openMenus.inventario ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`pl-4 space-y-0.5 overflow-hidden transition-all ${openMenus.inventario ? 'max-h-40' : 'max-h-0'}`}>
              <NavLink to="/inventario" end className={({ isActive }) => getSubMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/inventario")}>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Ver inventario</span>
              </NavLink>
              {canSeeHistorialTomas && (
                <NavLink to="/inventario/tomas" className={({ isActive }) => getSubMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/inventario/tomas")}>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>Historial de Tomas</span>
                </NavLink>
              )}
            </div>
          </div>
        )}

        {(auth.isAdmin || auth.hasPerm("usuarios.ver")) && (
          <NavLink to="/usuarios" className={({ isActive }) => getMenuItemClass(isActive)} onClick={(e) => handleGuardedNav(e, "/usuarios")}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Usuarios</span>
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <span>© {year} Comssire</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Activo</span>
          </span>
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ open = false, onClose }) {
  return (
    <>
      <aside className={`app-sidebar hidden md:block ${open ? 'open' : 'closed'}`}>
        {open && (
          <div className="sidebar-content">
            <SidebarContent onNavigate={onClose} />
          </div>
        )}
      </aside>

      <div className={`sidebar-backdrop md:hidden ${open ? 'is-open' : ''}`} onClick={onClose} />
      
      <aside className={`sidebar-drawer md:hidden ${open ? 'is-open' : ''}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-medium text-white">Menú</span>
            <button className="p-1 text-slate-400 hover:text-white rounded" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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