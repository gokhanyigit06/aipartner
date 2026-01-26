using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.DTOs;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Services
{
    public class ReportService : IReportService
    {
        private readonly PosDbContext _context;

        public ReportService(PosDbContext context)
        {
            _context = context;
        }

        public async Task<ProfitLossReportDto> GetProfitLossReportAsync(DateTime startDate, DateTime endDate)
        {
            // GELEN TARİHLERİ ZORLA UTC'YE ÇEVİRİYORUZ
            startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

             // 0. Günlük Dağılım İçin Raw Data
            var rawOrders = await _context.Orders
                .AsNoTracking()
                .Where(o => o.Status == OrderStatus.Paid && 
                            o.CreatedAt >= startDate && 
                            o.CreatedAt <= endDate)
                .Select(o => new { o.CreatedAt, o.TotalAmount, o.TotalCost, o.NetProfit })
                .ToListAsync();

            // 0.1 Labor Costs (Daily)
            var laborCosts = await _context.TimeEntries
                .AsNoTracking()
                .Where(te => te.Date >= startDate && te.Date <= endDate)
                .GroupBy(te => te.Date)
                .Select(g => new { Date = g.Key, TotalCost = g.Sum(te => te.TotalCost) })
                .ToListAsync();

            var dailyStats = rawOrders
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => 
                {
                    var dayLabor = laborCosts.FirstOrDefault(l => l.Date == g.Key)?.TotalCost ?? 0;
                    var revenue = g.Sum(x => x.TotalAmount);
                    var cogs = g.Sum(x => x.TotalCost);
                    
                    // Net Profit = Revenue - COGS - Labor
                    var netProfit = revenue - cogs - dayLabor;

                    return new DailyProfitLossDto
                    {
                        Date = g.Key,
                        Revenue = revenue,
                        Cost = cogs,
                        LaborCost = dayLabor,
                        NetProfit = netProfit,
                        Margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
                    };
                })
                .OrderBy(d => d.Date)
                .ToList();

            // 1. Satış Verilerini Getir (Product Wise)
            // Performans için AsNoTracking ve Projection kullanıyoruz.
            // Sadece ödenmiş (Paid) siparişleri baz alıyoruz.
            
            var salesData = await _context.OrderItems
                .AsNoTracking()
                .Where(oi => oi.Order.CreatedAt >= startDate && 
                             oi.Order.CreatedAt <= endDate && 
                             oi.Order.Status == OrderStatus.Paid)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new 
                {
                    ProductId = g.Key,
                    // Satış anındaki ismini (ProductName) snapshot olarak alabiliriz veya ürün tablosundan.
                    // Burada snapshot ismini kullanmak, ürün silinse bile raporda görünmesini sağlar, 
                    // ancak maliyet hesabı için Product tablosunda hala olması gerekir.
                    // Gruplama olduğu için Max/Min ile bir isim seçiyoruz.
                    ProductName = g.Max(x => x.ProductName), 
                    TotalQuantity = g.Sum(x => x.Quantity),
                    // Ciro hesabı: Satılan Fiyat * Adet
                    TotalRevenue = g.Sum(x => x.Price * x.Quantity) 
                })
                .ToListAsync();

            if (!salesData.Any())
            {
                return new ProfitLossReportDto 
                { 
                    StartDate = startDate, 
                    EndDate = endDate 
                };
            }

            // 2. Maliyet Verilerini Getir (Db Query - Current Recipe)
            // Satılan ürün ID'lerine göre güncel reçete maliyetlerini çekiyoruz.
            var productIds = salesData.Select(s => s.ProductId).Distinct().ToList();

            var productCosts = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id))
                .Select(p => new
                {
                    p.Id,
                    // Birim Maliyet = Reçetedeki Hammadde Miktarı * Hammadde Birim Fiyatı (Toplamı)
                    UnitCost = p.RecipeItems.Sum(r => r.Amount * r.RawMaterial.CostPerUnit)
                })
                .ToListAsync();

            // 3. Verileri Birleştir ve Hesapla (In-Memory Processing)
            var reportItems = new List<ProductProfitabilityDto>();

            foreach (var sale in salesData)
            {
                // Maliyet bulamazsak 0 kabul et (Örn: Ürün silinmiş veya reçetesi yok)
                var costInfo = productCosts.FirstOrDefault(c => c.Id == sale.ProductId);
                var unitCost = costInfo?.UnitCost ?? 0;
                
                var totalCost = unitCost * sale.TotalQuantity;
                var netProfit = sale.TotalRevenue - totalCost;
                
                var profitMargin = sale.TotalRevenue > 0 
                    ? (netProfit / sale.TotalRevenue) * 100 
                    : 0;

                reportItems.Add(new ProductProfitabilityDto
                {
                    ProductId = sale.ProductId,
                    ProductName = sale.ProductName, // Satış anındaki isim
                    TotalSalesCount = sale.TotalQuantity,
                    TotalRevenue = sale.TotalRevenue,
                    UnitCost = unitCost,
                    TotalCost = totalCost,
                    NetProfit = netProfit,
                    MarginPercentage = Math.Round(profitMargin, 2)
                });
            }

            // 4. Genel Toplamları Oluştur
            // Recalculate Totals based on improved logic
            var totalRevenue = reportItems.Sum(x => x.TotalRevenue);
            var totalCogs = reportItems.Sum(x => x.TotalCost);
            var totalLabor = dailyStats.Sum(d => d.LaborCost);
            var totalNetProfit = totalRevenue - totalCogs - totalLabor;

            var report = new ProfitLossReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                ProductPerformance = reportItems.OrderByDescending(x => x.TotalRevenue).ToList(),
                DailyStats = dailyStats, 
                TotalRevenue = totalRevenue,
                TotalInfoCost = totalCogs,
                TotalLaborCost = totalLabor,
                TotalNetProfit = totalNetProfit
            };

            // Genel Marj Hesabı
            if (report.TotalRevenue > 0)
            {
                report.TotalMarginPercentage = Math.Round((report.TotalNetProfit / report.TotalRevenue) * 100, 2);
            }

            return report;
        }
    }
}
