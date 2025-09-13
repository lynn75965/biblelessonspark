import { Button } from "@/components/ui/button";
import { BookOpen, Menu, Settings, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  isAuthenticated?: boolean;
  organizationName?: string;
  onAuthClick?: () => void;
}

export function Header({ isAuthenticated = false, organizationName, onAuthClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">LessonSpark</h1>
              {organizationName && (
                <p className="text-xs text-muted-foreground">{organizationName}</p>
              )}
            </div>
          </div>
          <div className="beta-ribbon">Private Beta</div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm">Dashboard</Button>
              <Button variant="ghost" size="sm">My Lessons</Button>
              <Button variant="ghost" size="sm">Members</Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm">Features</Button>
              <Button variant="ghost" size="sm">Pricing</Button>
              <Button variant="outline" size="sm" onClick={onAuthClick}>
                Sign In
              </Button>
              <Button variant="hero" size="sm" onClick={onAuthClick}>
                Request Access
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" className="w-full justify-start">Dashboard</Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">My Lessons</Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">Members</Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="w-full justify-start">Features</Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">Pricing</Button>
                <Button variant="outline" size="sm" className="w-full" onClick={onAuthClick}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" className="w-full" onClick={onAuthClick}>
                  Request Access
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}