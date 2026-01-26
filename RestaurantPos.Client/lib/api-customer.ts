import { api } from "./api";

export interface CustomerInsightsDto {
    customerId: string;
    name: string;
    tier: string;
    points: number;
    lastVisit: string;
    lastOrders: OrderSummaryDto[];
    favoriteProducts: FavoriteProductDto[];
}

export interface OrderSummaryDto {
    id: string;
    date: string;
    total: number;
}

export interface FavoriteProductDto {
    productName: string;
    count: number;
}

export const CustomerApi = {
    search: async (phone: string) => {
        try {
            const res = await api.get<any>(`/customers/search?phone=${phone}`);

            // Search returns basic customer, fetch detailed insights immediately
            if (res.data && res.data.id) {
                return await CustomerApi.getInsights(res.data.id);
            }
            return null;
        } catch (e) {
            return null;
        }
    },
    getInsights: async (id: string) => {
        const res = await api.get<CustomerInsightsDto>(`/customers/${id}/insights`);
        return res.data;
    }
};
