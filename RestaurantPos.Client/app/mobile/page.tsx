"use client";

import React, { useEffect, useState } from "react";
import { usePosStore } from "@/store/posStore";
import { getTables, updateTableStatus, createOrder } from "@/lib/api";
import { Table, TableStatus, ProductDto, StationRouting } from "@/types/pos";
import BottomNav from "@/components/mobile/BottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Armchair,
    ChevronLeft,
    Search,
    ChefHat,
    Wine,
    Utensils,
    Trash2,
    Plus,
    Minus,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function MobilePosPage() {
    // Store
    const {
        products,
        cart,
        selectedTable,
        fetchProducts,
        addToCart,
        removeFromCart,
        clearCart,
        setSelectedTable,
        checkoutOrder
    } = usePosStore();

    // Local State
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchProducts();
            const tableData = await getTables();
            setTables(tableData);
            setLoading(false);
        };
        init();
    }, [fetchProducts]);

    // Derived State
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            activeTab === "all" ? true :
                activeTab === "food" ? p.stationRouting === StationRouting.KitchenOnly || p.stationRouting === StationRouting.Both :
                    activeTab === "drink" ? p.stationRouting === StationRouting.BarOnly : true;

        return matchesSearch && matchesCategory;
    });

    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    // Handlers
    const handleTableSelect = async (table: Table) => {
        if (table.status === TableStatus.Reserved) {
            toast.warning("Bu masa rezerve durumda");
            return;
        }

        // Occupy table logic (simplified)
        if (table.status === TableStatus.Free) {
            await updateTableStatus(table.id, TableStatus.Occupied);
            // Optimistic update
            setTables(tables.map(t => t.id === table.id ? { ...t, status: TableStatus.Occupied } : t));
        }

        setSelectedTable(table);
        // Clear search and reset tab
        setSearchQuery("");
        setActiveTab("all");
    };

    const handleBackToTables = () => {
        if (cart.length > 0) {
            toast.error("Masadan çıkmadan önce sepeti onaylayın veya boşaltın.");
            return;
        }
        setSelectedTable(null);
        // Refresh tables in background
        getTables().then(setTables);
    };

    const handleProductClick = (product: ProductDto) => {
        addToCart(product, []); // No modifiers for speed-dial
        toast.success(`${product.name} eklendi`, {
            position: 'top-center',
            duration: 1000,
            icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
        });
    };

    const handleCheckout = async () => {
        if (!selectedTable) return;

        setIsProcessing(true);
        try {
            await checkoutOrder();
            toast.success("Sipariş mutfağa iletildi!", {
                position: 'top-center',
                className: 'bg-green-600 text-white border-none'
            });
            setIsCartOpen(false);
            // Optional: Auto-close table view? No, keep it open for more orders or manual exit
        } catch (error) {
            toast.error("Sipariş gönderilemedi.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDER: Table Selection ---
    if (!selectedTable) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
                <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-slate-800 text-center">Masa Seçimi</h1>
                </header>

                <main className="flex-1 p-4">
                    {loading ? (
                        <div className="flex justify-center pt-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableSelect(table)}
                                    className={`relative aspect-square rounded-xl p-2 flex flex-col items-center justify-center border-2 transition-all active:scale-95
                                        ${table.status === TableStatus.Free
                                            ? 'bg-white border-slate-200 text-slate-600 shadow-sm'
                                            : table.status === TableStatus.Occupied
                                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}
                                >
                                    <div className={`p-2 rounded-full mb-2 ${table.status === TableStatus.Free ? 'bg-slate-100' :
                                            table.status === TableStatus.Occupied ? 'bg-orange-100' : 'bg-indigo-100'
                                        }`}>
                                        <Armchair className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm block truncate w-full text-center">
                                        {table.name}
                                    </span>
                                    {table.status !== TableStatus.Free && (
                                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // --- RENDER: Menu & Ordering ---
    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white shadow-sm z-10 flex-none">
                <div className="flex items-center p-3 gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackToTables} className="-ml-2">
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="font-bold text-slate-900">{selectedTable.name}</h2>
                        <p className="text-xs text-slate-500">Sipariş Ekranı</p>
                    </div>
                </div>

                {/* Categories & Search */}
                <div className="px-3 pb-3 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Ürün ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-100 border-none pl-9 h-10 rounded-xl"
                        />
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex space-x-2 pb-1">
                            <Button
                                variant={activeTab === "all" ? "default" : "outline"}
                                onClick={() => setActiveTab("all")}
                                className={`rounded-full px-6 ${activeTab === "all" ? "bg-slate-900" : "bg-white border-slate-200 text-slate-600"}`}
                                size="sm"
                            >
                                <Utensils className="w-3 h-3 mr-2" />
                                Tümü
                            </Button>
                            <Button
                                variant={activeTab === "food" ? "default" : "outline"}
                                onClick={() => setActiveTab("food")}
                                className={`rounded-full px-6 ${activeTab === "food" ? "bg-orange-500 hover:bg-orange-600" : "bg-white border-slate-200 text-slate-600"}`}
                                size="sm"
                            >
                                <ChefHat className="w-3 h-3 mr-2" />
                                Yiyecek
                            </Button>
                            <Button
                                variant={activeTab === "drink" ? "default" : "outline"}
                                onClick={() => setActiveTab("drink")}
                                className={`rounded-full px-6 ${activeTab === "drink" ? "bg-blue-500 hover:bg-blue-600" : "bg-white border-slate-200 text-slate-600"}`}
                                size="sm"
                            >
                                <Wine className="w-3 h-3 mr-2" />
                                İçecek
                            </Button>
                        </div>
                        <ScrollBar orientation="horizontal" className="invisible" />
                    </ScrollArea>
                </div>
            </header>

            {/* Product Grid */}
            <ScrollArea className="flex-1 px-3 py-2 bg-slate-50">
                <div className="grid grid-cols-2 gap-3 pb-24">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className="border-none shadow-sm active:scale-95 transition-transform overflow-hidden cursor-pointer"
                        >
                            <div className="aspect-[4/3] bg-slate-100 relative">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Utensils className="w-8 h-8" />
                                    </div>
                                )}
                                {(product.discountedPrice && product.discountedPrice < product.basePrice) && (
                                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        İNDİRİM
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-3">
                                <h3 className="font-semibold text-sm text-slate-800 line-clamp-1">{product.name}</h3>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="font-bold text-orange-600">
                                        {product.discountedPrice || product.basePrice} ₺
                                    </span>
                                    {product.discountedPrice && (
                                        <span className="text-xs text-slate-400 line-through">{product.basePrice} ₺</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

            {/* Bottom Navigation */}
            <BottomNav
                itemCount={cart.length}
                totalAmount={totalAmount}
                onCartClick={() => setIsCartOpen(true)}
            />

            {/* Cart Sheet */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 rounded-t-3xl">
                    <SheetHeader className="p-6 pb-2 border-b border-slate-100 bg-white sticky top-0 rounded-t-3xl">
                        <SheetTitle className="flex items-center justify-between text-2xl">
                            <span>Sipariş Özeti</span>
                            <span className="text-orange-600 font-bold">{selectedTable.name}</span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {cart.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">Sepetiniz boş</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartId} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-900">{item.product.name}</div>
                                        <div className="text-slate-500 text-sm">{item.product.basePrice} ₺</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-slate-900 w-16 text-right">
                                            {item.totalPrice} ₺
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.cartId)}
                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-white border-t border-slate-200 safe-area-bottom">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-slate-500 font-medium">Toplam</span>
                            <span className="text-3xl font-bold text-slate-900">
                                {totalAmount.toFixed(2)} ₺
                            </span>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isProcessing}
                            className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl shadow-green-200 rounded-xl"
                        >
                            {isProcessing ? "Gönderiliyor..." : "Mutfağa Gönder"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
