import http from "../../../api/http";

// Crear toma
export async function apiCrearToma(cveAlm) {
  const { data } = await http.post("/api/inventarios/tomas", { cveAlm });
  return data; // { tomaId, cveAlm, totalProductos }
}

// Listar tomas (historial)
export async function apiListarTomas(params = {}) {
  const { data } = await http.get("/api/inventarios/tomas", { params });
  return data; // TomaDto[]
}

// Ver toma (detalle)
export async function apiVerToma(tomaId, params = {}) {
  const { data } = await http.get(`/api/inventarios/tomas/${tomaId}`, { params });
  return data;
  // { toma, resumen, total, page, pageSize, items }
}

// Capturar físico
export async function apiCapturarFisico(tomaId, cveArt, existFisico) {
  const { data } = await http.put(
    `/api/inventarios/tomas/${tomaId}/detalle/${encodeURIComponent(cveArt)}`,
    { existFisico }
  );
  return data;
}

// Cerrar toma
export async function apiCerrarToma(tomaId) {
  const { data } = await http.post(`/api/inventarios/tomas/${tomaId}/cerrar`, {});
  return data;
}

// Cancelar toma
export async function apiCancelarToma(tomaId) {
  const { data } = await http.post(`/api/inventarios/tomas/${tomaId}/cancelar`, {});
  return data;
}

// Reporte JSON (revisión)
export async function apiReporteToma(tomaId, params = {}) {
  const { data } = await http.get(`/api/inventarios/tomas/${tomaId}/reporte`, { params });
  return data; // { resumen, items }
}

// PDF (blob)
export async function apiPdfToma(tomaId) {
  const { data } = await http.get(`/api/inventarios/tomas/${tomaId}/pdf`, {
    responseType: "blob",
  });
  return data; // Blob
}