/**
 * APP SHELL
 * Sidebar + content layout wrapper for authenticated pages
 *
 * ARCHITECTURE:
 * - Sidebar items come exclusively from sidebarConfig.ts (SSOT)
 * - Role resolution uses the same hook chain as Header.tsx
 * - Tab items navigate to /dashboard with state: { tab: tabValue }
 * - Route items use <Link> to navigate to other pages
 * - Action items trigger internal callbacks (profile modal, sign out)
 * - Conditional sections (e.g. Teaching Team for individuals)
 *   are evaluated against the conditions prop at render time
 *
 * SELF-CONTAINED:
 * AppShell owns all navigation logic. No page passes tab callbacks
 * or profile callbacks. Tab navigation uses React Router location
 * state so Dashboard reads the target tab on mount.
 *
 * GOVERNING PRINCIPLE:
 * Every role lands on the lesson builder. The sidebar adds
 * role-appropriate tools alongside it. Nobody's preparation
 * work is ever displaced. Build Lesson is always primary.
 *
 * MOBILE BEHAVIOR:
 * On screens below md (768px), sidebar is hidden and accessible
 * via a hamburger button that opens a Sheet (slide-in drawer).
 * On md+ screens, sidebar is always visible.
 *
 * CHANGELOG:
 * - March 22, 2026: Initial creation for ui-sidebar branch
 * - March 25, 2026: Self-contained rework -- no prop drilling
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useOrganization } from "@/hooks/useOrganization";
import { getEffectiveRole } from "@/constants/accessControl";
import {
  getSidebarForRole,
  isSidebarTabItem,
  isSidebarRouteItem,
  isSidebarActionItem,
  type SidebarItem,
  type ResolvedSidebarSection,
} from "@/constants/sidebarConfig";
import { BRANDING } from "@/config/branding";
import { ROUTES } from "@/constants/routes";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";

// =============================================================================
// TYPES
// =============================================================================

interface AppShellProps {
  children: React.ReactNode;
  /**
   * Runtime conditions for conditional sidebar sections.
   * Keys match the `condition` field in SidebarSection definitions.
   * Example: { hasTeam: true }
   */
  conditions?: Record<string, boolean>;
}

// =============================================================================
// SIDEBAR CONTENT (shared between desktop and mobile)
// =============================================================================

interface SidebarContentProps {
  sections: ResolvedSidebarSection[];
  currentPath: string;
  currentTab: string | null;
  onItemClick: (item: SidebarItem) => void;
}

function SidebarContent({ sections, currentPath, currentTab, onItemClick, intensity, setIntensity }: SidebarContentProps & { intensity: number; setIntensity: (v: number) => void }) {
  return (
    <>
      {/* Logo block */}
      <div className="px-3 py-4 border-b border-[#2d4a2d]">
        <div className="flex items-center gap-2 mb-3">
          <img src={BRANDING.logo.icon} alt={BRANDING.logo.altText} className="h-7 w-7 rounded-lg object-contain" />
          <span className="font-bold text-[15px] text-white tracking-wide">{BRANDING.appName}</span>
        </div>
        {/* Intensity slider */}
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-[#8a9f8a] shrink-0" />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2d4a2d] accent-[#c8d8c8]"
            aria-label="Theme intensity"
          />
          <Sun className="h-4 w-4 text-[#8a9f8a] shrink-0" />
        </div>
      </div>

      <nav className="flex flex-col gap-1 py-2" aria-label="Sidebar navigation">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Items flow as one clean list -- no labels or dividers */}
            {section.items.map(item => {
            const IconComponent = item.icon;
            const isActive = isSidebarTabItem(item)
              ? currentPath === ROUTES.DASHBOARD && item.tabValue === currentTab
              : isSidebarRouteItem(item)
                ? (() => {
                    const itemPath = (item.route || '').split('#')[0];
                    const itemHash = (item.route || '').includes('#') ? '#' + (item.route || '').split('#')[1] : '';
                    if (currentPath !== itemPath) return false;
                    if (!itemHash) return !window.location.hash;
                    return window.location.hash === itemHash;
                  })()
                : false;

            const itemClasses = cn(
              "flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium tracking-wide transition-colors text-left rounded-md",
              isActive
                ? "bg-[#4a7a4a] text-white font-semibold"
                : "text-[#d8e8d8] hover:bg-[#2d4a2d] hover:text-white"
            );

            // Route items render as <Link> for proper navigation
            if (isSidebarRouteItem(item) && item.route) {
              return (
                <Link
                  key={item.id}
                  to={item.route}
                  onClick={() => onItemClick(item)}
                  className={itemClasses}
                  title={item.description}
                >
                  <IconComponent className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            }

            // Tab items and action items render as <button>
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className={itemClasses}
                title={item.description}
              >
                <IconComponent className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
      </nav>
    </>
  );
}

// =============================================================================
// APP SHELL
// =============================================================================

export function AppShell({
  children,
  conditions = {},
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { intensity, setIntensity } = useTheme();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { userRole, hasOrganization } = useOrganization();

  // Resolve role and get sidebar sections (same chain as Header.tsx)
  const effectiveRole = getEffectiveRole(isAdmin, hasOrganization, userRole);
  const allSections = getSidebarForRole(effectiveRole);

  // Filter out sections whose runtime condition is not met
  const visibleSections = allSections.filter(section => {
    if (!section.condition) return true;
    return conditions[section.condition] === true;
  });

  // Determine current tab for active state highlighting
  // Dashboard reads tab from location.state; AppShell reads it for highlighting
  const currentTab: string | null = location.pathname === ROUTES.DASHBOARD
    ? (location.state as any)?.tab || 'enhance'
    : null;

  // Handle sidebar item clicks
  const handleItemClick = async (item: SidebarItem) => {
    if (isSidebarTabItem(item) && item.tabValue) {
      // Navigate to /dashboard with tab in location state
      navigate(ROUTES.DASHBOARD, { state: { tab: item.tabValue } });
      setMobileOpen(false);
    } else if (isSidebarActionItem(item)) {
      if (item.action === 'openProfile') {
        setShowProfileModal(true);
        setMobileOpen(false);
      } else if (item.action === 'signOut') {
        await signOut();
        window.location.href = '/auth';
      }
      setMobileOpen(false);
    } else if (isSidebarRouteItem(item)) {
      // Navigation handled by <Link> -- just close mobile drawer
      setMobileOpen(false);
    }
  };

  // Shared sidebar content props
  const sidebarProps: SidebarContentProps = {
    sections: visibleSections,
    currentPath: location.pathname,
    currentTab,
    onItemClick: handleItemClick,
  };

  return (
    <>
    <div className={BRANDING.layout.pageWrapper}>
      <Header isAuthenticated hideOrgContext hideUserMenu className="hidden" />

      <div className="flex flex-1">
        {/* Desktop sidebar -- always visible on md+ */}
        <aside className="hidden md:flex md:w-56 lg:w-64 flex-col border-r border-[#2d4a2d] bg-[#1a2e1a] shrink-0 overflow-y-auto sticky top-0 h-screen">
          <SidebarContent {...sidebarProps} intensity={intensity} setIntensity={setIntensity} />
        </aside>

        {/* Mobile sidebar -- Sheet drawer */}
        <div className="md:hidden fixed bottom-20 left-4 z-40">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full shadow-lg bg-background"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col bg-[#1a2e1a] border-[#2d4a2d]">
              <SheetTitle className="sr-only">
                Navigation
              </SheetTitle>
              <SidebarContent {...sidebarProps} intensity={intensity} setIntensity={setIntensity} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content area */}
        <main className={cn("flex-1 min-w-0", `container ${BRANDING.layout.containerPadding}`)}>
          {children}
        </main>
      </div>

    </div>

    <UserProfileModal
      open={showProfileModal}
      onOpenChange={setShowProfileModal}
    />
    </>
  );
}
