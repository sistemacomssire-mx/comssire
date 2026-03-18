function money(n) {
  const x = Number(n || 0);
  return "$" + x.toFixed(2);
}

export default function TotalCard({ totals }) {
  const items = totals?.items ?? 0;
  const subtotal = totals?.subtotal ?? 0;
  const iva = totals?.iva ?? 0;
  const total = totals?.total ?? 0;

  return (
    <div className="panel p-5">
      <p className="text-xs text-white/55">Totales</p>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/65">Partidas</span>
          <span className="font-semibold">{items}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/65">Subtotal</span>
          <span className="font-semibold">{money(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/65">IVA (16%)</span>
          <span className="font-semibold">{money(iva)}</span>
        </div>
        <div className="h-px bg-white/10 my-2"></div>
        <div className="flex justify-between text-base">
          <span className="font-extrabold">Total</span>
          <span className="font-extrabold">{money(total)}</span>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-white/50">*Se actualiza conforme agregas partidas.</p>
    </div>
  );
}