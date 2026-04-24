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

import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme, THEME_LEVELS } from "@/components/layout/ThemeProvider";
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
import { useSubscription } from "@/hooks/useSubscription";
import { isPaidTier } from "@/constants/pricingConfig";
import { UpgradePromptModal } from "@/components/subscription/UpgradePromptModal";
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
  isFreeTier: boolean;
  onLockedItemClick: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({ sections, currentPath, currentTab, onItemClick, isFreeTier, onLockedItemClick, collapsed = false, onToggleCollapse, intensity, setIntensity }: SidebarContentProps & { intensity: number; setIntensity: (v: number) => void }) {
  return (
    <>
      {/* Collapse toggle -- desktop only */}
      {onToggleCollapse && (
        <div className={cn("flex border-b border-[#2d4a2d]", collapsed ? "justify-center py-2" : "justify-end px-2 py-1")}>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-[#8a9f8a] hover:text-white hover:bg-[#2d4a2d] transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Logo block */}
      <div className={cn("border-b border-[#2d4a2d]", collapsed ? "px-1 py-3" : "px-3 py-4")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2 mb-3")}>
          <img src={BRANDING.logo.icon} alt={BRANDING.logo.altText} className="h-7 w-7 rounded-lg object-contain" />
          {!collapsed && <span className="font-bold text-[15px] text-white tracking-wide">{BRANDING.appName}</span>}
        </div>
        {/* Theme intensity selector -- hidden when collapsed */}
        {!collapsed && (
        <div className="flex items-center justify-center gap-1.5">
          {THEME_LEVELS.map((level) => {
            const isActive = intensity === level.value;
            const fills: Record<number, string> = { 15: "#1a1a1a", 40: "#4a4a4a", 65: "#a0a0a0", 90: "#f0f0f0" };
            const fill = fills[level.value] || "#a0a0a0";
            const needsBorder = level.value === 90;
            return (
              <button
                key={level.value}
                onClick={() => setIntensity(level.value)}
                className={`flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 transition-all cursor-pointer ${
                  isActive ? "ring-2 ring-[#4A7A4A] bg-[#2d4a2d]/50" : "hover:bg-[#2d4a2d]/30"
                }`}
                aria-label={`Theme: ${level.label}`}
                title={level.label}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <circle cx="9" cy="9" r="7" fill={fill} stroke={needsBorder ? "#666" : "none"} strokeWidth={needsBorder ? 1 : 0} />
                </svg>
                <span className="text-[10px] text-[#8a9f8a] leading-none">{level.label}</span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      <div className="flex-1 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
      <nav className="flex flex-col gap-1 py-2" aria-label="Sidebar navigation">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Items flow as one clean list -- no labels or dividers */}
            {section.items.map(item => {
            const tierGate = item.tierGate || 'always';

            // hidden_free items are not rendered at all for free users
            if (isFreeTier && tierGate === 'hidden_free') return null;

            // paid_only items are grayed + locked for free users
            const isLocked = isFreeTier && tierGate === 'paid_only';

            const IconComponent = item.icon;
            const isActive = !isLocked && (isSidebarTabItem(item)
              ? currentPath === ROUTES.DASHBOARD && item.tabValue === currentTab
              : isSidebarRouteItem(item)
                ? (() => {
                    const itemPath = (item.route || '').split('#')[0];
                    const itemHash = (item.route || '').includes('#') ? '#' + (item.route || '').split('#')[1] : '';
                    if (currentPath !== itemPath) return false;
                    if (!itemHash) return !window.location.hash;
                    return window.location.hash === itemHash;
                  })()
                : false);

            const itemClasses = cn(
              "flex items-center w-full py-2.5 text-[13px] font-medium tracking-wide transition-colors text-left rounded-md",
              collapsed ? "justify-center px-0" : "gap-3 px-4",
              isLocked
                ? "text-[#d8e8d8] opacity-50 cursor-pointer hover:bg-[#2d4a2d] hover:text-white"
                : isActive
                  ? "bg-[#4a7a4a] text-white font-semibold"
                  : "text-[#d8e8d8] hover:bg-[#2d4a2d] hover:text-white"
            );

            // Locked items render as button that opens upgrade modal
            // aria-disabled keeps item in tab order; disabled would remove focus
            if (isLocked) {
              return (
                <button
                  key={item.id}
                  aria-disabled="true"
                  aria-label={`${item.label}, Personal Plan required`}
                  tabIndex={0}
                  onClick={onLockedItemClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onLockedItemClick();
                    }
                  }}
                  className={itemClasses}
                  title={collapsed ? item.label : `Upgrade to unlock ${item.label}`}
                >
                  <span className="relative shrink-0">
                    <IconComponent className="h-[18px] w-[18px]" aria-hidden="true" />
                    {collapsed && <Lock className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-[#8a9f8a]" aria-hidden="true" />}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && <Lock className="h-3.5 w-3.5 shrink-0 ml-auto" aria-hidden="true" />}
                </button>
              );
            }

            // Route items render as <Link> for proper navigation
            if (isSidebarRouteItem(item) && item.route) {
              return (
                <Link
                  key={item.id}
                  to={item.route}
                  onClick={() => onItemClick(item)}
                  className={itemClasses}
                  title={collapsed ? item.label : item.description}
                >
                  <IconComponent className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            }

            // Tab items and action items render as <button>
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className={itemClasses}
                title={collapsed ? item.label : item.description}
              >
                <IconComponent className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>
      ))}
      </nav>
      </div>
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() =>
    typeof window !== 'undefined' && false
  );

  const toggleDesktopCollapse = useCallback(() => {
    setDesktopCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('bls_sidebar_collapsed', String(next));
      return next;
    });
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const { intensity, setIntensity } = useTheme();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { userRole, hasOrganization } = useOrganization();
  const { tier } = useSubscription();
  const isFreeTier = !isPaidTier(tier);

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
      navigate(ROUTES.DASHBOARD, { state: { tab: item.tabValue }, replace: true });
      setMobileOpen(false);
    } else if (isSidebarActionItem(item)) {
      if (item.action === 'openProfile') {
        setShowProfileModal(true);
        setMobileOpen(false);
      } else if (item.action === 'openUpgradeModal') {
        setShowUpgradeModal(true);
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

  const handleLockedItemClick = () => {
    setShowUpgradeModal(true);
    setMobileOpen(false);
  };

  // Shared sidebar content props
  const sidebarProps: SidebarContentProps = {
    sections: visibleSections,
    currentPath: location.pathname,
    currentTab,
    onItemClick: handleItemClick,
    isFreeTier,
    onLockedItemClick: handleLockedItemClick,
  };

  return (
    <>
    <div className={BRANDING.layout.pageWrapper}>
      <Header isAuthenticated hideOrgContext hideUserMenu className="hidden" />

      <div className="flex flex-1">
        {/* Desktop sidebar -- always visible on md+ */}
        <aside className={cn(
          "hidden md:flex flex-col border-r border-[#2d4a2d] bg-[#1a2e1a] shrink-0 overflow-y-auto sticky top-0 h-screen transition-[width] duration-200",
          desktopCollapsed ? "w-14" : "md:w-64 lg:w-72"
        )}>
          <SidebarContent {...sidebarProps} collapsed={desktopCollapsed} onToggleCollapse={toggleDesktopCollapse} intensity={intensity} setIntensity={setIntensity} />
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

    <UpgradePromptModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      trigger="feature_teaser"
    />
    </>
  );
}
