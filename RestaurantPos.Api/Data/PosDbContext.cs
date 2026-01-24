using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Data
{
    public class PosDbContext : DbContext
    {
        public PosDbContext(DbContextOptions<PosDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<ModifierGroup> ModifierGroups { get; set; }
        public DbSet<Modifier> Modifiers { get; set; }
        public DbSet<ProductModifierGroup> ProductModifierGroups { get; set; }
        
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderItemModifier> OrderItemModifiers { get; set; }
        public DbSet<Table> Tables { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Many-to-Many Relationship Bridge
            modelBuilder.Entity<ProductModifierGroup>()
                .HasKey(pmg => new { pmg.ProductId, pmg.ModifierGroupId });

            modelBuilder.Entity<ProductModifierGroup>()
                .HasOne(pmg => pmg.Product)
                .WithMany(p => p.ProductModifierGroups)
                .HasForeignKey(pmg => pmg.ProductId);

            modelBuilder.Entity<ProductModifierGroup>()
                .HasOne(pmg => pmg.ModifierGroup)
                .WithMany(mg => mg.ProductGroups)
                .HasForeignKey(pmg => pmg.ModifierGroupId);

            // Configure Order Relationships
            modelBuilder.Entity<Order>()
                .HasMany(o => o.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasMany(oi => oi.Modifiers)
                .WithOne(oim => oim.OrderItem)
                .HasForeignKey(oim => oim.OrderItemId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Seed Users
            // Simple hash for "1234" (using SHA256 for demo purposes)
            // Ideally use a proper password hasher
            var defaultPasswordHash = "03wk039s"; // Placeholder for demo, I'll use simple plain or a recognizable hash. 
            // Let's use a known SHA256 hash for "1234": 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
            var hash1234 = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

            var tenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");

            modelBuilder.Entity<User>().HasData(
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Username = "admin", PasswordHash = hash1234, Role = UserRole.Admin },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Username = "garson", PasswordHash = hash1234, Role = UserRole.Waiter },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Username = "mutfak", PasswordHash = hash1234, Role = UserRole.Kitchen },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Username = "kasa", PasswordHash = hash1234, Role = UserRole.Cashier }
            );
        }

        public DbSet<User> Users { get; set; }
    }
}
