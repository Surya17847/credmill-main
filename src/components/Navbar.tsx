import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, ChevronDown, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
        else setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Signed-out: toggle between Home and Login/Signup
  // Signed-in: Dashboard, Explainability, About dropdown, theme toggle, profile dropdown
  const isAuthPage = location.pathname === '/auth';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="rounded-lg">
            <img src="logo.ico" alt="CredMill" className="h-8" />
          </div>
          <span className="text-xl font-bold">CredMill</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {!user ? (
            <>
              {isAuthPage ? (
                <Link to="/">
                  <Button variant={location.pathname === '/' ? "secondary" : "ghost"} className="font-medium">
                    Home
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button className="font-medium">Sign Up / Login</Button>
                </Link>
              )}
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link to="/dashboard">
                <Button variant={location.pathname === '/dashboard' ? "secondary" : "ghost"} className="font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link to="/explainability">
                <Button variant={location.pathname === '/explainability' ? "secondary" : "ghost"} className="font-medium">
                  Explainability
                </Button>
              </Link>

              {/* About Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 font-medium">
                    <Info className="h-4 w-4" />
                    About
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    Website
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/evaluation')}>
                    Model Performance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/fairness')}>
                    Fairness Audit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 ml-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium max-w-[120px] truncate">{displayName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-4 mt-8">
              {!user ? (
                <>
                  {isAuthPage ? (
                    <Link to="/" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start font-medium">Home</Button>
                    </Link>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Sign Up / Login</Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{displayName}</span>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant={location.pathname === '/dashboard' ? "secondary" : "ghost"} className="w-full justify-start font-medium">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/explainability" onClick={() => setIsOpen(false)}>
                    <Button variant={location.pathname === '/explainability' ? "secondary" : "ghost"} className="w-full justify-start font-medium">
                      Explainability
                    </Button>
                  </Link>
                  <Link to="/" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Website</Button>
                  </Link>
                  <Link to="/evaluation" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Model Performance</Button>
                  </Link>
                  <Link to="/fairness" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start font-medium">Fairness Audit</Button>
                  </Link>
                  <Button variant="outline" onClick={() => { handleLogout(); setIsOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">Toggle theme</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
