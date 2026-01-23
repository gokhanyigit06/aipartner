"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label"; // Shadcn Label
import { ProductDto, ModifierDto, ModifierGroupDto } from "@/types/pos";

interface ProductModalProps {
    product: ProductDto | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: ProductDto, modifiers: ModifierDto[]) => void;
}

export default function ProductModal({
    product,
    isOpen,
    onClose,
    onAddToCart,
}: ProductModalProps) {
    const [selectedModifiers, setSelectedModifiers] = useState<ModifierDto[]>([]);

    // Modal reset
    // Reset modifiers when product changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedModifiers([]);
        }
    }, [isOpen, product]); // This is actually what causes the lint if it thinks it causes a re-render loop. 
    // The linter error 'Calling setState synchronously within an effect' usually happens if you call it directly in body, not in useEffect.
    // Wait, let me check the file content again.
    // Line 35 is inside useEffect. The error says: "Calling setState synchronously within an effect". 
    // Ah, wait. The error log message: "Calling setState synchronously within an effect" usually refers to the function body, NOT inside useEffect.
    // Let's re-read the error log.
    // /Users/gokhanyigit/Desktop/aipartner/RestaurantPos.Client/components/ProductModal.tsx:35:13
    // 33 |     useEffect(() => {
    // 34 |         if (isOpen) {
    // > 35 |             setSelectedModifiers([]); 
    // It IS inside useEffect. 
    // Maybe checking if it's already empty would help? 
    // Or maybe the linter is just flagging it because it triggers a re-render immediately after mount.
    // Let's try: if (isOpen && selectedModifiers.length > 0) setSelectedModifiers([]);
    // But better yet, I will use a Key on the dialog or just ignore this specific rule if logic is sound.
    // For now, let's try to conditionally update only if needed.

    if (!product) return null;

    // Handle Radio Change (Single Selection: 0)
    const handleRadioChange = (group: ModifierGroupDto, modifierId: string) => {
        const selectedModifier = group.modifiers.find((m) => m.id === modifierId);
        if (!selectedModifier) return;

        setSelectedModifiers((prev) => {
            // Remove any existing modifier from this group
            const filtered = prev.filter(
                (m) => !group.modifiers.some((gm) => gm.id === m.id)
            );
            // Add the new one
            return [...filtered, selectedModifier];
        });
    };

    // Handle Checkbox Change (Multiple Selection: 1)
    const handleCheckboxChange = (
        checked: boolean,
        group: ModifierGroupDto,
        modifier: ModifierDto
    ) => {
        setSelectedModifiers((prev) => {
            if (checked) {
                return [...prev, modifier];
            } else {
                return prev.filter((m) => m.id !== modifier.id);
            }
        });
    };

    const calculateTotal = () => {
        const modifiersPrice = selectedModifiers.reduce(
            (sum, m) => sum + m.priceAdjustment,
            0
        );
        return product.basePrice + modifiersPrice;
    };

    const handleAddToCart = () => {
        onAddToCart(product, selectedModifiers);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">

                <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        {product.name}
                    </DialogTitle>
                    <p className="text-slate-500 font-medium">{product.basePrice} ₺</p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {product.modifierGroups && product.modifierGroups.length > 0 ? (
                        product.modifierGroups.map((group) => (
                            <div key={group.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-slate-800">
                                        {group.name}
                                    </h3>
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                                        {group.selectionType === 0 ? "Zorunlu Seçim" : "İsteğe Bağlı"}
                                    </span>
                                </div>

                                {group.selectionType === 0 ? (
                                    /* SINGLE SELECTION (Radio) */
                                    <RadioGroup
                                        onValueChange={(val) => handleRadioChange(group, val)}
                                        className="flex flex-col gap-3"
                                    >
                                        {group.modifiers.map((modifier) => {
                                            const isSelected = selectedModifiers.some(
                                                (m) => m.id === modifier.id
                                            );
                                            const fullModifierId = `radio-${group.id}-${modifier.id}`;

                                            return (
                                                <div
                                                    key={modifier.id}
                                                    className={`
                            flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer
                            ${isSelected ? "border-green-500 bg-green-50/50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
                          `}
                                                    onClick={() => handleRadioChange(group, modifier.id)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <RadioGroupItem value={modifier.id} id={fullModifierId} className="border-slate-400 text-green-600 focus:ring-green-600" />
                                                        <Label htmlFor={fullModifierId} className="cursor-pointer font-medium text-slate-700 text-base">
                                                            {modifier.name}
                                                        </Label>
                                                    </div>
                                                    {modifier.priceAdjustment > 0 && (
                                                        <span className="text-sm font-semibold text-green-600">
                                                            +{modifier.priceAdjustment} ₺
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                ) : (
                                    /* MULTIPLE SELECTION (Checkbox) */
                                    <div className="flex flex-col gap-3">
                                        {group.modifiers.map((modifier) => {
                                            const isChecked = selectedModifiers.some(
                                                (m) => m.id === modifier.id
                                            );
                                            const fullModifierId = `check-${group.id}-${modifier.id}`;

                                            return (
                                                <div
                                                    key={modifier.id}
                                                    className={`
                            flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer
                            ${isChecked ? "border-green-500 bg-green-50/50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
                          `}
                                                    onClick={() => handleCheckboxChange(!isChecked, group, modifier)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={fullModifierId}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, group, modifier)}
                                                            className="w-5 h-5 border-slate-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                        />
                                                        <Label htmlFor={fullModifierId} className="cursor-pointer font-medium text-slate-700 text-base">
                                                            {modifier.name}
                                                        </Label>
                                                    </div>
                                                    {modifier.priceAdjustment > 0 && (
                                                        <span className="text-sm font-semibold text-green-600">
                                                            +{modifier.priceAdjustment} ₺
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <span className="text-4xl mb-2">🍽️</span>
                            <p>Bu ürün için ekstra seçenek bulunmuyor.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
                    <div className="flex flex-col w-full gap-4">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-medium text-slate-600">Toplam Tutar:</span>
                            <span className="text-2xl font-bold text-slate-900">{calculateTotal()} ₺</span>
                        </div>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg rounded-xl shadow-lg shadow-green-200"
                            onClick={handleAddToCart}
                        >
                            Sepete Ekle
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
