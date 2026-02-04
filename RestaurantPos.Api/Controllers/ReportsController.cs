using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;
using RestaurantPos.Api.Services;
using RestaurantPos.Api.DTOs;

namespace RestaurantPos.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly PosDbContext _context;
        private readonly IReportService _reportService;

        public ReportsController(PosDbContext context, IReportService reportService)
        {
            _context = context;
            _reportService = reportService;
        }

        [HttpGet("daily-summary")]
        public async Task<IActionResult> GetDailySummary()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            // Bugünkü ödenen siparişleri getir
            var todaysOrders = await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.Status == OrderStatus.Paid && 
                           o.CreatedAt >= today && 
                           o.CreatedAt < tomorrow)
                .ToListAsync();

            // Toplam ciro
            var totalRevenue = todaysOrders.Sum(o => o.TotalAmount);

            // Toplam sipariş sayısı
            var totalOrders = todaysOrders.Count;

            // Aktif (dolu) masa sayısı - Occupied durumundaki masalar
            var activeTables = await _context.Tables
                .CountAsync(t => t.Status == TableStatus.Occupied);

            // En çok satılan ürünler (Top 3)
            var bestSellingProducts = await _context.OrderItems
                .Where(oi => todaysOrders.Select(o => o.Id).Contains(oi.OrderId))
                .GroupBy(oi => new { oi.ProductId, oi.ProductName })
                .Select(g => new BestSellingProductDto
                {
                    ProductName = g.Key.ProductName,
                    Quantity = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.Price * oi.Quantity)
                })
                .OrderByDescending(p => p.Quantity)
                .Take(3)
                .ToListAsync();

            // Saatlik Satışlar (Bugün)
            var hourlySales = todaysOrders
                .GroupBy(o => o.CreatedAt.Hour)
                .Select(g => new HourlySalesDto
                {
                    Hour = $"{g.Key:00}:00",
                    Sales = g.Sum(o => o.TotalAmount)
                })
                .OrderBy(x => x.Hour)
                .ToList();

            // Eksik saatleri 0 ile doldur (Opsiyonel, frontend grafiği için güzel olur)
            // Basitlik adına mevcut saatleri dönüyoruz.

            // Son Siparişler (Aktif/Genel Akış) - Status fark etmeksizin son 5
            var recentOrdersList = await _context.Orders
                .Where(o => o.CreatedAt >= today && o.CreatedAt < tomorrow)
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .Select(o => new RecentOrderDto
                {
                    Id = o.OrderNumber,
                    Table = o.TableName ?? "Paket",
                    Status = o.Status.ToString(), // Enum string olarak
                    Total = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            var summary = new DailySummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                ActiveTables = activeTables,
                BestSellingProducts = bestSellingProducts,
                HourlySales = hourlySales,
                RecentOrders = recentOrdersList
            };

            return Ok(summary);
        }

        [HttpGet("z-report")]
        public async Task<IActionResult> GetZReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            // Varsayılan olarak son 30 günü getir
            var start = startDate?.Date ?? DateTime.UtcNow.Date.AddDays(-30);
            var end = endDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1);

            var dailyReports = await _context.Orders
                .Where(o => o.Status == OrderStatus.Paid && 
                           o.CreatedAt >= start && 
                           o.CreatedAt < end)
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new DailyReportDto
                {
                    Date = g.Key,
                    TotalOrders = g.Count(),
                    CashPayments = g.Where(o => o.PaymentMethod == "Nakit").Sum(o => o.TotalAmount),
                    CardPayments = g.Where(o => o.PaymentMethod == "Kart").Sum(o => o.TotalAmount),
                    TotalRevenue = g.Sum(o => o.TotalAmount)
                })
                .OrderByDescending(r => r.Date)
                .ToListAsync();

            return Ok(dailyReports);
        }

        [HttpGet("profit-loss")]
        public async Task<IActionResult> GetProfitLossReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var start = startDate?.Date ?? DateTime.UtcNow.Date.AddDays(-30);
            var end = endDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

            var report = await _reportService.GetProfitLossReportAsync(start, end);
            return Ok(report);
        }

        [HttpGet("detailed-analysis")]
        public async Task<IActionResult> GetDetailedAnalysis([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            // 1. Current Period
            // Defaults to 'Last 30 Days' if not provided
            var currentStart = startDate?.Date ?? DateTime.UtcNow.Date.AddDays(-30);
            var currentEnd = endDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

            // 2. Previous Period calculation (Same duration immediately before currentStart)
            var duration = currentEnd - currentStart;
            // Ensure strictly distinct periods
            var previousEnd = currentStart.AddTicks(-1); 
            var previousStart = previousEnd.Subtract(duration);

            // 3. Fetch Data
            var currentPeriodData = await _reportService.GetProfitLossReportAsync(currentStart, currentEnd);
            var previousPeriodData = await _reportService.GetProfitLossReportAsync(previousStart, previousEnd);

            // 4. Calculate Changes
            var result = new DetailedReportResponse
            {
                CurrentPeriod = currentPeriodData,
                PreviousPeriod = previousPeriodData,
                Comparison = new ComparisonSummary
                {
                    RevenueChangePercentage = CalculateChange(currentPeriodData.TotalRevenue, previousPeriodData.TotalRevenue),
                    NetProfitChangePercentage = CalculateChange(currentPeriodData.TotalNetProfit, previousPeriodData.TotalNetProfit),
                    MarginChangePercentage = CalculateChange(currentPeriodData.TotalMarginPercentage, previousPeriodData.TotalMarginPercentage),
                    CostChangePercentage = CalculateChange(currentPeriodData.TotalInfoCost, previousPeriodData.TotalInfoCost)
                }
            };

            return Ok(result);
        }

        private double CalculateChange(decimal current, decimal previous)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return (double)Math.Round(((current - previous) / previous) * 100, 2);
        }

        private double CalculateChange(double current, double previous)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return Math.Round(((current - previous) / previous) * 100, 2);
        }
    }

    public class DetailedReportResponse
    {
        public ProfitLossReportDto CurrentPeriod { get; set; }
        public ProfitLossReportDto PreviousPeriod { get; set; }
        public ComparisonSummary Comparison { get; set; }
    }

    public class ComparisonSummary
    {
        public double RevenueChangePercentage { get; set; }
        public double NetProfitChangePercentage { get; set; }
        public double MarginChangePercentage { get; set; }
        public double CostChangePercentage { get; set; }
    }

    // DTOs
    public class DailySummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int ActiveTables { get; set; }
        public List<BestSellingProductDto> BestSellingProducts { get; set; } = new();
        public List<HourlySalesDto> HourlySales { get; set; } = new();
        public List<RecentOrderDto> RecentOrders { get; set; } = new();
    }

    public class HourlySalesDto
    {
        public string Hour { get; set; }
        public decimal Sales { get; set; }
    }

    public class RecentOrderDto
    {
        public string Id { get; set; } // Order Number
        public string Table { get; set; }
        public string Status { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class BestSellingProductDto
    {
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Revenue { get; set; }
    }

    public class DailyReportDto
    {
        public DateTime Date { get; set; }
        public int TotalOrders { get; set; }
        public decimal CashPayments { get; set; }
        public decimal CardPayments { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
