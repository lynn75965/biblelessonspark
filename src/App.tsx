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
import ChurchPlantReport from "./pages/ChurchPlantReport";
import WhyChurchesCanTrustBibleLessonSpark from "./pages/WhyChurchesCanTrustBibleLessonSpark";

import AdminBetaMetrics from "./pages/AdminBetaMetrics";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Cookie from "./pages/legal/Cookie";
import NotFound from "./pages/NotFound";
import Devotionals from "./pages/Devotionals";
import Bonuses from "./pages/Bonuses";
import MoreTools from "./pages/MoreTools";

// Self-Service Shepherd Entry Point (Stack 2)
import OrgLanding from "./pages/OrgLanding";
import OrgSetup from "./pages/OrgSetup";
import OrgSuccess from "./pages/OrgSuccess";
import OrgManager from "./pages/OrgManager";

// Phase 27: Teaching Team
import TeachingTeam from "./pages/TeachingTeam";

// Admin Toolbelt
import ToolbeltAdmin from "./pages/ToolbeltAdmin";

// Phase D: Publishing Hub
import PublishingHub from "./pages/PublishingHub";
// Phase E: Digital Wing
import SharedContentPage from "./pages/SharedContentPage";
import { ROUTES } from "@/constants/routes";

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
            <Route path={ROUTES.HOME} element={<Index />} />
            <Route path={ROUTES.SHARE} element={<SharedContentPage />} />
            <Route path={ROUTES.AUTH} element={<Auth />} />
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN}
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN_TOOLBELT}
              element={
                <ProtectedRoute>
                  <ToolbeltAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN_BETA_METRICS}
              element={
                <ProtectedRoute>
                  <AdminBetaMetrics />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ACCOUNT}
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.SETUP} element={<Setup />} />
            <Route path={ROUTES.SETUP_CHECKLIST} element={<SetupChecklist />} />
            <Route path={ROUTES.SETUP_GUIDE} element={<Setup />} />
            <Route path={ROUTES.PREFERENCES_LENS} element={
              <ProtectedRoute>
                <PreferencesLens />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.DOCS} element={<Docs />} />
            <Route path={ROUTES.HELP} element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.TRAINING} element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.COMMUNITY} element={<Community />} />
            <Route path={ROUTES.CHURCH_PLANT_REPORT} element={<ChurchPlantReport />} />
            <Route path={ROUTES.WHY_CHURCHES_CAN_TRUST} element={<WhyChurchesCanTrustBibleLessonSpark />} />
            <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
            <Route path={ROUTES.TERMS} element={<TermsOfService />} />
            <Route path={ROUTES.COOKIE} element={<Cookie />} />

            {/* Self-Service Shepherd Entry Point (Stack 2 - Org Manager) */}
            <Route path={ROUTES.ORG} element={<OrgLanding />} />
            <Route path={ROUTES.ORG_SETUP} element={
              <ProtectedRoute>
                <OrgSetup />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ORG_SUCCESS} element={
              <ProtectedRoute>
                <OrgSuccess />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.ORG_MANAGER} element={
              <ProtectedRoute>
                <OrgManager />
              </ProtectedRoute>
            } />

            {/* Phase 27: Teaching Team */}
            <Route path={ROUTES.TEACHING_TEAM} element={
              <ProtectedRoute>
                <TeachingTeam />
              </ProtectedRoute>
            } />

            {/* Devotionals */}
            <Route path={ROUTES.DEVOTIONALS} element={
              <ProtectedRoute>
                <Devotionals />
              </ProtectedRoute>
            } />

            {/* Sidebar extras */}
            <Route path={ROUTES.BONUSES} element={
              <ProtectedRoute>
                <Bonuses />
              </ProtectedRoute>
            } />
            <Route path={ROUTES.MORE_TOOLS} element={
              <ProtectedRoute>
                <MoreTools />
              </ProtectedRoute>
            } />

            {/* Phase D: Publishing Hub */}
            <Route path={ROUTES.PUBLISH} element={
              <ProtectedRoute>
                <PublishingHub />
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
