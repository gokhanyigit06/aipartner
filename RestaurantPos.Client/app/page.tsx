"use client";

import React, { useEffect, useState } from "react";
import { usePosStore } from "@/store/posStore";
import { useAuthStore } from "@/store/authStore";
import { ProductDto, ModifierDto, Table, TableStatus } from "@/types/pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductModal from "@/components/ProductModal";
import { toast } from "sonner";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { getTables, updateTableStatus } from "@/lib/api";
import { Armchair, ArrowLeft, Gift, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import CustomerLoyaltyModal from "@/components/CustomerLoyaltyModal";

import AppHeader from "@/components/layout/AppHeader";

export default function PosPage() {
  const {
    products,
    cart,
    selectedTable,
    discountPercentage,
    fetchProducts,
    addToCart,
    removeFromCart,
    clearCart,
    checkoutOrder,
    setSelectedTable,
    toggleComplimentary,
    setDiscountPercentage,
    selectedCustomer,
    redeemPoints
  } = usePosStore();

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Table Selection State
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  useEffect(() => {
    fetchProducts();
    loadTables();
  }, [fetchProducts]);

  const loadTables = async () => {
    setIsLoadingTables(true);
    const data = await getTables();
    setTables(data);
    setIsLoadingTables(false);
  };

  const handleTableClick = async (table: Table) => {
    if (table.status === TableStatus.Reserved) {
      toast.warning("Bu masa rezerve.");
      return;
    }

    // If table is free, mark as Occupied
    if (table.status === TableStatus.Free) {
      const success = await updateTableStatus(table.id, TableStatus.Occupied);
      if (!success) {
        toast.error("Masa durumu güncellenemedi.");
        return;
      }
      // Update local state temporarily
      table.status = TableStatus.Occupied;
    }

    setSelectedTable(table);
  };

  const handleBackToTables = () => {
    // Logic for leaving a table?
    // If cart is not empty, warn?
    if (cart.length > 0) {
      if (!confirm("Sepetinizde ürünler var. Çıkarsanız sepet silinecek. Emin misiniz?")) return;
      clearCart();
    }
    setSelectedTable(null);
    loadTables(); // Refresh status
  };

  // Ürün kartına tıklayınca modal aç
  const handleProductClick = (product: ProductDto) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Modal içinden sepete ekleme
  const handleAddProductToCart = (product: ProductDto, modifiers: ModifierDto[]) => {
    addToCart(product, modifiers);
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCheckout = async () => {
    setIsOrdering(true);
    await checkoutOrder();
    setIsOrdering(false);
    toast.success("Sipariş mutfağa iletildi!");
    // After checkout, maybe go back to tables? Or stay? 
    // Usually stay or cleared. Store clears cart.
  };

  // Calculations
  const subTotal = cart.reduce((sum, item) => {
    return sum + (item.isComplimentary ? 0 : item.totalPrice);
  }, 0);

  const discountAmount = subTotal * (discountPercentage / 100);

  // Loyalty Points Deduction
  let pointsDeduction = 0;
  if (selectedCustomer && redeemPoints && selectedCustomer.points > 0) {
    // Logic: Deduct points up to the order total, but keeping in mind subTotal - discountAmount
    const amountAfterGeneralDiscount = subTotal - discountAmount;
    pointsDeduction = Math.min(selectedCustomer.points, amountAfterGeneralDiscount);
  }

  const finalTotal = Math.max(0, subTotal - discountAmount - pointsDeduction);

  // SignalR Listener for Ready Orders
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5001/kitchenHub", {
        accessTokenFactory: () => useAuthStore.getState().user?.token || ""
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("POS Connected to KitchenHub");

        connection.on("OrderReady", (order: { tableName: string; tableId: string; orderNumber: string }) => {
          toast(`🔔 ${order.tableName || "Masa ?"} Siparişi Hazır!`, {
            description: `Sipariş No: ${order.orderNumber.substring(8)}`,
            action: {
              label: "Tamam",
              onClick: () => console.log("Görüldü"),
            },
            duration: 5000,
          });
        });
      })
      .catch(err => {
        console.warn("SignalR bağlantısı kurulamadı (Backend çalışmıyor olabilir):", err.message);
        // Don't show error to user, just log it
      });

    return () => {
      connection.stop().catch(() => {
        // Ignore stop errors
      });
    };
  }, []);

  // --- RENDER TABLE SELECTION SCREEN ---
  if (!selectedTable) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-6xl">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Masa Seçimi</h1>
          <p className="text-slate-500 mb-8">Lütfen sipariş için bir masa seçin.</p>

          {isLoadingTables ? (
            <div className="text-center py-10">Masa planı yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {tables.length === 0 && <div className="col-span-4 text-slate-400">Tanımlı masa yok. Admin panelinden ekleyiniz.</div>}
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`relative h-40 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1
                                        ${table.status === TableStatus.Free
                      ? 'bg-white border-green-200 hover:border-green-400'
                      : table.status === TableStatus.Occupied
                        ? 'bg-red-50 border-red-200 hover:border-red-400'
                        : 'bg-yellow-50 border-yellow-200 opacity-60'
                    }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3
                                        ${table.status === TableStatus.Free ? 'bg-green-100 text-green-600' :
                      table.status === TableStatus.Occupied ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <Armchair className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{table.name}</h3>
                  <span className="text-xs text-slate-500">{table.capacity} Kişilik</span>

                  <span className={`absolute top-2 right-2 w-3 h-3 rounded-full ${table.status === TableStatus.Free ? 'bg-green-500 animate-pulse' :
                    table.status === TableStatus.Occupied ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER POS SCREEN ---
  return (
    <div className="flex h-screen w-full bg-slate-50 flex-col overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">


        {/* LEFT SIDE: Product Grid (70%) */}
        <div className="w-[70%] p-6 overflow-y-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" className="gap-2" onClick={handleBackToTables}>
              <ArrowLeft className="w-4 h-4" /> Masalara Dön
            </Button>
            <h1 className="text-3xl font-bold text-slate-800">Menü ({selectedTable.name})</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const hasDiscount = product.discountedPrice && product.discountedPrice < product.basePrice
              const hasAllergens = product.allergens && product.allergens > 0
              const displayPrice = hasDiscount ? product.discountedPrice : product.basePrice

              return (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-slate-200 active:scale-95 duration-100 relative overflow-hidden group"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Allergen Warning Badge */}
                  {hasAllergens && (
                    <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                      <span className="text-sm font-bold">⚠️</span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                      İNDİRİM
                    </div>
                  )}

                  {/* Product Image (if available) */}
                  {product.imageUrl && (
                    <div className="w-full h-32 overflow-hidden bg-slate-100">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold text-center select-none">
                      {product.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 text-center space-y-1">
                    {hasDiscount ? (
                      <>
                        {/* Original Price - Strikethrough */}
                        <div className="text-sm text-slate-400 line-through">
                          {product.basePrice} ₺
                        </div>
                        {/* Discounted Price - Large and Red */}
                        <div className="text-2xl font-bold text-red-600">
                          {product.discountedPrice} ₺
                        </div>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-green-600">
                        {product.basePrice} ₺
                      </span>
                    )}

                    {/* Allergen Info Text */}
                    {hasAllergens && (
                      <div className="text-xs text-yellow-700 font-medium mt-2">
                        Alerjen içerir
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* RIGHT SIDE: Cart / Ticket (30%) */}
        <div className="w-[30%] bg-white border-l border-slate-200 flex flex-col shadow-xl">

          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-2xl font-bold text-slate-800">Adisyon</h2>
            <h2 className="text-2xl font-bold text-slate-800">Adisyon</h2>
            <p className="text-sm text-slate-500">Masa: <span className="font-bold text-orange-600">{selectedTable.name}</span></p>

            {/* Customer Search Trigger */}
            <div className="mt-4">
              <CustomerLoyaltyModal />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sepet boş
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className={`flex items-center justify-between p-3 rounded-lg border group transition-colors ${item.isComplimentary ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'
                    }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${item.isComplimentary ? 'text-green-700' : 'text-slate-800'}`}>
                        {item.product.name}
                      </span>
                      {item.isComplimentary && <span className="text-[10px] bg-green-200 text-green-800 px-1 rounded">İKRAM</span>}
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        {item.selectedModifiers.map(m => m.name).join(", ")}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">x{item.quantity}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${item.isComplimentary ? 'text-green-600 line-through decoration-slate-400/50' : 'text-slate-700'}`}>
                      {item.isComplimentary ? "0 ₺" : `${item.totalPrice} ₺`}
                    </span>

                    {/* Complimentary Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 transition-colors ${item.isComplimentary ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-slate-400 hover:text-green-500 hover:bg-green-50'}`}
                      onClick={() => toggleComplimentary(item.cartId)}
                      title="İkram Yap"
                    >
                      <Gift className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeFromCart(item.cartId)}
                    >
                      <span className="sr-only">Sil</span>
                      ✕
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: Totals & Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">

            {/* Discount Input */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Percent className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  placeholder="İndirim %"
                  className="pl-8 h-9 text-sm"
                  min="0"
                  max="100"
                  value={discountPercentage > 0 ? discountPercentage : ''}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                />
              </div>
              <div className="text-xs text-slate-500 w-1/2 leading-tight">
                Genel indirim oranı
              </div>
            </div>

            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Ara Toplam</span>
                <span>{subTotal.toFixed(2)} ₺</span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>İndirim (%{discountPercentage})</span>
                  <span>-{discountAmount.toFixed(2)} ₺</span>
                </div>
              )}
              {pointsDeduction > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <div className="flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    <span>Sadakat Puanı</span>
                  </div>
                  <span>-{pointsDeduction.toFixed(2)} ₺</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-lg font-bold text-slate-800">Genel Toplam</span>
                <span className="text-3xl font-bold text-slate-900">{finalTotal.toFixed(2)} ₺</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full text-slate-600"
                onClick={clearCart}
                disabled={cart.length === 0 || isOrdering}
              >
                İptal
              </Button>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 justify-center"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isOrdering}
              >
                {isOrdering ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    İşleniyor...
                  </>
                ) : (
                  "Siparişi Tamamla"
                )}
              </Button>
            </div>
          </div>

        </div>

        {/* Modifier Selection Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          onAddToCart={handleAddProductToCart}
        />

      </div>
    </div >
  );
}
