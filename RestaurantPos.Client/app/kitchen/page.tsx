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

export default function KitchenPage() {
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const [connection, setConnection] = useState<HubConnection | null>(null);

    // 0. Initial Load of Active Orders (Fix refresh data loss)
    useEffect(() => {
        const fetchActiveOrders = async () => {
            try {
                console.log("Fetching active orders...");
                const data = await getActiveOrders();
                console.log("Active orders fetched:", data);
                // Active orders might return empty list on error too, but api logs error.
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch active orders:", error);
            }
        };

        fetchActiveOrders();
    }, []);

    useEffect(() => {
        // 1. Setup SignalR Connection
        const newConnection = new HubConnectionBuilder()
            .withUrl("http://localhost:5001/kitchenHub", {
                accessTokenFactory: () => useAuthStore.getState().user?.token || ""
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        setConnection(newConnection);

        // Return cleanup
        return () => {
            newConnection.stop().catch(() => {
                // Ignore stop errors
            });
        };
    }, []);

    useEffect(() => {
        if (connection) {
            connection
                .start()
                .then(() => {
                    console.log("SignalR Connected to KitchenHub");

                    // 2. Listen for 'ReceiveNewOrder'
                    connection.on("ReceiveNewOrder", (newOrder: KdsOrder) => {
                        console.log("New Order Received:", newOrder);
                        // Add new order to the top of the list
                        setOrders((prev) => [newOrder, ...prev]);
                    });
                })
                .catch((err) => {
                    console.warn("SignalR bağlantısı kurulamadı (Backend çalışmıyor olabilir):", err.message);
                    // Don't show error to user, just log it
                });

            return () => {
                connection.stop().catch(() => {
                    // Ignore stop errors
                });
            };
        }
    }, [connection]);

    const handleMarkReady = async (orderId: string) => {
        try {
            const success = await markOrderAsReady(orderId);

            if (success) {
                // Remove from list or move to 'Completed' (for now removing)
                setOrders((prev) => prev.filter((o) => o.id !== orderId));
            } else {
                console.error("Failed to mark order as ready");
            }
        } catch (error) {
            console.error("Error marking order ready:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            <AppHeader />
            <div className="p-6 flex-1">
                <header className="mb-8 flex items-center justify-between border-b border-slate-700 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-orange-500">KDS Ekranı</h1>
                        <p className="text-slate-400 text-sm">Canlı Mutfak Akışı</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-slate-800 rounded border border-slate-700">
                            <span className="text-xs text-slate-500 block">Bekleyen</span>
                            <span className="text-xl font-bold text-orange-400">{orders.length}</span>
                        </div>
                        <div className="px-4 py-2 bg-slate-800 rounded border border-slate-700">
                            <span className="text-xs text-slate-500 block">Tamamlanan</span>
                            <span className="text-xl font-bold text-green-400">0</span>
                        </div>
                    </div>
                </header>

                {/* Grid Layout for Order Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.length === 0 ? (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">
                            <span className="text-5xl mb-4">👨‍🍳</span>
                            <p className="text-xl">Henüz sipariş yok, bekleniyor...</p>
                        </div>
                    ) : (
                        orders
                            .map(order => ({
                                ...order,
                                items: order.items.filter(i => i.preparationStation === 0 || i.preparationStation === undefined)
                            }))
                            .filter(order => order.items.length > 0)
                            .map((order) => (
                                <Card
                                    key={order.id}
                                    className="bg-slate-800 border-none shadow-xl animate-in fade-in zoom-in duration-300 ring-2 ring-orange-500/20"
                                >
                                    <CardHeader className="bg-slate-700/50 p-4 rounded-t-xl flex flex-col justify-between items-start border-b border-slate-700">
                                        <div className="flex w-full justify-between items-center mb-2">
                                            <Badge className="bg-orange-500 text-white hover:bg-orange-600">YENİ</Badge>
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
                                                <li key={index} className="flex flex-col border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-slate-700 text-slate-200 w-6 h-6 flex items-center justify-center rounded text-sm font-bold">
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
                                                            <div key={i} className="text-orange-300 text-sm font-medium flex items-center gap-1">
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
                                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                ✅ HAZIR (Servis Et)
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
