"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function AppHeader() {
    const router = useRouter();
    const { logout, user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        document.cookie = "auth_token=; path=/; max-age=0";
        document.cookie = "auth_role=; path=/; max-age=0";
        router.push("/login");
    };

    if (!mounted) return null;

    return (
        <header className="w-full h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-50">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                    <span className="font-bold text-xs text-white">R</span>
                </div>
                <span className="font-bold text-slate-800 tracking-tight text-sm hidden sm:inline-block">
                    RestoPOS
                </span>
            </div>

            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-4">
                        {user.role === 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50"
                                onClick={() => router.push("/admin")}
                            >
                                <LayoutDashboard className="w-3 h-3" />
                                <span className="text-xs font-semibold">Admin Panel</span>
                            </Button>
                        )}
                        <div className="text-xs text-slate-500 font-medium">
                            Aktif Rol: <span className="text-orange-600 ml-1 bg-orange-50 px-2 py-0.5 rounded-full">{user.roleName}</span>
                        </div>
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                >
                    <LogOut className="w-3 h-3" />
                    <span className="text-xs font-semibold">Çıkış Yap</span>
                </Button>
            </div>
        </header>
    );
}
