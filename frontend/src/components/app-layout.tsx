
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  Home,
  CalendarDays,
  Bot,
  Stethoscope,
  AreaChart,
  PanelLeft,
  User,
  LogOut,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserProfile } from "@/lib/types"

const LeafIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M17.61,3.47A8.75,8.75,0,0,0,3.5,12.39c0,4.24,3,8.44,3.5,9.11a1,1,0,0,0,1.6-.2l1.37-2.84A5.43,5.43,0,0,1,12,14.65a5.76,5.76,0,0,1,3.41-1.12l1.3-1.3A8.75,8.75,0,0,0,17.61,3.47Z" />
  </svg>
);


const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/ai-chat", icon: Bot, label: "Bloom AI" },
  { href: "/consultation", icon: Stethoscope, label: "Consult" },
  { href: "/reports", icon: AreaChart, label: "Reports" },
]

function ProfileButton() {
    const router = useRouter()
    const [localProfile, setLocalProfile] = React.useState<Partial<UserProfile> | null>(null);

    React.useEffect(() => {
        try {
            const profile = JSON.parse(localStorage.getItem('bloom_user_profile') || 'null');
            setLocalProfile(profile);
        } catch (e) {
            // ignore
        }
    }, [])

    const handleLogout = async () => {
        localStorage.removeItem('bloom_user_profile');
        router.push("/")
    }

    const getAvatarName = () => {
        if (localProfile?.name) return localProfile.name;
        if (localProfile?.fullName) return localProfile.fullName;
        if (localProfile?.email) return localProfile.email;
        return 'User';
    }
    
    const name = getAvatarName();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={localProfile?.photoURL || undefined} alt={name}/>
                        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function SideNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card/20 no-print">
        <div className="flex h-16 items-center justify-between px-6 border-b">
            <Link href="/home" className="flex items-center space-x-3">
                <LeafIcon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold font-headline">Bloom</span>
            </Link>
            <ProfileButton />
        </div>
      <nav className="flex flex-col p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/70 transition-all hover:text-foreground hover:bg-accent",
              pathname === item.href && "bg-accent text-primary font-semibold"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-headline">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function MobileNav() {
    const pathname = usePathname()
    return (
        <>
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 md:hidden no-print">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                        >
                            <PanelLeft className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col">
                        <nav className="grid gap-4 text-lg font-medium">
                            <Link
                                href="/home"
                                className="flex items-center gap-3 text-lg font-semibold mb-4"
                            >
                                <LeafIcon className="h-8 w-8 text-primary" />
                                <span className="font-headline">Bloom</span>
                            </Link>
                            {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                                pathname === item.href && "bg-accent text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                 <div className="flex items-center gap-2 text-lg font-semibold">
                    <Link href="/home" className="flex items-center gap-2">
                        <LeafIcon className="h-6 w-6 text-primary" />
                        <span className="sr-only">Bloom</span>
                    </Link>
                </div>
                <ProfileButton />
            </header>
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t z-50 flex justify-around items-center no-print">
                {navItems.slice(0,5).map(item => (
                    <Link href={item.href} key={item.href} className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-md transition-colors w-16",
                        pathname === item.href ? "text-primary" : "text-foreground/60"
                    )}>
                        <item.icon className="h-6 w-6" />
                        <span className="text-xs font-medium text-center">{item.label}</span>
                    </Link>
                ))}
            </div>
        </>
    )
}

function MainLayout({ children }: { children: React.ReactNode }) {
    return (
         <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto mb-16 md:mb-0">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(hsl(var(--secondary))_1px,transparent_1px)] [background-size:16px_16px]"></div>
            {children}
        </main>
    )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
      setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;

    const localProfile = localStorage.getItem('bloom_user_profile');
    if (!localProfile) {
      router.push('/');
    }
  }, [router, isClient]);

  if(!isClient) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
         <div className="flex items-center space-x-4 text-2xl font-semibold">
            <LeafIcon className="h-8 w-8 animate-spin text-primary" />
           <span>Loading...</span>
         </div>
       </div>
     );
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <MobileNav />
        <MainLayout>{children}</MainLayout>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full">
      <SideNav />
      <div className="flex flex-col flex-1">
         <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-lg px-6 md:hidden no-print">
            {/* Kept for potential future use in tablet views */}
         </header>
        <MainLayout>{children}</MainLayout>
      </div>
    </div>
  )
}

    