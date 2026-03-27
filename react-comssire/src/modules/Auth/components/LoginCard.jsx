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
  const [showPassword, setShowPassword] = useState(false);
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
      }, 700);
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        {/* Decoración superior */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-white/20" />
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="absolute -left-10 top-20 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
         <div className="mb-6 text-center">
  <h2 className="text-2xl font-black tracking-tight text-slate-800">
    Iniciar sesión
  </h2>
  <p className="mt-1 text-sm text-slate-500">
    Ingresa tus credenciales para continuar
  </p>
</div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {alert.message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition-all ${
                  alert.type === "error"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {alert.message}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Usuario
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-400/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Contraseña
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 15v2m-6 0h12a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a5 5 0 10-10 0v1H6a2 2 0 00-2 2v5a2 2 0 002 2zm3-9V7a3 3 0 116 0v1H9z"
                    />
                  </svg>
                </span>

                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-12 pr-12 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-400/15"
                />

                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-orange-500"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 3l18 18M10.584 10.587A3 3 0 0013.41 13.4M9.88 9.88A3 3 0 0114.12 14.12M6.228 6.228A9.965 9.965 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7a9.97 9.97 0 01-5.772-1.828M6.228 6.228L3 3m3.228 3.228A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-2.12 3.592"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-2 focus:ring-orange-400/40"
                />
                Recordarme
              </label>

              <a
                href={`https://api.whatsapp.com/send?phone=5214773923173&text=${encodeURIComponent(
                  "¡Hola! Olvidé mi contraseña y necesito restablecerla"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-orange-500 underline decoration-orange-300 underline-offset-4 transition-colors hover:text-orange-600"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-400/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="absolute inset-0 bg-white/0 transition duration-300 group-hover:bg-white/10" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <svg
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </button>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center">
              <p className="text-sm text-slate-500">
                ¿No tienes acceso?{" "}
                <a
                  href={`https://api.whatsapp.com/send?phone=5214773923173&text=${encodeURIComponent(
                    "¡Hola! Necesito acceso al sistema"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-orange-500 underline decoration-orange-300 underline-offset-4 transition-colors hover:text-orange-600"
                >
                  Contacta al admin
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="relative flex items-center justify-between border-t border-slate-200/70 bg-white/50 px-6 py-4 text-xs text-slate-500 backdrop-blur-md">
          <span>© {year} Comssire</span>
          
        </div>
      </div>
    </div>
  );
}