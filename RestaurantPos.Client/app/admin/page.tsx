import React from "react";
import { DollarSign, ShoppingBag, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">

            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Panel Özeti</h1>
                <p className="text-slate-500 mt-1">Hoşgeldiniz, işletmenizin anlık durumu.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Günlük Satış"
                    value="₺12,450"
                    change="+15% geçen güne göre"
                    icon={DollarSign}
                    trend="up"
                />
                <StatCard
                    title="Aktif Siparişler"
                    value="8"
                    change="Şu an hazırlanıyor"
                    icon={ShoppingBag}
                    trend="neutral"
                />
                <StatCard
                    title="Masa Doluluk"
                    value="%65"
                    change="12/20 Masa dolu"
                    icon={Users}
                    trend="up"
                />
                <StatCard
                    title="Sistem Durumu"
                    value="Normal"
                    change="Tüm servisler aktif"
                    icon={Activity}
                    trend="up"
                />
            </div>

            {/* Placeholder Charts / Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Saatlik Satış Grafiği</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
                            Grafik Alanı (Recharts entegrasyonu yapılacak)
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Son Hareketler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-slate-700 font-medium">Masa {i + 2} Siparişi</span>
                                    </div>
                                    <span className="text-slate-500">2 dk önce</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Simple Stat Card Component
// Simple Stat Card Component
interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: React.ElementType; // Better than any
    trend: 'up' | 'neutral' | 'down';
}

function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
    return (
        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-800">{value}</div>
                <p className={`text-xs mt-1 ${trend === 'up' ? 'text-green-600' : 'text-slate-500'}`}>
                    {change}
                </p>
            </CardContent>
        </Card>
    );
}
