using System.Threading.Tasks;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Services
{
    public interface ICustomerService
    {
        Task<Customer?> GetCustomerByPhoneAsync(string phoneNumber);
        Task<CustomerInsightsDto> GetCustomerInsightsAsync(Guid customerId);
        Task AddLoyaltyPointsAsync(Guid customerId, decimal amount);
        Task<bool> RedeemPointsAsync(Guid customerId, Guid orderId);
    }

    public class CustomerInsightsDto
    {
        public Guid CustomerId { get; set; }
        public string Name { get; set; }
        public string Tier { get; set; }
        public decimal Points { get; set; }
        public DateTime LastVisit { get; set; }
        public List<OrderSummaryDto> LastOrders { get; set; }
        public List<FavoriteProductDto> FavoriteProducts { get; set; }
    }

    public class OrderSummaryDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public decimal Total { get; set; }
    }

    public class FavoriteProductDto
    {
        public string ProductName { get; set; }
        public int Count { get; set; }
    }
}
