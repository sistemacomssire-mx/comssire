import logo from "../../../../public/img/LogoCompleto.png";
import LoginCard from "../components/LoginCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#072a4a] text-white antialiased">
      <div className="relative min-h-screen overflow-hidden">
        {/* Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl"></div>

        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"></div>

        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        ></div>

        {/* Contenido */}
        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
          <div className="grid w-full items-center gap-14 lg:grid-cols-2">
            {/* Lado izquierdo */}
            <div className="hidden lg:block">
              <img src={logo} alt="Comssire" className="mb-10 h-24" />

              <p className="mb-3 text-sm text-white/70">
                Bienvenido al
              </p>

              <h1 className="text-5xl font-extrabold leading-tight">
                Sistema de{" "}
                <span className="relative inline-block">
                  administración
                  <span className="absolute -bottom-2 left-0 h-[4px] w-full rounded-full bg-orange-500"></span>
                </span>
                <br />
                y control operativo.
              </h1>

              <p className="mt-6 max-w-xl text-lg text-white/70">
                Accede para gestionar servicios, clientes y reportes.
              </p>

              <div className="mt-10 flex items-center gap-4 text-sm text-white/65">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  Acceso seguro
                </span>
                <span>•</span>
                <span>Panel de control</span>
              </div>
            </div>

            {/* Card Login */}
            <LoginCard />
          </div>
        </div>
      </div>
    </div>
  );
}
