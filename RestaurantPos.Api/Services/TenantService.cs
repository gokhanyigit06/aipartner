using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace RestaurantPos.Api.Services
{
    public interface ITenantService
    {
        Task<Tenant> CreateTenantAsync(string name, string domain, string ownerEmail, string ownerPassword);
        Task<Tenant?> GetTenantByDomainAsync(string domain);
        Task<List<Tenant>> GetAllTenantsAsync();
    }

    public class TenantService : ITenantService
    {
        private readonly PosDbContext _context;
        private readonly ILogger<TenantService> _logger;

        public TenantService(PosDbContext context, ILogger<TenantService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Tenant> CreateTenantAsync(string name, string domain, string ownerEmail, string ownerPassword)
        {
            // 1. Create Tenant
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = name,
                Domain = domain,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"[SaaS] New Tenant Created: {name} (ID: {tenant.Id})");

            // 2. Create Owner User (Admin Role)
            var ownerUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Username = ownerEmail,
                PasswordHash = HashPassword(ownerPassword), // Simple hash for demo
                Role = UserRole.Admin,
                FullName = $"{name} - Owner",
                MonthlySalary = 0,
                CommissionRate = 0
            };

            _context.Users.Add(ownerUser);

            // 3. Create Default Categories (Optional - if you have Category entity)
            // For now, we'll skip this as we don't have a Category table yet
            // But in a real system, you'd seed default categories here

            // 4. Create Sample Table
            var sampleTable = new Table
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Name = "Masa 1",
                Capacity = 4,
                Status = TableStatus.Free
            };

            _context.Tables.Add(sampleTable);

            await _context.SaveChangesAsync();

            _logger.LogInformation($"[SaaS] Tenant {name} onboarding completed. Owner: {ownerEmail}");

            return tenant;
        }

        public async Task<Tenant?> GetTenantByDomainAsync(string domain)
        {
            // Note: Tenants table doesn't have TenantId filter (it's the master table)
            return await _context.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Domain == domain && t.IsActive);
        }

        public async Task<List<Tenant>> GetAllTenantsAsync()
        {
            return await _context.Tenants
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        private string HashPassword(string password)
        {
            // Simple SHA256 hash for demo (use proper password hasher in production)
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                return Convert.ToHexString(hash).ToLower();
            }
        }
    }
}
