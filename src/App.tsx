import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMaterialsStore } from "@/store/materialsStore";
import { useServicesStore } from "@/store/servicesStore";
import { useCompanyStore } from "@/store/companyStore";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "@/components/PrivateRoute";
import Index from "./pages/Index";
import Materials from "./pages/Materials";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import NewQuote from "./pages/NewQuote";
import QuoteDetail from "./pages/QuoteDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const AppContent = () => {
  const { fetchMaterials } = useMaterialsStore();
  const { fetchServices } = useServicesStore();
  const { fetchCompany } = useCompanyStore();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      fetchMaterials();
      fetchServices();
      fetchCompany();
    }
  }, [user, loading, fetchMaterials, fetchServices, fetchCompany]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
        <Route path="/materials" element={<PrivateRoute><Materials /></PrivateRoute>} />
        <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/quote/new" element={<PrivateRoute><NewQuote /></PrivateRoute>} />
        <Route path="/quote/:id" element={<PrivateRoute><QuoteDetail /></PrivateRoute>} />
        <Route path="/quote/:id/edit" element={<PrivateRoute><NewQuote /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner position="top-center" />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
