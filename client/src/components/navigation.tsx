import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, PlusCircle, Search, PawPrint } from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/">
            <div className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
              <PawPrint className="h-8 w-8 text-primary mr-3 fill-current" />
              <span className="text-xl font-bold text-foreground">Paw Finder</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated && (
              <>
                <Link to="/">
                  <span className={`text-sm font-medium transition-colors hover:text-foreground cursor-pointer ${
                    location.pathname === "/" ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    Home
                  </span>
                </Link>
                <Link to="/search">
                  <span className={`text-sm font-medium transition-colors hover:text-foreground cursor-pointer ${
                    location.pathname.startsWith("/search") ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    Search
                  </span>
                </Link>
                <Link to="/report">
                  <span className={`text-sm font-medium transition-colors hover:text-foreground cursor-pointer ${
                    location.pathname === "/report" ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    Report
                  </span>
                </Link>
              </>
            )}
            <Link to="/stories">
              <span className={`text-sm font-medium transition-colors hover:text-foreground cursor-pointer ${
                location.pathname === "/stories" ? "text-foreground" : "text-muted-foreground"
              }`}>
                <PawPrint className="h-4 w-4 text-primary mr-1 inline fill-current" />
                Stories
              </span>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Quick Action Buttons */}
                <div className="hidden sm:flex items-center space-x-2">
                  <Link to="/search">
                    <Button variant="outline" size="sm" data-testid="button-nav-search">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </Link>
                  <Link to="/report">
                    <Button size="sm" data-testid="button-nav-report">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                  </Link>
                </div>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} alt={(user as any)?.firstName || "User"} />
                        <AvatarFallback>
                          {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleLogin} data-testid="button-sign-in">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </Button>
                <Button onClick={handleLogin} data-testid="button-get-started">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
