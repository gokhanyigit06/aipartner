using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;
using RestaurantPos.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly PosDbContext _context;
        private readonly ICustomerService _customerService;

        public CustomersController(PosDbContext context, ICustomerService customerService)
        {
            _context = context;
            _customerService = customerService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string phone)
        {
            var customer = await _customerService.GetCustomerByPhoneAsync(phone);
            if (customer == null) return NotFound("Müşteri bulunamadı");
            return Ok(customer);
        }
        
        [HttpGet("{id}/insights")]
        public async Task<IActionResult> GetInsights(Guid id)
        {
            var insights = await _customerService.GetCustomerInsightsAsync(id);
            if (insights == null) return NotFound();
            return Ok(insights);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Customer customer)
        {
            customer.Id = Guid.NewGuid();
            customer.TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            customer.LoyaltyPoints = 0;
            customer.LastVisit = DateTime.UtcNow;
            
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return Ok(customer);
        }

        [HttpPost("{id}/redeem")]
        public async Task<IActionResult> RedeemPoints(Guid id, [FromQuery] Guid orderId)
        {
            var success = await _customerService.RedeemPointsAsync(id, orderId);
            if (!success) return BadRequest("Puan kullanımı başarısız (Yetersiz puan veya sipariş bulunamadı)");
            return Ok(new { success = true, message = "Puanlar indirime dönüştürüldü" });
        }
    }
}
