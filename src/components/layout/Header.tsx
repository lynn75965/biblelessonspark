import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { BookOpen, User, Settings, LogOut, Shield, Eye, Building2, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useViewMode, ViewMode } from "@/contexts/ViewModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getTheologyProfile } from "@/constants/theologyProfiles";
import { getUIConfig } from "@/constants/programConfig";

interface HeaderProps {
  onAuthClick?: () => void;
  isAuthenticated?: boolean;
  organizationName?: string;
}

export function Header({ onAuthClick, isAuthenticated, organizationName }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { viewMode, setViewMode, isSimulatedView, viewModeLabel } = useViewMode();
  const [theologicalLens, setTheologicalLens] = useState<string | null>(null);

  const authenticated = user ? true : isAuthenticated;
  const userEmail = user?.email;
  const displayName = user?.user_metadata?.full_name || userEmail?.split('@')[0] || 'User';
  const uiConfig = getUIConfig();

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

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as ViewMode);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity shrink-0" title="Return to Home">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-bold gradient-text hidden xs:inline">LessonSpark USA</span>
          </Link>

          {authenticated && organizationName && (
            <Badge variant="outline" className="hidden md:flex text-xs truncate max-w-[120px] lg:max-w-none">
              {organizationName}
            </Badge>
          )}

          {authenticated && theologicalLens && (
            <Badge variant="secondary" className="hidden lg:flex text-xs">
              Lens: {theologicalLens}
            </Badge>
          )}

          {authenticated && isAdmin && isSimulatedView && (
            <Badge variant="destructive" className="hidden sm:flex text-xs animate-pulse">
              <Eye className="h-3 w-3 mr-1" />
              {viewModeLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          {authenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-secondary shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
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
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View As...</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup value={viewMode} onValueChange={handleViewModeChange}>
                            <DropdownMenuRadioItem value="admin">
                              <Shield className="mr-2 h-4 w-4 text-red-500" />
                              <span>Admin View</span>
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="orgLeader">
                              <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                              <span>Org Leader View</span>
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="personal">
                              <UserCircle className="mr-2 h-4 w-4 text-green-500" />
                              <span>Personal Workspace</span>
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {uiConfig.showJoinBetaButton && (
                <Button variant="ghost" size="sm" className="min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm px-2 sm:px-3" onClick={() => window.location.href = '/auth?tab=signin'}>
                  Sign In
                </Button>
              )}
              <Button variant="hero" size="sm" className="min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm px-3 sm:px-4" onClick={() => window.location.href = uiConfig.showJoinBetaButton ? '/auth?tab=signup' : '/auth'}>
                {uiConfig.showJoinBetaButton ? uiConfig.joinBetaButtonText : uiConfig.headerButtonText}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}