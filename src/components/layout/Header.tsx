import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { User, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getTheologyProfile } from "@/constants/theologyProfiles";
import { useSystemSettings } from "@/hooks/useSystemSettings";

// SSOT Imports
import { getEffectiveRole } from "@/constants/accessControl";
import { getNavigationForRole, NavigationItem } from "@/constants/navigationConfig";
import { BRANDING } from "@/config/branding";

interface HeaderProps {
  onAuthClick?: () => void;
  isAuthenticated?: boolean;
  organizationName?: string;
  hideOrgContext?: boolean; // NEW: Hide org badge for Personal Workspace
}

export function Header({ onAuthClick, isAuthenticated, organizationName, hideOrgContext = false }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { organization, userRole, hasOrganization } = useOrganization();
  const [theologicalLens, setTheologicalLens] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const authenticated = user ? true : isAuthenticated;
  const userEmail = user?.email;
  const displayName = user?.user_metadata?.full_name || userEmail?.split('@')[0] || 'User';
  const { settings } = useSystemSettings();

  // Determine effective role and get navigation items
  const effectiveRole = getEffectiveRole(isAdmin, hasOrganization, userRole);
  const navigationItems = getNavigationForRole(effectiveRole);

  // Use org name from hook if not passed as prop, BUT respect hideOrgContext
  const displayOrgName = hideOrgContext ? null : (organizationName || organization?.name);

  // "Lead a Team" nav item logic (February 2026)
  // - Solo teacher (no org): "Lead a Team" → /org
  // - Org owner/leader: "{Org Name}" → /org-manager
  // - Org member: "{Org Name}" → /dashboard
  const getOrgNavItem = () => {
    if (!authenticated || !user) return null;

    if (hasOrganization && organization) {
      const isLeader = userRole === 'owner' || userRole === 'leader';
      return {
        label: organization.name || 'My Organization',
        route: isLeader ? '/org-manager' : '/dashboard',
      };
    }

    // Solo teacher — no org
    return {
      label: 'Lead a Team',
      route: '/org',
    };
  };

  const orgNavItem = getOrgNavItem();

  useEffect(() => {
    const fetchTheologyProfile = async () => {
      if (!user) {
        setTheologicalLens(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('theology_profile_id')
        .eq('id', user.id)
        .single();

      if (!error && data?.theology_profile_id) {
        const profile = getTheologyProfile(data.theology_profile_id);
        setTheologicalLens(profile ? profile.name : null);
      }
    };

    fetchTheologyProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
          {/* Logo + Wordmark - SSOT from BRANDING, matches Footer styling */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0" title="Return to Home">
            <img 
              src={BRANDING.logo.icon} 
              alt={BRANDING.logo.altText}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-contain"
            />
            <span className="font-semibold text-base sm:text-lg text-primary">
              {BRANDING.appName}
            </span>
          </Link>

          {authenticated && displayOrgName && (
            <Badge variant="outline" className="hidden md:flex text-xs truncate max-w-[120px] lg:max-w-none">
              {displayOrgName}
            </Badge>
          )}

          {authenticated && theologicalLens && !hideOrgContext && (
            <Badge variant="secondary" className="hidden lg:flex text-xs">
              Lens: {theologicalLens}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          {authenticated ? (
            <>
              <NotificationBell />

              {/* "Lead a Team" / Org Name nav item (February 2026)
                  - Solo teacher: "Lead a Team" → /org landing page
                  - Org owner/leader: "{Org Name}" → /org-manager
                  - Org member: "{Org Name}" → /dashboard */}
              {orgNavItem && (
                <Link
                  to={orgNavItem.route}
                  className="hidden sm:flex items-center gap-1.5 h-9 sm:h-10 px-2 sm:px-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/10"
                  title={hasOrganization ? `Go to ${orgNavItem.label}` : 'Start a ministry organization'}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="max-w-[120px] lg:max-w-[180px] truncate">
                    {orgNavItem.label}
                  </span>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                    </div>
                    <span className="hidden sm:block text-sm lg:text-base max-w-[100px] lg:max-w-none truncate">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 sm:w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {navigationItems.map((item, index) => {
                    const IconComponent = item.icon;

                    // Handle User Profile specially (open modal, not navigate)
                    if (item.id === 'settings') {
                      return (
                        <DropdownMenuItem key={item.id} onClick={() => setShowProfileModal(true)}>
                          <IconComponent className="mr-2 h-4 w-4" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      );
                    }

                    // Handle Sign Out specially (onClick, not Link)
                    if (item.id === 'signOut') {
                      return (
                        <DropdownMenuItem key={item.id} onClick={handleSignOut}>
                          <IconComponent className="mr-2 h-4 w-4" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      );
                    }

                    // Render navigation link
                    return (
                      <div key={item.id}>
                        <DropdownMenuItem asChild>
                          <Link to={item.route} className="flex items-center">
                            <IconComponent className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                        {item.dividerAfter && <DropdownMenuSeparator />}
                      </div>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {settings.show_join_beta_button && (
                <Button variant="ghost" size="sm" className="min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm px-2 sm:px-3" onClick={() => window.location.href = '/auth?tab=signin'}>
                  Sign In
                </Button>
              )}
              <Button variant="default" size="sm" className="min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm px-3 sm:px-4" onClick={() => window.location.href = settings.show_join_beta_button ? '/auth?tab=signup' : '/auth'}>
                {settings.show_join_beta_button ? "Join Beta" : "Sign In"}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>

      {showProfileModal && (
        <UserProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
        />
      )}
    );
}
