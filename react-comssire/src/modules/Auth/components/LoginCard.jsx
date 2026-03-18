import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../store/auth.storage";
import { loginRequest } from "../api/auth.api";

export default function LoginCard() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: true,
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setAlert({ type: "", message: "" });

    if (!form.username || !form.password) {
      setAlert({
        type: "error",
        message: "Debes ingresar usuario y contraseña.",
      });
      return;
    }

    try {
      setLoading(true);

      // ✅ Ya no llamamos http directo desde el componente
      const data = await loginRequest({
        username: form.username,
        password: form.password,
      });

      const token = data?.token || data?.accessToken || data?.jwt;

      if (!token) {
        setAlert({
          type: "error",
          message: "Login válido pero no se recibió token.",
        });
        return;
      }

      const rol = data?.rol || "";
      const permisos = Array.isArray(data?.permisos) ? data.permisos : [];
      const username = data?.username || form.username;
      const expiresAtUtc = data?.expiresAtUtc || null;
      const mustChangePassword = !!data?.mustChangePassword;

      // ✅ Guardamos TODO en un solo objeto (como ya lo tenías)
      authStorage.setAuth({
        token,
        expiresAtUtc,
        username,
        rol,
        permisos,
        mustChangePassword,
      });

      setAlert({
        type: "success",
        message: "Inicio de sesión exitoso.",
      });

      const nextPath = mustChangePassword
        ? "/cuenta/cambiar-password"
        : "/home";

      setTimeout(() => {
        navigate(nextPath, { replace: true });
      }, 600);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setAlert({
          type: "error",
          message: "Usuario o contraseña incorrectos.",
        });
      } else if (err.response?.status === 400) {
        setAlert({
          type: "error",
          message: "Datos inválidos.",
        });
      } else {
        setAlert({
          type: "error",
          message: "Error del servidor. Intenta más tarde.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-2xl">
        <div className="p-7 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold">Iniciar sesión</h2>
              <p className="text-sm text-white/60">Sistema de administración</p>
            </div>

            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200 ring-1 ring-orange-500/20">
              Seguro
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {alert.message && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  alert.type === "error"
                    ? "bg-red-500/15 ring-1 ring-red-500/30 text-red-200"
                    : "bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-200"
                }`}
              >
                {alert.message}
              </div>
            )}

            <div>
              <label className="text-sm text-white/70">Usuario</label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="usuario"
                className="mt-2 w-full rounded-2xl bg-white/15 px-4 py-3 text-white placeholder:text-white/40 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/70"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Contraseña</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl bg-white/15 px-4 py-3 text-white placeholder:text-white/40 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/70"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-white/65">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-orange-500 focus:ring-2 focus:ring-orange-400/60"
                />
                Recordarme
              </label>

              <a
  href={`https://api.whatsapp.com/send?phone=5214773923173&text=${encodeURIComponent(
    "¡Hola! Olvidé mi contraseña y necesito restablecerla"
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-orange-200 underline underline-offset-4 hover:text-orange-100"
>
  ¿Olvidaste tu contraseña?
</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-400 active:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300/60 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

        <p className="text-center text-sm text-white/55">
  ¿No tienes acceso?{" "}
  <a
    href={`https://api.whatsapp.com/send?phone=5214773923173&text=${encodeURIComponent(
      "¡Hola! Necesito acceso al sistema"
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-orange-200 underline underline-offset-4 hover:text-orange-100"
  >
    Contacta al admin
  </a>
</p>
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-7 py-5 text-xs text-white/45">
          <span>© {year} Comssire</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Sistema activo
          </span>
        </div>
      </div>
    </div>
  );
}