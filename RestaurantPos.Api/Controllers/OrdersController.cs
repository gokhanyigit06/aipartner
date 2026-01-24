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

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly PosDbContext _context;
        private readonly IHubContext<KitchenHub> _hubContext;

        public OrdersController(PosDbContext context, IHubContext<KitchenHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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
                Items = o.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.ProductName,
                    Quantity = oi.Quantity,
                    Notes = oi.Notes,
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

                decimal itemTotal = product.BasePrice * item.Quantity; // Use Server Price
                decimal modifiersTotal = item.Modifiers.Sum(m => m.Price) * item.Quantity;
                totalAmount += (itemTotal + modifiersTotal);
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
                Status = order.Status.ToString(),
                Items = order.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.ProductName,
                    Quantity = oi.Quantity,
                    Notes = oi.Notes,
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
                Status = o.Status.ToString(),
                PaymentMethod = o.PaymentMethod,
                Items = o.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.ProductName,
                    Quantity = oi.Quantity,
                    Notes = oi.Notes,
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

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            // Update Status and PaymentMethod
            order.Status = OrderStatus.Paid;
            order.PaymentMethod = paymentMethod;

            await _context.SaveChangesAsync();

            // Notify clients (e.g. remove from KDS/Cashier screens)
            await _hubContext.Clients.All.SendAsync("OrderPaid", new 
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TableName = order.TableName
            });

            return NoContent();
        }
    }
}
