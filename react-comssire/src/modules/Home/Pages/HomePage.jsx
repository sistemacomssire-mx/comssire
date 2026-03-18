import AppLayout from "../../../layouts/AppLayout/AppLayout";

export default function HomePage() {
  return (
    <AppLayout title="Home" subtitle="Panel de control">
      <div className="rounded-3xl bg-white/10 ring-1 ring-white/15 p-6">
        <h2 className="text-xl font-extrabold">Bienvenido</h2>
        <p className="mt-2 text-white/70">
          Aquí irá tu dashboard (resumen de compras, inventario, etc.).
        </p>
      </div>
    </AppLayout>
  );
}
