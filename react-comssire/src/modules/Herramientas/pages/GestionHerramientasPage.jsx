import { useMemo, useState } from "react";
import AppLayout from "../../../layouts/AppLayout/AppLayout";

const MOCK_HERRAMIENTAS = [
  {
    id: 1,
    codigo: "HR-001",
    nombre: "Taladro inalámbrico Bosch",
    categoria: "Eléctrica",
    ubicacion: "Almacén Principal",
    responsable: "Juan Aguilar",
    estado: "Prestada",
    fecha: "2026-03-21",
  },
  {
    id: 2,
    codigo: "HR-002",
    nombre: "Juego de matracas Stanley",
    categoria: "Manual",
    ubicacion: "Taller Diesel",
    responsable: "Disponible",
    estado: "Disponible",
    fecha: "2026-03-18",
  },
  {
    id: 3,
    codigo: "HR-003",
    nombre: "Multímetro digital Fluke",
    categoria: "Diagnóstico",
    ubicacion: "Área Eléctrica",
    responsable: "Miguel Villafaña",
    estado: "Mantenimiento",
    fecha: "2026-03-17",
  },
  {
    id: 4,
    codigo: "HR-004",
    nombre: "Pistola de impacto Milwaukee",
    categoria: "Neumática",
    ubicacion: "Almacén 100",
    responsable: "Carlos Ramírez",
    estado: "Prestada",
    fecha: "2026-03-20",
  },
  {
    id: 5,
    codigo: "HR-005",
    nombre: "Gato hidráulico 3T",
    categoria: "Elevación",
    ubicacion: "Patio de servicio",
    responsable: "Disponible",
    estado: "Disponible",
    fecha: "2026-03-14",
  },
  {
    id: 6,
    codigo: "HR-006",
    nombre: "Escáner automotriz Launch",
    categoria: "Diagnóstico",
    ubicacion: "Diagnóstico móvil",
    responsable: "Yolanda Calderón",
    estado: "Prestada",
    fecha: "2026-03-22",
  },
];

function StatusBadge({ estado }) {
  const styles = {
    Disponible:
      "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
    Prestada: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
    Mantenimiento: "bg-sky-500/15 text-sky-300 border border-sky-400/20",
    Extraviada: "bg-rose-500/15 text-rose-300 border border-rose-400/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        styles[estado] ||
        "bg-slate-500/15 text-slate-300 border border-slate-400/20"
      }`}
    >
      {estado}
    </span>
  );
}

function SummaryCard({ title, value, helper, icon, accent = "orange" }) {
  const accents = {
    orange:
      "from-orange-500/20 to-orange-400/5 border-orange-400/15 text-orange-300",
    emerald:
      "from-emerald-500/20 to-emerald-400/5 border-emerald-400/15 text-emerald-300",
    sky: "from-sky-500/20 to-sky-400/5 border-sky-400/15 text-sky-300",
    rose: "from-rose-500/20 to-rose-400/5 border-rose-400/15 text-rose-300",
  };

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br ${accents[accent]} p-4 shadow-[0_18px_45px_rgba(15,23,42,0.18)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/30 ring-1 ring-white/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function GestionHerramientasPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [ubicacion, setUbicacion] = useState("Todas");

  const stats = useMemo(() => {
    const total = MOCK_HERRAMIENTAS.length;
    const disponibles = MOCK_HERRAMIENTAS.filter(
      (item) => item.estado === "Disponible"
    ).length;
    const prestadas = MOCK_HERRAMIENTAS.filter(
      (item) => item.estado === "Prestada"
    ).length;
    const mantenimiento = MOCK_HERRAMIENTAS.filter(
      (item) => item.estado === "Mantenimiento"
    ).length;

    return { total, disponibles, prestadas, mantenimiento };
  }, []);

  const ubicaciones = useMemo(
    () => ["Todas", ...new Set(MOCK_HERRAMIENTAS.map((item) => item.ubicacion))],
    []
  );

  const herramientasFiltradas = useMemo(() => {
    return MOCK_HERRAMIENTAS.filter((item) => {
      const matchesSearch =
        item.codigo.toLowerCase().includes(search.toLowerCase()) ||
        item.nombre.toLowerCase().includes(search.toLowerCase()) ||
        item.responsable.toLowerCase().includes(search.toLowerCase());

      const matchesEstado = estado === "Todos" ? true : item.estado === estado;
      const matchesUbicacion =
        ubicacion === "Todas" ? true : item.ubicacion === ubicacion;

      return matchesSearch && matchesEstado && matchesUbicacion;
    });
  }, [search, estado, ubicacion]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <section className="rounded-[28px] border border-slate-800 bg-[#0b1220] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                Módulo pendiente
              </div>

              <h2 className="text-xl font-bold text-white md:text-2xl">
                Gestión de herramientas
              </h2>

         
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                Exportar vista
              </button>

              <button className="rounded-2xl bg-[#FA891A] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(250,137,26,0.25)] transition hover:bg-[#EA7607]">
                Nueva herramienta
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total"
            value={stats.total}
            helper="Herramientas registradas"
            accent="orange"
            icon={
              <svg
                className="h-5 w-5 text-orange-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.7 6.3l3 3m0 0l-9.4 9.4H5.3v-3l9.4-9.4m3 3L16 4.3a1.414 1.414 0 00-2 0l-1.3 1.3"
                />
              </svg>
            }
          />

          <SummaryCard
            title="Disponibles"
            value={stats.disponibles}
            helper="Listas para asignación"
            accent="emerald"
            icon={
              <svg
                className="h-5 w-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
          />

          <SummaryCard
            title="Prestadas"
            value={stats.prestadas}
            helper="Actualmente asignadas"
            accent="sky"
            icon={
              <svg
                className="h-5 w-5 text-sky-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a5 5 0 00-10 0v2m-2 0h14l1 11H4L5 9z"
                />
              </svg>
            }
          />

          <SummaryCard
            title="Mantenimiento"
            value={stats.mantenimiento}
            helper="Requieren revisión"
            accent="rose"
            icon={
              <svg
                className="h-5 w-5 text-rose-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317a1 1 0 011.35-.936l7 3.111a1 1 0 01.325 1.619l-2.09 2.09a1 1 0 000 1.414l1.475 1.475a1 1 0 010 1.414l-2.121 2.121a1 1 0 01-1.414 0l-1.475-1.475a1 1 0 00-1.414 0l-2.09 2.09a1 1 0 01-1.62-.324l-3.11-7a1 1 0 01.936-1.351h3.09a1 1 0 001-1V4.317z"
                />
              </svg>
            }
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[28px] border border-slate-800 bg-[#0b1220] shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Listado de herramientas
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Vista principal con filtros, estados y responsables.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:min-w-[720px]">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Buscar
                    </label>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Código, nombre o responsable"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-orange-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Estado
                    </label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                    >
                      <option>Todos</option>
                      <option>Disponible</option>
                      <option>Prestada</option>
                      <option>Mantenimiento</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Ubicación
                    </label>
                    <select
                      value={ubicacion}
                      onChange={(e) => setUbicacion(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                    >
                      {ubicaciones.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto p-3">
              <table className="min-w-full overflow-hidden rounded-2xl text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Código
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Herramienta
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Categoría
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Ubicación
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Responsable
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Estado
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                      Último movimiento
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {herramientasFiltradas.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/5 text-slate-300 transition hover:bg-white/5"
                    >
                      <td className="px-3 py-3 font-mono text-xs text-white">
                        {item.codigo}
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-medium text-white">
                          {item.nombre}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID interno #{item.id}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-sm">{item.categoria}</td>
                      <td className="px-3 py-3 text-sm">{item.ubicacion}</td>
                      <td className="px-3 py-3 text-sm">{item.responsable}</td>

                      <td className="px-3 py-3">
                        <StatusBadge estado={item.estado} />
                      </td>

                      <td className="px-3 py-3 text-sm text-slate-400">
                        {item.fecha}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-800 bg-[#0b1220] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
              <h3 className="text-base font-semibold text-white">
                Préstamos recientes
              </h3>
            

              <div className="mt-4 space-y-3">
                {MOCK_HERRAMIENTAS.filter(
                  (item) => item.estado === "Prestada"
                ).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.codigo} · {item.ubicacion}
                        </p>
                      </div>

                      <StatusBadge estado={item.estado} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="block text-slate-500">
                          Responsable
                        </span>
                        <span className="text-white">{item.responsable}</span>
                      </div>

                      <div>
                        <span className="block text-slate-500">Fecha</span>
                        <span className="text-white">{item.fecha}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-[#0b1220] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
              <h3 className="text-base font-semibold text-white">
                Acciones rápidas
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10">
                  Registrar préstamo
                </button>

                <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10">
                  Registrar devolución
                </button>

                <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10">
                  Reportar incidencia
                </button>

                <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10">
                  Ver historial completo
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}