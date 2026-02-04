"use client";

import React, { useEffect, useState } from "react";
import { Upload, Eye, ExternalLink, ChevronDown } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteSettings, defaultSettings } from "@/types/qrmenu";
import { getTables } from "@/lib/api";
import { Table } from "@/types/pos";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// NOTE: Since backend endpoint for settings doesn't exist yet, 
// we will mock the persistence using localStorage for now.
export default function QrMenuSettingsPage() {
    // Try to load initial settings from localStorage or defaults
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [isUploading, setIsUploading] = useState(false);
    const [tables, setTables] = useState<Table[]>([]);

    useEffect(() => {
        const savedSettings = localStorage.getItem("qr_menu_settings");
        if (savedSettings) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }

        // Load tables for preview dropdown
        loadTables();
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const loadTables = async () => {
        const data = await getTables();
        setTables(data);
    };

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem("qr_menu_settings", JSON.stringify(settings));
        toast.success("Ayarlar başarıyla kaydedildi (Local Mode)");
        // In real backend integration, here we would call an API
    };

    // Generic Image Upload Handler (Mock)
    const handleImageUpload = async (file: File, field: 'logoUrl' | 'defaultProductImage') => {
        if (!file) return;
        setIsUploading(true);
        try {
            // Since we don't have a backend upload yet, we'll use FileReader for preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                handleChange(field, result);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error("Resim yüklenirken hata oluştu.");
            setIsUploading(false);
        }
    };

    // Banner Handlers
    const handleBannerUrlChange = (index: number, value: string) => {
        const newUrls = [...settings.bannerUrls];
        newUrls[index] = value;
        setSettings(prev => ({ ...prev, bannerUrls: newUrls }));
    };

    const addBannerUrl = () => {
        if (settings.bannerUrls.length < 5) {
            setSettings(prev => ({
                ...prev,
                bannerUrls: [...prev.bannerUrls, '']
            }));
        }
    };

    const removeBannerUrl = (index: number) => {
        const newUrls = settings.bannerUrls.filter((_, i) => i !== index);
        setSettings(prev => ({ ...prev, bannerUrls: newUrls }));
    };

    // Theme Colors Definition
    const themeColors = [
        { name: 'Siyah (Varsayılan)', value: 'black', class: 'bg-black' },
        { name: 'Beyaz', value: 'white', class: 'bg-white border border-gray-200' },
        { name: 'Mavi', value: 'blue', class: 'bg-blue-600' },
        { name: 'Turuncu', value: 'orange', class: 'bg-orange-500' },
        { name: 'Kırmızı', value: 'red', class: 'bg-red-600' },
        { name: 'Yeşil', value: 'green', class: 'bg-green-600' },
    ];

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">QR Menü Ayarları</h1>
                    <p className="text-sm text-slate-500">
                        Menünüzün görünümünü ve içeriğini kişiselleştirin.
                    </p>
                </div>
                <div className="flex gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Önizleme
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
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Theme Settings */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Görünüm & Tema</h3>
                        <p className="text-sm text-slate-500">Genel renk ve font ayarları.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Theme Color */}
                        <div>
                            <label className="mb-3 block text-sm font-bold text-slate-700">Ana Renk</label>
                            <div className="flex flex-wrap gap-3">
                                {themeColors.map(color => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleChange('themeColor', color.value)}
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${settings.themeColor === color.value
                                            ? 'border-slate-900 scale-110 ring-2 ring-slate-200'
                                            : 'border-transparent hover:scale-105'
                                            }`}
                                        title={color.name}
                                    >
                                        <div className={`h-6 w-6 rounded-full shadow-sm ${color.class}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Family */}
                        <div>
                            <label className="mb-3 block text-sm font-bold text-slate-700">Yazı Fontu</label>
                            <select
                                value={settings.fontFamily || 'Inter'}
                                onChange={(e) => handleChange('fontFamily', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Lato">Lato</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Playfair Display">Playfair Display</option>
                            </select>
                        </div>

                        {/* Dark Mode */}
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100 h-full">
                            <div>
                                <h4 className="font-bold text-slate-900">Koyu Mod</h4>
                                <p className="text-xs text-slate-500">Müşteriler için koyu tema</p>
                            </div>
                            <button
                                onClick={() => handleChange('darkMode', !settings.darkMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.darkMode ? 'bg-slate-900' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logo Settings */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Logo Ayarları</h3>
                        <p className="text-sm text-slate-500">Menü başlığında görünecek logo.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative flex h-32 w-full md:w-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 group">
                            {settings.logoUrl ? (
                                <img
                                    src={settings.logoUrl}
                                    alt="Logo"
                                    className="max-h-full max-w-full object-contain p-2"
                                />
                            ) : (
                                <div className="text-center text-xs text-slate-400">
                                    <Upload className="mx-auto mb-1 h-5 w-5 opacity-50" />
                                    Logo Yok
                                </div>
                            )}
                            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logoUrl')}
                                />
                            </label>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">İşletme Adı (Text Logo)</label>
                                <input
                                    type="text"
                                    value={settings.siteName || ''}
                                    onChange={(e) => handleChange('siteName', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                    placeholder="Logo yoksa bu isim görünür"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Slogan / Açıklama</label>
                                <input
                                    type="text"
                                    value={settings.siteDescription || ''}
                                    onChange={(e) => handleChange('siteDescription', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                    placeholder="Örn: Cafe & Bistro"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner Settings */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Banner / Slayt Alanı</h3>
                            <p className="text-sm text-slate-500">Menü üstünde kayan görseller.</p>
                        </div>
                        <button
                            onClick={() => handleChange('bannerActive', !settings.bannerActive)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.bannerActive ? 'bg-orange-500' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.bannerActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {settings.bannerActive && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                                {settings.bannerUrls && settings.bannerUrls.length > 0 && settings.bannerUrls[0] ? (
                                    <img
                                        src={settings.bannerUrls[0]}
                                        className="h-full w-full object-cover"
                                        alt="Banner Preview"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                        Görsel Yok
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {settings.bannerUrls.map((url, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="text-xs font-bold w-12 text-slate-500">Slayt {index + 1}</span>
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleBannerUrlChange(index, e.target.value)}
                                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                            placeholder="https://..."
                                        />
                                        <button
                                            onClick={() => removeBannerUrl(index)}
                                            className="text-xs font-medium text-red-600 hover:text-red-800 px-2"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                                {settings.bannerUrls.length < 5 && (
                                    <Button variant="outline" size="sm" onClick={addBannerUrl} className="mt-2">
                                        + Yeni Slayt Ekle
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Styling */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Kategori Görünümü</h3>
                        <p className="text-sm text-slate-500">Kategori listesi düzeni.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Kategori Yüksekliği</label>
                            <div className="flex gap-2">
                                {['small', 'medium', 'large'].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => handleChange('categoryRowHeight', h)}
                                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${settings.categoryRowHeight === h
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {h === 'small' ? 'İnce' : h === 'medium' ? 'Orta' : 'Geniş'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Boşluklar</label>
                            <div className="flex gap-2">
                                {['small', 'medium', 'large'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => handleChange('categoryGap', g)}
                                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${settings.categoryGap === g
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {g === 'small' ? 'Az' : g === 'medium' ? 'Normal' : 'Çok'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Görsel Karartma (Overlay) %{settings.categoryOverlayOpacity}
                            </label>
                            <input
                                type="range"
                                min="0" max="90" step="10"
                                value={settings.categoryOverlayOpacity ?? 50}
                                onChange={(e) => handleChange('categoryOverlayOpacity', parseInt(e.target.value))}
                                className="w-full h-2 rounded-lg bg-slate-200 accent-slate-900 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
