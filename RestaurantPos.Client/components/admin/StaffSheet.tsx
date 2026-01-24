"use client"

import React, { useState, useEffect } from "react"
import { Save, User, Briefcase, DollarSign, Clock, Calendar, Phone, MapPin, Droplet, FileText } from "lucide-react"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StaffSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editStaff?: any | null
}

const BLOOD_TYPES = [
    { value: 0, label: "Bilinmiyor" },
    { value: 1, label: "A+" },
    { value: 2, label: "A-" },
    { value: 3, label: "B+" },
    { value: 4, label: "B-" },
    { value: 5, label: "AB+" },
    { value: 6, label: "AB-" },
    { value: 7, label: "O+" },
    { value: 8, label: "O-" },
]

const CONTRACT_STATUS = [
    { value: 0, label: "Bekliyor", color: "bg-yellow-100 text-yellow-800" },
    { value: 1, label: "İmzalandı", color: "bg-green-100 text-green-800" },
    { value: 2, label: "Sonlandırıldı", color: "bg-red-100 text-red-800" },
]

const ROLES = [
    { value: 0, label: "Yönetici" },
    { value: 1, label: "Garson" },
    { value: 2, label: "Mutfak" },
    { value: 3, label: "Kasiyer" },
]

export default function StaffSheet({ open, onOpenChange, onSuccess, editStaff }: StaffSheetProps) {
    // Tab 1: Özlük & İletişim
    const [fullName, setFullName] = useState("")
    const [photoUrl, setPhotoUrl] = useState("")
    const [phone, setPhone] = useState("")
    const [address, setAddress] = useState("")
    const [bloodType, setBloodType] = useState(0)
    const [contractStatus, setContractStatus] = useState(0)
    const [startDate, setStartDate] = useState("")

    // Tab 2: Giriş Bilgileri
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [staffNo, setStaffNo] = useState("")
    const [role, setRole] = useState(1)

    // Tab 3: Maaş & Puantaj
    const [netSalary, setNetSalary] = useState("")
    const [sgkPremium, setSgkPremium] = useState("")
    const [weeklyShiftPattern, setWeeklyShiftPattern] = useState("")
    const [timeEntries, setTimeEntries] = useState<any[]>([])

    useEffect(() => {
        if (editStaff && open) {
            // Load existing staff data
            setFullName(editStaff.fullName || "")
            setPhotoUrl(editStaff.photoUrl || "")
            setPhone(editStaff.phone || "")
            setAddress(editStaff.address || "")
            setBloodType(editStaff.bloodType || 0)
            setContractStatus(editStaff.contractStatus || 0)
            setStartDate(editStaff.startDate || "")
            setUsername(editStaff.username || "")
            setStaffNo(editStaff.staffNo || "")
            setRole(editStaff.role || 1)
            setNetSalary(editStaff.netSalary?.toString() || "")
            setSgkPremium(editStaff.sgkPremium?.toString() || "")
            setWeeklyShiftPattern(editStaff.weeklyShiftPattern || "")
            setTimeEntries(editStaff.timeEntries || [])
        } else if (!editStaff && open) {
            resetForm()
        }
    }, [editStaff, open])

    const resetForm = () => {
        setFullName("")
        setPhotoUrl("")
        setPhone("")
        setAddress("")
        setBloodType(0)
        setContractStatus(0)
        setStartDate("")
        setUsername("")
        setPassword("")
        setStaffNo("")
        setRole(1)
        setNetSalary("")
        setSgkPremium("")
        setWeeklyShiftPattern("")
        setTimeEntries([])
    }

    const handleSave = async () => {
        if (!fullName || !username) {
            toast.warning("Lütfen ad soyad ve kullanıcı adını girin.")
            return
        }

        if (!editStaff && !password) {
            toast.warning("Yeni personel için şifre gereklidir.")
            return
        }

        const payload = {
            fullName,
            username,
            password: password || undefined,
            role,
            staffProfile: {
                staffNo,
                bloodType,
                phone,
                address,
                photoUrl: photoUrl || undefined,
                startDate: startDate || undefined,
                contractStatus,
                netSalary: netSalary ? parseFloat(netSalary) : 0,
                sgkPremium: sgkPremium ? parseFloat(sgkPremium) : 0,
                weeklyShiftPattern: weeklyShiftPattern || undefined,
            }
        }

        try {
            // TODO: API call
            toast.info("API entegrasyonu bekleniyor")
            console.log("Staff payload:", payload)

            // onSuccess()
            // onOpenChange(false)
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Bir hata oluştu.")
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "-"
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString))
    }

    const calculateTotalHours = (clockIn: string, clockOut: string) => {
        if (!clockIn || !clockOut) return 0
        const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime()
        return (diff / (1000 * 60 * 60)).toFixed(1)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span className="text-2xl">👤</span>
                        {editStaff ? "Personel Düzenle" : "Yeni Personel İşe Al"}
                    </SheetTitle>
                    <SheetDescription>
                        Kurumsal İK sistemi - Özlük, maaş ve puantaj yönetimi
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="profile" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">👤 Özlük & İletişim</TabsTrigger>
                        <TabsTrigger value="login">🔐 Giriş Bilgileri</TabsTrigger>
                        <TabsTrigger value="payroll">💰 Maaş & Puantaj</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: Özlük & İletişim */}
                    <TabsContent value="profile" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Avatar */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={photoUrl} />
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-2xl">
                                            {fullName.charAt(0) || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="photo">Fotoğraf URL</Label>
                                        <Input
                                            id="photo"
                                            value={photoUrl}
                                            onChange={(e) => setPhotoUrl(e.target.value)}
                                            placeholder="https://example.com/photo.jpg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Ad Soyad *</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Örn: Emre Aksoy"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Telefon</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="0555 123 45 67"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bloodType">Kan Grubu</Label>
                                        <Select value={bloodType.toString()} onValueChange={(val) => setBloodType(parseInt(val))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BLOOD_TYPES.map((bt) => (
                                                    <SelectItem key={bt.value} value={bt.value.toString()}>
                                                        {bt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Adres</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Tam adres"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">İşe Alım Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">İşe Başlama Tarihi</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contractStatus">Sözleşme Durumu</Label>
                                        <Select value={contractStatus.toString()} onValueChange={(val) => setContractStatus(parseInt(val))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CONTRACT_STATUS.map((cs) => (
                                                    <SelectItem key={cs.value} value={cs.value.toString()}>
                                                        {cs.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge className={CONTRACT_STATUS[contractStatus].color}>
                                        {CONTRACT_STATUS[contractStatus].label}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: Giriş Bilgileri */}
                    <TabsContent value="login" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Sistem Giriş Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Kullanıcı Adı *</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="emre.aksoy"
                                        disabled={!!editStaff}
                                    />
                                    {editStaff && (
                                        <p className="text-xs text-muted-foreground">
                                            Kullanıcı adı değiştirilemez
                                        </p>
                                    )}
                                </div>

                                {!editStaff && (
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Şifre *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Güvenli şifre"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="staffNo">Personel No</Label>
                                        <Input
                                            id="staffNo"
                                            value={staffNo}
                                            onChange={(e) => setStaffNo(e.target.value)}
                                            placeholder="PER-001"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Yetki Rolü *</Label>
                                        <Select value={role.toString()} onValueChange={(val) => setRole(parseInt(val))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map((r) => (
                                                    <SelectItem key={r.value} value={r.value.toString()}>
                                                        {r.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: Maaş & Puantaj */}
                    <TabsContent value="payroll" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Bordro Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="netSalary">Net Maaş (₺)</Label>
                                        <Input
                                            id="netSalary"
                                            type="number"
                                            step="0.01"
                                            value={netSalary}
                                            onChange={(e) => setNetSalary(e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Çalışanın eline geçen tutar
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sgkPremium">SGK Primi / Brüt Maliyet (₺)</Label>
                                        <Input
                                            id="sgkPremium"
                                            type="number"
                                            step="0.01"
                                            value={sgkPremium}
                                            onChange={(e) => setSgkPremium(e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Şirkete toplam maliyet
                                        </p>
                                    </div>
                                </div>

                                {netSalary && sgkPremium && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                Toplam Maliyet
                                            </span>
                                            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                                {(parseFloat(netSalary) + parseFloat(sgkPremium)).toFixed(2)} ₺
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="shiftPattern">Haftalık Shift Planı</Label>
                                    <Input
                                        id="shiftPattern"
                                        value={weeklyShiftPattern}
                                        onChange={(e) => setWeeklyShiftPattern(e.target.value)}
                                        placeholder="Pzt-Cum: 09:00-18:00"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Örnek: "Pzt-Cum: 09:00-18:00, Cmt: 10:00-15:00"
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Puantaj Geçmişi */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Bu Ay Puantaj Geçmişi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {timeEntries.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        Henüz puantaj kaydı bulunmuyor
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {timeEntries.map((entry: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-semibold">{formatDate(entry.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                        <span>Giriş: {formatDate(entry.clockIn)}</span>
                                                        {entry.clockOut && (
                                                            <span>Çıkış: {formatDate(entry.clockOut)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">
                                                        {calculateTotalHours(entry.clockIn, entry.clockOut)}h
                                                    </div>
                                                    {!entry.clockOut && (
                                                        <Badge variant="outline" className="text-xs">Aktif</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <SheetFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        {editStaff ? "Güncelle" : "İşe Al"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
