export default function OrderHeaderRemision({ folio, fecha, status = "Nueva", partidasCount = 0 }) {
  const getStatusColor = () => {
    switch (String(status).toLowerCase()) {
      case "borrador":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "guardada":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "exportada":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusText = () => {
    const map = {
      borrador: "Borrador",
      guardada: "Guardada",
      exportada: "Exportada",
    };
    return map[String(status).toLowerCase()] || status || "—";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="compra-card p-5">
        <div className="text-[0.95rem] font-semibold text-slate-500">Folio</div>
        <div className="text-[1.05rem] md:text-[1.15rem] font-semibold text-slate-900 truncate mt-3">
          {folio || "—"}
        </div>
      </div>

      <div className="compra-card p-5">
        <div className="text-[0.95rem] font-semibold text-slate-500">Fecha</div>
        <div className="text-[1.05rem] md:text-[1.15rem] font-semibold text-slate-900 mt-3">
          {fecha || "—"}
        </div>
      </div>

      <div className="compra-card p-5">
        <div className="text-[0.95rem] font-semibold text-slate-500 mb-3">Estatus</div>
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              String(status).toLowerCase() === "exportada" ? "bg-orange-500" : String(status).toLowerCase() === "guardada" ? "bg-blue-500" : "bg-slate-500"
            }`}
          />
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="compra-card p-5">
        <div className="text-[0.95rem] font-semibold text-slate-500">Partidas</div>
        <div className="text-[1.05rem] md:text-[1.15rem] font-semibold text-slate-900 mt-3">
          {partidasCount}
        </div>
      </div>
    </div>
  );
}
