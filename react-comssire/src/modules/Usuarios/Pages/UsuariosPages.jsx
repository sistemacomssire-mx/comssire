import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
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

const swalBase = {
  heightAuto: false,
  allowOutsideClick: false,
  customClass: {
    popup: "swal2-popup-custom",
    title: "swal2-title-custom",
    htmlContainer: "swal2-text-custom",
    actions: "swal2-actions-custom",
    confirmButton: "swal2-confirm-custom",
    cancelButton: "swal2-cancel-custom",
  },
  buttonsStyling: true,
};

function showSuccess(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "success",
    title,
    text,
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#ea580c",
  });
}

function showError(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#dc2626",
  });
}

function showWarning(title, text = "") {
  return Swal.fire({
    ...swalBase,
    icon: "warning",
    title,
    text,
    confirmButtonText: "Entendido",
    confirmButtonColor: "#ea580c",
  });
}

function confirmAction({
  title,
  text,
  confirmButtonText = "Sí, continuar",
  cancelButtonText = "Cancelar",
  icon = "warning",
}) {
  return Swal.fire({
    ...swalBase,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#ea580c",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: true,
  });
}

function getUserStatusStyles(active) {
  if (active) {
    return {
      badge: {
        backgroundColor: "#ecfdf5",
        color: "#047857",
        border: "1px solid #86efac",
      },
      dot: { backgroundColor: "#10b981" },
      label: "Activo",
    };
  }

  return {
    badge: {
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      border: "1px solid #fca5a5",
    },
    dot: { backgroundColor: "#ef4444" },
    label: "Inactivo",
  };
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500 bg-orange-500 text-white shadow-[0_8px_18px_-10px_rgba(249,115,22,0.95)] transition hover:bg-orange-600"
            title="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function btnOrange(disabled = false) {
  return [
    "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
    disabled
      ? "cursor-not-allowed border-orange-300 bg-orange-300 text-white/90"
      : "bg-orange-600 text-white shadow-[0_12px_24px_-12px_rgba(249,115,22,0.95)] hover:border-orange-600 hover:bg-orange-600 active:scale-[0.99]",
  ].join(" ");
}

const IconPlus = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 4v16m8-8H4" />
  </svg>
);

const IconRefresh = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconKey = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const IconDeactivate = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

const IconActivate = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconCopy = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const IconWhatsApp = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.374 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.057 23.885a.5.5 0 00.606.61l6.187-1.452A11.945 11.945 0 0012 24c6.627 0 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.988-1.366l-.358-.213-3.713.871.932-3.607-.232-.372A9.786 9.786 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
  </svg>
);

const IconUser = () => (
  <svg className="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

function ActionBtn({ onClick, title, variant, children }) {
  const variants = {
    key: "bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-500 hover:border-orange-500 hover:text-white",
    deactivate: "bg-red-50 border-red-200 text-red-500 hover:bg-red-500 hover:border-red-500 hover:text-white",
    activate: "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        "inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border transition",
        variants[variant] ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BadgeStatus({ active }) {
  const statusStyles = getUserStatusStyles(active);

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
      style={statusStyles.badge}
    >
      <span className="inline-block h-2 w-2 rounded-full" style={statusStyles.dot} />
      {statusStyles.label}
    </span>
  );
}

function BadgeMust({ value }) {
  return value ? (
    <span className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
      Sí
    </span>
  ) : (
    <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
      No
    </span>
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
  const [form, setForm] = useState({ nombre: "", apellidos: "", email: "", fechaNacimiento: "", rolId: "" });
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [result, setResult] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [q, setQ] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const r = await getRoles();
      setRoles(Array.isArray(r) ? r : []);
      const trabajador = (r || []).find((x) => (x.nombre || "").toLowerCase() === "trabajador");
      setForm((prev) => ({ ...prev, rolId: String((trabajador?.id ?? r?.[0]?.id) || "") }));
    } catch (err) {
      await showError("Error al cargar roles", niceError(err, "No se pudieron cargar los roles."));
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
      setUsuarios([]);
      await showError("Error al cargar usuarios", niceError(err, "No se pudieron cargar los usuarios."));
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
      const s = `${u.id} ${u.username} ${u.nombre} ${u.apellidos} ${u.email || ""} ${u.rolNombre || ""}`.toLowerCase();
      return s.includes(term);
    });
  }, [usuarios, q]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildCredentialsText = () =>
    result
      ? [
          "Credenciales de acceso",
          `Usuario: ${result.username}`,
          `Contrasena temporal: ${result.tempPassword}`,
          "Ingresa al sistema y cambia tu contrasena cuando te lo solicite.",
        ].join("\n")
      : "";

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(buildCredentialsText());
      await showSuccess("Credenciales copiadas", "Las credenciales se copiaron correctamente.");
    } catch {
      await showError("No se pudo copiar", "No se pudieron copiar las credenciales.");
    }
  };

  const sendCredentialsWhatsApp = () => {
    const text = encodeURIComponent(buildCredentialsText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!canCrear) {
      await showError("Acceso denegado", "No tienes permiso para crear usuarios.");
      return;
    }

    if (!form.nombre.trim() || !form.apellidos.trim()) {
      await showWarning("Campos incompletos", "Completa Nombre y Apellidos.");
      return;
    }

    if (!form.rolId) {
      await showWarning("Rol requerido", "Selecciona un rol.");
      return;
    }

    const selectedRole = roles.find((r) => String(r.id) === String(form.rolId));

    const confirmation = await confirmAction({
      title: "¿Crear usuario?",
      text: `Se registrará a ${form.nombre.trim()} ${form.apellidos.trim()} con el rol ${selectedRole?.nombre || "seleccionado"}.`,
      confirmButtonText: "Sí, crear usuario",
      cancelButtonText: "Cancelar",
      icon: "question",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoadingCreate(true);
      const payload = {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim() || null,
        fechaNacimiento: form.fechaNacimiento || null,
        rolId: Number(form.rolId),
      };
      const data = await createUsuario(payload);
      setResult(data);
      setForm((prev) => ({ ...prev, nombre: "", apellidos: "", email: "", fechaNacimiento: "" }));
      await loadUsers();
      await showSuccess("Usuario creado", "El usuario se creó correctamente.");
    } catch (err) {
      await showError("Error al crear usuario", niceError(err, "Error al crear usuario."));
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
    if (!resetUser?.id) return;

    if (!newPass || newPass.length < 8) {
      await showWarning("Contraseña inválida", "La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPass !== newPass2) {
      await showWarning("Contraseñas distintas", "Las contraseñas no coinciden.");
      return;
    }

    const confirmation = await confirmAction({
      title: "¿Actualizar contraseña?",
      text: `Se actualizará la contraseña del usuario ${resetUser?.username}.${mustChange ? " Además, se forzará el cambio en el siguiente inicio de sesión." : ""}`,
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: "Cancelar",
      icon: "warning",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoadingReset(true);
      await resetUsuarioPassword(resetUser.id, newPass, mustChange);
      setResetOpen(false);
      await loadUsers();
      await showSuccess("Contraseña actualizada", "La contraseña se actualizó correctamente.");
    } catch (err) {
      await showError("No se pudo actualizar", niceError(err, "No se pudo actualizar la contraseña."));
    } finally {
      setLoadingReset(false);
    }
  };

  const toggleActivo = async (u) => {
    const activar = !u.activo;

    const confirmation = await confirmAction({
      title: activar ? "¿Activar usuario?" : "¿Desactivar usuario?",
      text: activar ? `Se activará el usuario ${u.username}.` : `Se desactivará el usuario ${u.username}.`,
      confirmButtonText: activar ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      icon: "warning",
    });

    if (!confirmation.isConfirmed) return;

    try {
      await setUsuarioActivo(u.id, activar);
      await loadUsers();
      await showSuccess(
        activar ? "Usuario activado" : "Usuario desactivado",
        activar ? "El usuario fue activado correctamente." : "El usuario fue desactivado correctamente."
      );
    } catch (err) {
      await showError("No se pudo actualizar", niceError(err, "No se pudo actualizar el estado."));
    }
  };

  const changeRol = async (u, rolId) => {
    const nextRole = roles.find((r) => String(r.id) === String(rolId));
    const currentRole = roles.find((r) => String(r.id) === String(u.rolId));

    const confirmation = await confirmAction({
      title: "¿Cambiar rol?",
      text: `El usuario ${u.username} cambiará de ${currentRole?.nombre || u.rolNombre || "rol actual"} a ${nextRole?.nombre || "nuevo rol"}.`,
      confirmButtonText: "Sí, cambiar rol",
      cancelButtonText: "Cancelar",
      icon: "warning",
    });

    if (!confirmation.isConfirmed) {
      setUsuarios((prev) => [...prev]);
      return;
    }

    try {
      await setUsuarioRol(u.id, Number(rolId));
      await loadUsers();
      await showSuccess("Rol actualizado", "El rol se actualizó correctamente.");
    } catch (err) {
      setUsuarios((prev) => [...prev]);
      await showError("No se pudo actualizar", niceError(err, "No se pudo actualizar el rol."));
    }
  };

  return (
    <AppLayout>
      <Modal open={resetOpen} title="Actualizar contraseña" onClose={() => setResetOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2">
              <IconUser />
              <span className="text-sm font-semibold text-slate-800">{resetUser?.username}</span>
            </div>
            <div className="text-sm text-slate-500">
              {resetUser?.nombre} {resetUser?.apellidos} · {resetUser?.rolNombre}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className={inputCls} placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirmar contraseña</label>
            <input type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} className={inputCls} placeholder="Repite la contraseña" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-300" />
            Forzar cambio de contraseña en el siguiente inicio de sesión
          </label>

          <button type="button" onClick={doResetPassword} disabled={loadingReset} className={btnOrange(loadingReset)}>
            {loadingReset ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </div>
      </Modal>

      <div className="space-y-5 p-1 md:p-2">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3M5 20h9a2 2 0 002-2V7a2 2 0 00-2-2h-3.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 007.172 3H5a2 2 0 00-2 2v13a2 2 0 002 2z" />
                </svg>
                Usuarios
              </div>
              <h2 className="mt-1 text-lg font-semibold text-slate-800">Registrar usuario</h2>
               
            </div>
            <span className="inline-flex min-h-[34px] items-center rounded-full border border-orange-200 bg-orange-50 px-3 text-sm font-medium text-orange-700">
              Admin
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Juan Diego" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Apellidos</label>
              <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej. Pérez López" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email (opcional)</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="ejemplo@correo.com" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha de nacimiento</label>
              <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Rol</label>
              <select
                name="rolId"
                value={form.rolId}
                onChange={handleChange}
                disabled={loadingRoles}
                className={inputCls}
              >
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>{r.nombre}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">Los permisos se asignan por rol.</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 md:col-span-2">
              <button type="submit" disabled={loadingCreate || !canCrear} className={btnOrange(loadingCreate || !canCrear)}>
                <IconPlus />
                {loadingCreate ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-5 rounded-[24px] border border-orange-200 bg-orange-50 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="text-base font-semibold">Credenciales generadas</h3>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Cópialas o envíalas por WhatsApp. La contraseña temporal solo se muestra una vez.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "Username", value: result.username, cls: "text-slate-800" },
                  { label: "Contraseña temporal", value: result.tempPassword, cls: "text-orange-700" },
                  { label: "Usuario ID", value: result.usuarioId, cls: "text-slate-800" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
                    <div className={`mt-1 break-all font-mono text-sm font-semibold ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={copyCredentials} className={btnOrange(false)}>
                  <IconCopy /> Copiar credenciales
                </button>
                <button type="button" onClick={sendCredentialsWhatsApp} className={btnOrange(false)}>
                  <IconWhatsApp /> Enviar por WhatsApp
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M17 20h5V9H2v11h5m10 0v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0H7m10-12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Usuarios registrados
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Total: <span className="font-semibold text-slate-800">{usuarios.length}</span> usuarios
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar usuario..."
                className="min-w-[260px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
              <button type="button" onClick={loadUsers} disabled={loadingUsers || !canVer} className={btnOrange(loadingUsers || !canVer)}>
                <IconRefresh /> Refrescar
              </button>
            </div>
          </div>

          {!canVer ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              No tienes permiso para ver usuarios (usuarios.ver)
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[22px] border border-slate-200">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-[#dfeaf5]">
                    {["ID", "Username", "Nombre", "Email", "Rol", "Estado", "MustChange", ""].map((h, i) => (
                      <th
                        key={h + i}
                        className={[
                          "border-b border-[#b5c7dc] px-4 py-4 text-[13px] font-extrabold text-[#35527a]",
                          i === 7 ? "text-right" : "text-left",
                        ].join(" ")}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="group">
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 font-mono text-sm font-semibold text-[#183b63] group-hover:bg-[#f8fbff]">{u.id}</td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 font-mono text-sm font-semibold text-[#183b63] group-hover:bg-[#f8fbff]">{u.username}</td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 text-sm text-[#183b63] group-hover:bg-[#f8fbff]">{u.nombre} {u.apellidos}</td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 text-sm text-slate-600 group-hover:bg-[#f8fbff]">{u.email || "—"}</td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 group-hover:bg-[#f8fbff]">
                        {canAsignarRol ? (
                          <select
                            value={String(u.rolId)}
                            onChange={(e) => changeRol(u, e.target.value)}
                            className="min-w-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={String(r.id)}>{r.nombre}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                            {u.rolNombre}
                          </span>
                        )}
                      </td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 group-hover:bg-[#f8fbff]">
                        <BadgeStatus active={u.activo} />
                      </td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 group-hover:bg-[#f8fbff]">
                        <BadgeMust value={u.mustChangePassword} />
                      </td>
                      <td className="border-b border-[#d9e5f1] bg-white px-4 py-4 group-hover:bg-[#f8fbff]">
                        <div className="flex justify-end gap-2">
                          {canResetPass && (
                            <ActionBtn onClick={() => openReset(u)} title="Actualizar contraseña" variant="key">
                              <IconKey />
                            </ActionBtn>
                          )}
                          {canEditar && (
                            <ActionBtn
                              onClick={() => toggleActivo(u)}
                              title={u.activo ? "Desactivar" : "Activar"}
                              variant={u.activo ? "deactivate" : "activate"}
                            >
                              {u.activo ? <IconDeactivate /> : <IconActivate />}
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loadingUsers && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="bg-white px-4 py-10 text-center text-sm text-slate-500">
                        No hay usuarios para mostrar.
                      </td>
                    </tr>
                  )}
                  {loadingUsers && (
                    <tr>
                      <td colSpan={8} className="bg-white px-4 py-10 text-center text-sm text-slate-500">
                        Cargando usuarios...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}