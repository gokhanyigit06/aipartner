"use client"

import * as React from "react"
import { Users, DollarSign, Clock, TrendingUp, UserPlus, Edit2, Briefcase } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import StaffSheet from "@/components/admin/StaffSheet"

interface StaffAnalytics {
    userId: string
    username: string
    fullName: string
    role: string
    monthlySalary: number
    commissionRate: number
    totalWorkingHours: number
    totalOrders: number
    totalSales: number
    commissionEarned: number
}

export default function StaffPage() {
    const [staff, setStaff] = React.useState<StaffAnalytics[]>([])
    const [loading, setLoading] = React.useState(true)
    const [sheetOpen, setSheetOpen] = React.useState(false)
    const [selectedStaff, setSelectedStaff] = React.useState<any | null>(null)

    React.useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff/analytics')
            setStaff(response.data)
        } catch (error) {
            console.error('Failed to fetch staff:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNewStaff = () => {
        setSelectedStaff(null)
        setSheetOpen(true)
    }

    const handleEditStaff = (staffMember: StaffAnalytics) => {
        setSelectedStaff(staffMember)
        setSheetOpen(true)
    }

    const handleSheetClose = (open: boolean) => {
        setSheetOpen(open)
        if (!open) {
            setSelectedStaff(null)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            case 'Waiter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            case 'Kitchen': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            case 'Cashier': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'Admin': return 'Yönetici'
            case 'Waiter': return 'Garson'
            case 'Kitchen': return 'Mutfak'
            case 'Cashier': return 'Kasiyer'
            default: return role
        }
    }

    const totalSalary = staff.reduce((sum, s) => sum + s.monthlySalary, 0)
    const totalCommission = staff.reduce((sum, s) => sum + s.commissionEarned, 0)
    const totalHours = staff.reduce((sum, s) => sum + s.totalWorkingHours, 0)

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                İnsan Kaynakları & Bordro
                            </h1>
                            <p className="text-muted-foreground">
                                Personel özlük, maaş ve puantaj yönetimi
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleNewStaff}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Yeni Personel İşe Al
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Toplam Maaş Gideri
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {formatCurrency(totalSalary)}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Aylık sabit maaşlar
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                            Toplam Prim
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {formatCurrency(totalCommission)}
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Kazanılan primler
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Toplam Çalışma
                        </CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {totalHours.toFixed(1)} saat
                        </div>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Tüm personel toplamı
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Table */}
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
                <CardHeader>
                    <CardTitle>Personel Listesi</CardTitle>
                    <CardDescription>Tüm çalışanların özlük, performans ve bordro bilgileri</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Henüz personel kaydı bulunmuyor.</p>
                            <Button
                                onClick={handleNewStaff}
                                variant="outline"
                                className="mt-4"
                            >
                                İlk Personeli İşe Al
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-bold">Personel</TableHead>
                                        <TableHead className="font-bold">Rol</TableHead>
                                        <TableHead className="text-right font-bold">Aylık Maaş</TableHead>
                                        <TableHead className="text-center font-bold">Toplam Sipariş</TableHead>
                                        <TableHead className="text-right font-bold">Hakedilen Prim</TableHead>
                                        <TableHead className="text-center font-bold">Çalışma Saati</TableHead>
                                        <TableHead className="text-center font-bold">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staff.map((member) => (
                                        <TableRow
                                            key={member.userId}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.fullName}`} />
                                                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-600 text-white font-bold">
                                                            {member.fullName.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-semibold">{member.fullName}</div>
                                                        <div className="text-xs text-muted-foreground">@{member.username}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleBadgeColor(member.role)}>
                                                    {getRoleLabel(member.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(member.monthlySalary)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-sm font-semibold">
                                                    {member.totalOrders}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-bold text-green-700 dark:text-green-400">
                                                    {formatCurrency(member.commissionEarned)}
                                                </span>
                                                <div className="text-xs text-muted-foreground">
                                                    %{member.commissionRate} prim oranı
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Clock className="h-4 w-4 text-orange-600" />
                                                    <span className="font-semibold">{member.totalWorkingHours.toFixed(1)}h</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    onClick={() => handleEditStaff(member)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Staff Sheet */}
            <StaffSheet
                open={sheetOpen}
                onOpenChange={handleSheetClose}
                onSuccess={fetchStaff}
                editStaff={selectedStaff}
            />
        </div>
    )
}
