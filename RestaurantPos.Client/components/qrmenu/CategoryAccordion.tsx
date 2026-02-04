
"use client";

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useMenu } from '@/store/menuStore';
import { CategoryDto, ProductDto } from '@/types/pos';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

interface CategoryAccordionProps {
    categories: CategoryDto[];
    products: ProductDto[];
    language: 'tr' | 'en';
}

export default function CategoryAccordion({ categories, products, language }: CategoryAccordionProps) {
    const { settings } = useMenu();
    const { addToCart } = useCartStore();

    const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Track open state for active categories (multiple can be open at a time).
    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(() => {
        if (categories.length > 0) {
            return [categories[0].id];
        }
        return [];
    });

    const toggleCategory = (id: string) => {
        const isOpening = !activeCategoryIds.includes(id);

        setActiveCategoryIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(c => c !== id);
            } else {
                return [...prev, id];
            }
        });

        if (isOpening) {
            // Scroll logic could be added here similar to original project if smooth behavior needed
        }
    };

    const handleProductClick = (product: ProductDto) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    const handleAddToBasket = (product: ProductDto, quantity: number, notes: string) => {
        addToCart({
            productId: product.id,
            name: product.name,
            price: product.discountedPrice || product.basePrice,
            quantity: quantity,
            modifiers: [], // Modifiers functionality pending, passing empty for now
            note: notes,
            image: product.imageUrl // Ensure cart shows image if available
        });
        toast.success(`${product.name} sepete eklendi`);
    };

    // Styling Maps
    const gapMap = {
        small: 'space-y-2',
        medium: 'space-y-4',
        large: 'space-y-8'
    };

    const heightMap = {
        small: 'h-20',
        medium: 'h-28',
        large: 'h-40'
    };

    const fontSizeMap = {
        medium: 'text-xl',
        large: 'text-2xl',
        xl: 'text-4xl'
    };

    const fontWeightMap = {
        normal: 'font-medium',
        bold: 'font-bold',
        black: 'font-black'
    };

    const trackingMap = {
        tighter: 'tracking-tighter',
        tight: 'tracking-tight',
        normal: 'tracking-normal',
        wide: 'tracking-wide',
        wider: 'tracking-wider',
        widest: 'tracking-widest'
    };

    const currentGap = gapMap[settings.categoryGap || 'medium'];
    const currentHeight = heightMap[settings.categoryRowHeight || 'medium'];
    const currentFontSize = fontSizeMap[settings.categoryFontSize || 'large'];
    const currentFontWeight = fontWeightMap[settings.categoryFontWeight || 'black'];
    const currentTracking = trackingMap[settings.categoryLetterSpacing || 'normal'];

    return (
        <>
            <ProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                product={selectedProduct}
                language={language}
                onAddToBasket={handleAddToBasket}
            />

            <div className={currentGap}>
                {[...categories]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((category) => {
                        // Filter products for this category
                        const categoryProducts = products.filter(p => p.categoryId === category.id);

                        const isOpen = activeCategoryIds.includes(category.id);
                        let displayName = category.name;

                        // Filter out categories with no products (Optional, maybe user wants to see empty categories?)
                        // if (categoryProducts.length === 0) return null;

                        return (
                            <div
                                key={category.id}
                                id={`category-${category.id}`}
                                className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300"
                            >
                                {/* Header Button */}
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className={`relative flex ${currentHeight} w-full items-center overflow-hidden text-left bg-slate-100 group`}
                                >
                                    {/* Background Image logic - if category has image or maybe utilize first product image */}
                                    {category.imageUrl ? (
                                        <div className="absolute inset-0 z-0">
                                            <Image
                                                src={category.imageUrl}
                                                alt={displayName}
                                                fill
                                                unoptimized
                                                className={cn(
                                                    "object-cover transition-opacity duration-300",
                                                )}
                                            />
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    backgroundColor: `rgba(0,0,0, ${settings.categoryOverlayOpacity !== undefined && settings.categoryOverlayOpacity !== null ? settings.categoryOverlayOpacity / 100 : 0.5})`
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        // Fallback Gradient if no image
                                        <div
                                            className="absolute inset-0 z-0 bg-gradient-to-r from-slate-800 to-slate-600"
                                        />
                                    )}

                                    {/* Content */}
                                    <div className="relative z-10 flex w-full items-center justify-between px-6">
                                        <div className="flex items-center w-full gap-4">
                                            {/* Category Icon could go here */}

                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3
                                                        className={`${currentFontSize} ${currentFontWeight} text-white drop-shadow-md ${currentTracking}`}
                                                        style={{ fontFamily: settings.categoryFontFamily ? `"${settings.categoryFontFamily}", sans-serif` : undefined }}
                                                    >
                                                        {displayName}
                                                    </h3>
                                                </div>

                                                <div className="flex items-center gap-2 text-white/80">
                                                    <p className="text-xs font-bold">
                                                        {categoryProducts.length} {language === 'en' ? 'Items' : 'Çeşit'}
                                                    </p>
                                                    {category.description && (
                                                        <span className="text-xs font-medium text-white/70 line-clamp-1 border-l border-white/30 pl-2">
                                                            {category.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-full bg-black/20 transition-transform duration-300 shrink-0 backdrop-blur-sm",
                                            isOpen ? "rotate-180 bg-white text-black" : "text-white"
                                        )}>
                                            <ChevronDown className="h-6 w-6" />
                                        </div>
                                    </div>
                                </button>

                                {/* Accordion Body / Products Grid */}
                                <div
                                    className={cn(
                                        "grid transition-all duration-300 ease-in-out",
                                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    )}
                                >
                                    <div className="overflow-hidden">
                                        <div className="grid gap-3 p-3 sm:p-4 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50">
                                            {categoryProducts.map((product) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    language={language}
                                                    // Layout mode could come from category settings later
                                                    layoutMode={'grid'}
                                                    onClick={() => handleProductClick(product)}
                                                />
                                            ))}
                                            {categoryProducts.length === 0 && (
                                                <div className="py-8 text-center text-gray-500 col-span-full">
                                                    Bu kategoride henüz ürün bulunmuyor.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </>
    );
}
