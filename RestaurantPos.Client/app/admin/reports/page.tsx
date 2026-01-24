"use client"

import * as React from "react"
import { FileText, Download, Calendar, TrendingUp, DollarSign } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface DailyReport {
    date: string
    totalOrders: number
    cashPayments: number
    cardPayments: number
    totalRevenue: number
}

export default function ReportsPage() {
    const [reports, setReports] = React.useState<DailyReport[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await api.get('/reports/z-report')
                setReports(response.data)
            } catch (error) {
                console.error('Failed to fetch Z-report:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date)
    }

    const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalOrders = reports.reduce((sum, r) => sum + r.totalOrders, 0)
    const totalCash = reports.reduce((sum, r) => sum + r.cashPayments, 0)
    const totalCard = reports.reduce((sum, r) => sum + r.cardPayments, 0)

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            Finansal Raporlar
                        </h1>
                        <p className="text-muted-foreground">
                            Günlük ciro ve ödeme detayları (Z-Raporu)
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Toplam Ciro
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {loading ? "..." : formatCurrency(totalRevenue)}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Son 30 gün
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                            Nakit Ödemeler
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {loading ? "..." : formatCurrency(totalCash)}
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {totalRevenue > 0 ? `${((totalCash / totalRevenue) * 100).toFixed(1)}% oranında` : "0%"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Kart Ödemeleri
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {loading ? "..." : formatCurrency(totalCard)}
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                            {totalRevenue > 0 ? `${((totalCard / totalRevenue) * 100).toFixed(1)}% oranında` : "0%"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Toplam Sipariş
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {loading ? "..." : totalOrders}
                        </div>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Ödenen siparişler
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Reports Table */}
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Günlük Detay Raporu</CardTitle>
                            <CardDescription>Tarih bazında ciro ve ödeme dağılımı</CardDescription>
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Excel İndir
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Henüz rapor verisi bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-bold">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Tarih
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center font-bold">Sipariş Sayısı</TableHead>
                                        <TableHead className="text-right font-bold">Nakit</TableHead>
                                        <TableHead className="text-right font-bold">Kart</TableHead>
                                        <TableHead className="text-right font-bold">Toplam Ciro</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((report, index) => (
                                        <TableRow
                                            key={index}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-medium">
                                                {formatDate(report.date)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-sm font-semibold">
                                                    {report.totalOrders}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-700 dark:text-green-400">
                                                {formatCurrency(report.cashPayments)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-purple-700 dark:text-purple-400">
                                                {formatCurrency(report.cardPayments)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {formatCurrency(report.totalRevenue)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
