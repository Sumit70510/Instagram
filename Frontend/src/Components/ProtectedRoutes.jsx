import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoutes({ children }) {
  const { user } = useSelector((store) => store.auth);

if (!user || !user._id) {
  return <Navigate to="/login" replace />;
}

  return children ? children : <Outlet />;
}