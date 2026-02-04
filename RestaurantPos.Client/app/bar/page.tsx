"use client";

import React, { useEffect, useState } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/layout/AppHeader";
import { getActiveOrders, markOrderAsReady } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface KdsOrder {
    id: string;
    orderNumber: string;
    tableName: string; // Add table name
    status: string;
    items: {
        productName: string;
        quantity: number;
        notes?: string;
        preparationStation: number;
        modifiers: {
            modifierName: string;
        }[];
    }[];
}

// ... (imports remain same)

export default function BarPage() {
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const [connection, setConnection] = useState<HubConnection | null>(null);

    // 0. Initial Load of Active Orders
    useEffect(() => {
        const fetchActiveOrders = async () => {
            try {
                const data = await getActiveOrders();
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch active orders:", error);
            }
        };

        fetchActiveOrders();
    }, []);

    // 1. Setup SignalR Connection
    useEffect(() => {
        const connect = new HubConnectionBuilder()
            .withUrl("http://localhost:5001/kitchenHub", {
                accessTokenFactory: () => useAuthStore.getState().user?.token || ""
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        setConnection(connect);
    }, []);

    useEffect(() => {
        if (connection) {
            connection
                .start()
                .then(() => {
                    console.log("SignalR Connected to KitchenHub (Bar)");

                    // 2. Listen for 'ReceiveNewOrder'
                    connection.on("ReceiveNewOrder", (newOrder: KdsOrder) => {
                        console.log("New Order Received:", newOrder);
                        // Add new order to the top of the list
                        setOrders((prev) => [newOrder, ...prev]);
                    });
                })
                .catch((err) => {
                    // Ignore the specific error "The connection was stopped during negotiation"
                    if (err.message && err.message.includes("stopped during negotiation")) {
                        console.log("SignalR connection cancelled during negotiation (Bar cleanup).");
                    } else {
                        console.warn("SignalR not connected:", err.message);
                    }
                });

            return () => {
                connection.off("ReceiveNewOrder");
                connection.stop().catch(() => {
                    // Ignore stop errors
                });
            };
        }
    }, [connection]);

    const handleMarkReady = async (orderId: string) => {
        // ... (Mark ready logic same - assuming api handles generic ready)
        // Ideally should support partial ready or station specific ready, but for now simple correct.
        try {
            // In distributed system, we might need 'MarkBarItemReady', but 'MarkOrderAsReady' marks whole order.
            // If we mark whole order ready from Bar, Kitchen might be confused if they are not done.
            // BUT user requested "Mutfak ekranının aynısı".
            // For simplified KDS, marking "Ready" means "Ready from this station".
            // If backend only supports ONE status, then whoever clicks first marks order Ready.
            // This is a limitation of current Backend 'Order.Status'.
            // I will leave it as is, but warn user or just implement.
            const success = await markOrderAsReady(orderId);

            if (success) {
                setOrders((prev) => prev.filter((o) => o.id !== orderId));
            } else {
                console.error("Failed to mark order as ready");
            }
        } catch (error) {
            console.error("Error marking order ready:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <AppHeader />
            <div className="p-6 flex-1">
                <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-sky-500">Bar Ekranı</h1>
                        <p className="text-slate-400 text-sm">İçecek Sipariş Akışı</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-slate-900 rounded border border-slate-800">
                            <span className="text-xs text-slate-500 block">Bekleyen</span>
                            <span className="text-xl font-bold text-sky-400">{orders.length}</span>
                        </div>
                    </div>
                </header>

                {/* Grid Layout for Order Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.length === 0 ? (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">
                            <span className="text-5xl mb-4">🍹</span>
                            <p className="text-xl">İçecek siparişi yok, bekleniyor...</p>
                        </div>
                    ) : (
                        orders
                            .map(order => ({
                                ...order,
                                items: order.items.filter(i => i.preparationStation === 1) // 1 = Bar
                            }))
                            .filter(order => order.items.length > 0)
                            .map((order) => (
                                <Card
                                    key={order.id}
                                    className="bg-slate-900 border-none shadow-xl animate-in fade-in zoom-in duration-300 ring-2 ring-sky-500/20"
                                >
                                    <CardHeader className="bg-slate-800/50 p-4 rounded-t-xl flex flex-col justify-between items-start border-b border-slate-800">
                                        <div className="flex w-full justify-between items-center mb-2">
                                            <Badge className="bg-sky-600 text-white hover:bg-sky-700">YENİ İÇECEK</Badge>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold text-white mb-1">
                                                {order.tableName || "Masa ?"}
                                            </CardTitle>
                                            <p className="text-xs text-slate-400 font-mono">
                                                #{order.orderNumber.substring(8)}
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 space-y-4">
                                        {/* Order Items */}
                                        <ul className="space-y-4">
                                            {order.items.map((item, index) => (
                                                <li key={index} className="flex flex-col border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-slate-800 text-slate-200 w-6 h-6 flex items-center justify-center rounded text-sm font-bold">
                                                                {item.quantity}
                                                            </span>
                                                            <span className="font-semibold text-lg text-slate-200 leading-tight">
                                                                {item.productName}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Modifiers / Notes */}
                                                    <div className="pl-8 mt-1 space-y-1">
                                                        {item.modifiers && item.modifiers.map((mod, i) => (
                                                            <div key={i} className="text-sky-300 text-sm font-medium flex items-center gap-1">
                                                                <span>•</span> {mod.modifierName}
                                                            </div>
                                                        ))}
                                                        {item.notes && (
                                                            <div className="text-yellow-200/80 text-xs italic bg-yellow-900/20 p-1 rounded mt-1">
                                                                📝 {item.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="pt-4 mt-auto">
                                            <button
                                                onClick={() => handleMarkReady(order.id)}
                                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                ✅ HAZIR
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}
