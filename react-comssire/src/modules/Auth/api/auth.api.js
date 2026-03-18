import http from "../../../api/http";

// POST /api/Auth/login
// Mantengo el mismo payload que ya usabas en LoginCard (username/password)
export async function loginRequest({ username, password }) {
  const { data } = await http.post("/api/Auth/login", {
    username,
    password,
  });
  return data;
}

// POST /api/Auth/change-password
// Mantengo el mismo payload que ya usabas (currentPassword/newPassword)
export async function changePasswordRequest({ currentPassword, newPassword }) {
  const { data } = await http.post("/api/Auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}

// GET /api/Auth/me (opcional)
export async function meRequest() {
  const { data } = await http.get("/api/Auth/me");
  return data;
}