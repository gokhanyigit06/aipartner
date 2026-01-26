import React from "react";
import { ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavProps {
    itemCount: number;
    totalAmount: number;
    onCartClick: () => void;
    className?: string;
}

export default function BottomNav({ itemCount, totalAmount, onCartClick, className }: BottomNavProps) {
    if (itemCount === 0) return null;

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 safe-area-bottom", className)}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Toplam Tutar</span>
                    <span className="text-xl font-bold text-slate-900">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount)}
                    </span>
                </div>

                <Button
                    onClick={onCartClick}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-200 rounded-xl h-12 text-lg font-semibold"
                >
                    <ShoppingBasket className="w-5 h-5 mr-2" />
                    Sepetim ({itemCount})
                </Button>
            </div>
        </div>
    );
}
