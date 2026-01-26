import { ProductDto, Table, TableStatus } from "@/types/pos";
import { OrderCreateDto, OrderDto } from "@/types/order";
import { useAuthStore } from "@/store/authStore";

export interface RawMaterial {
    id: string;
    name: string;
    unit: number;
    currentStock: number;
    minimumAlertLevel: number;
    costPerUnit: number;
}

export const UnitLabels = ["Gram", "Kilogram", "Adet", "Litre", "Mililitre"];

export async function getRawMaterials(): Promise<RawMaterial[]> {
    try {
        const response = await api.get('/rawmaterials');
        return response.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createRawMaterial(data: any): Promise<boolean> {
    try {
        await api.post('/rawmaterials', data);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function addRecipeItem(data: { productId: string, rawMaterialId: string, amount: number }): Promise<boolean> {
    try {
        // Only send DTO fields
        await api.post(`/products/${data.productId}/recipes`, {
            rawMaterialId: data.rawMaterialId,
            amount: data.amount
        });
        return true;
    } catch (error) {
        console.error("addRecipeItem failed:", error);
        throw error; // Re-throw to be caught by UI
    }
}

export async function deleteRecipeItem(id: string): Promise<boolean> {
    try {
        await api.delete(`/recipeitems/${id}`);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const API_BASE_URL = "http://localhost:5001/api";

const getAuthHeaders = () => {
    const token = useAuthStore.getState().user?.token;
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
};

export async function getTables(): Promise<Table[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/tables`, {
            cache: "no-store",
            headers: getAuthHeaders(),
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch tables:", error);
        return [];
    }
}

export async function createTable(name: string, capacity: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/tables`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, capacity, status: TableStatus.Free })
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to create table:", error);
        return false;
    }
}

export async function deleteTable(id: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/tables/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to delete table:", error);
        return false;
    }
}

export async function updateTableStatus(id: string, status: TableStatus): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/tables/${id}/status`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(status)
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to update table status:", error);
        return false;
    }
}

export async function getProducts(): Promise<ProductDto[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            cache: "no-store",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Error fetching products: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export async function createProduct(productData: any): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(productData),
        });

        if (!response.ok || response.status !== 201) {
            const errorText = await response.text();
            throw new Error(`Error creating product: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return true;
    } catch (error) {
        console.error("Failed to create product:", error);
        return false;
    }
}

export async function createOrder(orderData: OrderCreateDto): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error creating order: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error("Failed to create order:", error);
        return false;
    }
}

export async function getActiveOrders(): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/active`, {
            cache: "no-store",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Error fetching active orders: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch active orders:", error);
        return [];
    }
}

export async function markOrderAsReady(orderId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/ready`, {
            method: "PUT",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Error marking order ready: ${response.statusText}`);
        }
        return true;
    } catch (error) {
        console.error("Failed to mark order ready:", error);
        return false;
    }
}

export async function getCashierOrders(): Promise<OrderDto[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/cashier`, {
            cache: "no-store",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Error fetching cashier orders: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch cashier orders:", error);
        return [];
    }
}

export async function payOrder(orderId: string, paymentMethod: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/checkout?paymentMethod=${encodeURIComponent(paymentMethod)}`, {
            method: "PUT",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Error paying order: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error("Failed to pay order:", error);
        return false;
    }
}

export async function login(username: string, password: string): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
}

// Generic API client for axios-like usage
export const api = {
    get: async <T = any>(endpoint: string) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            cache: "no-store",
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
        }
        const text = await response.text();
        return { data: text ? JSON.parse(text) : null as T };
    },
    post: async <T = any>(endpoint: string, data: any) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
        }
        const text = await response.text();
        return { data: text ? JSON.parse(text) : null as T };
    },
    put: async <T = any>(endpoint: string, data?: any) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
        }
        const text = await response.text();
        return { data: text ? JSON.parse(text) : null as T };
    },
    delete: async <T = any>(endpoint: string) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || response.statusText);
        }
        const text = await response.text();
        return { data: text ? JSON.parse(text) : null as T };
    }
};

