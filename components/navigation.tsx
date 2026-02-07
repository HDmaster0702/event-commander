'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { ShieldAlert, Users, LayoutDashboard, LogOut, Settings, Calendar, BarChart3, Menu, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { RoleBadge } from './role-badge';
import { X } from 'lucide-react';

export function Navigation() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [open, setOpen] = useState(false); // For closing sheet on navigation

    const user = session?.user;

    // Simple check to hide nav on login and invite pages
    if (pathname === '/login' || pathname.startsWith('/invite')) return null;

    const role = user ? (user as any).role : 'User';
    const isActive = user ? (user as any).isActive : true;
    const avatarUrl = user?.image || undefined;

    if (user && isActive === false) {
        signOut({ callbackUrl: '/login' });
        return null;
    }

    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/admin/events', label: (role === 'ADMIN' || role === 'SUPER_ADMIN') ? 'Events' : 'My Events', icon: Calendar },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/logs', label: 'Logs', icon: BarChart3 },
        { href: '/admin/settings', label: 'Settings', icon: Settings, hidden: role !== 'SUPER_ADMIN' },
    ];

    return (
        <nav className="border-b border-neutral-800 bg-neutral-900 sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 lg:px-8 justify-between">
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Mobile Menu Trigger */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden text-neutral-400 hover:text-white hover:bg-neutral-800">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-neutral-900 border-neutral-800 text-neutral-200 w-72 p-0" showCloseButton={false}>
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                                    <div className="flex items-center space-x-2 font-bold text-neutral-100">
                                        <img src="/soldier.png" alt="Event Commander Logo" className="h-8 w-auto object-contain" />
                                        <span>Event Commander</span>
                                    </div>
                                    <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary text-neutral-400 hover:text-white">
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Close</span>
                                    </SheetClose>
                                </div>
                                <div className="flex-1 overflow-auto py-4 px-4">
                                    <div className="flex flex-col space-y-2">
                                        {links.map((link) => {
                                            if (link.hidden) return null;
                                            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                                            return (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setOpen(false)}
                                                    className={cn(
                                                        "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                                        isActive
                                                            ? "bg-blue-500/10 text-blue-500"
                                                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                                    )}
                                                >
                                                    <link.icon className="mr-3 h-5 w-5" />
                                                    {link.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 font-bold text-neutral-100">
                        <img src="/soldier.png" alt="Event Commander Logo" className="h-8 lg:h-10 w-auto object-contain" />
                        <span className="hidden lg:inline">Event Commander</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-4">
                        {links.map((link) => {
                            if (link.hidden) return null;
                            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center text-sm font-medium transition-colors hover:text-blue-500",
                                        isActive ? "text-blue-500" : "text-neutral-400"
                                    )}
                                >
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-4">
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-3 lg:pl-6 lg:border-l lg:border-neutral-800 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className="flex items-center gap-3 bg-neutral-900/50 border border-neutral-800 rounded-full pl-1 pr-1 lg:pr-4 py-1">
                                        <Avatar className="h-8 w-8 border border-neutral-800">
                                            <AvatarImage
                                                src={avatarUrl}
                                                alt={user.name || "User avatar"}
                                            />
                                            <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                                                {user.name?.charAt(0) || user.email?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col text-left hidden lg:flex">
                                            <span className="text-xs font-semibold text-neutral-200 leading-none mb-0.5">{user.name}</span>
                                            <RoleBadge role={role} variant="text" />
                                        </div>
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800 text-neutral-200">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-neutral-800" />
                                <DropdownMenuItem asChild className="focus:bg-neutral-800 focus:text-neutral-100 cursor-pointer">
                                    <Link href="/profile" className="flex items-center">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => signOut()}
                                    className="focus:bg-red-900/30 focus:text-red-400 text-red-400 cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </nav>
    );
}
