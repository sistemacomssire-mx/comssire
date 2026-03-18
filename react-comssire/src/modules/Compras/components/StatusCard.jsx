export default function StatusCard({ status = "Borrador", subtitle = "Listo para generar MOD" }) {
  return (
    <div className="panel p-5">
      <p className="text-xs text-white/55">Estatus</p>
      <p className="mt-2 text-lg font-extrabold">{status}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
        <span className="h-2 w-2 rounded-full bg-orange-500"></span>
        {subtitle}
      </div>
    </div>
  );
}