"use client"

import React, { useEffect, useState } from "react"
import { PlusCircle, Edit, Trash2, Package, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProductDto } from "@/types/pos"
import { getProducts, uploadProductsExcel } from "@/lib/api"
import ProductSheet from "@/components/admin/ProductSheet"

export default function ProductsPage() {
    const [products, setProducts] = useState<ProductDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editProduct, setEditProduct] = useState<ProductDto | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];

        try {
            const result = await uploadProductsExcel(file);
            if (result && result.count >= 0) {
                toast.success(result.message || "Ürünler başarıyla yüklendi.");
                fetchProducts();
            } else {
                toast.error("Yükleme başarısız oldu.");
            }
        } catch (error) {
            toast.error("Dosya yüklenirken hata oluştu.");
        } finally {
            setIsUploading(false);
            // Verify this reset works if needed, usually we don't need to manually clear generic input unless user retries same file immediately
            e.target.value = "";
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true)
        try {
            const data = await getProducts()
            if (data) {
                setProducts(data)
            } else {
                toast.error("Ürünler yüklenirken hata oluştu")
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            toast.error("Sunucuya bağlanılamadı")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (product: ProductDto) => {
        setEditProduct(product)
        setIsSheetOpen(true)
    }

    const handleNewProduct = () => {
        setEditProduct(null)
        setIsSheetOpen(true)
    }

    const handleSheetClose = (open: boolean) => {
        setIsSheetOpen(open)
        if (!open) {
            setEditProduct(null)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const getStationBadge = (routing: number) => {
        switch (routing) {
            case 0: return <Badge variant="outline" className="bg-orange-50 text-orange-700">👨‍🍳 Mutfak</Badge>
            case 1: return <Badge variant="outline" className="bg-blue-50 text-blue-700">🍹 Bar</Badge>
            case 2: return <Badge variant="outline" className="bg-purple-50 text-purple-700">🔄 Her İkisi</Badge>
            default: return <Badge variant="outline">-</Badge>
        }
    }

    const hasAllergens = (allergens: number) => allergens > 0

    return (
        <div className="space-y-6 p-2 lg:p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Menü Yönetimi
                    </h1>
                    <p className="text-muted-foreground">
                        Ürünlerinizi, fiyatlandırmanızı ve varyasyonlarınızı buradan yönetin
                    </p>
                </div>

                <div className="flex gap-2">
                    <label htmlFor="excel-upload">
                        <Button
                            variant="outline"
                            className="cursor-pointer gap-2 border-green-600 text-green-600 hover:bg-green-50"
                            asChild
                        >
                            <span>
                                <Upload className="w-4 h-4" />
                                Excel Yükle
                            </span>
                        </Button>
                    </label>
                    <input
                        id="excel-upload"
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />

                    <Button
                        onClick={handleNewProduct}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Yeni Ürün Ekle
                    </Button>
                </div>
            </div>

            {/* Product List */}
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
                <CardHeader>
                    <CardTitle>Ürün Listesi</CardTitle>
                    <CardDescription>
                        Sistemdeki tüm ürünler ve detayları
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Henüz ürün eklenmemiş.</p>
                            <Button
                                onClick={handleNewProduct}
                                variant="outline"
                                className="mt-4"
                            >
                                İlk Ürünü Ekle
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-bold">Ürün Adı</TableHead>
                                        <TableHead className="font-bold">Fiyat</TableHead>
                                        <TableHead className="font-bold">İstasyon</TableHead>
                                        <TableHead className="text-center font-bold">Durum</TableHead>
                                        <TableHead className="text-center font-bold">Özellikler</TableHead>
                                        <TableHead className="text-right font-bold">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white font-bold">
                                                            {product.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold">{product.name}</div>
                                                        {product.modifierGroups.length > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {product.modifierGroups.length} seçenek grubu
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {product.discountedPrice ? (
                                                        <>
                                                            <div className="text-sm line-through text-muted-foreground">
                                                                {formatCurrency(product.basePrice)}
                                                            </div>
                                                            <div className="text-lg font-bold text-red-600">
                                                                {formatCurrency(product.discountedPrice)}
                                                            </div>
                                                            <Badge variant="destructive" className="text-xs">
                                                                İndirimli
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <div className="text-lg font-semibold">
                                                            {formatCurrency(product.basePrice)}
                                                        </div>
                                                    )}
                                                    {product.costPrice && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Maliyet: {formatCurrency(product.costPrice)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStationBadge(product.stationRouting)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {product.isActive ? (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Pasif
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {hasAllergens(product.allergens) && (
                                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                                            ⚠️ Alerjen
                                                        </Badge>
                                                    )}
                                                    {product.printerIds && (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                            🖨️ Yazıcı
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        onClick={() => handleEdit(product)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Product Sheet */}
            <ProductSheet
                open={isSheetOpen}
                onOpenChange={handleSheetClose}
                onSuccess={fetchProducts}
                editProduct={editProduct}
            />
        </div>
    )
}
