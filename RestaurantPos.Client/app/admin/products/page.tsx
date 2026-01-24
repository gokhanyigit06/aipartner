"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductDto, ModifierGroupDto, ModifierDto } from "@/types/pos";
import { getProducts, createProduct } from "@/lib/api";

export default function ProductsPage() {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Form States
    const [productName, setProductName] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [preparationStation, setPreparationStation] = useState(0);
    const [modifierGroups, setModifierGroups] = useState<ModifierGroupDto[]>([]);

    // Fetch Products on Mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getProducts();
            if (data) {
                setProducts(data);
            } else {
                toast.error("Ürünler yüklenirken hata oluştu");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Sunucuya bağlanılamadı");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Modifier Group Helpers ---

    const addModifierGroup = () => {
        const newGroup: ModifierGroupDto = {
            id: crypto.randomUUID(),
            name: "",
            selectionType: 0, // 0 = Single, 1 = Multiple
            minSelection: 1,
            maxSelection: 1,
            modifiers: []
        };
        setModifierGroups([...modifierGroups, newGroup]);
    };

    const removeModifierGroup = (id: string) => {
        setModifierGroups(modifierGroups.filter(g => g.id !== id));
    };

    const updateModifierGroup = (id: string, field: keyof ModifierGroupDto, value: any) => {
        setModifierGroups(modifierGroups.map(g =>
            g.id === id ? { ...g, [field]: value } : g
        ));
    };

    // --- Modifier Helpers ---

    const addModifier = (groupId: string) => {
        const newModifier: ModifierDto = {
            id: crypto.randomUUID(),
            name: "",
            priceAdjustment: 0
        };

        setModifierGroups(modifierGroups.map(group => {
            if (group.id === groupId) {
                return { ...group, modifiers: [...group.modifiers, newModifier] };
            }
            return group;
        }));
    };

    const removeModifier = (groupId: string, modifierId: string) => {
        setModifierGroups(modifierGroups.map(group => {
            if (group.id === groupId) {
                return { ...group, modifiers: group.modifiers.filter(m => m.id !== modifierId) };
            }
            return group;
        }));
    };

    const updateModifier = (groupId: string, modifierId: string, field: keyof ModifierDto, value: any) => {
        setModifierGroups(modifierGroups.map(group => {
            if (group.id === groupId) {
                const updatedModifiers = group.modifiers.map(m =>
                    m.id === modifierId ? { ...m, [field]: value } : m
                );
                return { ...group, modifiers: updatedModifiers };
            }
            return group;
        }));
    };

    // --- Save Product ---

    const handleSaveProduct = async () => {
        if (!productName || !productPrice) {
            toast.warning("Lütfen ürün adı ve fiyatını girin.");
            return;
        }

        const payload = {
            // Temporary IDs for testing as requested
            categoryId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            tenantId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            name: productName,
            basePrice: parseFloat(productPrice),
            preparationStation: preparationStation,
            modifierGroups: modifierGroups
        };

        try {
            const success = await createProduct(payload);

            if (success) {
                toast.success("Ürün ve varyasyonlar başarıyla kaydedildi!");
                setIsSheetOpen(false);
                // Reset Form
                setProductName("");
                setProductPrice("");
                setPreparationStation(0);
                setModifierGroups([]);
                // Refresh List
                fetchProducts();
            } else {
                toast.error("Kaydetme başarısız oldu.");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Bir hata oluştu.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Menü Yönetimi</h1>
                    <p className="text-slate-500">Ürünlerinizi, kategorilerinizi ve varyasyonlarınızı buradan yönetin.</p>
                </div>

                {/* Add New Product Sheet Trigger */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                            <PlusCircle className="w-4 h-4" />
                            Yeni Ürün Ekle
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-2xl bg-slate-50 overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Yeni Ürün & Menü Oluşturucu</SheetTitle>
                            <SheetDescription>
                                Ürün detaylarını ve varyasyon gruplarını buradan yönetebilirsiniz.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-6 py-6">

                            {/* Product Basic Info */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold">Temel Bilgiler</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Ürün Adı</Label>
                                        <Input
                                            id="name"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="Örn: Karışık Pizza"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Fiyat (₺)</Label>
                                        <Input
                                            id="price"
                                            value={productPrice}
                                            onChange={(e) => setProductPrice(e.target.value)}
                                            type="number"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Hazırlık İstasyonu</Label>
                                        <Select
                                            value={preparationStation.toString()}
                                            onValueChange={(val) => setPreparationStation(parseInt(val))}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="İstasyon Seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">👨‍🍳 Mutfak (Yemek)</SelectItem>
                                                <SelectItem value="1">🍹 Bar (İçecek)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Modifier Groups Builder */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-800">Seçenek Grupları</h3>
                                    <Button onClick={addModifierGroup} variant="outline" size="sm" className="border-dashed border-2 border-slate-300 hover:border-green-500 hover:text-green-600">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Yeni Seçenek Grubu Ekle
                                    </Button>
                                </div>

                                {modifierGroups.length === 0 && (
                                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                                        Henüz seçenek grubu eklenmedi. (Örn: Porsiyon, Ekstra Malzeme)
                                    </div>
                                )}

                                {modifierGroups.map((group, index) => (
                                    <Card key={group.id} className="relative border-slate-300 shadow-sm">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                            onClick={() => removeModifierGroup(group.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>

                                        <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100 rounded-t-lg">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Grup Adı</Label>
                                                    <Input
                                                        value={group.name}
                                                        onChange={(e) => updateModifierGroup(group.id, 'name', e.target.value)}
                                                        placeholder="Örn: Porsiyon Seçimi"
                                                        className="h-8 bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Seçim Tipi</Label>
                                                    <Select
                                                        value={group.selectionType.toString()}
                                                        onValueChange={(val) => updateModifierGroup(group.id, 'selectionType', parseInt(val))}
                                                    >
                                                        <SelectTrigger className="h-8 bg-white">
                                                            <SelectValue placeholder="Seçim Tipi" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="0">Tekli Seçim (Radio)</SelectItem>
                                                            <SelectItem value="1">Çoklu Seçim (Checkbox)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-4 space-y-4">
                                            {/* Modifiers List */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold uppercase text-slate-400">Seçenekler</Label>
                                                    <Button
                                                        onClick={() => addModifier(group.id)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Seçenek Ekle
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {group.modifiers.map((modifier) => (
                                                        <div key={modifier.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                                                            <Input
                                                                className="h-8 flex-1 bg-white"
                                                                placeholder="Seçenek Adı (Örn: 1.5 Porsiyon)"
                                                                value={modifier.name}
                                                                onChange={(e) => updateModifier(group.id, modifier.id, 'name', e.target.value)}
                                                            />
                                                            <div className="relative w-24">
                                                                <span className="absolute left-2 top-1.5 text-xs text-slate-400">₺</span>
                                                                <Input
                                                                    className="h-8 pl-5 bg-white"
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={modifier.priceAdjustment}
                                                                    onChange={(e) => updateModifier(group.id, modifier.id, 'priceAdjustment', parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                                onClick={() => removeModifier(group.id, modifier.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {group.modifiers.length === 0 && (
                                                        <div className="text-xs text-slate-400 italic text-center py-2">
                                                            Bu gruba henüz seçenek eklenmedi.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <SheetFooter className="pb-10 sm:pb-0">
                            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>İptal</Button>
                            <Button onClick={handleSaveProduct} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Save className="w-4 h-4" />
                                Kaydet ve Yayınla
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-200/50">
                    <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Ürün Listesi</TabsTrigger>
                    <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Kategoriler</TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Seçenekler</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Ürünler</CardTitle>
                            <CardDescription>
                                Sistemdeki mevcut ürünlerin listesi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Yükleniyor...
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[300px]">Ürün Adı</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead>Fiyat</TableHead>
                                            <TableHead className="text-right">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                                    Henüz ürün eklenmemiş.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            products.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell className="text-slate-500">Genel</TableCell>
                                                    <TableCell>{product.basePrice} ₺</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="mt-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Kategoriler</CardTitle>
                            <CardDescription>
                                Ürünlerinizi gruplayacağınız kategoriler.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                <p className="text-slate-400">Kategori listesi buraya gelecek</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced" className="mt-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Gelişmiş Seçenekler</CardTitle>
                            <CardDescription>
                                Varyasyon grupları ve ekstra seçenekler.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                <p className="text-slate-400">Varyasyon yönetimi buraya gelecek</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
