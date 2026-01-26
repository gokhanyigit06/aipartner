using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Services
{
    public class ProcurementService : IProcurementService
    {
        private readonly PosDbContext _context;
        private readonly ILogger<ProcurementService> _logger;

        public ProcurementService(PosDbContext context, ILogger<ProcurementService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<SuggestedOrderDto>> GetSuggestedOrdersAsync()
        {
            _logger.LogInformation("[Procurement] Calculating Smart Replenishment Suggestions...");

            // 1. Kritik Stok Seviyesinin Altına Düşen Hammaddeleri Bul
            var criticalMaterials = await _context.RawMaterials
                .AsNoTracking()
                .Where(rm => rm.CurrentStock <= rm.MinimumAlertLevel)
                .ToListAsync();

            var suggestions = new List<SuggestedOrderDto>();

            foreach (var material in criticalMaterials)
            {
                // Örnek Mantık: Güvenli stok seviyesine (Min Level * 2) tamamlayacak kadar öner
                var targetStock = material.MinimumAlertLevel * 2;
                if (targetStock == 0) targetStock = 10; // Default fallback

                var quantityNeeded = targetStock - material.CurrentStock;
                
                if (quantityNeeded <= 0) continue;

                suggestions.Add(new SuggestedOrderDto
                {
                    RawMaterialId = material.Id,
                    RawMaterialName = material.Name,
                    CurrentStock = material.CurrentStock,
                    MinimumStockLevel = material.MinimumAlertLevel,
                    SuggestedQuantity = quantityNeeded,
                    Unit = material.Unit.ToString(),
                    EstimatedCost = quantityNeeded * material.CostPerUnit
                });
            }

            return suggestions.OrderByDescending(x => x.EstimatedCost).ToList();
        }
    }
}
