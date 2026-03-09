import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.tsx";

interface Props {
  allowedRoles?: string[]; // e.g. ["Admin"] for admin-only pages
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  // Still bootstrapping — show nothing (or a spinner)
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but wrong role
  if (allowedRoles && !allowedRoles.some((r) => user?.roles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
