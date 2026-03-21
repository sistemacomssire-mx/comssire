export default function OrderHeader({ folio, fecha, status = "Nueva" }) {
  const getStatusColor = () => {
    switch (status) {
      case "Borrador":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "Enviada":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Aprobada":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rechazada":
        return "bg-red-50 text-red-700 border-red-200";
      case "Exportada":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const cardClass =
    "compra-card p-5";

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className={cardClass}>
        <div className="text-[0.95rem] font-semibold text-slate-500">Folio</div>
        <div className="text-[1.05rem] md:text-[1.15rem] font-semibold text-slate-900 truncate mt-3">
          {folio || "—"}
        </div>
      </div>

      <div className={cardClass}>
        <div className="text-[0.95rem] font-semibold text-slate-500">Fecha</div>
        <div className="text-[1.05rem] md:text-[1.15rem] font-semibold text-slate-900 mt-3">
          {fecha || "—"}
        </div>
      </div>

      <div className={cardClass}>
        <div className="text-[0.95rem] font-semibold text-slate-500 mb-3">Estatus</div>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${status === "Borrador" ? "bg-slate-500" : "bg-orange-500"}`} />
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${getStatusColor()}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}