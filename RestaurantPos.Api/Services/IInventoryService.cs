using System;
using System.Threading.Tasks;

namespace RestaurantPos.Api.Services
{
    public interface IInventoryService
    {
        Task ProcessOrderStockAsync(Guid orderId);
        Task ReceiveStockAsync(Guid purchaseOrderId); // Placeholder for future use
    }
}
