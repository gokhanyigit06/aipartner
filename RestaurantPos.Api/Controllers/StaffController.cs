using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StaffController : ControllerBase
    {
        private readonly PosDbContext _context;

        public StaffController(PosDbContext context)
        {
            _context = context;
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetStaffAnalytics()
        {
            var staff = await _context.Users
                .Where(u => u.Role == UserRole.Waiter || u.Role == UserRole.Kitchen || u.Role == UserRole.Cashier)
                .ToListAsync();

            var staffAnalytics = new List<StaffAnalyticsDto>();

            foreach (var user in staff)
            {
                // Calculate total working hours from shifts
                var shifts = await _context.Shifts
                    .Where(s => s.UserId == user.Id && s.ClockOut.HasValue)
                    .ToListAsync();

                var totalHours = shifts.Sum(s => s.TotalHours);

                // Calculate total orders handled (for waiters)
                var totalOrders = await _context.Orders
                    .Where(o => o.WaiterId == user.Id && o.Status == OrderStatus.Paid)
                    .CountAsync();

                // Calculate total sales for commission
                var totalSales = await _context.Orders
                    .Where(o => o.WaiterId == user.Id && o.Status == OrderStatus.Paid)
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                // Calculate commission earned
                var commissionEarned = totalSales * (user.CommissionRate / 100);

                staffAnalytics.Add(new StaffAnalyticsDto
                {
                    UserId = user.Id,
                    Username = user.Username,
                    FullName = user.FullName ?? user.Username,
                    Role = user.Role.ToString(),
                    MonthlySalary = user.MonthlySalary,
                    CommissionRate = user.CommissionRate,
                    TotalWorkingHours = Math.Round(totalHours, 2),
                    TotalOrders = totalOrders,
                    TotalSales = totalSales,
                    CommissionEarned = commissionEarned
                });
            }

            return Ok(staffAnalytics);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStaffDetails(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            return Ok(new StaffDetailDto
            {
                UserId = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                MonthlySalary = user.MonthlySalary,
                CommissionRate = user.CommissionRate
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateStaffDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            user.FullName = dto.FullName;
            user.MonthlySalary = dto.MonthlySalary;
            user.CommissionRate = dto.CommissionRate;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpGet("{id}/shifts")]
        public async Task<IActionResult> GetStaffShifts(Guid id, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-7);
            var end = endDate ?? DateTime.UtcNow;

            var shifts = await _context.Shifts
                .Where(s => s.UserId == id && s.ClockIn >= start && s.ClockIn <= end)
                .OrderByDescending(s => s.ClockIn)
                .Select(s => new ShiftDto
                {
                    Id = s.Id,
                    ClockIn = s.ClockIn,
                    ClockOut = s.ClockOut,
                    TotalHours = s.TotalHours
                })
                .ToListAsync();

            return Ok(shifts);
        }

        [HttpPost("{id}/clock-in")]
        public async Task<IActionResult> ClockIn(Guid id)
        {
            var shift = new Shift
            {
                Id = Guid.NewGuid(),
                UserId = id,
                ClockIn = DateTime.UtcNow,
                TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6")
            };

            _context.Shifts.Add(shift);
            await _context.SaveChangesAsync();
            return Ok(shift);
        }

        [HttpPost("{id}/clock-out")]
        public async Task<IActionResult> ClockOut(Guid id)
        {
            var activeShift = await _context.Shifts
                .Where(s => s.UserId == id && s.ClockOut == null)
                .OrderByDescending(s => s.ClockIn)
                .FirstOrDefaultAsync();

            if (activeShift == null)
                return BadRequest("No active shift found");

            activeShift.ClockOut = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(activeShift);
        }
    }

    // DTOs
    public class StaffAnalyticsDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public decimal MonthlySalary { get; set; }
        public decimal CommissionRate { get; set; }
        public double TotalWorkingHours { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalSales { get; set; }
        public decimal CommissionEarned { get; set; }
    }

    public class StaffDetailDto
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string Role { get; set; } = string.Empty;
        public decimal MonthlySalary { get; set; }
        public decimal CommissionRate { get; set; }
    }

    public class UpdateStaffDto
    {
        public string? FullName { get; set; }
        public decimal MonthlySalary { get; set; }
        public decimal CommissionRate { get; set; }
    }

    public class ShiftDto
    {
        public Guid Id { get; set; }
        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        public double TotalHours { get; set; }
    }
}
