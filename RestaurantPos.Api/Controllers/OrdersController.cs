using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.DTOs;
using RestaurantPos.Api.Hubs;
using RestaurantPos.Api.Models;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly PosDbContext _context;
        private readonly IHubContext<KitchenHub> _hubContext;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(PosDbContext context, IHubContext<KitchenHub> hubContext, ILogger<OrdersController> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        // GET: api/Orders/active
        [HttpGet("active")]
        [Authorize(Roles = "Admin, Kitchen")]
        public async Task<ActionResult<List<OrderDto>>> GetActiveOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product) // Include Product definition
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Modifiers)
                .Where(o => o.Status == OrderStatus.New || o.Status == OrderStatus.Preparing)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var orderDtos = orders.Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                TableName = o.TableName,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                DiscountPercentage = o.DiscountPercentage,
                Items = o.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.ProductName,
                    Quantity = oi.Quantity,
                    Notes = oi.Notes,
                    IsComplimentary = oi.IsComplimentary,
                    PreparationStation = oi.Product != null ? (int)oi.Product.PreparationStation : 0,
                    Modifiers = oi.Modifiers.Select(m => new OrderItemModifierDto
                    {
                        ModifierName = m.ModifierName
                    }).ToList()
                }).ToList()
            }).ToList();

            return Ok(orderDtos);
        }

        // POST: api/Orders
        [HttpPost]
        [Authorize(Roles = "Admin, Waiter")]
        public async Task<ActionResult<OrderDto>> CreateOrder(OrderCreateDto input)
        {
            // 0. Fetch Products for Verification & Station Info
            var productIds = input.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            // 1. Calculate Total Amount server-side
            decimal totalAmount = 0;
            foreach (var item in input.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product)) continue;

                if (item.IsComplimentary) continue; // Skip adding to total if complimentary

                decimal itemTotal = product.BasePrice * item.Quantity; // Use Server Price
                decimal modifiersTotal = item.Modifiers.Sum(m => m.Price) * item.Quantity;
                totalAmount += (itemTotal + modifiersTotal);
            }

            // Apply General Discount
            if (input.DiscountPercentage > 0)
            {
                totalAmount = totalAmount * (1 - (input.DiscountPercentage / 100));
            }

            // 2. Create Order Entity
            var orderId = Guid.NewGuid();
            var orderNumber = DateTime.Now.ToString("yyyyMMddHHmmss"); 

            var order = new Order
            {
                Id = orderId,
                TenantId = input.TenantId,
                TableId = input.TableId,
                TableName = input.TableName,
                OrderNumber = orderNumber,
                Status = OrderStatus.New,
                CreatedAt = DateTime.UtcNow,
                TotalAmount = totalAmount,
                DiscountPercentage = input.DiscountPercentage,
                
                // 3. Map Items
                OrderItems = input.Items.Select(i => new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    TenantId = input.TenantId,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    Price = products.ContainsKey(i.ProductId) ? products[i.ProductId].BasePrice : i.Price,
                    Notes = i.Notes,
                    IsComplimentary = i.IsComplimentary,
                    Modifiers = i.Modifiers.Select(m => new OrderItemModifier
                    {
                        Id = Guid.NewGuid(),
                        TenantId = input.TenantId,
                        ModifierName = m.ModifierName,
                        Price = m.Price
                    }).ToList()
                }).ToList()
            };

            // 4. Save to DB
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // 5. Response
            var responseDto = new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                TableName = order.TableName,
                TotalAmount = order.TotalAmount,
                DiscountPercentage = order.DiscountPercentage,
                Status = order.Status.ToString(),
                Items = order.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.ProductName,
                    Quantity = oi.Quantity,
                    Notes = oi.Notes,
                    IsComplimentary = oi.IsComplimentary,
                    // Map Station Type from Dictionary
                    PreparationStation = products.ContainsKey(oi.ProductId) ? (int)products[oi.ProductId].PreparationStation : 0, 
                    Modifiers = oi.Modifiers.Select(m => new OrderItemModifierDto
                    {
                        ModifierName = m.ModifierName
                    }).ToList()
                }).ToList()
            };

            // 6. Notify Kitchen (Real-time)
            await _hubContext.Clients.All.SendAsync("ReceiveNewOrder", responseDto);

            return CreatedAtAction(nameof(CreateOrder), new { id = order.Id }, responseDto);
        }

        // PUT: api/Orders/{id}/ready
        [HttpPut("{id}/ready")]
        [Authorize(Roles = "Admin, Kitchen")]
        public async Task<IActionResult> MarkOrderAsReady(Guid id)
        {
            var order = await _context.Orders.FindAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            // Update Status
            order.Status = OrderStatus.Ready;
            await _context.SaveChangesAsync();

            // Notify Waiters/POS (Real-time)
            await _hubContext.Clients.All.SendAsync("OrderReady", new 
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TableId = order.TableId,
                TableName = order.TableName
            });

            return NoContent();
        }
        // GET: api/Orders/cashier
        [HttpGet("cashier")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<ActionResult<List<OrderDto>>> GetCashierOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Modifiers)
                // Filter for Ready or Served orders (Open for checkout)
                .Where(o => o.Status == OrderStatus.Ready || o.Status == OrderStatus.Served)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var orderDtos = orders.Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                TableName = o.TableName,
                TotalAmount = o.TotalAmount,
                DiscountPercentage = o.DiscountPercentage,
                Status = o.Status.ToString(),
                PaymentMethod = o.PaymentMethod,
                Items = o.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.ProductName,
                    Quantity = oi.Quantity,
                    Notes = oi.Notes,
                    IsComplimentary = oi.IsComplimentary,
                    Modifiers = oi.Modifiers.Select(m => new OrderItemModifierDto
                    {
                        ModifierName = m.ModifierName
                    }).ToList()
                }).ToList()
            }).ToList();

            return Ok(orderDtos);
        }

        // PUT: api/Orders/{id}/checkout
        [HttpPut("{id}/checkout")]
        [Authorize(Roles = "Admin, Cashier")]
        public async Task<IActionResult> CheckoutOrder(Guid id, [FromQuery] string paymentMethod)
        {
            if (string.IsNullOrWhiteSpace(paymentMethod))
            {
                return BadRequest("Payment method is required.");
            }

            // Start Transaction for Data Consistency
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Load order with items
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound("Order not found.");
                }

                if (order.Status == OrderStatus.Paid)
                {
                    return BadRequest("Order is already paid.");
                }

                _logger.LogInformation($"Starting checkout for Order {order.OrderNumber} ({id}).");

                // 1. Inventory Management Logic
                // Fetch relevant products and their recipes + raw materials
                var productIds = order.OrderItems.Select(oi => oi.ProductId).Distinct().ToList();
                
                var productsWithRecipes = await _context.Products
                    .Include(p => p.RecipeItems)
                        .ThenInclude(r => r.RawMaterial)
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                var stockAlerts = new List<string>();

                foreach (var orderItem in order.OrderItems)
                {
                    var product = productsWithRecipes.FirstOrDefault(p => p.Id == orderItem.ProductId);
                    if (product == null) continue; // Should not happen if data integrity is maintained

                    if (product.RecipeItems != null && product.RecipeItems.Any())
                    {
                        foreach (var recipeItem in product.RecipeItems)
                        {
                            if (recipeItem.RawMaterial == null) continue;

                            // Calculation: Order Quantity * Recipe Amount
                            var deductionAmount = orderItem.Quantity * recipeItem.Amount;
                            var rawMaterial = recipeItem.RawMaterial;

                            _logger.LogInformation($"Deducting stock: {rawMaterial.Name} - Amount: {deductionAmount} (Current: {rawMaterial.CurrentStock})");

                            // Deduct from stock
                            rawMaterial.CurrentStock -= deductionAmount;

                            // Check Critical Stock Level
                            if (rawMaterial.CurrentStock <= rawMaterial.MinimumAlertLevel)
                            {
                                var alertMsg = $"⚠️ DİKKAT: {rawMaterial.Name} stoğu kritik seviyede! (Kalan: {rawMaterial.CurrentStock} {rawMaterial.Unit})";
                                stockAlerts.Add(alertMsg);
                                _logger.LogWarning(alertMsg);
                            }
                        }
                    }
                }

                // 2. Update Order Status
                order.Status = OrderStatus.Paid;
                order.PaymentMethod = paymentMethod;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Order {order.OrderNumber} paid successfully.");

                // 3. Real-time Notifications (SignalR)
                
                // Notify payment success (to POS/Kitchen/Admin)
                await _hubContext.Clients.All.SendAsync("OrderPaid", new 
                {
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    TableName = order.TableName,
                    Status = "Paid"
                });

                // Send Stock Alerts if any
                foreach(var alert in stockAlerts.Distinct())
                {
                    await _hubContext.Clients.All.SendAsync("ReceiveStockAlert", alert);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Checkout error for Order {id}");
                return StatusCode(500, $"Ödeme işlemi sırasında hata oluştu: {ex.Message}");
            }
        }
    }
}
