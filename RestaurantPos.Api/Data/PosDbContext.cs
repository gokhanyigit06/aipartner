using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Models;
using RestaurantPos.Api.Services;
using System.Linq.Expressions;

namespace RestaurantPos.Api.Data
{
    public class PosDbContext : DbContext
    {
        private readonly ITenantResolver _tenantResolver;

        public PosDbContext(DbContextOptions<PosDbContext> options, ITenantResolver tenantResolver) : base(options)
        {
            _tenantResolver = tenantResolver;
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<ModifierGroup> ModifierGroups { get; set; }
        public DbSet<Modifier> Modifiers { get; set; }
        public DbSet<ProductModifierGroup> ProductModifierGroups { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderItemModifier> OrderItemModifiers { get; set; }
        public DbSet<Table> Tables { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Shift> Shifts { get; set; }
        
        // HR System
        public DbSet<StaffProfile> StaffProfiles { get; set; }
        public DbSet<TimeEntry> TimeEntries { get; set; }

        // Inventory
        public DbSet<RawMaterial> RawMaterials { get; set; }
        public DbSet<RecipeItem> RecipeItems { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<StockLot> StockLots { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Global Query Filter for Multi-tenancy
            // This ensures every query automatically filters by the current TenantId
            Expression<Func<Guid>> tenantIdAccessor = () => _tenantResolver.GetTenantId();

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    // e => e.TenantId == _tenantResolver.GetTenantId()
                    var param = Expression.Parameter(entityType.ClrType, "e");
                    var prop = Expression.Property(param, nameof(BaseEntity.TenantId));
                    var filter = Expression.Lambda(
                        Expression.Equal(prop, Expression.Invoke(tenantIdAccessor)), 
                        param);
                        
                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
                }
            }

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
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Customer)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.SetNull); // Müşteri silinirse siparişler kalsın

            modelBuilder.Entity<OrderItem>()
                .HasMany(oi => oi.Modifiers)
                .WithOne(oim => oim.OrderItem)
                .HasForeignKey(oim => oim.OrderItemId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Configure 1-to-1 User <-> StaffProfile
            modelBuilder.Entity<User>()
                .HasOne(u => u.StaffProfile)
                .WithOne(sp => sp.User)
                .HasForeignKey<StaffProfile>(sp => sp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Configure StaffProfile -> TimeEntries
            modelBuilder.Entity<StaffProfile>()
                .HasMany(sp => sp.TimeEntries)
                .WithOne(te => te.Staff)
                .HasForeignKey(te => te.StaffId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure RecipeItem Relationships
            modelBuilder.Entity<RecipeItem>()
                .HasOne(r => r.Product)
                .WithMany(p => p.RecipeItems)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RecipeItem>()
                .HasOne(r => r.RawMaterial)
                .WithMany() // RawMaterial has no collection of RecipeItems
                .HasForeignKey(r => r.RawMaterialId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent deleting RawMaterial if it's used in a recipe
            
            // Configure PurchaseOrder Relationships
            modelBuilder.Entity<PurchaseOrder>()
                .HasMany(po => po.Items)
                .WithOne(poi => poi.PurchaseOrder)
                .HasForeignKey(poi => poi.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.Supplier)
                .WithMany()
                .HasForeignKey(po => po.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
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
    }
}
