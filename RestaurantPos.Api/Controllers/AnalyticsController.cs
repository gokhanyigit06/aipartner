using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.DTOs;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly PosDbContext _context;

        public AnalyticsController(PosDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gelişmiş Analitik ve İş Zekası Verileri
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<AnalyticsResponseDto>> GetAnalytics(
            [FromQuery] Guid tenantId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            // Varsayılan tarih aralığı: Son 30 gün
            var start = startDate.HasValue 
                ? DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc) 
                : DateTime.UtcNow.AddDays(-30);
            var end = endDate.HasValue 
                ? DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc) 
                : DateTime.UtcNow;

            // Sipariş verilerini çek (Sadece ödenen siparişler)
            var orders = await _context.Orders
                .Where(o => o.TenantId == tenantId 
                    && o.Status == OrderStatus.Paid 
                    && o.CreatedAt >= start 
                    && o.CreatedAt <= end)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Waiter)
                .ToListAsync();

            if (!orders.Any())
            {
                return Ok(new AnalyticsResponseDto
                {
                    MenuEngineering = new List<MenuEngineeringDto>(),
                    HeatmapData = new List<HeatmapDataDto>(),
                    Summary = new AnalyticsSummaryDto()
                });
            }

            // 1. Menü Mühendisliği Analizi
            var menuEngineering = CalculateMenuEngineering(orders);

            // 2. Yoğunluk Haritası
            var heatmapData = CalculateHeatmapData(orders);

            // 3. Özet İstatistikler
            var summary = CalculateSummary(orders, menuEngineering, heatmapData);

            return Ok(new AnalyticsResponseDto
            {
                MenuEngineering = menuEngineering,
                HeatmapData = heatmapData,
                Summary = summary
            });
        }

        /// <summary>
        /// Menü Mühendisliği (BCG Matrix) Hesaplama
        /// </summary>
        private List<MenuEngineeringDto> CalculateMenuEngineering(List<Order> orders)
        {
            // Ürün bazında satış ve kâr analizi
            var productStats = orders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => new { oi.ProductId, oi.ProductName })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    SalesVolume = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.Price * oi.Quantity),
                    // Kâr hesaplama: Ürünün CostPrice'ı varsa kullan
                    TotalCost = g.Sum(oi => (oi.Product?.CostPrice ?? 0) * oi.Quantity),
                })
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductName,
                    p.SalesVolume,
                    p.Revenue,
                    TotalProfit = p.Revenue - p.TotalCost,
                    ProfitMargin = p.Revenue > 0 ? ((p.Revenue - p.TotalCost) / p.Revenue) * 100 : 0
                })
                .ToList();

            if (!productStats.Any())
                return new List<MenuEngineeringDto>();

            // Medyan hesaplama (BCG Matrix için)
            var medianSales = CalculateMedian(productStats.Select(p => (double)p.SalesVolume).ToList());
            var medianMargin = CalculateMedian(productStats.Select(p => (double)p.ProfitMargin).ToList());

            // Kategorilere ayırma
            var result = productStats.Select(p => new MenuEngineeringDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                SalesVolume = p.SalesVolume,
                ProfitMargin = p.ProfitMargin,
                Revenue = p.Revenue,
                TotalProfit = p.TotalProfit,
                Category = CategorizeProduct(p.SalesVolume, p.ProfitMargin, medianSales, medianMargin)
            }).ToList();

            return result;
        }

        /// <summary>
        /// BCG Matrix Kategorizasyonu
        /// </summary>
        private MenuEngineeringCategory CategorizeProduct(
            int salesVolume, 
            decimal profitMargin, 
            double medianSales, 
            double medianMargin)
        {
            bool highSales = salesVolume >= medianSales;
            bool highMargin = profitMargin >= (decimal)medianMargin;

            if (highSales && highMargin)
                return MenuEngineeringCategory.Star;      // Yıldız
            else if (highSales && !highMargin)
                return MenuEngineeringCategory.Plow;      // At
            else if (!highSales && highMargin)
                return MenuEngineeringCategory.Puzzle;    // Bulmaca
            else
                return MenuEngineeringCategory.Dog;       // Köpek
        }

        /// <summary>
        /// Medyan hesaplama yardımcı fonksiyonu
        /// </summary>
        private double CalculateMedian(List<double> values)
        {
            if (!values.Any()) return 0;
            
            var sorted = values.OrderBy(v => v).ToList();
            int count = sorted.Count;
            
            if (count % 2 == 0)
                return (sorted[count / 2 - 1] + sorted[count / 2]) / 2.0;
            else
                return sorted[count / 2];
        }

        /// <summary>
        /// Yoğunluk Haritası Hesaplama
        /// </summary>
        private List<HeatmapDataDto> CalculateHeatmapData(List<Order> orders)
        {
            var turkishDays = new[] { "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar" };
            
            // Gün ve saat bazında gruplama
            var hourlyData = orders
                .GroupBy(o => new
                {
                    DayOfWeek = (int)o.CreatedAt.DayOfWeek,
                    Hour = o.CreatedAt.Hour
                })
                .Select(g => new
                {
                    DayIndex = g.Key.DayOfWeek == 0 ? 6 : g.Key.DayOfWeek - 1, // Pazartesi = 0
                    g.Key.Hour,
                    AverageRevenue = g.Average(o => o.TotalAmount),
                    OrderCount = g.Count(),
                    // Garson sayısı: Benzersiz garsonlar
                    AverageWaiters = g.Select(o => o.WaiterId).Distinct().Count()
                })
                .ToList();

            if (!hourlyData.Any())
                return new List<HeatmapDataDto>();

            // Yoğunluk normalizasyonu (0-1 arası)
            var maxRevenue = hourlyData.Max(h => h.AverageRevenue);
            
            var result = hourlyData.Select(h => new HeatmapDataDto
            {
                DayOfWeek = turkishDays[h.DayIndex],
                DayIndex = h.DayIndex,
                Hour = h.Hour,
                AverageRevenue = h.AverageRevenue,
                AverageWaiters = h.AverageWaiters,
                OrderCount = h.OrderCount,
                Intensity = maxRevenue > 0 ? (double)(h.AverageRevenue / maxRevenue) : 0
            }).ToList();

            return result;
        }

        /// <summary>
        /// Özet İstatistikler
        /// </summary>
        private AnalyticsSummaryDto CalculateSummary(
            List<Order> orders, 
            List<MenuEngineeringDto> menuEngineering,
            List<HeatmapDataDto> heatmapData)
        {
            var totalRevenue = orders.Sum(o => o.TotalAmount);
            var totalProfit = orders.Sum(o => o.NetProfit);
            var totalOrders = orders.Count;
            var totalProductsSold = orders.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity);

            var bestSelling = menuEngineering
                .OrderByDescending(m => m.SalesVolume)
                .FirstOrDefault();

            var mostProfitable = menuEngineering
                .OrderByDescending(m => m.TotalProfit)
                .FirstOrDefault();

            var peakHourData = heatmapData
                .OrderByDescending(h => h.AverageRevenue)
                .FirstOrDefault();

            var peakDayData = heatmapData
                .GroupBy(h => h.DayOfWeek)
                .Select(g => new { Day = g.Key, Revenue = g.Sum(h => h.AverageRevenue) })
                .OrderByDescending(d => d.Revenue)
                .FirstOrDefault();

            return new AnalyticsSummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalProfit = totalProfit,
                AverageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
                TotalOrders = totalOrders,
                TotalProductsSold = totalProductsSold,
                BestSellingProduct = bestSelling?.ProductName ?? "N/A",
                MostProfitableProduct = mostProfitable?.ProductName ?? "N/A",
                PeakHour = peakHourData != null ? $"{peakHourData.Hour}:00" : "N/A",
                PeakDay = peakDayData?.Day ?? "N/A"
            };
        }
    }
}
