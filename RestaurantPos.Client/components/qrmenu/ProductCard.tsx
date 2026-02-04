
"use client";

import { useMenu } from '@/store/menuStore';
import { ProductDto } from '@/types/pos';
import { cn } from '@/lib/utils';
import { Flame, Leaf, Wheat } from 'lucide-react';
import { ALLERGENS } from '@/lib/allergens';
import Image from 'next/image';

interface ProductCardProps {
    product: ProductDto;
    language: 'tr' | 'en';
    onClick?: () => void;
    layoutMode?: 'grid' | 'list' | 'list-no-image';
}

export default function ProductCard({ product, language, onClick, layoutMode = 'grid' }: ProductCardProps) {
    const { settings } = useMenu();

    const displayName = product.name; // In current legacy POS we only have 'name', no 'nameEn' yet
    const displayDescription = product.description;

    // Helper to get icon (Placeholder for future tag system)
    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'pepper': return <Flame className="h-3 w-3" />;
            case 'leaf': return <Leaf className="h-3 w-3" />;
            case 'wheat': return <Wheat className="h-3 w-3" />;
            default: return null;
        }
    };

    // Dynamic Styles from Settings
    const titleSize = {
        medium: 'text-lg',
        large: 'text-xl',
        xl: 'text-2xl'
    }[settings.productTitleSize || 'large'];

    const descriptionSize = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base'
    }[settings.productDescriptionSize || 'medium'];

    const priceSize = {
        medium: 'text-lg',
        large: 'text-xl',
        xl: 'text-2xl'
    }[settings.productPriceSize || 'large'];

    // Fallback image logic
    const imageSrc = (product.imageUrl && product.imageUrl.length > 5)
        ? product.imageUrl
        : (settings.defaultProductImage && settings.defaultProductImage.length > 5)
            ? settings.defaultProductImage
            : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';

    // Helper to format title (break line on parenthesis)
    const formatTitle = (title: string) => {
        if (!title) return "";
        const parts = title.split('(');
        if (parts.length > 1) {
            const mainPart = parts[0];
            const secondaryPart = '(' + parts.slice(1).join('(');
            return (
                <span>
                    {mainPart}
                    <span className="block mt-1">
                        {secondaryPart}
                    </span>
                </span>
            );
        }
        return title;
    };

    const formattedPrice = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.basePrice);
    const formattedDiscountPrice = product.discountedPrice
        ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.discountedPrice)
        : null;

    // RENDER: GRID (Standard with Image)
    return (
        <div
            onClick={onClick}
            className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer h-full"
        >

            {/* Large Top Image */}
            <div className="relative aspect-square w-full bg-white">
                <Image
                    src={imageSrc}
                    alt={displayName}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.discountedPrice && (
                    <div className="absolute top-3 left-3 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
                        {language === 'en' ? 'Sale' : 'İndirim'}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-6">
                {/* Title and Price Row */}
                <div className="mb-2 flex items-start justify-between gap-4">
                    <h3
                        className={cn("font-serif font-bold leading-tight tracking-wide", titleSize)}
                        style={{ color: settings.productTitleColor }}
                    >
                        {formatTitle(displayName?.toLocaleUpperCase('tr-TR'))}
                    </h3>
                    <div className="flex flex-col items-end shrink-0">
                        {product.discountedPrice ? (
                            <>
                                <span className="text-xs text-gray-400 line-through">{formattedPrice}</span>
                                <span
                                    className={cn("font-bold", priceSize)}
                                    style={{ color: settings.productPriceColor }}
                                >
                                    {formattedDiscountPrice}
                                </span>
                            </>
                        ) : (
                            <span
                                className={cn("font-bold", priceSize)}
                                style={{ color: settings.productPriceColor }}
                            >
                                {formattedPrice}
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p
                    className={cn("mb-4 leading-relaxed line-clamp-2", descriptionSize)}
                    style={{ color: settings.productDescriptionColor }}
                >
                    {displayDescription}
                </p>

                {/* Allergen Icons (Mock for now, as ProductDto might not have list of allergen names yet, just a flag) */}
                {/* 
                {product.allergens && product.allergens.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        ...
                    </div>
                )}
                */}

                {/* Tags / Allergens Footer */}
                {/* 
                {product.tags && product.tags.length > 0 && (
                     ...
                )} 
                */}
            </div>
        </div>
    );
}
