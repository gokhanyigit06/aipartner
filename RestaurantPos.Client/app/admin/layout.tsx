import React from "react";
import AdminSidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header (Optional placeholder for now) */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Yönetim Paneli
                    </h2>
                    <div className="flex items-center gap-4">
                        {/* Simple user avatar placeholder */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Admin User</span>
                            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                        </div>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
