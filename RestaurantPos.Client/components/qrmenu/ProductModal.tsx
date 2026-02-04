
"use client";

import { useMenu } from '@/store/menuStore';
import { ProductDto } from '@/types/pos';
import { cn } from '@/lib/utils';
import { X, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDto | null;
    language: 'tr' | 'en';
    onAddToBasket: (product: ProductDto, quantity: number, notes: string) => void;
}

export default function ProductModal({ isOpen, onClose, product, language, onAddToBasket }: ProductModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const { settings } = useMenu();
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
            setQuantity(1);
            setNote("");
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;
    if (!product) return null;

    const displayName = product.name;
    const displayDescription = product.description;

    // Theme Color Logic
    const themeTextColors: Record<string, string> = {
        black: 'text-amber-600',
        white: 'text-black',
        blue: 'text-blue-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
        green: 'text-green-600'
    };

    // Determine active color based on theme
    const activeColor = settings.themeColor || 'black';
    const activeColorClass = themeTextColors[activeColor] || 'text-amber-600';

    // Also need bg color for button
    const getButtonColorClass = () => {
        switch (activeColor) {
            case 'black': return 'bg-black hover:bg-gray-800 text-white';
            case 'white': return 'bg-white hover:bg-gray-100 text-black border border-gray-200';
            case 'blue': return 'bg-blue-600 hover:bg-blue-700 text-white';
            case 'orange': return 'bg-orange-500 hover:bg-orange-600 text-white';
            case 'red': return 'bg-red-600 hover:bg-red-700 text-white';
            case 'green': return 'bg-green-600 hover:bg-green-700 text-white';
            default: return 'bg-black hover:bg-gray-800 text-white';
        }
    }

    const imageSrc = (product.imageUrl && product.imageUrl.length > 5)
        ? product.imageUrl
        : (settings.defaultProductImage && settings.defaultProductImage.length > 5)
            ? settings.defaultProductImage
            : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';

    const handleAdd = () => {
        onAddToBasket(product, quantity, note);
        onClose();
    };

    const formattedPrice = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.basePrice);
    const formattedDiscountPrice = product.discountedPrice
        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.discountedPrice)
        : null;

    return (
        <div className={cn(
            "fixed inset-0 z-[60] flex items-center justify-center px-4 transition-all duration-300",
            isOpen ? "visible opacity-100" : "invisible opacity-0"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 transform flex flex-col max-h-[90vh]",
                    isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-95"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto">
                    {/* Product Image */}
                    <div className="relative aspect-square w-full bg-gray-100 sm:aspect-video">
                        <Image
                            src={imageSrc}
                            alt={displayName}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    </div>

                    {/* Details */}
                    <div className="p-6 md:p-8">
                        <h2 className="font-serif text-3xl font-black leading-tight tracking-wide text-gray-900 mb-2">
                            {displayName.toLocaleUpperCase('tr-TR')}
                        </h2>

                        <div className="flex items-center gap-3 mb-6">
                            {product.discountedPrice ? (
                                <>
                                    <span className={cn("text-3xl font-bold", activeColorClass)}>
                                        {formattedDiscountPrice}
                                    </span>
                                    <span className="text-lg text-gray-400 line-through font-medium">
                                        {formattedPrice}
                                    </span>
                                </>
                            ) : (
                                <span className={cn("text-3xl font-bold", activeColorClass)}>
                                    {formattedPrice}
                                </span>
                            )}
                        </div>

                        {displayDescription && (
                            <p className="text-lg text-gray-600 leading-relaxed font-medium mb-6">
                                {displayDescription}
                            </p>
                        )}

                        {/* Note Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Not Ekle
                            </label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                                rows={2}
                                placeholder="Özel isteğiniz var mı?"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        {/* Quantity and Add Button - Sticky Bottom for better UX could be nice, but inline here for simplicity */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            {/* Quantity */}
                            <div className="flex items-center justify-between rounded-xl bg-gray-100 p-1 w-full sm:w-auto">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white shadow-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="w-12 text-center font-bold text-lg text-gray-900">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white shadow-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Add Button */}
                            <Button
                                className={cn("flex-1 h-12 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95", getButtonColorClass())}
                                onClick={handleAdd}
                            >
                                Sepete Ekle - {
                                    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                                        .format((product.discountedPrice || product.basePrice) * quantity)
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
