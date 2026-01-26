import { api } from "./api";

export interface Supplier {
    id?: string;
    name: string;
    contactInfo: string;
    leadTimeDays: number;
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    supplier?: Supplier;
    orderNumber: string;
    status: number; // 0=Draft, 1=Approved, 2=Received
    totalAmount: number;
    expectedDate: string;
    receivedDate?: string;
    items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
    id?: string;
    rawMaterialId: string;
    rawMaterialName?: string; // Optional helper
    quantity: number;
    unitPrice: number;
}

export interface SuggestedOrderDto {
    rawMaterialId: string;
    rawMaterialName: string;
    currentStock: number;
    minimumStockLevel: number;
    suggestedQuantity: number;
    unit: string;
    estimatedCost: number;
}

export const ProcurementApi = {
    getSuggestions: async () => {
        const res = await api.get<SuggestedOrderDto[]>("/procurement/suggestions");
        return res.data;
    },
    getSuppliers: async () => {
        const res = await api.get<Supplier[]>("/procurement/suppliers");
        return res.data;
    },
    createSupplier: async (supplier: Supplier) => {
        const res = await api.post<Supplier>("/procurement/suppliers", supplier);
        return res.data;
    },
    getOrders: async () => {
        const res = await api.get<PurchaseOrder[]>("/procurement/orders");
        return res.data;
    },
    createOrder: async (order: Partial<PurchaseOrder>) => {
        const res = await api.post<PurchaseOrder>("/procurement/orders", order);
        return res.data;
    },
    updateStatus: async (id: string, status: number) => {
        const res = await api.put<PurchaseOrder>(`/procurement/orders/${id}/status?status=${status}`);
        return res.data;
    }
};
