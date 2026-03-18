import { Navigate, useLocation } from "react-router-dom";
import { authStorage } from "../store/auth.storage";

/**
 * - Si no hay token => /login
 * - Si mustChangePassword => /cuenta/cambiar-password
 */
export default function RequireAuth({ children }) {
  const loc = useLocation();
  const token = authStorage.getToken();

  if (!token) return <Navigate to="/login" replace />;

  const must = authStorage.mustChangePassword();
  if (must && loc.pathname !== "/cuenta/cambiar-password") {
    return <Navigate to="/cuenta/cambiar-password" replace />;
  }

  return children;
}