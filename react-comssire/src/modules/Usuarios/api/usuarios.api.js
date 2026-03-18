import http from "../../../api/http";

// GET /api/Usuarios
export async function getUsuarios() {
  const { data } = await http.get("/api/Usuarios");
  return data;
}

// POST /api/Usuarios
export async function createUsuario(payload) {
  const { data } = await http.post("/api/Usuarios", payload);
  return data;
}

// GET /api/Roles
export async function getRoles() {
  const { data } = await http.get("/api/Roles");
  return data;
}

// PUT /api/Usuarios/{id}/activo
export async function setUsuarioActivo(id, activo) {
  const { data } = await http.put(`/api/Usuarios/${id}/activo`, { activo });
  return data;
}

// PUT /api/Usuarios/{id}/rol
export async function setUsuarioRol(id, rolId) {
  const { data } = await http.put(`/api/Usuarios/${id}/rol`, { rolId });
  return data;
}

// POST /api/Usuarios/{id}/reset-password
// ✅ Reset admin NO debe obligar cambio nuevamente, por eso default false
export async function resetUsuarioPassword(id, newPassword, mustChangePassword = false) {
  const { data } = await http.post(`/api/Usuarios/${id}/reset-password`, {
    newPassword,
    mustChangePassword,
  });
  return data;
}