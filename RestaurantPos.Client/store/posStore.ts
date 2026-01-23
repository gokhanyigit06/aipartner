import { create } from 'zustand';
import { ProductDto, ModifierDto } from '@/types/pos';
import { getProducts, createOrder } from '@/lib/api';

export interface CartItem {
    cartId: string;
    product: ProductDto;
    selectedModifiers: ModifierDto[];
    quantity: number;
    totalPrice: number;
}

interface PosState {
    products: ProductDto[];
    cart: CartItem[];
    fetchProducts: () => Promise<void>;
    addToCart: (product: ProductDto, selectedModifiers: ModifierDto[]) => void;
    removeFromCart: (cartId: string) => void;
    clearCart: () => void;
    checkoutOrder: () => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
    products: [],
    cart: [],
    fetchProducts: async () => {
        try {
            const data = await getProducts();
            set({ products: data });
        } catch (error) {
            console.error("Store fetch failed", error);
        }
    },
    addToCart: (product, selectedModifiers) => {
        const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
        const itemTotalPrice = product.basePrice + modifiersPrice;

        const newItem: CartItem = {
            cartId: crypto.randomUUID(),
            product,
            selectedModifiers,
            quantity: 1,
            totalPrice: itemTotalPrice,
        };

        set((state) => ({
            cart: [...state.cart, newItem],
        }));
    },
    removeFromCart: (cartId) =>
        set((state) => ({
            cart: state.cart.filter((item) => item.cartId !== cartId),
        })),
    checkoutOrder: async () => {
        const state = get();
        if (state.cart.length === 0) return;

        // Dummy IDs for now
        const tenantId = "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // Default Guid
        const tableId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";  // Dummy string ID
        const tableName = "Masa 5"; // Hardcoded Table Name

        const orderDto = {
            tenantId,
            tableId,
            tableName,
            items: state.cart.map((item: CartItem) => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.basePrice,
                notes: "",
                modifiers: item.selectedModifiers.map((m: ModifierDto) => ({
                    modifierName: m.name,
                    price: m.priceAdjustment
                }))
            }))
        };

        const success = await createOrder(orderDto);
        if (success) {
            set({ cart: [] });
        }
    },
}));
