using MediatR;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Events;
using RestaurantPos.Api.Services;

namespace RestaurantPos.Api.Handlers
{
    public class LoyaltyPointsHandler : INotificationHandler<OrderPaidEvent>
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<LoyaltyPointsHandler> _logger;

        public LoyaltyPointsHandler(IServiceScopeFactory scopeFactory, ILogger<LoyaltyPointsHandler> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task Handle(OrderPaidEvent notification, CancellationToken cancellationToken)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<PosDbContext>();
                var customerService = scope.ServiceProvider.GetRequiredService<ICustomerService>();

                var order = await context.Orders
                    .AsNoTracking()
                    .FirstOrDefaultAsync(o => o.Id == notification.OrderId);

                if (order != null && order.CustomerId.HasValue)
                {
                    _logger.LogInformation($"[Loyalty] Processing points for Order {order.OrderNumber}, Customer {order.CustomerId}");
                    await customerService.AddLoyaltyPointsAsync(order.CustomerId.Value, notification.TotalAmount);
                }
            }
        }
    }
}
