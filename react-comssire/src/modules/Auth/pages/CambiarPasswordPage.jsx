import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../store/auth.storage";
import { changePasswordRequest } from "../api/auth.api";

export default function CambiarPasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!newPassword || newPassword.length < 8) {
      setAlert({
        type: "error",
        message: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    if (newPassword !== newPassword2) {
      setAlert({ type: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    try {
      setLoading(true);

      // ✅ Ya no llamamos http directo desde la página
      await changePasswordRequest({ currentPassword, newPassword });

      const auth = authStorage.getAuth();
      authStorage.setAuth({ ...auth, mustChangePassword: false });

      setAlert({
        type: "success",
        message: "Contraseña actualizada. Entrando al sistema...",
      });

      setTimeout(() => navigate("/home", { replace: true }), 600);
    } catch (err) {
      const msg =
        (typeof err.response?.data === "string" && err.response.data) ||
        err.response?.data?.message ||
        "No se pudo cambiar la contraseña.";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#072a4a] text-white antialiased">
      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
        <div className="w-full rounded-3xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-2xl">
          <div className="p-7 sm:p-8">
            <h2 className="text-2xl font-extrabold">Cambiar contraseña</h2>
            <p className="mt-2 text-sm text-white/70">
              Por seguridad, debes cambiar tu contraseña para continuar.
            </p>

            {alert.message && (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  alert.type === "error"
                    ? "bg-red-500/15 ring-1 ring-red-500/30 text-red-200"
                    : "bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-200"
                }`}
              >
                {alert.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="text-sm text-white/70">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/15 px-4 py-3 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/70"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/15 px-4 py-3 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/70"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/15 px-4 py-3 text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/70"
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-400 active:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300/60 disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}