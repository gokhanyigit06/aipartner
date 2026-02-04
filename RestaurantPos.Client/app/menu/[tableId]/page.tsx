
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTablePublic, getPublicProducts, createPublicOrder } from '@/lib/api';
import { CategoryDto, ProductDto } from '@/types/pos';
import { useCartStore } from '@/store/cartStore';
import { useMenu, useMenuStore } from '@/store/menuStore'; // Import our new settings store
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Trash2, MapPin, Search } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// New Components
import HeroBanner from '@/components/qrmenu/HeroBanner';
import CategoryAccordion from '@/components/qrmenu/CategoryAccordion';
import Image from 'next/image';

export default function MobileMenuPage() {
    // 1. Params & Stores
    const params = useParams();
    const tableId = params.tableId as string;

    // Store
    const { items, removeFromCart, clearCart, totalAmount } = useCartStore();
    const { settings } = useMenu(); // This will give us colors, fonts, etc.

    // Local State
    const [table, setTable] = useState<any>(null);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);

    // 2. Load Data
    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch Table Info (skip for demo mode)
            if (tableId !== 'demo') {
                const tableData = await getTablePublic(tableId);
                setTable(tableData);
            } else {
                // Demo mode - set fake table data
                setTable({
                    id: 'demo',
                    tableNumber: 'DEMO',
                    status: 0
                });
            }

            // Fetch Products
            // NOTE: Currently getPublicProducts returns ProductDtos which include CategoryName/Id
            // We need to extract unique categories from products since we don't have a public getCategories endpoint yet.
            const productData = await getPublicProducts();

            // Map incoming products to state
            setProducts(productData);

            // Extract Categories manually from products for now
            // In a real scenario, you might want a separate endpoint /api/categories/public
            const uniqueCategoriesMap = new Map<string, CategoryDto>();

            productData.forEach(p => {
                if (p.categoryId && p.categoryName) {
                    if (!uniqueCategoriesMap.has(p.categoryId)) {
                        uniqueCategoriesMap.set(p.categoryId, {
                            id: p.categoryId,
                            name: p.categoryName,
                            sortOrder: 0, // Default since we don't have this yet
                            imageUrl: undefined, // Maybe add logic to pick an image from one of the products?
                            description: '',
                            displayMode: 0, // Grid mode by default
                            isActive: true
                        });
                    }
                }
            });

            const extractedCategories = Array.from(uniqueCategoriesMap.values());
            // Sort alphabetically for now or by some other logic
            extractedCategories.sort((a, b) => a.name.localeCompare(b.name));
            setCategories(extractedCategories);

        } catch (error) {
            console.error("Failed to load menu data", error);
            toast.error("Menü yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tableId) {
            loadData();
        }
    }, [tableId]);


    // 3. Search Filtering
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 4. Order Handler
    const handleOrder = async () => {
        if (items.length === 0) {
            toast.error("Sepetiniz boş!");
            return;
        }

        setIsOrderSubmitting(true);
        try {
            const orderData = {
                tableId: tableId === 'default' ? null : tableId, // Handle 'default' or test cases
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.note
                })),
                note: "QR Menü Siparişi" // General order note
            };

            const success = await createPublicOrder(orderData);
            if (success) {
                toast.success("Siparişiniz alındı! Afiyet olsun.");
                clearCart();
                // We'll rely on toast for feedback, user can close sheet manually or we can force close if we had ref
            } else {
                toast.error("Sipariş oluşturulamadı.");
            }
        } catch (error) {
            console.error("Order error", error);
            toast.error("Bir hata oluştu.");
        } finally {
            setIsOrderSubmitting(false);
        }
    };

    // 5. Theme Styles Injection
    // We inject a style tag to override some globals based on settings (Optional but powerful)
    const fontToUrl = (font: string) => {
        // Simple mapping for Google Fonts
        return `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@300;400;500;700;900&display=swap`;
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                    <p className="text-sm font-medium text-gray-500">Menü Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Dynamic Font Loader */}
            {settings.fontFamily && (
                <style jsx global>{`
                    @import url('${fontToUrl(settings.fontFamily)}');
                    body {
                        font-family: '${settings.fontFamily}', sans-serif;
                    }
                `}</style>
            )}

            <main className="min-h-screen bg-slate-50 pb-24">
                {/* Header / Logo Area */}
                <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
                    <div className="container mx-auto max-w-md px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Logo */}
                            {settings.logoUrl ? (
                                <div className="relative h-10 w-auto">
                                    <img
                                        src={settings.logoUrl}
                                        alt="Restaurant Logo"
                                        className="h-full w-auto object-contain"
                                        style={{ maxWidth: settings.logoWidth || 120 }}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 leading-none">
                                        {settings.siteName || "MENÜ"}
                                    </h1>
                                    {settings.siteDescription && (
                                        <p className="text-xs text-gray-500 mt-0.5">{settings.siteDescription}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Table Info Badge */}
                        <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 border border-orange-100">
                            <MapPin size={12} />
                            {table ? `Masa ${table.tableNumber}` : 'Masa Seçilmedi'}
                        </div>
                    </div>
                </header>

                <div className="container mx-auto max-w-md p-4 space-y-6">

                    {/* Hero Slider */}
                    {settings.bannerActive && settings.bannerUrls.length > 0 && (
                        <HeroBanner
                            bannerUrls={settings.bannerUrls}
                            mobileBannerUrls={settings.mobileBannerUrls}
                        />
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Ürün ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                    </div>

                    {/* Categories & Products */}
                    <div className="mt-6">
                        {categories.length > 0 ? (
                            <CategoryAccordion
                                categories={categories}
                                products={filteredProducts}
                                language="tr"
                            />
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>Menü içeriği bulunamadı.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 text-center pb-10">
                        <p className="text-xs text-gray-400 font-medium">
                            Powered by <span className="text-orange-500 font-bold">RestoPOS</span>
                        </p>
                    </div>

                </div>

                {/* Floating Cart Button */}
                {items.length > 0 && (
                    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full max-w-md rounded-2xl bg-black text-white shadow-xl hover:bg-gray-800 h-14 flex items-center justify-between px-6 border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                            {items.reduce((a, b) => a + b.quantity, 0)}
                                        </div>
                                        <span className="font-bold">Sepeti Görüntüle</span>
                                    </div>
                                    <span className="font-bold text-lg">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount())}
                                    </span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 flex flex-col">
                                <SheetHeader className="p-6 border-b border-gray-100">
                                    <SheetTitle className="text-left text-xl font-bold flex items-center w-full justify-between">
                                        <span>Sepetim</span>
                                        <span className="text-sm font-normal text-gray-500">
                                            {table ? `Masa ${table.tableNumber}` : ''}
                                        </span>
                                    </SheetTitle>
                                </SheetHeader>

                                <ScrollArea className="flex-1 px-6 py-4">
                                    {items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                            <ShoppingCart size={48} className="mb-2 opacity-20" />
                                            <p>Sepetiniz boş.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                                    {/* Image if available */}
                                                    {item.image && (
                                                        <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                                                            <Image
                                                                src={item.image}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                            <span className="font-bold text-gray-900">
                                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.price * item.quantity)}
                                                            </span>
                                                        </div>
                                                        {item.note && (
                                                            <p className="text-xs text-orange-600 mt-1 italic">Not: {item.note}</p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                {item.price} ₺ x {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => removeFromCart(item.productId, item.modifiers)}
                                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>

                                <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                                    <div className="w-full space-y-4">
                                        <div className="flex items-center justify-between text-lg font-black text-gray-900">
                                            <span>Toplam</span>
                                            <span>
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount())}
                                            </span>
                                        </div>
                                        <Button
                                            className="w-full h-12 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                            onClick={handleOrder}
                                            disabled={isOrderSubmitting || items.length === 0}
                                        >
                                            {isOrderSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sipariş Gönderiliyor...
                                                </>
                                            ) : (
                                                "Siparişi Onayla"
                                            )}
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                )}
            </main>
        </>
    );
}
