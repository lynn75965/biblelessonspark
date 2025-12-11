import './config/i18n';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SecurityAlerts } from "@/components/security/SecurityAlerts";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import Setup from "./pages/Setup";
import SetupChecklist from "./pages/SetupChecklist";
import PreferencesLens from "./pages/PreferencesLens";
import Docs from "./pages/Docs";
import Help from "./pages/Help";
import Training from "./pages/Training";
import Community from "./pages/Community";
import BetaSignup from "./pages/BetaSignup";
import AdminBetaMetrics from "./pages/AdminBetaMetrics";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Cookie from "./pages/legal/Cookie";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SecurityAlerts />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route path="/setup" element={<Setup />} />
            <Route path="/setup/checklist" element={<SetupChecklist />} />
            <Route path="/setup/guide" element={<Setup />} />
            <Route path="/preferences/lens" element={
              <ProtectedRoute>
                <PreferencesLens />
              </ProtectedRoute>
            } />
            <Route path="/docs" element={<Docs />} />
            <Route path="/help" element={<Help />} />
            <Route path="/training" element={<Training />} />
            <Route path="/community" element={<Community />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/legal/cookie" element={<Cookie />} />
            <Route path="/admin/beta-metrics" element={
              <ProtectedRoute>
                <AdminBetaMetrics />
              </ProtectedRoute>
            } />
            <Route path="/beta-signup" element={
              <ProtectedRoute>
                <BetaSignup />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;