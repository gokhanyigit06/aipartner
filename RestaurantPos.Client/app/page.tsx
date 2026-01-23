"use client";

import React, { useEffect, useState } from "react";
import { usePosStore } from "@/store/posStore";
import { ProductDto, ModifierDto } from "@/types/pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductModal from "@/components/ProductModal";
import { toast } from "sonner";
import { HubConnectionBuilder } from "@microsoft/signalr";

export default function PosPage() {
  const { products, cart, fetchProducts, addToCart, removeFromCart, clearCart, checkoutOrder } = usePosStore();

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // SignalR Listener for Ready Orders
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5001/kitchenHub")
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
      .catch(err => console.error("SignalR POS Load Error: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">

      {/* LEFT SIDE: Product Grid (70%) */}
      <div className="w-[70%] p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">Menü</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-slate-200 active:scale-95 duration-100"
              onClick={() => handleProductClick(product)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold text-center select-none">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center">
                <span className="text-xl font-bold text-green-600">
                  {product.basePrice} ₺
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Cart / Ticket (30%) */}
      <div className="w-[30%] bg-white border-l border-slate-200 flex flex-col shadow-xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800">Adisyon</h2>
          <p className="text-sm text-slate-500">Masa: A-12</p>
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
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group"
              >
                <div>
                  <div className="font-semibold text-slate-800">{item.product.name}</div>
                  {item.selectedModifiers.length > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {item.selectedModifiers.map(m => m.name).join(", ")}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">x{item.quantity}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">
                    {item.totalPrice} ₺
                  </span>
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
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg text-slate-600">Genel Toplam</span>
            <span className="text-3xl font-bold text-slate-900">{totalAmount} ₺</span>
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
  );
}
