import { ProductDto } from "@/types/pos";
import { OrderCreateDto } from "@/types/order";

const API_BASE_URL = "http://localhost:5001/api";

export async function getProducts(): Promise<ProductDto[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            cache: "no-store", // Ensure fresh data
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

export async function createOrder(orderData: OrderCreateDto): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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
