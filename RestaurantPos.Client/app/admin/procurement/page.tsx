"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    ShoppingCart,
    Truck,
    PackageCheck,
    AlertCircle,
    Plus,
    MoreHorizontal,
    CheckCircle,
    FileText,
    ArrowRight
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ProcurementApi, PurchaseOrder, Supplier, SuggestedOrderDto } from "@/lib/api-procurement";

export default function ProcurementPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Satın Alma ve Tedarik</h1>
                <p className="text-slate-500">Akıllı stok takibi ve tedarikçi yönetimi</p>
            </div>

            {/* Smart Suggestions Section */}
            <SmartSuggestionsSection />

            {/* Main Content Tabs */}
            <Tabs defaultValue="orders" className="space-y-6">
                <TabsList className="bg-white border">
                    <TabsTrigger value="orders" className="gap-2">
                        <FileText className="w-4 h-4" /> Satın Alma Emirleri
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="gap-2">
                        <Truck className="w-4 h-4" /> Tedarikçiler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                    <PurchaseOrderList />
                </TabsContent>

                <TabsContent value="suppliers">
                    <SupplierList />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- Sub-Component: Smart Suggestions ---
function SmartSuggestionsSection() {
    const [suggestions, setSuggestions] = useState<SuggestedOrderDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const data = await ProcurementApi.getSuggestions();
            setSuggestions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-32 bg-slate-100 animate-pulse rounded-xl" />;
    if (suggestions.length === 0) return null;

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-orange-900 text-lg">Sistem Önerileri</CardTitle>
                </div>
                <CardDescription className="text-orange-800/80">
                    Kritik stok seviyesinin altına düşen {suggestions.length} hammadde tespit edildi.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((item) => (
                        <div key={item.rawMaterialId} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-slate-900">{item.rawMaterialName}</h4>
                                    <p className="text-xs text-red-500 font-medium">Stok: {item.currentStock} {item.unit} (Min: {item.minimumStockLevel})</p>
                                </div>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    Acil
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                <span className="text-sm font-bold text-slate-700">
                                    Öneri: {item.suggestedQuantity} {item.unit}
                                </span>
                                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 hover:bg-orange-50 hover:text-orange-600">
                                    Sipariş Oluştur <ArrowRight className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// --- Sub-Component: Purchase Order List ---
function PurchaseOrderList() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [ordersData, suppliersData] = await Promise.all([
            ProcurementApi.getOrders(),
            ProcurementApi.getSuppliers()
        ]);
        setOrders(ordersData);
        setSuppliers(suppliersData);
    };

    const handleStatusChange = async (id: string, status: number) => {
        try {
            await ProcurementApi.updateStatus(id, status);
            toast.success("Sipariş durumu güncellendi");
            loadData(); // Refresh
        } catch (error) {
            toast.error("Hata oluştu");
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <Badge variant="secondary">Taslak</Badge>;
            case 1: return <Badge className="bg-blue-500 hover:bg-blue-600">Onaylandı</Badge>;
            case 2: return <Badge className="bg-green-500 hover:bg-green-600">Teslim Alındı</Badge>;
            case 3: return <Badge variant="destructive">İptal</Badge>;
            default: return <Badge>Bilinmiyor</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Satın Alma Emirleri</CardTitle>
                    <CardDescription>Tüm satın alma geçmişi ve aktif siparişler</CardDescription>
                </div>
                <CreateOrderDialog suppliers={suppliers} onSuccess={loadData} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sipariş No</TableHead>
                            <TableHead>Tedarikçi</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Tutar</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">Kayıt bulunamadı</TableCell>
                            </TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.orderNumber}</TableCell>
                                    <TableCell>{po.supplier?.name || "-"}</TableCell>
                                    <TableCell>{format(new Date(po.expectedDate), 'd MMM yyyy', { locale: tr })}</TableCell>
                                    <TableCell>{po.totalAmount} ₺</TableCell>
                                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleStatusChange(po.id, 0)}>
                                                    Taslak Yap
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(po.id, 1)}>
                                                    Onayla
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(po.id, 2)} className="text-green-600 font-medium">
                                                    <PackageCheck className="w-4 h-4 mr-2" />
                                                    Teslim Al (Stok Girişi)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(po.id, 3)} className="text-red-600">
                                                    İptal Et
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SupplierList() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    useEffect(() => {
        ProcurementApi.getSuppliers().then(setSuppliers);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simplified Logic: Add Supplier
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const contact = (form.elements.namedItem('contact') as HTMLInputElement).value;

        await ProcurementApi.createSupplier({ name, contactInfo: contact, leadTimeDays: 3 });
        toast.success("Tedarikçi eklendi");
        ProcurementApi.getSuppliers().then(setSuppliers);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kayıtlı Tedarikçiler</CardTitle>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Yeni Tedarikçi</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Yeni Tedarikçi Ekle</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Firma Adı</Label>
                                <Input name="name" required placeholder="Örn: Metro Grossmarket" />
                            </div>
                            <div className="space-y-2">
                                <Label>İletişim</Label>
                                <Input name="contact" placeholder="Tel / Email" />
                            </div>
                            <Button type="submit" className="w-full">Kaydet</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Firma Adı</TableHead>
                            <TableHead>İletişim</TableHead>
                            <TableHead>Vade (Gün)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.contactInfo}</TableCell>
                                <TableCell>{s.leadTimeDays}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function CreateOrderDialog({ suppliers, onSuccess }: { suppliers: Supplier[], onSuccess: () => void }) {
    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // DEMO: Create a dummy order for now, proper implementation requires product selection
        const form = e.target as HTMLFormElement;
        const supplierId = (form.elements.namedItem('supplierId') as HTMLSelectElement).value;

        await ProcurementApi.createOrder({
            supplierId,
            orderNumber: "PO-" + Math.floor(Math.random() * 10000),
            expectedDate: new Date().toISOString(),
            totalAmount: 0,
            items: [] // In real app, we add items here
        });

        toast.success("Sipariş taslağı oluşturuldu");
        setOpen(false);
        onSuccess();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Yeni Sipariş</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Satın Alma Emri Oluştur</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tedarikçi Seç</Label>
                        <select name="supplierId" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full">Oluştur</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
