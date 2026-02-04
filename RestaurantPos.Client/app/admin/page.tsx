"use client"

import * as React from "react"
import {
    DollarSign,
    Package,
    Users,
    UtensilsCrossed,
    TrendingUp,
    Clock,
    MoreHorizontal
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

// --- Types ---
interface DailySummary {
    totalRevenue: number
    totalOrders: number
    activeTables: number
    bestSellingProducts: BestSellingProduct[]
    hourlySales: DailyHourlySales[]
    recentOrders: RecentOrder[]
}

interface BestSellingProduct {
    productName: string
    quantity: number
    revenue: number
}

interface DailyHourlySales {
    hour: string
    sales: number
}

interface RecentOrder {
    id: string
    table: string
    status: string
    total: number
    createdAt: string
}

// --- Status Map ---
const STATUS_MAP: Record<string, string> = {
    "New": "Yeni",
    "Preparing": "Hazırlanıyor",
    "Ready": "Hazır",
    "Served": "Servis Edildi",
    "Paid": "Tamamlandı",
    "Cancelled": "İptal"
};

const chartConfig = {
    sales: {
        label: "Satış (TL)",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

// --- Components ---

export default function AdminDashboardPage() {
    const [summary, setSummary] = React.useState<DailySummary | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchDailySummary = async () => {
            try {
                const response = await api.get('/reports/daily-summary')
                setSummary(response.data)
            } catch (error) {
                console.error('Failed to fetch daily summary:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDailySummary()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return "Şimdi";
        if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} sa önce`;
        return date.toLocaleDateString('tr-TR');
    }

    const topProduct = summary?.bestSellingProducts[0]

    // Default chart data if empty to show grid
    const chartData = summary?.hourlySales?.length ? summary.hourlySales : [{ hour: "00:00", sales: 0 }];
    const recentOrders = summary?.recentOrders || [];

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Dashboard
                </h1>
                <p className="text-muted-foreground">
                    İşletmenizin anlık performansı ve özet verileri.
                </p>
            </div>

            {/* KPI Cards Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Günlük Ciro"
                    value={loading ? "Yükleniyor..." : formatCurrency(summary?.totalRevenue || 0)}
                    description="Bugünkü toplam gelir"
                    icon={DollarSign}
                    trend="up"
                    gradient="from-blue-500 to-blue-600"
                />
                <KpiCard
                    title="Toplam Sipariş"
                    value={loading ? "..." : String(summary?.totalOrders || 0)}
                    description="Bugün ödenen sipariş sayısı"
                    icon={Package}
                    trend="up"
                    gradient="from-indigo-500 to-purple-600"
                />
                <KpiCard
                    title="Aktif Masalar"
                    value={loading ? "..." : String(summary?.activeTables || 0)}
                    description="Şu anda dolu olan masalar"
                    icon={Users}
                    trend="neutral"
                    gradient="from-orange-400 to-pink-600"
                />
                <KpiCard
                    title="En Çok Satan"
                    value={loading ? "..." : topProduct?.productName || "Veri yok"}
                    description={loading ? "..." : topProduct ? `Bugün ${topProduct.quantity} adet satıldı` : "Henüz satış yok"}
                    icon={UtensilsCrossed}
                    trend="up"
                    gradient="from-emerald-500 to-teal-600"
                />
            </div>

            {/* Main Content: Chart & Table */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Sales Chart */}
                <Card className="col-span-4 border-none shadow-xl bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle>Saatlik Satış Grafiği</CardTitle>
                        <CardDescription>Bugünen ait saatlik ciro dağılımı.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="hour"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value}
                                />
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Bar
                                    dataKey="sales"
                                    radius={[8, 8, 0, 0]}
                                    fill="var(--color-sales)"
                                    fillOpacity={0.8}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Recent Orders Table */}
                <Card className="col-span-3 border-none shadow-xl bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle>Son Siparişler</CardTitle>
                        <CardDescription>Sisteme düşen son 5 sipariş.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">Henüz sipariş yok.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Sipariş No</TableHead>
                                        <TableHead>Masa</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="text-right">Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-xs text-slate-500">
                                                <div>{order.id}</div>
                                                <div className="text-[10px] text-slate-400 font-normal">{formatTimeAgo(order.createdAt)}</div>
                                            </TableCell>
                                            <TableCell>{order.table}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.status === "Paid" ? "default" :
                                                            order.status === "Completed" ? "default" :
                                                                order.status === "New" ? "secondary" :
                                                                    order.status === "Cancelled" ? "destructive" : "outline"
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {STATUS_MAP[order.status] || order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(order.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}

// --- Helper Components ---

function KpiCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    gradient
}: {
    title: string
    value: string
    description: string
    icon: React.ElementType
    trend: 'up' | 'down' | 'neutral'
    gradient: string
}) {
    return (
        <Card className="border-none shadow-lg overflow-hidden relative group hover:-translate-y-1 transition-all duration-300">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon className="w-24 h-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-full bg-gradient-to-br ${gradient} text-white shadow-md`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    {value}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3 text-green-500" /> : null}
                    {trend === 'neutral' ? <Clock className="mr-1 h-3 w-3 text-yellow-500" /> : null}
                    <span className={trend === 'up' ? 'text-green-600 font-medium' : ''}>{description}</span>
                </div>
            </CardContent>
            {/* Decorative gradient background roughly */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/10 pointer-events-none" />
        </Card>
    )
}
