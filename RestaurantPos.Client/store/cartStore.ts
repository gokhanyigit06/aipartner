
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
    modifiers?: { modifierName: string; price: number }[];
}

interface CartStore {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string, modifiers?: any[]) => void;
    updateQuantity: (productId: string, quantity: number, modifiers?: any[]) => void;
    clearCart: () => void;
    totalAmount: () => number;
    itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addToCart: (newItem) => set((state) => {
                const existingItemIndex = state.items.findIndex(
                    item => item.productId === newItem.productId &&
                        JSON.stringify(item.modifiers) === JSON.stringify(newItem.modifiers)
                );

                if (existingItemIndex > -1) {
                    const updatedItems = [...state.items];
                    updatedItems[existingItemIndex].quantity += newItem.quantity;
                    return { items: updatedItems };
                }

                return { items: [...state.items, newItem] };
            }),
            removeFromCart: (productId, modifiers) => set((state) => ({
                items: state.items.filter(item =>
                    !(item.productId === productId &&
                        JSON.stringify(item.modifiers) === JSON.stringify(modifiers))
                )
            })),
            updateQuantity: (productId, quantity, modifiers) => set((state) => {
                if (quantity <= 0) {
                    return {
                        items: state.items.filter(item =>
                            !(item.productId === productId &&
                                JSON.stringify(item.modifiers) === JSON.stringify(modifiers))
                        )
                    };
                }

                return {
                    items: state.items.map(item => {
                        if (item.productId === productId &&
                            JSON.stringify(item.modifiers) === JSON.stringify(modifiers)) {
                            return { ...item, quantity };
                        }
                        return item;
                    })
                };
            }),
            clearCart: () => set({ items: [] }),
            totalAmount: () => {
                const items = get().items;
                return items.reduce((total, item) => {
                    const itemTotal = item.price * item.quantity;
                    const modifiersTotal = (item.modifiers || []).reduce((sum, m) => sum + m.price, 0) * item.quantity;
                    return total + itemTotal + modifiersTotal;
                }, 0);
            },
            itemCount: () => {
                return get().items.reduce((sum, item) => sum + item.quantity, 0);
            }
        }),
        {
            name: 'restaurant-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
