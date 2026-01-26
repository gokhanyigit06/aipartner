using Microsoft.AspNetCore.Http;

namespace RestaurantPos.Api.Services
{
    public interface ITenantResolver
    {
        Guid GetTenantId();
    }

    public class HeaderTenantResolver : ITenantResolver
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HeaderTenantResolver(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid GetTenantId()
        {
            // 1. Try to get from Header
            var context = _httpContextAccessor.HttpContext;
            if (context?.Request.Headers.TryGetValue("X-Tenant-ID", out var tenantIdValue) == true)
            {
                if (Guid.TryParse(tenantIdValue, out var tenantId))
                {
                    return tenantId;
                }
            }

            // 2. Fallback for Dev/Test (The default ID we've been using)
            return Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6"); 
        }
    }
}
