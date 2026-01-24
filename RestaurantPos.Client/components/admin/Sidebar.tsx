"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    UtensilsCrossed,
    ShoppingBag,
    FileText,
    Settings,
    LogOut,
    Armchair,
    Laptop,
    ChefHat,
    Wine,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const menuItems = [
    { icon: LayoutDashboard, label: "Panel", href: "/admin" },
    { icon: UtensilsCrossed, label: "Menü Yönetimi", href: "/admin/products" },
    { icon: Armchair, label: "Masa Yönetimi", href: "/admin/tables" },
    { icon: ShoppingBag, label: "Siparişler", href: "/admin/orders" },
    { icon: Users, label: "Personel & Prim", href: "/admin/staff" },
    { icon: FileText, label: "Finansal Raporlar", href: "/admin/reports" },
    { icon: Settings, label: "Ayarlar", href: "/admin/settings" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        // 1. Clear Store
        logout();

        // 2. Clear Cookies
        document.cookie = "auth_token=; path=/; max-age=0";
        document.cookie = "auth_role=; path=/; max-age=0";

        // 3. Redirect
        router.push("/login");
    };

    return (
        <aside className="w-64 bg-white flex flex-col h-screen border-r border-slate-200 shadow-sm z-20">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center mr-3 shadow-md shadow-orange-500/20">
                    <span className="font-bold text-lg text-white">R</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">
                    RestoPOS
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative font-medium",
                                isActive
                                    ? "bg-orange-50 text-orange-600"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "text-orange-600" : "text-slate-400 group-hover:text-slate-600")} />
                            <span>{item.label}</span>

                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}

                <div className="my-6 mx-3 border-t border-slate-100" />

                <div className="px-3 mb-2">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Operasyon
                    </p>

                    <Link
                        href="/"
                        target="_blank"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-green-700 hover:bg-green-50 transition-all font-medium group"
                    >
                        <Laptop className="w-5 h-5 text-slate-400 group-hover:text-green-600" />
                        <span>POS Ekranı</span>
                    </Link>

                    <Link
                        href="/kitchen"
                        target="_blank"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-orange-700 hover:bg-orange-50 transition-all font-medium group"
                    >
                        <ChefHat className="w-5 h-5 text-slate-400 group-hover:text-orange-600" />
                        <span>Mutfak (KDS)</span>
                    </Link>

                    <Link
                        href="/bar"
                        target="_blank"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-all font-medium group"
                    >
                        <Wine className="w-5 h-5 text-slate-400 group-hover:text-sky-600" />
                        <span>Bar Ekranı</span>
                    </Link>
                </div>
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
                >
                    <LogOut className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
                <p className="text-xs text-center text-slate-400 mt-4 font-mono">v1.0.0 Admin Panel</p>
            </div>
        </aside>
    );
}
