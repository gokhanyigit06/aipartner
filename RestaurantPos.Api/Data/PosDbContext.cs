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
        }
    }
}
