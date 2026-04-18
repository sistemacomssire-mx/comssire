import http from "../../../api/http";

function getFilenameFromHeaders(headers, fallback) {
  const cd = headers?.["content-disposition"] || headers?.["Content-Disposition"];
  const match = cd ? /filename="?([^"]+)"?/i.exec(cd) : null;
  return match?.[1] || fallback;
}

export const comprasRemisionApi = {
  async getProveedores(search = "") {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await http.get(`/api/catalogos/proveedores${qs}`);
    return Array.isArray(data) ? data : [];
  },

  async getAlmacenes() {
    const { data } = await http.get("/api/catalogos/almacenes");
    return Array.isArray(data) ? data : [];
  },

  async getProductos(search = "") {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await http.get(`/api/catalogos/productos${qs}`);
    return Array.isArray(data) ? data : [];
  },

  async getProductoByCodigo(cveArt) {
    const { data } = await http.get(`/api/catalogos/productos/${encodeURIComponent(cveArt)}`);
    return data;
  },

  async getExistencias(cveArt) {
    const { data } = await http.get(`/api/catalogos/existencias/${encodeURIComponent(cveArt)}`);
    return Array.isArray(data) ? data : [];
  },

  async getAll(params = {}) {
    const { data } = await http.get("/api/compras-remision", { params });
    return Array.isArray(data) ? data : [];
  },

  async getById(id) {
    const { data } = await http.get(`/api/compras-remision/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post("/api/compras-remision", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.put(`/api/compras-remision/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await http.delete(`/api/compras-remision/${id}`);
    return data;
  },

  async addPartida(id, payload) {
    const { data } = await http.post(`/api/compras-remision/${id}/partidas`, payload);
    return data;
  },

  async updatePartida(id, partidaId, payload) {
    const { data } = await http.put(`/api/compras-remision/${id}/partidas/${partidaId}`, payload);
    return data;
  },

  async deletePartida(id, partidaId) {
    const { data } = await http.delete(`/api/compras-remision/${id}/partidas/${partidaId}`);
    return data;
  },

  async downloadMod(id) {
    const response = await http.get(`/api/compras-remision/${id}/mod`, {
      responseType: "blob",
    });

    return {
      blob: response.data,
      filename: getFilenameFromHeaders(response.headers, "remision.mod"),
    };
  },

  async downloadPdf(id) {
    const response = await http.get(`/api/compras-remision/${id}/pdf`, {
      responseType: "blob",
    });

    return {
      blob: response.data,
      filename: getFilenameFromHeaders(response.headers, "remision.pdf"),
    };
  },
};