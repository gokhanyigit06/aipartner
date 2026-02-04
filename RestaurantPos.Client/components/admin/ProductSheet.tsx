"use client"

import React, { useState, useEffect } from "react"
import { Save, Plus, X, Trash2, AlertCircle } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductDto, ModifierGroupDto, ModifierDto, StationRouting, AllergenType, RecipeItemDto, CategoryDto } from "@/types/pos"
import { createProduct, updateProduct, getRawMaterials, RawMaterial, UnitLabels, addRecipeItem, deleteRecipeItem, getCategories } from "@/lib/api"

interface ProductSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editProduct?: ProductDto | null
}

const ALLERGEN_OPTIONS = [
    { value: AllergenType.Gluten, label: "Gluten" },
    { value: AllergenType.Dairy, label: "Süt Ürünleri" },
    { value: AllergenType.Nuts, label: "Fındık/Fıstık" },
    { value: AllergenType.Eggs, label: "Yumurta" },
    { value: AllergenType.Fish, label: "Balık" },
    { value: AllergenType.Shellfish, label: "Kabuklu Deniz Ürünleri" },
    { value: AllergenType.Soy, label: "Soya" },
    { value: AllergenType.Sesame, label: "Susam" },
]

export default function ProductSheet({ open, onOpenChange, onSuccess, editProduct }: ProductSheetProps) {
    // Tab 1: Genel Bilgiler
    const [productName, setProductName] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [isActive, setIsActive] = useState(true)

    // Tab 2: Finans
    const [basePrice, setBasePrice] = useState("")
    const [costPrice, setCostPrice] = useState("")
    const [discountedPrice, setDiscountedPrice] = useState("")

    // Tab 3: Operasyon
    const [allergens, setAllergens] = useState<number>(0)
    const [stationRouting, setStationRouting] = useState<number>(StationRouting.KitchenOnly)
    const [printerIds, setPrinterIds] = useState("")

    // Modifier Groups
    const [modifierGroups, setModifierGroups] = useState<ModifierGroupDto[]>([])

    // Recipe Tab
    const [recipeItems, setRecipeItems] = useState<RecipeItemDto[]>([])
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
    const [selectedMaterialId, setSelectedMaterialId] = useState("")
    const [recipeAmount, setRecipeAmount] = useState("")

    // Categories
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

    // Load product data when editing
    useEffect(() => {
        if (open) {
            fetchCategories()
        }

        if (editProduct && open) {
            setProductName(editProduct.name)
            setImageUrl(editProduct.imageUrl || "")
            setIsActive(editProduct.isActive)
            setBasePrice(editProduct.basePrice.toString())
            setCostPrice(editProduct.costPrice?.toString() || "")
            setDiscountedPrice(editProduct.discountedPrice?.toString() || "")
            setAllergens(editProduct.allergens || 0)
            setStationRouting(editProduct.stationRouting || StationRouting.KitchenOnly)
            setPrinterIds(editProduct.printerIds || "")
            setStationRouting(editProduct.stationRouting || StationRouting.KitchenOnly)
            setPrinterIds(editProduct.printerIds || "")
            setModifierGroups(editProduct.modifierGroups || [])
            setRecipeItems(editProduct.recipeItems || [])
            setSelectedCategoryId(editProduct.categoryId || "")

            // Fetch materials if editing
            fetchMaterials()
        } else if (!editProduct && open) {
            resetForm()
        }
    }, [editProduct, open])

    const resetForm = () => {
        setProductName("")
        setImageUrl("")
        setIsActive(true)
        setBasePrice("")
        setCostPrice("")
        setDiscountedPrice("")
        setAllergens(0)
        setStationRouting(StationRouting.KitchenOnly)
        setPrinterIds("")
        setPrinterIds("")
        setModifierGroups([])
        setRecipeItems([])
        setSelectedMaterialId("")
        setRecipeAmount("")
        setSelectedCategoryId("")
    }

    const fetchCategories = async () => {
        const data = await getCategories()
        setCategories(data)
    }

    const fetchMaterials = async () => {
        const data = await getRawMaterials()
        setRawMaterials(data)
    }

    const handleAddRecipeItem = async () => {
        if (!editProduct || !selectedMaterialId || !recipeAmount) return

        const payload = {
            productId: editProduct.id,
            rawMaterialId: selectedMaterialId,
            amount: parseFloat(recipeAmount)
        };
        console.log("Gönderilen Reçete Verisi:", payload);

        try {
            await addRecipeItem(payload)

            toast.success("Malzeme reçeteye eklendi")
            setSelectedMaterialId("")
            setRecipeAmount("")
            // Trigger refresh
            onSuccess()

            // Optimistic update
            const material = rawMaterials.find(m => m.id === selectedMaterialId)
            if (material) {
                const newItem: RecipeItemDto = {
                    id: "temp-" + crypto.randomUUID(),
                    rawMaterialId: material.id,
                    rawMaterialName: material.name,
                    amount: parseFloat(recipeAmount),
                    unit: UnitLabels[material.unit]
                }
                setRecipeItems([...recipeItems, newItem])
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Hata oluştu")
        }
    }

    const handleDeleteRecipeItem = async (id: string) => {
        // If it's a temp item, just remove from state
        if (id.startsWith("temp-")) {
            setRecipeItems(recipeItems.filter(i => i.id !== id))
            return
        }

        const success = await deleteRecipeItem(id)
        if (success) {
            toast.success("Malzeme reçeteden silindi")
            setRecipeItems(recipeItems.filter(i => i.id !== id))
            onSuccess()
        } else {
            toast.error("Hata oluştu")
        }
    }

    const getSelectedMaterialUnit = () => {
        const m = rawMaterials.find(r => r.id === selectedMaterialId)
        return m ? UnitLabels[m.unit] : "-"
    }

    const handleAllergenToggle = (allergenValue: number) => {
        setAllergens(prev => prev ^ allergenValue) // XOR to toggle flag
    }

    const isAllergenSelected = (allergenValue: number) => {
        return (allergens & allergenValue) !== 0
    }

    // Modifier Group Helpers
    const addModifierGroup = () => {
        const newGroup: ModifierGroupDto = {
            id: crypto.randomUUID(),
            name: "",
            selectionType: 0,
            minSelection: 1,
            maxSelection: 1,
            modifiers: []
        }
        setModifierGroups([...modifierGroups, newGroup])
    }

    const removeModifierGroup = (id: string) => {
        setModifierGroups(modifierGroups.filter(g => g.id !== id))
    }

    const updateModifierGroup = (id: string, field: keyof ModifierGroupDto, value: any) => {
        setModifierGroups(modifierGroups.map(g =>
            g.id === id ? { ...g, [field]: value } : g
        ))
    }

    const addModifier = (groupId: string) => {
        const newModifier: ModifierDto = {
            id: crypto.randomUUID(),
            name: "",
            priceAdjustment: 0
        }
        setModifierGroups(modifierGroups.map(group => {
            if (group.id === groupId) {
                return { ...group, modifiers: [...group.modifiers, newModifier] }
            }
            return group
        }))
    }

    const removeModifier = (groupId: string, modifierId: string) => {
        setModifierGroups(modifierGroups.map(group => {
            if (group.id === groupId) {
                return { ...group, modifiers: group.modifiers.filter(m => m.id !== modifierId) }
            }
            return group
        }))
    }

    const updateModifier = (groupId: string, modifierId: string, field: keyof ModifierDto, value: any) => {
        setModifierGroups(modifierGroups.map(group => {
            if (group.id === groupId) {
                const updatedModifiers = group.modifiers.map(m =>
                    m.id === modifierId ? { ...m, [field]: value } : m
                )
                return { ...group, modifiers: updatedModifiers }
            }
            return group
        }))
    }

    const handleSaveProduct = async () => {
        if (!productName || !basePrice) {
            toast.warning("Lütfen ürün adı ve fiyatını girin.")
            return
        }

        const payload = {
            categoryId: selectedCategoryId || null,
            tenantId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            name: productName,
            basePrice: parseFloat(basePrice),
            costPrice: costPrice ? parseFloat(costPrice) : undefined,
            discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
            isActive,
            allergens,
            stationRouting,
            printerIds: printerIds || undefined,
            imageUrl: imageUrl || undefined,
            modifierGroups
        }

        try {
            let success;

            if (editProduct) {
                // Update existing product
                success = await updateProduct(editProduct.id, payload);
            } else {
                // Create new product
                success = await createProduct(payload);
            }

            if (success) {
                toast.success(editProduct ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla kaydedildi!")
                resetForm()
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error("Kaydetme başarısız oldu.")
            }
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Bir hata oluştu.")
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span className="text-2xl">🏪</span>
                        {editProduct ? "Ürün Düzenle" : "Gelişmiş Ürün Yönetimi"}
                    </SheetTitle>
                    <SheetDescription>
                        Enterprise seviye ürün bilgi yönetimi (PIM) - Finans, Operasyon ve Mutfak entegrasyonu
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="general" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">📋 Genel Bilgiler</TabsTrigger>
                        <TabsTrigger value="finance">💰 Finans</TabsTrigger>
                        <TabsTrigger value="operations">⚙️ Operasyon</TabsTrigger>
                        {editProduct && <TabsTrigger value="recipe">🍲 Reçete / Malzemeler</TabsTrigger>}
                    </TabsList>

                    {/* TAB 1: Genel Bilgiler */}
                    <TabsContent value="general" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Temel Ürün Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Ürün Adı *</Label>
                                    <Input
                                        id="name"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="Örn: Karışık Pizza"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori</Label>
                                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Kategori seçin (opsiyonel)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        QR menüde bu kategoride görünecek
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image">Ürün Görseli (URL)</Label>
                                    <Input
                                        id="image"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="active" className="text-base">Ürün Aktif mi?</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Pasif ürünler POS ekranında görünmez
                                        </p>
                                    </div>
                                    <Switch
                                        id="active"
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Modifier Groups */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Seçenek Grupları (Opsiyonel)</CardTitle>
                                    <Button onClick={addModifierGroup} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Grup Ekle
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {modifierGroups.length === 0 ? (
                                    <div className="text-center p-6 border-2 border-dashed rounded-lg text-muted-foreground">
                                        Henüz seçenek grubu eklenmedi (Örn: Porsiyon, Ekstra Malzeme)
                                    </div>
                                ) : (
                                    modifierGroups.map((group) => (
                                        <Card key={group.id} className="relative">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={() => removeModifierGroup(group.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <CardContent className="pt-6 space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Grup Adı</Label>
                                                        <Input
                                                            value={group.name}
                                                            onChange={(e) => updateModifierGroup(group.id, 'name', e.target.value)}
                                                            placeholder="Örn: Porsiyon"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Seçim Tipi</Label>
                                                        <Select
                                                            value={group.selectionType.toString()}
                                                            onValueChange={(val) => updateModifierGroup(group.id, 'selectionType', parseInt(val))}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="0">Tekli</SelectItem>
                                                                <SelectItem value="1">Çoklu</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs">Seçenekler</Label>
                                                        <Button
                                                            onClick={() => addModifier(group.id)}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 text-xs"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Ekle
                                                        </Button>
                                                    </div>
                                                    {group.modifiers.map((modifier) => (
                                                        <div key={modifier.id} className="flex gap-2">
                                                            <Input
                                                                className="h-8 flex-1"
                                                                placeholder="Seçenek adı"
                                                                value={modifier.name}
                                                                onChange={(e) => updateModifier(group.id, modifier.id, 'name', e.target.value)}
                                                            />
                                                            <Input
                                                                className="h-8 w-24"
                                                                type="number"
                                                                placeholder="₺"
                                                                value={modifier.priceAdjustment}
                                                                onChange={(e) => updateModifier(group.id, modifier.id, 'priceAdjustment', parseFloat(e.target.value))}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => removeModifier(group.id, modifier.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: Finans */}
                    <TabsContent value="finance" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Fiyatlandırma Stratejisi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="basePrice">Normal Fiyat (₺) *</Label>
                                    <Input
                                        id="basePrice"
                                        type="number"
                                        step="0.01"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Müşteriye gösterilen standart fiyat
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discountedPrice" className="flex items-center gap-2">
                                        İndirimli Fiyat (₺)
                                        <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                            Kampanya
                                        </span>
                                    </Label>
                                    <Input
                                        id="discountedPrice"
                                        type="number"
                                        step="0.01"
                                        value={discountedPrice}
                                        onChange={(e) => setDiscountedPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Girilirse POS'ta normal fiyat üstü çizili görünür
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="costPrice" className="flex items-center gap-2">
                                        Maliyet Fiyatı (₺)
                                        <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            Dahili
                                        </span>
                                    </Label>
                                    <Input
                                        id="costPrice"
                                        type="number"
                                        step="0.01"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Kar marjı hesaplaması için kullanılır (müşteriye gösterilmez)
                                    </p>
                                </div>

                                {/* Profit Margin Calculator */}
                                {basePrice && costPrice && (
                                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                                Kar Marjı
                                            </span>
                                            <span className="text-lg font-bold text-green-700 dark:text-green-300">
                                                {(((parseFloat(basePrice) - parseFloat(costPrice)) / parseFloat(basePrice)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                            Birim kar: {(parseFloat(basePrice) - parseFloat(costPrice)).toFixed(2)} ₺
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: Operasyon & Mutfak */}
                    <TabsContent value="operations" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                    Alerjen Bilgisi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {ALLERGEN_OPTIONS.map((allergen) => (
                                        <div key={allergen.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`allergen-${allergen.value}`}
                                                checked={isAllergenSelected(allergen.value)}
                                                onCheckedChange={() => handleAllergenToggle(allergen.value)}
                                            />
                                            <Label
                                                htmlFor={`allergen-${allergen.value}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {allergen.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Seçilen alerjenler POS ekranında ⚠️ ikonu ile gösterilir
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">İstasyon Yönlendirme</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Hazırlık İstasyonu</Label>
                                    <Select
                                        value={stationRouting.toString()}
                                        onValueChange={(val) => setStationRouting(parseInt(val))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">👨‍🍳 Sadece Mutfak</SelectItem>
                                            <SelectItem value="1">🍹 Sadece Bar</SelectItem>
                                            <SelectItem value="2">🔄 Her İkisi (Mutfak + Bar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Sipariş hangi ekranlara gönderilecek?
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="printers">Yazıcı ID'leri (Opsiyonel)</Label>
                                    <Input
                                        id="printers"
                                        value={printerIds}
                                        onChange={(e) => setPrinterIds(e.target.value)}
                                        placeholder='["printer-guid-1", "printer-guid-2"]'
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JSON formatında yazıcı GUID listesi
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: Reçete */}
                    {editProduct && (
                        <TabsContent value="recipe" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Reçete Malzemeleri</CardTitle>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                            {recipeItems.length} Malzeme
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Bu ürün hazırlanırken stoktan düşülecek malzemeler
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Add New Item */}
                                    <div className="flex gap-2 items-end p-4 bg-muted/30 rounded-lg border">
                                        <div className="flex-1 space-y-2">
                                            <Label>Hammadde Seç</Label>
                                            <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Malzeme seç..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rawMaterials.map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.name} ({UnitLabels[m.unit]})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <Label>Miktar</Label>
                                            <Input
                                                type="number"
                                                value={recipeAmount}
                                                onChange={(e) => setRecipeAmount(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="w-20 pb-2 text-sm text-muted-foreground font-medium">
                                            {getSelectedMaterialUnit()}
                                        </div>
                                        <Button onClick={handleAddRecipeItem} className="mb-[1px]">
                                            <Plus className="w-4 h-4 mr-2" /> Ekle
                                        </Button>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-2">
                                        {recipeItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                                        {item.rawMaterialName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{item.rawMaterialName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="secondary" className="text-sm font-normal">
                                                        {item.amount} {item.unit}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                        onClick={() => handleDeleteRecipeItem(item.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {recipeItems.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                Reçete henüz boş.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>

                <SheetFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleSaveProduct} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet ve Yayınla
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >
    )
}
