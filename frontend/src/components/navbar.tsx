"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Package, BarChart3, QrCode, Shield, Coins, ArrowLeftRight,
  LogOut, Menu, ChevronRight, Home, UserCheck, RotateCcw, ShoppingBag
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/types";

const navItems: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  ngo: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: Package },
    { href: "/artisans", label: "Artisans", icon: UserCheck },
    { href: "/scan", label: "Scan Product", icon: QrCode },
  ],
  validator: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/verifications", label: "Verifications", icon: Shield },
    { href: "/tokens", label: "My Tokens", icon: Coins },
  ],
  warehouse: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: Package },
    { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
    { href: "/returns", label: "Returns", icon: RotateCcw },
  ],
  distributor: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: Package },
    { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  ],
  retailer: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: Package },
    { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  ],
  customer: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Browse", icon: Package },
    { href: "/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/scan", label: "Scan Product", icon: QrCode },
  ],
  manufacturer: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: Package },
  ],
};

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = navItems[user.role] || [];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Parampara
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                <item.icon className="h-4 w-4 mr-1.5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex border-white/20 text-gray-300">
            {ROLE_LABELS[user.role]}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 w-9 rounded-full p-0" />}>
              <Avatar className="h-9 w-9 border border-white/20">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-950 border-white/10">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="sm" className="md:hidden" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-gray-950 border-white/10 w-72">
              <nav className="mt-8 flex flex-col gap-1">
                {items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
