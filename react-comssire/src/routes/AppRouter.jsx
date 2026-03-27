import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, CambiarPasswordPage } from "../modules/Auth";
import RequireAuth from "../modules/Auth/components/RequireAuth";

import { HomePage } from "../modules/Home";
import {
  ComprasPage,
  HistorialComprasPage,
  AprobacionesComprasPage,
} from "../modules/Compras";
import { UsuariosPage } from "../modules/Usuarios";
import {
  InventarioPage,
  TomaPage,
  TomasHistorialPage,
} from "../modules/Inventarios";
import { GestionHerramientasPage } from "../modules/Herramientas";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/cuenta/cambiar-password"
          element={
            <RequireAuth>
              <CambiarPasswordPage />
            </RequireAuth>
          }
        />

        <Route
          path="/home"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />

        <Route
          path="/compras"
          element={
            <RequireAuth>
              <ComprasPage />
            </RequireAuth>
          }
        />

        <Route
          path="/compras/historial"
          element={
            <RequireAuth>
              <HistorialComprasPage />
            </RequireAuth>
          }
        />

        {/* ✅ APROBACIONES */}
        <Route
          path="/compras/aprobaciones"
          element={
            <RequireAuth>
              <AprobacionesComprasPage />
            </RequireAuth>
          }
        />

        <Route
          path="/usuarios"
          element={
            <RequireAuth>
              <UsuariosPage />
            </RequireAuth>
          }
        />

        {/* ✅ INVENTARIO */}
        <Route
          path="/inventario"
          element={
            <RequireAuth>
              <InventarioPage />
            </RequireAuth>
          }
        />

        {/* ✅ HISTORIAL TOMAS */}
        <Route
          path="/inventario/tomas"
          element={
            <RequireAuth>
              <TomasHistorialPage />
            </RequireAuth>
          }
        />

        {/* ✅ DETALLE TOMA */}
        <Route
          path="/inventario/tomas/:tomaId"
          element={
            <RequireAuth>
              <TomaPage />
            </RequireAuth>
          }
        />

        {/* ✅ GESTIÓN DE HERRAMIENTAS */}
        <Route
          path="/herramientas"
          element={
            <RequireAuth>
              <GestionHerramientasPage />
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}