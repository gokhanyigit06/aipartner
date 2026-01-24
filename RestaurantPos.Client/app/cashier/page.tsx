"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { OrderDto } from "@/types/order";
import { getCashierOrders, payOrder } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Banknote, User, Clock } from "lucide-react";
import * as signalR from "@microsoft/signalr";

import AppHeader from "@/components/layout/AppHeader";

export default function CashierPage() {
    const [orders, setOrders] = useState<OrderDto[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();

    const loadOrders = async () => {
        try {
            const data = await getCashierOrders();
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 3 && user?.role !== 0) { // 3 = Cashier, 0 = Admin
            router.push("/login");
            return;
        }
        loadOrders();

        // Optional: SignalR listener for real-time updates (if KitchenHub sends updates)
        // But for now, simple polling is robust enough given existing code structure.
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Simple SignalR integration to listen for Ready orders
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5001/kitchenHub", {
                accessTokenFactory: () => useAuthStore.getState().user?.token || ""
            })
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("Cashier connected to SignalR");

                connection.on("OrderReady", () => {
                    toast.info("Yeni bir sipariş hazır!");
                    loadOrders();
                });

                // If there is an event for 'OrderPaid', we might want to refresh too if another cashier paid it
                connection.on("OrderPaid", () => {
                    loadOrders();
                });
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        return () => {
            connection.stop();
        };
    }, []);


    const handleOrderClick = (order: OrderDto) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handlePayment = async (method: string) => {
        if (!selectedOrder) return;
        const success = await payOrder(selectedOrder.id, method);
        if (success) {
            toast.success(`Ödeme alındı (${method}) - ${selectedOrder.tableName}`);
            setIsModalOpen(false);
            setSelectedOrder(null);
            loadOrders();
        } else {
            toast.error("Ödeme işlemi yapılırken bir hata oluştu.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950">
            <AppHeader />
            <div className="p-6 space-y-6 flex-1">
                <div className="flex flex-col gap-1">

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Kasa / Tahsilat
                    </h1>
                    <p className="text-slate-500">
                        Ödeme bekleyen hazır ve servis edilmiş siparişler.
                    </p>
                </div>

                {/* Orders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Clock className="w-12 h-12 mb-4" />
                            <p className="text-lg font-medium">Şu an açık hesap bulunmuyor.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <Card
                                key={order.id}
                                onClick={() => handleOrderClick(order)}
                                className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-slate-200 group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1 h-full ${order.status === 'Ready' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <CardHeader className="pb-3 pl-6">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl font-bold text-slate-800">
                                            {order.tableName}
                                        </CardTitle>
                                        <Badge variant={order.status === 'Ready' ? 'default' : 'secondary'}>
                                            {order.status === 'Ready' ? 'Hazır' : 'Servis Edildi'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 font-mono mt-1">
                                        #{order.orderNumber.substring(order.orderNumber.length - 4)}
                                    </p>
                                </CardHeader>
                                <CardContent className="pl-6">
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center text-slate-600">
                                            <User className="w-4 h-4 mr-2" />
                                            <span className="text-sm">Misafir</span>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            ₺{order.totalAmount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-slate-400">
                                        {order.items?.length || 0} Kalem Ürün
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Payment Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex justify-between items-center text-xl">
                                <span>{selectedOrder?.tableName} - Ödeme</span>
                                <Badge variant="outline" className="text-lg px-3 py-1 bg-slate-100">
                                    ₺{selectedOrder?.totalAmount.toFixed(2)}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription>
                                Sipariş detayları ve ödeme yöntemi seçimi.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Order Summary */}
                        <div className="my-4 border rounded-lg overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 border-b text-xs font-semibold text-slate-500 uppercase">
                                Sipariş Özeti
                            </div>
                            <ScrollArea className="h-[200px] w-full bg-white p-4">
                                <div className="space-y-3">
                                    {selectedOrder?.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between items-start text-sm">
                                            <div>
                                                <span className="font-medium text-slate-700">
                                                    {item.quantity}x {item.productName}
                                                </span>
                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {item.modifiers.map(m => m.modifierName).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-3">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-lg"
                                onClick={() => handlePayment('Cash')}
                            >
                                <Banknote className="mr-2 h-5 w-5" />
                                Nakit Tahsilat
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                                onClick={() => handlePayment('Credit Card')}
                            >
                                <CreditCard className="mr-2 h-5 w-5" />
                                Kredi Kartı
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
