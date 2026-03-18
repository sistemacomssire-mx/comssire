import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../../layouts/AppLayout/AppLayout";
import { authStorage } from "../../Auth/store/auth.storage";
import {
  createUsuario,
  getRoles,
  getUsuarios,
  resetUsuarioPassword,
  setUsuarioActivo,
  setUsuarioRol,
} from "../api/usuarios.api";

function hasPerm(clave) {
  return (authStorage.getPermisos() || []).includes(clave);
}

function niceError(err, fallback) {
  return (
    (typeof err?.response?.data === "string" && err.response.data) ||
    err?.response?.data?.message ||
    fallback
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-3">
      <div className="bg-slate-800 rounded-lg w-full max-w-md border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const canVer = useMemo(() => hasPerm("usuarios.ver"), []);
  const canCrear = useMemo(() => hasPerm("usuarios.crear"), []);
  const canEditar = useMemo(() => hasPerm("usuarios.editar"), []);
  const canAsignarRol = useMemo(() => hasPerm("usuarios.asignar_rol"), []);
  const canResetPass = useMemo(() => hasPerm("usuarios.reset_password"), []);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    fechaNacimiento: "",
    rolId: "",
  });

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [result, setResult] = useState(null);

  // listado
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [q, setQ] = useState("");

  // reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  // ✅ IMPORTANTE: por defecto NO forzar cambio en reset admin
  const [mustChange, setMustChange] = useState(false);

  const [loadingReset, setLoadingReset] = useState(false);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const r = await getRoles();
      setRoles(Array.isArray(r) ? r : []);

      const trabajador = (r || []).find((x) => (x.nombre || "").toLowerCase() === "trabajador");
      setForm((prev) => ({
        ...prev,
        rolId: String((trabajador?.id ?? r?.[0]?.id) || ""),
      }));
    } catch (err) {
      setAlert({ type: "error", message: niceError(err, "No se pudieron cargar los roles.") });
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsers = async () => {
    if (!canVer) return;
    setLoadingUsers(true);
    try {
      const data = await getUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlert({ type: "error", message: niceError(err, "No se pudieron cargar los usuarios.") });
      setUsuarios([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return usuarios;

    return (usuarios || []).filter((u) => {
      const s =
        `${u.id} ${u.username} ${u.nombre} ${u.apellidos} ${u.email || ""} ${u.rolNombre || ""}`.toLowerCase();
      return s.includes(term);
    });
  }, [usuarios, q]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    setResult(null);

    if (!canCrear) {
      setAlert({ type: "error", message: "No tienes permiso para crear usuarios." });
      return;
    }

    if (!form.nombre.trim() || !form.apellidos.trim()) {
      setAlert({ type: "error", message: "Completa Nombre y Apellidos." });
      return;
    }

    if (!form.rolId) {
      setAlert({ type: "error", message: "Selecciona un rol." });
      return;
    }

    try {
      setLoadingCreate(true);

      const payload = {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim() ? form.email.trim() : null,
        fechaNacimiento: form.fechaNacimiento ? form.fechaNacimiento : null,
        rolId: Number(form.rolId),
      };

      const data = await createUsuario(payload);

      setResult(data);
      setAlert({ type: "success", message: "Usuario creado correctamente." });

      setForm((prev) => ({
        ...prev,
        nombre: "",
        apellidos: "",
        email: "",
        fechaNacimiento: "",
      }));

      await loadUsers();
    } catch (err) {
      setAlert({
        type: "error",
        message: niceError(err, "Error al crear usuario. Revisa permisos/token o backend."),
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  const openReset = (u) => {
    setResetUser(u);
    setNewPass("");
    setNewPass2("");
    setMustChange(false);
    setResetOpen(true);
  };

  const doResetPassword = async () => {
    setAlert({ type: "", message: "" });

    if (!resetUser?.id) return;

    if (!newPass || newPass.length < 8) {
      setAlert({ type: "error", message: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }

    if (newPass !== newPass2) {
      setAlert({ type: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    try {
      setLoadingReset(true);

      await resetUsuarioPassword(resetUser.id, newPass, mustChange);

      setAlert({ type: "success", message: "Contraseña actualizada correctamente." });
      setResetOpen(false);
      await loadUsers();
    } catch (err) {
      setAlert({ type: "error", message: niceError(err, "No se pudo actualizar la contraseña.") });
    } finally {
      setLoadingReset(false);
    }
  };

  const toggleActivo = async (u) => {
    setAlert({ type: "", message: "" });
    try {
      await setUsuarioActivo(u.id, !u.activo);
      await loadUsers();
      setAlert({ type: "success", message: !u.activo ? "Usuario activado." : "Usuario desactivado." });
    } catch (err) {
      setAlert({ type: "error", message: niceError(err, "No se pudo actualizar el estado.") });
    }
  };

  const changeRol = async (u, rolId) => {
    setAlert({ type: "", message: "" });
    try {
      await setUsuarioRol(u.id, Number(rolId));
      await loadUsers();
      setAlert({ type: "success", message: "Rol actualizado." });
    } catch (err) {
      setAlert({ type: "error", message: niceError(err, "No se pudo actualizar el rol.") });
    }
  };

  return (
    <AppLayout>
      {/* Modal de reset de contraseña */}
      <Modal
        open={resetOpen}
        title={`Actualizar contraseña`}
        onClose={() => setResetOpen(false)}
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-white">{resetUser?.username}</span>
            </div>
            <div className="text-xs text-slate-400">
              {resetUser?.nombre} {resetUser?.apellidos} · {resetUser?.rolNombre}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
              placeholder="Repite la contraseña"
            />
          </div>

          <button
            type="button"
            onClick={doResetPassword}
            disabled={loadingReset}
            className="w-full px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded flex items-center justify-center gap-1.5"
          >
            {loadingReset ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Actualizar contraseña</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      <div className="w-full space-y-4">
        {/* Panel de creación de usuarios */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Alta de usuarios
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registra un trabajador, genera credenciales y compártelas
              </p>
            </div>
            <span className="px-2 py-1 text-xs bg-orange-600/20 text-orange-300 rounded-full border border-orange-500/30">
              Admin
            </span>
          </div>

          {alert.message && (
            <div className={`mb-4 p-3 rounded text-sm ${
              alert.type === "error"
                ? "bg-red-600/20 border border-red-500/30 text-red-300"
                : "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
            }`}>
              <div className="flex items-center gap-2">
                {alert.type === "error" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{alert.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                <input
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Juan Diego"
                  className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Apellidos</label>
                <input
                  name="apellidos"
                  type="text"
                  value={form.apellidos}
                  onChange={handleChange}
                  placeholder="Ej. Pérez López"
                  className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email (opcional)</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                <input
                  name="fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Rol</label>
              <select
                name="rolId"
                value={form.rolId}
                onChange={handleChange}
                disabled={loadingRoles}
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white disabled:opacity-50"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-500">Los permisos se asignan por rol</p>
            </div>

            <button
              type="submit"
              disabled={loadingCreate || loadingRoles || !canCrear}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingCreate ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Crear usuario</span>
                </>
              )}
            </button>
          </form>

          {/* Credenciales generadas */}
          {result && (
            <div className="mt-4 bg-slate-800/50 rounded-lg border border-slate-700 p-3">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Credenciales generadas
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Copia esto y entrégaselo al usuario. La contraseña temporal solo se muestra una vez.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700">
                  <span className="text-slate-500">Username</span>
                  <span className="font-mono text-white">{result.username}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700">
                  <span className="text-slate-500">Contraseña temporal</span>
                  <span className="font-mono text-emerald-400">{result.tempPassword}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700">
                  <span className="text-slate-500">Usuario ID</span>
                  <span className="font-mono text-white">{result.usuarioId}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Usuario: ${result.username}\nContraseña temporal: ${result.tempPassword}`
                  );
                  setAlert({ type: "success", message: "Credenciales copiadas." });
                }}
                className="mt-3 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copiar credenciales</span>
              </button>
            </div>
          )}
        </div>

        {/* Listado de usuarios */}
        <div className="bg-slate-800/30 rounded p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Usuarios registrados
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total: <span className="text-white font-medium">{usuarios.length}</span> usuarios
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar usuario..."
                className="flex-1 md:w-64 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500"
              />
              <button
                type="button"
                onClick={loadUsers}
                disabled={loadingUsers || !canVer}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-1.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refrescar</span>
              </button>
            </div>
          </div>

          {!canVer ? (
            <div className="p-3 bg-red-600/20 border border-red-500/30 rounded text-red-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>No tienes permiso para ver usuarios (usuarios.ver)</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80 text-slate-400 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">Username</th>
                    <th className="text-left px-3 py-2">Nombre</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Rol</th>
                    <th className="text-left px-3 py-2">Estado</th>
                    <th className="text-left px-3 py-2">MustChange</th>
                    <th className="text-right px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30">
                      <td className="px-3 py-2 font-mono text-xs text-white/70">{u.id}</td>
                      <td className="px-3 py-2 font-mono text-xs font-medium text-white">{u.username}</td>
                      <td className="px-3 py-2 text-xs text-white">
                        {u.nombre} {u.apellidos}
                      </td>
                      <td className="px-3 py-2 text-xs text-white/60">{u.email || "—"}</td>

                      <td className="px-3 py-2">
                        {canAsignarRol ? (
                          <select
                            value={String(u.rolId)}
                            onChange={(e) => changeRol(u, e.target.value)}
                            className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={String(r.id)}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded">
                            {u.rolNombre}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full ${
                          u.activo
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-600/20 text-red-300 border border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${
                          u.mustChangePassword 
                            ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {u.mustChangePassword ? "Sí" : "No"}
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          {canResetPass && (
                            <button
                              type="button"
                              onClick={() => openReset(u)}
                              className="p-1.5 text-orange-400 hover:text-white hover:bg-orange-600/50 rounded transition-colors"
                              title="Actualizar contraseña"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                          )}

                          {canEditar && (
                            <button
                              type="button"
                              onClick={() => toggleActivo(u)}
                              className={`p-1.5 rounded transition-colors ${
                                u.activo
                                  ? 'text-red-400 hover:text-white hover:bg-red-600/50'
                                  : 'text-emerald-400 hover:text-white hover:bg-emerald-600/50'
                              }`}
                              title={u.activo ? "Desactivar" : "Activar"}
                            >
                              {u.activo ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loadingUsers && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500 text-sm">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>No hay usuarios para mostrar</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {loadingUsers && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span>Cargando usuarios...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}