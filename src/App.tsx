import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Vendors from "./pages/Vendors";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import InvoiceCreate from "./pages/InvoiceCreate";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
// import { LoginPage } from "./pages/LoginPage";
import { AuthProvider } from "@/context/AuthContext";
import RegisterViaInvite from "./pages/Registerviainvite";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      {/* <Route path="/login" element={<LoginPage />} /> */}

      <Route path="/register" element={<RegisterViaInvite />} />

      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<AppLayout />}>
        {/* <Route index element={<Navigate to="/dashboard" replace />} /> */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="products" element={<Products />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vendors" element={<Vendors />} />
        {/* 
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<InvoiceCreate />} />
        <Route path="reports" element={<Reports />} />
        */}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
