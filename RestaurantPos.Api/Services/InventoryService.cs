using MediatR;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Events;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly PosDbContext _context;
        private readonly IMediator _mediator;
        private readonly ILogger<InventoryService> _logger;

        public InventoryService(PosDbContext context, IMediator mediator, ILogger<InventoryService> logger)
        {
            _context = context;
            _mediator = mediator;
            _logger = logger;
        }

        public async Task ProcessOrderStockAsync(Guid orderId)
        {
            _logger.LogInformation($"[FIFO Engine] Processing stock for Order {orderId}");

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return;

            decimal totalOrderCost = 0;

            // 1. Ürünleri ve Reçetelerini Yükle
            var productIds = order.OrderItems.Select(oi => oi.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Include(p => p.RecipeItems)
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            // 2. Her Sipariş Kalemi İçin
            foreach (var item in order.OrderItems)
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
                if (product == null || product.RecipeItems == null) continue;

                // 3. Reçete Kalemlerine Göre Stok Düş (FIFO)
                foreach (var recipeItem in product.RecipeItems)
                {
                    decimal requiredAmount = item.Quantity * recipeItem.Amount;
                    decimal costForThisMaterial = await DeductStockFifoAsync(recipeItem.RawMaterialId, requiredAmount);
                    
                    totalOrderCost += costForThisMaterial;
                }
            }

            // 4. Siparişe Maliyet ve Kâr Bilgisini İşle
            order.TotalCost = totalOrderCost;
            order.NetProfit = order.TotalAmount - totalOrderCost;

            await _context.SaveChangesAsync();

            // 5. Kâr Marjı Kontrolü ve Alarm
            if (order.TotalAmount > 0)
            {
                decimal margin = (order.NetProfit / order.TotalAmount) * 100;
                if (margin < 20)
                {
                    await _mediator.Publish(new LowMarginAlertEvent(order.Id, order.OrderNumber, margin, order.NetProfit));
                }
            }
        }

        private async Task<decimal> DeductStockFifoAsync(Guid rawMaterialId, decimal requiredAmount)
        {
            decimal totalCost = 0;
            decimal remainingToDeduct = requiredAmount;

            // FIFO: En eski tarihli (CreatedAt) stokları getir
            var lots = await _context.StockLots
                .Where(l => l.RawMaterialId == rawMaterialId && l.RemainingQuantity > 0)
                .OrderBy(l => l.CreatedAt)
                .ToListAsync();

            var rawMaterial = await _context.RawMaterials.FindAsync(rawMaterialId);

            foreach (var lot in lots)
            {
                if (remainingToDeduct <= 0) break;

                decimal deductFromLot = Math.Min(lot.RemainingQuantity, remainingToDeduct);
                
                // Maliyet Hesabı: Çekilen Miktar * Parti Maliyeti
                totalCost += deductFromLot * lot.UnitCost;

                // Stok Düşümü
                lot.RemainingQuantity -= deductFromLot;
                remainingToDeduct -= deductFromLot;

                _logger.LogInformation($"[FIFO] Deducted {deductFromLot} from Lot {lot.Id}. Cost: {deductFromLot * lot.UnitCost}");
            }

            // Eğer stok yetmezse (Negative Stock / Market Price Handling)
            if (remainingToDeduct > 0 && rawMaterial != null)
            {
                // Elde stok yok, o anki piyasa fiyatından (CostPerUnit) eksiye düş veya maliyet yaz
                decimal missingCost = remainingToDeduct * rawMaterial.CostPerUnit;
                totalCost += missingCost;
                
                // Ana stok sayacını güncelle (Referans amaçlı, asıl kaynak Lot'lardır)
                rawMaterial.CurrentStock -= requiredAmount; 
                
                _logger.LogWarning($"[FIFO] Insufficient batches for Material {rawMaterial.Name}. Used market price for missing {remainingToDeduct}.");
            }
            else if (rawMaterial != null)
            {
                // Stok var, ana sayacı da düş
                rawMaterial.CurrentStock -= requiredAmount;
            }

            return totalCost;
        }

        public Task ReceiveStockAsync(Guid purchaseOrderId)
        {
            // Future implementation
            return Task.CompletedTask;
        }
    }
}
