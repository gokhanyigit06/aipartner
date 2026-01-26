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

            var summary = new DailySummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                ActiveTables = activeTables,
                BestSellingProducts = bestSellingProducts
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
            // Zaman aralığı yönetimi
            var start = startDate?.Date ?? DateTime.UtcNow.Date.AddDays(-30);
            // endDate null ise bugünün sonuna kadar
            var end = endDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

            var report = await _reportService.GetProfitLossReportAsync(start, end);
            return Ok(report);
        }
    }

    // DTOs
    public class DailySummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int ActiveTables { get; set; }
        public List<BestSellingProductDto> BestSellingProducts { get; set; } = new();
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
