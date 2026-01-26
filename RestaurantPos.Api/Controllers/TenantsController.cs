using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantPos.Api.Models;
using RestaurantPos.Api.Services;

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TenantsController : ControllerBase
    {
        private readonly ITenantService _tenantService;

        public TenantsController(ITenantService tenantService)
        {
            _tenantService = tenantService;
        }

        // Super Admin Only - Create New Tenant (Restaurant)
        [HttpPost]
        [AllowAnonymous] // In production, this should require SuperAdmin role
        public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
        {
            try
            {
                var tenant = await _tenantService.CreateTenantAsync(
                    request.Name,
                    request.Domain,
                    request.OwnerEmail,
                    request.OwnerPassword
                );

                return Ok(new
                {
                    success = true,
                    tenantId = tenant.Id,
                    message = $"Tenant '{tenant.Name}' created successfully",
                    loginUrl = $"https://{tenant.Domain}.yourpos.com"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        [AllowAnonymous] // In production, require SuperAdmin
        public async Task<IActionResult> GetAllTenants()
        {
            var tenants = await _tenantService.GetAllTenantsAsync();
            return Ok(tenants);
        }

        [HttpGet("by-domain/{domain}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByDomain(string domain)
        {
            var tenant = await _tenantService.GetTenantByDomainAsync(domain);
            if (tenant == null) return NotFound("Tenant not found");
            return Ok(tenant);
        }
    }

    public class CreateTenantRequest
    {
        public string Name { get; set; }
        public string Domain { get; set; }
        public string OwnerEmail { get; set; }
        public string OwnerPassword { get; set; }
    }
}
