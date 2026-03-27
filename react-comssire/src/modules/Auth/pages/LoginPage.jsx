import logo from "../../../../public/img/LogoCompleto.png";
import LoginCard from "../components/LoginCard";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Fondo principal */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#164e63_45%,_#155e75_100%)]" />

      {/* Grid decorativo */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:42px_42px]" />

      {/* Blobs animados */}
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl animate-floatSlow" />
      <div className="pointer-events-none absolute right-10 top-20 h-80 w-80 rounded-full bg-orange-400/20 blur-3xl animate-floatMedium" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl animate-floatSlow" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] xl:gap-16">
          {/* Panel izquierdo */}
          <section className="hidden lg:block">
            <div className="max-w-xl animate-fadeUp">
              <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]" />
                <span className="text-sm font-medium text-white/85">
                  Plataforma operativa activa
                </span>
              </div>

              <img
                src={logo}
                alt="Comssire"
                className="mb-10 h-20 w-auto drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              />

              <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-cyan-100/80">
                Bienvenido al sistema
              </p>

              <h1 className="text-5xl font-black leading-[1.05] text-white xl:text-6xl">
                Administración
                <span className="block text-white/90">y control operativo</span>
                <span className="mt-3 block h-1.5 w-40 rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300" />
              </h1>

           

        
            </div>
          </section>

          {/* Login */}
          <section className="animate-fadeUp delay-150">
            <LoginCard />
          </section>
        </div>
      </div>

      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-18px) translateX(10px); }
        }

        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(16px) translateX(-12px); }
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(24px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-floatSlow {
          animation: floatSlow 8s ease-in-out infinite;
        }

        .animate-floatMedium {
          animation: floatMedium 10s ease-in-out infinite;
        }

        .animate-fadeUp {
          animation: fadeUp 0.8s ease-out both;
        }

        .delay-150 {
          animation-delay: 0.15s;
        }
      `}</style>
    </div>
  );
}