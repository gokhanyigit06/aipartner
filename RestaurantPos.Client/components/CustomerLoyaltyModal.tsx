import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Star, Award, Gift, CheckCircle } from "lucide-react";
import { CustomerApi, CustomerInsightsDto } from "@/lib/api-customer";
import { usePosStore } from "@/store/posStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function CustomerLoyaltyModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Store
    const {
        selectedCustomer,
        setCustomer,
        redeemPoints,
        toggleRedeemPoints,
        products,
        addToCart
    } = usePosStore();

    const handleSearch = async () => {
        if (!phone) return;
        setLoading(true);
        setSearchPerformed(true);

        const customer = await CustomerApi.search(phone);
        if (customer) {
            setCustomer(customer);
        } else {
            setCustomer(null);
            // Optional: Provide UI to create new customer
        }
        setLoading(false);
    };

    const handleAddFavorite = (productName: string) => {
        const product = products.find(p => p.name === productName);
        if (product) {
            addToCart(product, []);
            toast.success(`${product.name} sepete eklendi`);
            setIsOpen(false);
        } else {
            toast.error("Ürün menüde bulunamadı");
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Bronze': return 'bg-amber-700 text-white';
            case 'Silver': return 'bg-slate-400 text-slate-900';
            case 'Gold': return 'bg-yellow-400 text-yellow-900';
            case 'VIP': return 'bg-purple-600 text-white';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2 border-dashed border-slate-300 text-slate-600 hover:text-orange-600 hover:border-orange-200">
                    {selectedCustomer ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-slate-900">{selectedCustomer.name}</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" />
                            Müşteri Ekle / Puan
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Müşteri Sadakat Programı</DialogTitle>
                </DialogHeader>

                {/* Search Section */}
                {!selectedCustomer ? (
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Telefon Numarası (5XX...)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={loading}>
                                {loading ? "..." : <Search className="w-4 h-4" />}
                            </Button>
                        </div>

                        {searchPerformed && !loading && (
                            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                <p>Müşteri bulunamadı.</p>
                                <Button variant="link" className="text-orange-600">
                                    + Yeni Müşteri Oluştur
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 pt-2">
                        {/* Profile Header */}
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`${getTierColor(selectedCustomer.tier)}`}>
                                        {selectedCustomer.tier} Üye
                                    </Badge>
                                    <span className="text-xs text-slate-400">
                                        Son Ziyaret: {new Date(selectedCustomer.lastVisit).toLocaleDateString("tr-TR")}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500">Puan Bakiyesi</div>
                                <div className="text-2xl font-bold text-orange-600">
                                    {selectedCustomer.points.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Redeem Switch */}
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                    <Gift className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Puanları Kullan</p>
                                    <p className="text-xs text-slate-500">Mevcut siparişten düşer</p>
                                </div>
                            </div>
                            <Switch
                                checked={redeemPoints}
                                onCheckedChange={toggleRedeemPoints}
                                disabled={selectedCustomer.points <= 0}
                            />
                        </div>

                        {/* Favorites */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                Sık Tercih Ettikleri
                            </h4>
                            <div className="space-y-2">
                                {selectedCustomer.favoriteProducts.map((fav, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {idx + 1}
                                            </div>
                                            <span>{fav.productName}</span>
                                            <span className="text-xs text-slate-400">({fav.count} kez)</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleAddFavorite(fav.productName)}
                                        >
                                            Sepete Ekle
                                        </Button>
                                    </div>
                                ))}
                                {selectedCustomer.favoriteProducts.length === 0 && (
                                    <p className="text-xs text-slate-400 italic pl-2">Henüz favori ürünü yok.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs" onClick={() => setCustomer(null)}>
                                Müşteriyi Kaldır
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
