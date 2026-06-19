import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, ClipboardList, MessageSquare, Wallet, LogOut, Search, Menu, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

const NAV_ITEMS = [
  { name: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  { name: "طلبات مزودي الخدمة", href: "/providers", icon: Users },
  { name: "الخدمات", href: "/services", icon: Layers },
  { name: "الطلبات والعروض", href: "/requests", icon: ClipboardList },
  { name: "العمولات والمحفظة", href: "/commission", icon: Wallet },
  { name: "رسائل التواصل", href: "/messages", icon: MessageSquare },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
  };

  const NavLinks = ({ className, onItemClick }: { className?: string, onItemClick?: () => void }) => (
    <nav className={cn("flex flex-col gap-2 p-4", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={onItemClick}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans md:flex-row">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 border-l border-border bg-card p-0">
              <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
              <div className="flex h-16 items-center border-b border-border px-6">
                <div className="flex items-center gap-2">
                  <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="خدمة" className="h-8 w-8" />
                  <span className="text-xl font-bold tracking-tight text-primary">لوحة خدمة</span>
                </div>
              </div>
              <NavLinks onItemClick={() => {}} />
              <div className="absolute bottom-4 left-4 right-4">
                <Button variant="outline" className="w-full justify-start gap-2 border-border" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="خدمة" className="h-6 w-6" />
            <span className="text-lg font-bold text-foreground">خدمة</span>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-border bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
            <div className="rounded-md bg-primary/10 p-1.5">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="خدمة" className="h-7 w-7" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">خدمة <span className="text-primary text-sm font-medium align-top">أدمن</span></span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <NavLinks />
        </div>
        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        {/* Topbar Desktop */}
        <header className="hidden h-16 items-center justify-between border-b border-border bg-background px-8 md:flex">
          <div className="flex flex-1 items-center">
            {/* Can put breadcrumbs or search here */}
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="بحث في لوحة التحكم..." 
                className="w-full bg-secondary border-none pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-primary h-9 rounded-full text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-primary">
              أد
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}