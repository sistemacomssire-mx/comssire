import axios from "axios";
import { authStorage } from "../modules/Auth/store/auth.storage";

/*
  CONFIGURACIÓN SEGURA DE BASE URL

  - En desarrollo (npm run dev):
      Si no existe VITE_API_BASE_URL → usa localhost fallback.

  - En producción (Render):
      Si no existe VITE_API_BASE_URL → lanza error claro.
*/

const envBaseURL = import.meta.env.VITE_API_BASE_URL;
const localFallback = "https://localhost:7008";

if (!envBaseURL && import.meta.env.PROD) {
  throw new Error(
    "VITE_API_BASE_URL no está definida en producción. Configúrala en Render."
  );
}

const resolvedBaseURL = envBaseURL || localFallback;

const http = axios.create({
  baseURL: resolvedBaseURL,
});

// ---- helpers para debug ----
function safeUrl(config) {
  try {
    const base = config?.baseURL || "";
    const url = config?.url || "";
    return `${base}${url}`;
  } catch {
    return config?.url || "(unknown-url)";
  }
}

async function tryParseBlobError(error) {
  const resp = error?.response;
  const data = resp?.data;

  if (!resp || !data || !(data instanceof Blob)) return error;

  const ct =
    resp?.headers?.["content-type"] ||
    resp?.headers?.["Content-Type"] ||
    "";

  if (
    String(ct).includes("application/json") ||
    String(ct).includes("text")
  ) {
    try {
      const text = await data.text();
      try {
        const json = JSON.parse(text);
        error.response.parsedData = json;
      } catch {
        error.response.parsedData = text;
      }
    } catch {
      // ignore
    }
  }

  return error;
}

http.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const method = (config.method || "get").toUpperCase();
    const url = safeUrl(config);

    const m = (config.method || "get").toLowerCase();
    if (["post", "put", "patch"].includes(m)) {
      config.headers["Content-Type"] = "application/json";
      config.headers["Accept"] = "application/json";
    }

    if (config.responseType === "blob") {
      config.headers["Accept"] = "application/octet-stream";
      delete config.headers["Content-Type"];
    }

    console.log(`[HTTP] -> ${method} ${url}`, {
      params: config.params,
      data: config.data,
      responseType: config.responseType,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => {
    const method = (response?.config?.method || "get").toUpperCase();
    const url = safeUrl(response?.config);

    console.log(
      `[HTTP] <- ${method} ${url} ${response.status}`,
      { headers: response?.headers }
    );

    return response;
  },
  async (error) => {
    error = await tryParseBlobError(error);

    const status = error?.response?.status;
    const method = (error?.config?.method || "get").toUpperCase();
    const url = safeUrl(error?.config);

    console.error(
      `[HTTP] !! ${method} ${url} ${status ?? ""}`,
      {
        parsedData: error?.response?.parsedData,
        data: error?.response?.data,
      }
    );

    if (status === 401) {
      authStorage.clear();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default http;