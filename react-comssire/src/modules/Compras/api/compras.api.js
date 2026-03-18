import http from "../../../api/http";

export const comprasApi = {
  async getProveedores(search = "") {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await http.get(`/api/catalogos/proveedores${qs}`);
    return data;
  },

  async getAlmacenes() {
    const { data } = await http.get("/api/catalogos/almacenes");
    return data;
  },

  async getProductos(search = "") {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await http.get(`/api/catalogos/productos${qs}`);
    return data;
  },

  async getProductoByCodigo(cveArt) {
    const { data } = await http.get(
      `/api/catalogos/productos/${encodeURIComponent(cveArt)}`
    );
    return data;
  },

  async getExistencias(cveArt) {
    const { data } = await http.get(
      `/api/catalogos/existencias/${encodeURIComponent(cveArt)}`
    );
    return data;
  },

  async crearCompra(payload) {
    const { data } = await http.post("/api/Compras", payload);
    return data;
  },

  async getCompra(id) {
    const { data } = await http.get(`/api/Compras/${id}`);
    return data;
  },

  async updateCompra(id, payload, force = false) {
    const suffix = force ? "?force=true" : "";
    const url = `/api/Compras/${id}${suffix}`;
    console.log(`📡 PUT ${url}`, { force, payload });
    
    try {
      const { data } = await http.put(url, payload);
      return data;
    } catch (error) {
      // Si es 409 y requireForce, lanzamos el error con los datos parseados
      if (error?.response?.status === 409 && error?.response?.data?.requireForce) {
        const conflictError = new Error(error.response.data.message || "Conflicto al actualizar");
        conflictError.response = error.response;
        conflictError.isConflict = true;
        conflictError.requireForce = true;
        conflictError.estado = error.response.data.estado;
        throw conflictError;
      }
      throw error;
    }
  },

  async updateCompraForce(id, payload) {
    return await this.updateCompra(id, payload, true);
  },

  async addPartida(id, payload, force = false) {
    const suffix = force ? "?force=true" : "";
    const url = `/api/Compras/${id}/partidas${suffix}`;
    console.log(`📡 POST ${url}`, { force, payload });
    
    try {
      const { data } = await http.post(url, payload);
      return data;
    } catch (error) {
      if (error?.response?.status === 409 && error?.response?.data?.requireForce) {
        const conflictError = new Error(error.response.data.message || "Conflicto al agregar partida");
        conflictError.response = error.response;
        conflictError.isConflict = true;
        conflictError.requireForce = true;
        conflictError.estado = error.response.data.estado;
        throw conflictError;
      }
      throw error;
    }
  },

  async addPartidaForce(id, payload) {
    return await this.addPartida(id, payload, true);
  },

  async updatePartida(id, partidaId, payload, force = false) {
    const suffix = force ? "?force=true" : "";
    const url = `/api/Compras/${id}/partidas/${partidaId}${suffix}`;
    console.log(`📡 PUT ${url}`, { force, payload });
    
    try {
      const { data } = await http.put(url, payload);
      return data;
    } catch (error) {
      if (error?.response?.status === 409 && error?.response?.data?.requireForce) {
        const conflictError = new Error(error.response.data.message || "Conflicto al actualizar partida");
        conflictError.response = error.response;
        conflictError.isConflict = true;
        conflictError.requireForce = true;
        conflictError.estado = error.response.data.estado;
        throw conflictError;
      }
      throw error;
    }
  },

  async updatePartidaForce(id, partidaId, payload) {
    return await this.updatePartida(id, partidaId, payload, true);
  },

  async deletePartida(id, partidaId, force = false) {
    const suffix = force ? "?force=true" : "";
    const url = `/api/Compras/${id}/partidas/${partidaId}${suffix}`;
    console.log(`📡 DELETE ${url}`, { force });
    
    try {
      const { data } = await http.delete(url);
      return data;
    } catch (error) {
      if (error?.response?.status === 409 && error?.response?.data?.requireForce) {
        const conflictError = new Error(error.response.data.message || "Conflicto al eliminar partida");
        conflictError.response = error.response;
        conflictError.isConflict = true;
        conflictError.requireForce = true;
        conflictError.estado = error.response.data.estado;
        throw conflictError;
      }
      throw error;
    }
  },

  async deletePartidaForce(id, partidaId) {
    return await this.deletePartida(id, partidaId, true);
  },

  async enviarAprobacion(id) {
    const { data } = await http.post(`/api/Compras/${id}/enviar`);
    return data;
  },

  /**
   * Sube una factura (imagen) para una compra específica
   * @param {string} id - ID de la compra
   * @param {File|Blob} file - Archivo de imagen a subir (JPG, PNG, WEBP)
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async uploadFactura(id, file) {
    // 1. Validar que sea un archivo válido
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('El archivo no es válido:', file);
      throw new Error('El archivo debe ser un objeto File o Blob');
    }

    // 2. Validar tipo de archivo (opcional, el backend también valida)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Solo se permiten imágenes JPG, PNG o WEBP');
    }

    // 3. Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('La imagen excede 10MB');
    }

    // 4. Crear FormData correctamente
    const form = new FormData();
    
    // El nombre del campo DEBE ser "file" (coincide con el backend)
    form.append("file", file);
    
    // Opcional: Agregar metadatos adicionales si el backend los requiere
    // form.append("fileName", file.name);
    // form.append("contentType", file.type);

    // 5. Log para depuración
    console.log('📤 Subiendo factura:', {
      compraId: id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      lastModified: file instanceof File ? file.lastModified : 'N/A',
      formDataEntries: [...form.entries()].map(([key, value]) => ({
        key,
        value: value instanceof File ? `File: ${value.name} (${value.type})` : value
      }))
    });

    try {
      // 6. Hacer la petición con configuración especial para FormData
      const { data } = await http.post(`/api/Compras/${id}/factura`, form, {
        headers: {
          // Importante: No establecer Content-Type aquí
          // Axios lo establecerá automáticamente con el boundary correcto
          // 'Content-Type': 'multipart/form-data', // ← NO hacer esto
        },
        // No transformar los datos (importante para FormData)
        transformRequest: [(data) => data],
        // Timeout más largo para archivos grandes (30 segundos)
        timeout: 30000,
        // Indicar que estamos subiendo un archivo
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Progreso de subida: ${percentCompleted}%`);
        }
      });
      
      console.log('✅ Factura subida exitosamente:', data);
      return data;
    } catch (error) {
      // 7. Mejorar el manejo de errores
      console.error('❌ Error en uploadFactura:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          hasFormData: error.config?.data instanceof FormData,
          timeout: error.config?.timeout
        }
      });

      // 8. Transformar el error para mejor manejo en el componente
      if (error.response?.status === 415) {
        const enhancedError = new Error(
          error.response?.data?.message || 
          'Tipo de contenido no soportado. Asegúrate de enviar una imagen válida.'
        );
        enhancedError.response = error.response;
        enhancedError.isUnsupportedMediaType = true;
        throw enhancedError;
      }

      if (error.response?.status === 413) {
        const enhancedError = new Error(
          error.response?.data?.message || 
          'El archivo es demasiado grande. Máximo 10MB.'
        );
        enhancedError.response = error.response;
        enhancedError.isTooLarge = true;
        throw enhancedError;
      }

      throw error;
    }
  },

  async getFactura(id) {
    try {
      const { data } = await http.get(`/api/Compras/${id}/factura`);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo factura:', error);
      throw error;
    }
  },

  async deleteFactura(id) {
    try {
      const { data } = await http.delete(`/api/Compras/${id}/factura`);
      return data;
    } catch (error) {
      console.error('❌ Error eliminando factura:', error);
      throw error;
    }
  },

  async getAprobaciones() {
    const { data } = await http.get("/api/Compras/aprobaciones");
    return data;
  },

  async aprobarCompra(id) {
    const { data } = await http.post(`/api/Compras/${id}/aprobar`);
    return data;
  },

  async rechazarCompra(id, payload) {
    const { data } = await http.post(`/api/Compras/${id}/rechazar`, payload);
    return data;
  },

  async getHistorial(params = {}) {
    const fixed = { ...params };

    if (fixed.q && !fixed.search) {
      fixed.search = fixed.q;
      delete fixed.q;
    }

    const { data } = await http.get("/api/Compras/historial", {
      params: fixed,
    });
    return data;
  },

  downloadMod(id) {
    return http.get(`/api/Compras/${id}/mod`, {
      responseType: "blob",
    });
  },

  downloadPdf(id) {
    return http.get(`/api/Compras/${id}/pdf`, {
      responseType: "blob",
    });
  },

  getPdf(id) {
    return this.downloadPdf(id);
  },

  getMod(id) {
    return this.downloadMod(id);
  },
};

export default comprasApi;