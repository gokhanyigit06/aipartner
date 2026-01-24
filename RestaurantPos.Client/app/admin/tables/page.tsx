"use client";

import React, { useEffect, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getTables, createTable, deleteTable } from "@/lib/api";
import { Table, TableStatus } from "@/types/pos";
import { Trash2, Plus, Armchair, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function TablesAdminPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [newTableName, setNewTableName] = useState("");
    const [newTableCapacity, setNewTableCapacity] = useState(4);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setIsLoading(true);
        const data = await getTables();
        setTables(data);
        setIsLoading(false);
    };

    const handleCreateTable = async () => {
        if (!newTableName) {
            toast.warning("Lütfen masa adını girin.");
            return;
        }

        const success = await createTable(newTableName, newTableCapacity);
        if (success) {
            toast.success("Masa oluşturuldu.");
            setNewTableName("");
            setNewTableCapacity(4);
            setIsDialogOpen(false);
            fetchTables();
        } else {
            toast.error("Masa oluşturulamadı.");
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm("Bu masayı silmek istediğinize emin misiniz?")) return;

        const success = await deleteTable(id);
        if (success) {
            toast.success("Masa silindi.");
            fetchTables();
        } else {
            toast.error("Silme işlemi başarısız.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <AppHeader />
            <div className="container mx-auto p-6 max-w-6xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Masa Yönetimi</h1>
                        <p className="text-slate-500">Restoran yerleşim planını ve masa durumlarını yönetin.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Plus className="w-4 h-4" />
                                Yeni Masa Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Yeni Masa Oluştur</DialogTitle>
                                <DialogDescription>
                                    Masa adı ve kapasite bilgilerini girerek yeni bir masa ekleyin.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Masa Adı
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Örn: Bahçe 1"
                                        className="col-span-3"
                                        value={newTableName}
                                        onChange={(e) => setNewTableName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="capacity" className="text-right">
                                        Kapasite
                                    </Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min={1}
                                        className="col-span-3"
                                        value={newTableCapacity}
                                        onChange={(e) => setNewTableCapacity(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleCreateTable} className="bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    Kaydet
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Tables Grid */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-400">Masalar yükleniyor...</p>
                            </div>
                        ) : tables.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Armchair className="w-12 h-12 mb-4 text-slate-300" />
                                <p className="text-lg font-medium">Henüz masa eklenmemiş.</p>
                                <p className="text-sm">Sağ üstteki butonu kullanarak ilk masanızı ekleyin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {tables.map((table) => (
                                    <div key={table.id} className="relative group bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-green-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

                                        {/* Delete Button */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTable(table.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                                            ${table.status === TableStatus.Free ? 'bg-green-50 text-green-500' :
                                                table.status === TableStatus.Occupied ? 'bg-red-50 text-red-500' :
                                                    'bg-yellow-50 text-yellow-500'}`}>
                                            <Armchair className="w-8 h-8" />
                                        </div>

                                        <h3 className="font-bold text-lg text-slate-800 mb-1">{table.name}</h3>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                                {table.capacity} Kişilik
                                            </span>
                                        </div>

                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${table.status === TableStatus.Free ? 'bg-green-50 text-green-600 border-green-100' :
                                                table.status === TableStatus.Occupied ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-yellow-50 text-yellow-600 border-yellow-100'
                                            }`}>
                                            {table.status === TableStatus.Free ? 'Boş' :
                                                table.status === TableStatus.Occupied ? 'Dolu' : 'Rezerve'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
