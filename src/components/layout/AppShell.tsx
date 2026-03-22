/**
 * APP SHELL
 * Sidebar + content layout wrapper for authenticated pages
 *
 * ARCHITECTURE:
 * - Sidebar items come exclusively from sidebarConfig.ts (SSOT)
 * - Role resolution uses the same hook chain as Header.tsx
 * - Tab items call onTabChange to switch dashboard tabs (no navigation)
 * - Route items use <Link> to navigate to other pages
 * - Action items trigger callbacks (profile modal, sign out)
 * - Conditional sections (e.g. Teaching Team for individuals)
 *   are evaluated against the conditions prop at render time
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
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Footer } from "./Footer";
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

// =============================================================================
// TYPES
// =============================================================================

interface AppShellProps {
  children: React.ReactNode;
  /** Current active dashboard tab value (for highlighting sidebar tab items) */
  activeTab?: string;
  /** Callback when a sidebar tab item is clicked (switches dashboard tab) */
  onTabChange?: (tabValue: string) => void;
  /** Callback to open the user profile modal */
  onOpenProfile?: () => void;
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
  activeTab?: string;
  currentPath: string;
  onItemClick: (item: SidebarItem) => void;
}

function SidebarContent({ sections, activeTab, currentPath, onItemClick }: SidebarContentProps) {
  return (
    <nav className="flex flex-col gap-1 py-2" aria-label="Sidebar navigation">
      {sections.map((section, sectionIndex) => (
        <div key={section.id}>
          {/* Section divider (not before the first section) */}
          {sectionIndex > 0 && (
            <div className="mx-3 my-2 border-t border-border" />
          )}

          {/* Section label */}
          <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.label}
          </p>

          {/* Section items */}
          {section.items.map(item => {
            const IconComponent = item.icon;
            const isActive = isSidebarTabItem(item)
              ? item.tabValue === activeTab
              : isSidebarRouteItem(item)
                ? currentPath === item.route
                : false;

            const itemClasses = cn(
              "flex items-center gap-3 w-full px-3 py-2 mx-1 rounded-md text-sm transition-colors text-left",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground"
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
                  <IconComponent className="h-4 w-4 shrink-0" />
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
                <IconComponent className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// =============================================================================
// APP SHELL
// =============================================================================

export function AppShell({
  children,
  activeTab,
  onTabChange,
  onOpenProfile,
  conditions = {},
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
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

  // Handle sidebar item clicks
  const handleItemClick = (item: SidebarItem) => {
    if (isSidebarTabItem(item) && onTabChange && item.tabValue) {
      onTabChange(item.tabValue);
      setMobileOpen(false);
    } else if (isSidebarActionItem(item)) {
      if (item.action === 'openProfile' && onOpenProfile) {
        onOpenProfile();
      } else if (item.action === 'signOut') {
        signOut();
        window.location.href = '/';
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
    activeTab,
    currentPath: location.pathname,
    onItemClick: handleItemClick,
  };

  return (
    <div className={BRANDING.layout.pageWrapper}>
      <Header isAuthenticated hideOrgContext />

      <div className="flex flex-1">
        {/* Desktop sidebar -- always visible on md+ */}
        <aside className="hidden md:flex md:w-56 lg:w-64 flex-col border-r border-border bg-background shrink-0 overflow-y-auto">
          <SidebarContent {...sidebarProps} />
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
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="px-3 pt-4 pb-2 text-sm font-semibold">
                Navigation
              </SheetTitle>
              <SidebarContent {...sidebarProps} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content area */}
        <main className={cn("flex-1 min-w-0", `container ${BRANDING.layout.containerPadding}`)}>
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
