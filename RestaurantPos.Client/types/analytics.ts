// Menü Mühendisliği - BCG Matrix Kategorileri
export enum MenuEngineeringCategory {
    Star = 0,       // Yıldız: Yüksek Satış + Yüksek Kâr
    Plow = 1,       // At (Plow Horse): Yüksek Satış + Düşük Kâr
    Puzzle = 2,     // Bulmaca (Puzzle): Düşük Satış + Yüksek Kâr
    Dog = 3         // Köpek: Düşük Satış + Düşük Kâr
}

// Menü Mühendisliği DTO
export interface MenuEngineeringDto {
    productId: string;
    productName: string;
    salesVolume: number;           // Satış Adedi
    profitMargin: number;          // Kâr Marjı (%)
    revenue: number;               // Toplam Gelir
    totalProfit: number;           // Toplam Kâr
    category: MenuEngineeringCategory;
}

// Yoğunluk Haritası - Saatlik Veri
export interface HeatmapDataDto {
    dayOfWeek: string;             // Pazartesi, Salı, etc.
    dayIndex: number;              // 0 = Pazartesi, 6 = Pazar
    hour: number;                  // 0-23
    averageRevenue: number;        // O saatteki ortalama ciro
    averageWaiters: number;        // O saatteki ortalama garson sayısı
    orderCount: number;            // O saatteki sipariş sayısı
    intensity: number;             // 0-1 arası normalize edilmiş yoğunluk
}

// Özet İstatistikler
export interface AnalyticsSummaryDto {
    totalRevenue: number;
    totalProfit: number;
    averageProfitMargin: number;
    totalOrders: number;
    totalProductsSold: number;
    bestSellingProduct: string;
    mostProfitableProduct: string;
    peakHour: string;              // En yoğun saat
    peakDay: string;               // En yoğun gün
}

// Genel Analytics Response
export interface AnalyticsResponseDto {
    menuEngineering: MenuEngineeringDto[];
    heatmapData: HeatmapDataDto[];
    summary: AnalyticsSummaryDto;
}
