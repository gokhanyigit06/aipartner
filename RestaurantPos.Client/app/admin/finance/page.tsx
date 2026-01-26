"use client";

import React, { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    PieChart,
    CalendarIcon
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfitLossReport, ProfitLossReportDto } from "@/lib/api-finance";
import AppHeader from "@/components/layout/AppHeader";

export default function FinanceDashboard() {
    const [report, setReport] = useState<ProfitLossReportDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Date Range: Last 7 Days
    const [dateRange, setDateRange] = useState({
        start: subDays(new Date(), 30),
        end: new Date()
    });

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        // Format dates as YYYY-MM-DD
        const startStr = dateRange.start.toISOString().split('T')[0];
        const endStr = dateRange.end.toISOString().split('T')[0];

        const data = await getProfitLossReport(startStr, endStr);
        setReport(data);
        setLoading(false);
    };

    // Format Helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

    const formatPercent = (val: number) =>
        `%${val.toFixed(1)}`;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                <p className="mt-4 text-slate-500">Finansal veriler analiz ediliyor...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-8 text-center text-red-500">
                Veriler yüklenemedi. Lütfen sunucu bağlantınızı kontrol edin.
            </div>
        );
    }

    // Filter Alerts (Margin < 20%)
    const lowMarginProducts = report.productPerformance
        .filter(p => p.marginPercentage < 20)
        .sort((a, b) => a.marginPercentage - b.marginPercentage);

    return (
        <div className="min-h-screen bg-slate-50/50">

            <div className="container mx-auto p-6 space-y-8 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finansal Genel Bakış</h1>
                        <p className="text-slate-500">
                            İşletmenizin karlılık analizi ve stok performans raporu.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-md border shadow-sm">
                            📅 {format(dateRange.start, 'd MMM', { locale: tr })} - {format(dateRange.end, 'd MMM yyyy', { locale: tr })}
                        </span>
                        <Button onClick={loadReport} variant="outline" size="sm">
                            Yenile
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Toplam Ciro"
                        value={formatCurrency(report.totalRevenue)}
                        icon={<DollarSign className="text-blue-600" />}
                        trend="+12%" // Dummy trend for now
                        description="Geçen aya göre"
                    />
                    <KpiCard
                        title="Maliyet (COGS)"
                        value={formatCurrency(report.totalInfoCost)}
                        icon={<PieChart className="text-orange-600" />}
                        description="Satılan Malın Maliyeti"
                    />
                    <KpiCard
                        title="Net Kâr"
                        value={formatCurrency(report.totalNetProfit)}
                        icon={<TrendingUp className="text-green-600" />}
                        valueColor="text-green-600"
                    />
                    <KpiCard
                        title="Ortalama Marj"
                        value={formatPercent(report.totalMarginPercentage)}
                        icon={report.totalMarginPercentage < 20 ? <TrendingDown className="text-red-500" /> : <TrendingUp className="text-green-500" />}
                        description="Hedef: %30"
                        valueColor={report.totalMarginPercentage < 20 ? "text-red-600" : "text-slate-900"}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Chart */}
                    <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Ciro ve Maliyet Analizi</CardTitle>
                            <CardDescription>
                                Günlük bazda gelir ve gider karşılaştırması
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.dailyStats}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: tr })}
                                        stroke="#94a3b8"
                                        fontSize={12}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickFormatter={(val) => `₺${val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                        labelFormatter={(label) => format(new Date(label), 'd MMMM yyyy', { locale: tr })}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Ciro"
                                        stroke="#22c55e"
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cost"
                                        name="Maliyet"
                                        stroke="#f97316"
                                        fillOpacity={1}
                                        fill="url(#colorCost)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Alerts Table */}
                    <Card className="shadow-sm border-red-100 bg-red-50/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <CardTitle className="text-red-900">Kritik Marj Uyarıları</CardTitle>
                            </div>
                            <CardDescription className="text-red-700/80">
                                %20 kâr marjının altındaki ürünler (Acil Aksiyon)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {lowMarginProducts.length === 0 ? (
                                    <div className="text-sm text-green-600 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Tüm ürünlerin performansı iyi durumda.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lowMarginProducts.slice(0, 5).map(prod => (
                                            <div key={prod.productId} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 truncate">{prod.productName}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Maliyet: {formatCurrency(prod.unitCost)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-bold">
                                                        {formatPercent(prod.marginPercentage)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {lowMarginProducts.length > 5 && (
                                            <p className="text-xs text-center text-red-500 pt-2">
                                                ve {lowMarginProducts.length - 5} ürün daha...
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KpiCard({ title, value, icon, description, trend, valueColor = "text-slate-900" }: any) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-slate-500 mt-1">
                        {trend && <span className="text-green-600 font-medium mr-1">{trend}</span>}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
