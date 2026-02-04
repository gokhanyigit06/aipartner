"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Package, AlertTriangle, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial, RawMaterial, UnitLabels } from "@/lib/api";

export default function InventoryPage() {
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newUnit, setNewUnit] = useState("0");
    const [newStock, setNewStock] = useState("");
    const [newMinAlert, setNewMinAlert] = useState("");
    const [newCost, setNewCost] = useState("");

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setIsLoading(true);
        const data = await getRawMaterials();
        setMaterials(data);
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!newName || !newStock || !newMinAlert || !newCost) {
            toast.warning("Lütfen tüm alanları doldurun.");
            return;
        }

        const payload = {
            id: editingId || undefined,
            name: newName,
            unit: parseInt(newUnit),
            currentStock: parseFloat(newStock),
            minimumAlertLevel: parseFloat(newMinAlert),
            costPerUnit: parseFloat(newCost)
        };

        let success = false;
        if (editingId) {
            // Update
            success = await updateRawMaterial(editingId, payload);
        } else {
            // Create
            success = await createRawMaterial(payload);
        }

        if (success) {
            toast.success(editingId ? "Hammadde güncellendi!" : "Hammadde eklendi!");
            setIsDialogOpen(false);
            resetForm();
            fetchMaterials();
        } else {
            toast.error("Hata oluştu.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} isimli hammaddeyi silmek istediğinize emin misiniz?`)) return;

        const success = await deleteRawMaterial(id);
        if (success) {
            toast.success("Hammadde silindi.");
            fetchMaterials();
        } else {
            toast.error("Silme işlemi başarısız.");
        }
    };

    const openCreateDialog = () => {
        resetForm();
        setEditingId(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (item: RawMaterial) => {
        setEditingId(item.id);
        setNewName(item.name);
        setNewUnit(item.unit.toString());
        setNewStock(item.currentStock.toString());
        setNewMinAlert(item.minimumAlertLevel.toString());
        setNewCost(item.costPerUnit.toString());
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setNewName("");
        setNewUnit("0");
        setNewStock("");
        setNewMinAlert("");
        setNewCost("");
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Stok & Depo Yönetimi
                    </h1>
                    <p className="text-muted-foreground">
                        Hammadde stoklarını takip edin ve yönetin
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={openCreateDialog}>
                            <PlusCircle className="w-4 h-4" />
                            Yeni Hammadde Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Hammadde Düzenle" : "Yeni Hammadde Tanımla"}</DialogTitle>
                            <DialogDescription>
                                {editingId ? "Mevcut hammadde bilgilerini güncelleyin." : "Stok takibi yapılacak yeni bir malzeme ekleyin."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Adı</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Örn: Kıyma"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unit" className="text-right">Birim</Label>
                                <Select value={newUnit} onValueChange={setNewUnit}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Birim Seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UnitLabels.map((label, index) => (
                                            <SelectItem key={index} value={index.toString()}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">Mevcut Stok</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={newStock}
                                    onChange={e => setNewStock(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="alert" className="text-right">Uyarı Limiti</Label>
                                <Input
                                    id="alert"
                                    type="number"
                                    value={newMinAlert}
                                    onChange={e => setNewMinAlert(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Bu miktarın altına düşünce uyarı ver"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="cost" className="text-right">Birim Maliyet</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    value={newCost}
                                    onChange={e => setNewCost(e.target.value)}
                                    className="col-span-3"
                                    placeholder="₺"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                            <Button onClick={handleSave}>Kaydet</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Stok Listesi</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Hammadde ara..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hammadde Adı</TableHead>
                                <TableHead>Birim</TableHead>
                                <TableHead>Mevcut Stok</TableHead>
                                <TableHead>Birim Maliyet</TableHead>
                                <TableHead>Toplam Değer</TableHead>
                                <TableHead className="text-center">Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : filteredMaterials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Kayıt bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMaterials.map((item) => {
                                    const isLowStock = item.currentStock <= item.minimumAlertLevel;
                                    return (
                                        <TableRow key={item.id} className={isLowStock ? "bg-red-50 dark:bg-red-900/20" : ""}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400" />
                                                    {item.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{UnitLabels[item.unit]}</TableCell>
                                            <TableCell>
                                                <span className={isLowStock ? "text-red-600 font-bold" : ""}>
                                                    {item.currentStock}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.costPerUnit.toFixed(2)} ₺</TableCell>
                                            <TableCell>{(item.currentStock * item.costPerUnit).toFixed(2)} ₺</TableCell>
                                            <TableCell className="text-center">
                                                {isLowStock ? (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Kritik
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Stokta
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openEditDialog(item)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(item.id, item.name)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
