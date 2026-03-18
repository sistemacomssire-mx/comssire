import http from "../../../api/http";

// Almacenes (select)
export async function apiGetAlmacenes() {
  const { data } = await http.get("/api/inventarios/almacenes");
  return data;
}

// Existencias por almacén
// params: { q, page, pageSize, soloConExistencia, orderBy, orderDir }
export async function apiGetExistenciasPorAlmacen(cveAlm, params = {}) {
  const { data } = await http.get(`/api/inventarios/${cveAlm}/existencias`, {
    params,
  });
  return data; // { total, page, pageSize, items }
}