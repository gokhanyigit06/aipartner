using MediatR;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Events;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Handlers
{
    public class StockEntryHandler : INotificationHandler<PurchaseOrderReceivedEvent>
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<StockEntryHandler> _logger;

        public StockEntryHandler(IServiceScopeFactory scopeFactory, ILogger<StockEntryHandler> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task Handle(PurchaseOrderReceivedEvent notification, CancellationToken cancellationToken)
        {
            _logger.LogInformation($"[Procurement] Processing Stock Entry for PO {notification.PurchaseOrderId}");

            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<PosDbContext>();

                // 1. PO detaylarını getir (Item'ları ile)
                var purchaseOrder = await context.PurchaseOrders
                    .Include(po => po.Items)
                    .ThenInclude(i => i.RawMaterial)
                    .FirstOrDefaultAsync(po => po.Id == notification.PurchaseOrderId);

                if (purchaseOrder == null) 
                {
                    _logger.LogError($"Purchase Order {notification.PurchaseOrderId} not found!");
                    return;
                }

                if (purchaseOrder.Status != PurchaseOrderStatus.Received)
                {
                    _logger.LogWarning($"Purchase Order {notification.PurchaseOrderId} status is not Received. Skipping stock entry.");
                    return;
                }

                // 2. Her kalem için bir StockLot (Parti) oluştur
                foreach (var item in purchaseOrder.Items)
                {
                    var stockLot = new StockLot
                    {
                        Id = Guid.NewGuid(),
                        TenantId = notification.TenantId,
                        RawMaterialId = item.RawMaterialId,
                        PurchaseOrderId = purchaseOrder.Id,
                        UnitCost = item.UnitPrice, // Parti Maliyeti = Fatura Birim Fiyatı
                        InitialQuantity = item.Quantity,
                        RemainingQuantity = item.Quantity,
                        CreatedAt = DateTime.UtcNow,
                        ExpirationDate = DateTime.UtcNow.AddMonths(6) // Varsayılan SKT (İleride UI'dan alınabilir)
                    };

                    context.StockLots.Add(stockLot);

                    // 3. RawMaterial Ana Stoğunu Güncelle (Gösterge amaçlı)
                    // (Gerçek düşümler StockLot'tan yapılsa da toplam stoğu bilmek hızlı analiz için iyidir)
                    if (item.RawMaterial != null)
                    {
                        item.RawMaterial.CurrentStock += item.Quantity;
                        
                        // Son alış fiyatını güncelle (Piyasa fiyatı takibi için)
                        item.RawMaterial.CostPerUnit = item.UnitPrice; 
                    }
                    
                    _logger.LogInformation($"[Stock Entry] +{item.Quantity} {item.RawMaterial?.Name} added via Lot {stockLot.Id}");
                }

                await context.SaveChangesAsync();
                _logger.LogInformation($"[Procurement] Stock entry completed successfully for PO {notification.PurchaseOrderId}");
            }
        }
    }
}
