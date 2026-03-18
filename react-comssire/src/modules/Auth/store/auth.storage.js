const AUTH_KEY = "comssire_auth";
// Legacy key (ya no se usa, pero lo limpiamos por compatibilidad)
const TOKEN_KEY_LEGACY = "comssire_token";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function decodeJwt(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;

    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(b64 + pad);

    // utf-8 safe parse
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function normalizePerm(p) {
  return String(p || "").trim().toLowerCase();
}

export const authStorage = {
  // ====== WRITE ======
  setAuth(auth) {
    // auth: {token, expiresAtUtc, username, rol, permisos, mustChangePassword}
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth || {}));

    // ✅ IMPORTANTE: ya NO guardamos token legacy
    // Si existe de sesiones anteriores, lo limpiamos para evitar inconsistencias
    localStorage.removeItem(TOKEN_KEY_LEGACY);
  },

  clear() {
    localStorage.removeItem(AUTH_KEY);

    // ✅ limpiamos legacy por si existía
    localStorage.removeItem(TOKEN_KEY_LEGACY);
  },

  // ====== READ ======
  getAuth() {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return safeParse(raw);
  },

  getToken() {
    // ✅ ÚNICA fuente del token
    const a = this.getAuth();
    return a?.token || null;
  },

  getPayload() {
    const t = this.getToken();
    return decodeJwt(t);
  },

  getUsername() {
    const a = this.getAuth();
    return a?.username || null;
  },

  getRol() {
    const a = this.getAuth();
    return a?.rol || null;
  },

  getPermisos() {
    const a = this.getAuth();
    const p = a?.permisos;

    if (Array.isArray(p)) return p;
    if (typeof p === "string") return [p];

    return [];
  },

  hasPerm(perm) {
    const target = normalizePerm(perm);
    return this.getPermisos().some((x) => normalizePerm(x) === target);
  },

  mustChangePassword() {
    const a = this.getAuth();
    return !!a?.mustChangePassword;
  },

  isAdmin() {
    const rol = String(this.getRol() || "").toLowerCase();
    if (rol === "admin") return true;

    // Por permisos
    if (this.hasPerm("compras.editar_todas")) return true;
    if (this.hasPerm("compras.ver_aprobaciones")) return true;
    if (this.hasPerm("compras.aprobar")) return true;
    if (this.hasPerm("compras.rechazar")) return true;

    return false;
  },
};