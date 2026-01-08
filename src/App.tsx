import './config/i18n';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MaintenanceWrapper } from "@/components/MaintenanceWrapper";
import { SecurityAlerts } from "@/components/security/SecurityAlerts";
import { TenantProvider } from "@/contexts/TenantContext";
import { useTenantConfig } from "@/hooks/useTenantConfig";
import { ROUTES } from "@/constants/routes";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import PricingPage from "./pages/PricingPage";
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
import OrgManager from "./pages/OrgManager";
import Parables from "./pages/Parables";
import Devotionals from "./pages/Devotionals";

const queryClient = new QueryClient();

/**
 * TenantWrapper - Loads tenant config and provides it to the app
 * 
 * This component exists because hooks must be called inside a component,
 * and we need QueryClientProvider available before loading tenant config.
 */
function TenantWrapper({ children }: { children: React.ReactNode }) {
  const { config, isLoading } = useTenantConfig();

  // Show nothing during initial load to prevent flash of default content
  // This is typically very fast (< 100ms)
  if (isLoading) {
    return null;
  }

  return (
    <TenantProvider config={config}>
      {children}
    </TenantProvider>
  );
}

/**
 * AppRoutes - All application routes
 * Separated for clarity and to keep App component clean
 */
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing" element={<PricingPage />} />
        {/* PUBLIC ROUTE: Modern Parable Generator accessible to all users */}
        <Route path="/parables" element={<Parables />} />
        {/* PROTECTED ROUTE: DevotionalSpark for authenticated users */}
        <Route path="/devotionals" element={<ProtectedRoute><Devotionals /></ProtectedRoute>} />
        <Route
          path={ROUTES.WORKSPACE}
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD}
          element={<Navigate to="/workspace" replace />}
        />
        <Route
          path={ROUTES.ORG}
          element={
            <ProtectedRoute>
              <OrgManager />
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
  );
}

/**
 * App - Root application component
 * 
 * Provider hierarchy (outer to inner):
 * 1. QueryClientProvider - React Query for data fetching
 * 2. AuthProvider - Authentication state
 * 3. TenantWrapper - Tenant configuration (loads from database)
 * 4. TooltipProvider - UI tooltips
 * 5. MaintenanceWrapper - Maintenance mode check
 * 6. AppRoutes - All routes
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantWrapper>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SecurityAlerts />
          <MaintenanceWrapper>
            <AppRoutes />
          </MaintenanceWrapper>
        </TooltipProvider>
      </TenantWrapper>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
