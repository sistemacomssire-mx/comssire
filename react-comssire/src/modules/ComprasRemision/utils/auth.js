import { authStorage } from "../../Auth/store/auth.storage";

export function getJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(b64 + pad))));
  } catch {
    return null;
  }
}

function normalizePerm(p) {
  return String(p || "").trim().toLowerCase();
}

export function getAuthFromStorage() {
  const token = authStorage.getToken?.() || "";
  const payload = authStorage.getPayload?.() || getJwtPayload(token) || {};
  const permisos = authStorage.getPermisos?.() || [];
  const rol = authStorage.getRol?.() || payload.role || payload.rol || payload.Rol || "";

  const hasPerm = (perm) => permisos.some((x) => normalizePerm(x) === normalizePerm(perm));

  const isAdmin =
    authStorage.isAdmin?.() ||
    hasPerm("compras.editar_todas") ||
    hasPerm("compras.ver_aprobaciones") ||
    hasPerm("compras.aprobar") ||
    hasPerm("compras.rechazar") ||
    hasPerm("compras.generar_mod") ||
    String(rol).toLowerCase() === "admin";

  return { token, payload, permisos, rol, hasPerm, isAdmin };
}
