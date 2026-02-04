"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon, Wine, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getCategories, createCategory, updateCategory, deleteCategory, getTables } from "@/lib/api";
import { CategoryDto, CategoryDisplayMode, Table } from "@/types/pos";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [tables, setTables] = useState<Table[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imageUrl: "",
        sortOrder: 0,
        displayMode: CategoryDisplayMode.Grid,
        isActive: true,
    });

    useEffect(() => {
        loadCategories();
        loadTables();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setLoading(false);
    };

    const loadTables = async () => {
        const data = await getTables();
        setTables(data);
    };

    const handleOpenDialog = (category?: CategoryDto) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || "",
                imageUrl: category.imageUrl || "",
                sortOrder: category.sortOrder,
                displayMode: category.displayMode,
                isActive: category.isActive,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                description: "",
                imageUrl: "",
                sortOrder: categories.length,
                displayMode: CategoryDisplayMode.Grid,
                isActive: true,
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Kategori adı gereklidir");
            return;
        }

        const success = editingCategory
            ? await updateCategory(editingCategory.id, formData)
            : await createCategory(formData);

        if (success) {
            toast.success(editingCategory ? "Kategori güncellendi" : "Kategori oluşturuldu");
            setDialogOpen(false);
            loadCategories();
        } else {
            toast.error("İşlem başarısız oldu");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;

        const success = await deleteCategory(id);
        if (success) {
            toast.success("Kategori silindi");
            loadCategories();
        } else {
            toast.error("Silme işlemi başarısız oldu. Bu kategori ürünler tarafından kullanılıyor olabilir.");
        }
    };

    const displayModeLabels = {
        [CategoryDisplayMode.Grid]: "Grid (Resimli Kartlar)",
        [CategoryDisplayMode.List]: "Liste (Küçük Resimli)",
        [CategoryDisplayMode.ListNoImage]: "Liste (Sadece Metin)",
        [CategoryDisplayMode.CardCarousel]: "Yatay Kaydırmalı",
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Kategoriler</h1>
                    <p className="text-slate-600 mt-1">QR menü kategorilerinizi yönetin</p>
                </div>
                <div className="flex gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                QR Menü Önizleme
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => window.open('/menu/demo', '_blank')}>
                                <Eye className="w-4 h-4 mr-2" />
                                Demo Mod
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {tables.length > 0 ? (
                                tables.slice(0, 5).map((table) => (
                                    <DropdownMenuItem
                                        key={table.id}
                                        onClick={() => window.open(`/menu/${table.id}`, '_blank')}
                                    >
                                        {table.name}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>
                                    Masa bulunamadı
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Kategori
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <Wine className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Henüz kategori yok</h3>
                    <p className="text-slate-600 mb-4">İlk kategorinizi oluşturarak başlayın</p>
                    <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Kategori Ekle
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {category.imageUrl ? (
                                    <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className="w-24 h-24 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                )}

                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                                            {category.description && (
                                                <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-xs text-slate-500">
                                                    Sıra: {category.sortOrder}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {displayModeLabels[category.displayMode as CategoryDisplayMode]}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${category.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    {category.isActive ? "Aktif" : "Pasif"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenDialog(category)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(category.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Kategori Düzenle" : "Yeni Kategori"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Kategori Adı *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Örn: Ana Yemekler, İçecekler..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Kategori hakkında kısa açıklama"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="imageUrl">Görsel URL</Label>
                            <Input
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="https://..."
                            />
                            {formData.imageUrl && (
                                <img
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    className="mt-2 w-32 h-32 rounded-lg object-cover"
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="sortOrder">Sıralama</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="displayMode">Görünüm Modu</Label>
                                <Select
                                    value={formData.displayMode.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, displayMode: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Grid (Resimli Kartlar)</SelectItem>
                                        <SelectItem value="1">Liste (Küçük Resimli)</SelectItem>
                                        <SelectItem value="2">Liste (Sadece Metin)</SelectItem>
                                        <SelectItem value="3">Yatay Kaydırmalı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">Aktif</Label>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                            {editingCategory ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
