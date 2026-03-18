export default function OrderHeader({ folio, fecha, status = "Nueva" }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-slate-800/50 rounded p-2 border-l-2 border-blue-500">
        <div className="text-xs text-slate-400">Folio</div>
        <div className="text-sm font-bold text-white truncate">{folio || "—"}</div>
      </div>
      <div className="bg-slate-800/50 rounded p-2 border-l-2 border-blue-500">
        <div className="text-xs text-slate-400">Fecha</div>
        <div className="text-sm font-bold text-white">{fecha || "—"}</div>
      </div>
      <div className="bg-slate-800/50 rounded p-2 border-l-2 border-blue-500">
        <div className="text-xs text-slate-400">Estatus</div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span className="text-sm font-bold text-white">{status}</span>
        </div>
      </div>
    </div>
  );
}