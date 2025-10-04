import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, PlusCircle, Search } from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
              <span className="text-xl font-bold text-foreground">Paw</span>
              <i className="fas fa-paw text-2xl text-primary mx-2"></i>
              <span className="text-xl font-bold text-foreground">Finder</span>
            </div>
          </Link>
          
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <a className={`text-sm font-medium transition-colors hover:text-foreground ${
                  location === "/" ? "text-foreground" : "text-muted-foreground"
                }`}>
                  Home
                </a>
              </Link>
              <Link href="/search">
                <a className={`text-sm font-medium transition-colors hover:text-foreground ${
                  location.startsWith("/search") ? "text-foreground" : "text-muted-foreground"
                }`}>
                  Search
                </a>
              </Link>
              <Link href="/report">
                <a className={`text-sm font-medium transition-colors hover:text-foreground ${
                  location === "/report" ? "text-foreground" : "text-muted-foreground"
                }`}>
                  Report
                </a>
              </Link>
            </nav>
          )}
          
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Quick Action Buttons */}
                <div className="hidden sm:flex items-center space-x-2">
                  <Link href="/search">
                    <Button variant="outline" size="sm" data-testid="button-nav-search">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </Link>
                  <Link href="/report">
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
                  Sign In
                </Button>
                <Button onClick={handleLogin} data-testid="button-get-started">
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
