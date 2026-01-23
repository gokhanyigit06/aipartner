export interface OrderCreateDto {
    tenantId: string;
    tableId: string;
    tableName: string; // Add Table Name
    items: OrderItemCreateDto[];
}

export interface OrderItemCreateDto {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
    modifiers: OrderItemModifierCreateDto[];
}

export interface OrderItemModifierCreateDto {
    modifierName: string;
    price: number;
}

export interface OrderDto {
    id: string;
    orderNumber: string;
    tableName: string; // Add
    totalAmount: number;
    status: string;
    items?: OrderItemDto[];
}

export interface OrderItemDto {
    id?: string;
    productName: string;
    quantity: number;
    notes?: string;
    modifiers?: OrderItemModifierDto[];
}

export interface OrderItemModifierDto {
    modifierName: string;
}
