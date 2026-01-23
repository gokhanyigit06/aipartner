"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    UtensilsCrossed,
    ShoppingBag,
    BarChart3,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Panel", href: "/admin" },
    { icon: UtensilsCrossed, label: "Menü Yönetimi", href: "/admin/products" },
    { icon: ShoppingBag, label: "Siparişler", href: "/admin/orders" },
    { icon: BarChart3, label: "Raporlar", href: "/admin/reports" },
    { icon: Settings, label: "Ayarlar", href: "/admin/settings" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800 shadow-2xl">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
                    <span className="font-bold text-lg">R</span>
                </div>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
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
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isActive && "animate-pulse-slow")} />
                            <span className="font-medium">{item.label}</span>

                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-300/50 rounded-l-full blur-sm" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
                <p className="text-xs text-center text-slate-600 mt-4">v1.0.0 Admin Panel</p>
            </div>
        </aside>
    );
}
