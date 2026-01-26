using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;
using RestaurantPos.Api.Services;
using RestaurantPos.Api.Events;
using MediatR;

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Kitchen")]
    public class ProcurementController : ControllerBase
    {
        private readonly PosDbContext _context;
        private readonly IProcurementService _procurementService;
        private readonly IMediator _mediator;

        public ProcurementController(PosDbContext context, IProcurementService procurementService, IMediator mediator)
        {
            _context = context;
            _procurementService = procurementService;
            _mediator = mediator;
        }

        // --- Suggestions ---
        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions()
        {
            var suggestions = await _procurementService.GetSuggestedOrdersAsync();
            return Ok(suggestions);
        }

        // --- Suppliers ---
        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers.AsNoTracking().ToListAsync();
            return Ok(suppliers);
        }

        [HttpPost("suppliers")]
        public async Task<IActionResult> CreateSupplier(Supplier supplier)
        {
            supplier.Id = Guid.NewGuid();
            supplier.TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6"); // Demo ID
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSuppliers), new { id = supplier.Id }, supplier);
        }

        // --- Purchase Orders ---
        [HttpGet("orders")]
        public async Task<IActionResult> GetPurchaseOrders()
        {
            var orders = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.RawMaterial)
                .OrderByDescending(po => po.CreatedAt)
                .ToListAsync();
            
            return Ok(orders);
        }

        [HttpPost("orders")]
        public async Task<IActionResult> CreatePurchaseOrder(PurchaseOrder order)
        {
            order.Id = Guid.NewGuid();
            order.TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            order.CreatedAt = DateTime.UtcNow;
            order.Status = PurchaseOrderStatus.Draft;

            foreach (var item in order.Items)
            {
                item.Id = Guid.NewGuid();
                item.TenantId = order.TenantId;
                item.PurchaseOrderId = order.Id;
            }

            _context.PurchaseOrders.Add(order);
            await _context.SaveChangesAsync();
            return Ok(order);
        }

        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] PurchaseOrderStatus status)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null) return NotFound();

            // Status transition logic
            if (status == PurchaseOrderStatus.Received && order.Status != PurchaseOrderStatus.Received)
            {
                // Trigger Event
                order.ReceivedDate = DateTime.UtcNow;
                await _mediator.Publish(new PurchaseOrderReceivedEvent(order.Id, order.TenantId));
            }

            order.Status = status;
            await _context.SaveChangesAsync();
            return Ok(order);
        }
    }
}
