"use client";

import { useEffect, useState } from 'react';
import { AnalyticsResponseDto } from '@/types/analytics';
import MenuEngineeringChart from '@/components/analytics/MenuEngineeringChart';
import HeatmapChart from '@/components/analytics/HeatmapChart';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    Star,
    Clock,
    Calendar,
    BarChart3,
    Loader2
} from 'lucide-react';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // Tenant ID'yi localStorage'dan al (gerçek uygulamada auth context'ten gelecek)
    const tenantId = typeof window !== 'undefined'
        ? localStorage.getItem('tenantId') || '00000000-0000-0000-0000-000000000000'
        : '00000000-0000-0000-0000-000000000000';

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                tenantId,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });

            const response = await fetch(`http://localhost:5001/api/Analytics?${params}`);

            if (!response.ok) {
                throw new Error('Veri yüklenirken hata oluştu');
            }

            const data = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    // Stat Card Component
    const StatCard = ({
        icon: Icon,
        title,
        value,
        subtitle,
        color = 'blue',
        trend
    }: {
        icon: any;
        title: string;
        value: string;
        subtitle?: string;
        color?: string;
        trend?: string;
    }) => {
        const colorClasses = {
            blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
            green: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
            purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
            amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
            red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
            cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400'
        };

        return (
            <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} backdrop-blur-sm rounded-xl border p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                        <p className="text-3xl font-bold text-white mb-1">{value}</p>
                        {subtitle && (
                            <p className="text-gray-400 text-xs">{subtitle}</p>
                        )}
                        {trend && (
                            <div className="flex items-center gap-1 mt-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-emerald-400 font-semibold">{trend}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg bg-gray-800/50`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-300 text-lg font-semibold">Analitik verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 max-w-md">
                    <p className="text-red-400 text-lg font-semibold mb-2">Hata Oluştu</p>
                    <p className="text-gray-300">{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-blue-500" />
                            Gelişmiş Analitik ve İş Zekası
                        </h1>
                        <p className="text-gray-400">
                            Restoran performansınızı detaylı olarak analiz edin
                        </p>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400 mb-1">Bitiş</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                {analytics?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={DollarSign}
                            title="Toplam Gelir"
                            value={`₺${analytics.summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                            color="green"
                        />
                        <StatCard
                            icon={TrendingUp}
                            title="Toplam Kâr"
                            value={`₺${analytics.summary.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                            subtitle={`Ortalama Marj: ${analytics.summary.averageProfitMargin.toFixed(1)}%`}
                            color="emerald"
                        />
                        <StatCard
                            icon={ShoppingCart}
                            title="Toplam Sipariş"
                            value={analytics.summary.totalOrders.toString()}
                            subtitle={`${analytics.summary.totalProductsSold} ürün satıldı`}
                            color="blue"
                        />
                        <StatCard
                            icon={Package}
                            title="En Çok Satan"
                            value={analytics.summary.bestSellingProduct}
                            subtitle={`En Kârlı: ${analytics.summary.mostProfitableProduct}`}
                            color="purple"
                        />
                    </div>
                )}

                {/* Additional Stats Row */}
                {analytics?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            icon={Star}
                            title="En Kârlı Ürün"
                            value={analytics.summary.mostProfitableProduct}
                            color="amber"
                        />
                        <StatCard
                            icon={Clock}
                            title="Yoğun Saat"
                            value={analytics.summary.peakHour}
                            subtitle="En yüksek ciro"
                            color="cyan"
                        />
                        <StatCard
                            icon={Calendar}
                            title="Yoğun Gün"
                            value={analytics.summary.peakDay}
                            subtitle="En yüksek ciro"
                            color="red"
                        />
                    </div>
                )}

                {/* Menu Engineering Chart */}
                {analytics?.menuEngineering && analytics.menuEngineering.length > 0 && (
                    <MenuEngineeringChart data={analytics.menuEngineering} />
                )}

                {/* Heatmap */}
                {analytics?.heatmapData && analytics.heatmapData.length > 0 && (
                    <HeatmapChart data={analytics.heatmapData} />
                )}

                {/* Empty State */}
                {analytics &&
                    analytics.menuEngineering.length === 0 &&
                    analytics.heatmapData.length === 0 && (
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center">
                            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                Seçilen tarih aralığında veri bulunamadı
                            </h3>
                            <p className="text-gray-500">
                                Farklı bir tarih aralığı seçerek tekrar deneyin
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
}
