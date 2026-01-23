using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosSystem.Models
{
    // Enums
    public enum SelectionType
    {
        Single = 0,
        Multiple = 1
    }

    // Abstract Base for SaaS Multi-tenancy
    public abstract class BaseEntity
    {
        [Key]
        public Guid Id { get; set; }
        public Guid TenantId { get; set; } // SaaS Tenant Indicator
    }

    // 1. Product Model
    public class Product : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        public Guid CategoryId { get; set; } // Foreign Key to a Category (assuming exists or just ID)

        public bool IsActive { get; set; }

        // M-N Relationship Navigation
        public ICollection<ProductModifierGroup> ProductModifierGroups { get; set; }
    }

    // 2. Modifier Group Model (e.g. "Pizza Crusts", "Extra Toppings")
    public class ModifierGroup : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        public SelectionType SelectionType { get; set; } // Single or Multi

        public int MinSelection { get; set; } // e.g. 0 (optional) or 1 (mandatory)
        public int MaxSelection { get; set; } // e.g. 1 or 5

        // 1-N Relationship: A group has many options
        public ICollection<Modifier> Modifiers { get; set; }

        // M-N Relationship Navigation
        public ICollection<ProductModifierGroup> ProductGroups { get; set; }
    }

    // 3. Modifier / Option Model (e.g. "Thin Crust", "Extra Cheese")
    public class Modifier : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceAdjustment { get; set; } // e.g. +5.00 or 0

        // Foreign Key
        public Guid ModifierGroupId { get; set; }
        public ModifierGroup ModifierGroup { get; set; }
    }

    // 4. Bridge Entity for M-N Relationship
    public class ProductModifierGroup
    {
        // Composite Key components
        public Guid ProductId { get; set; }
        public Product Product { get; set; }

        public Guid ModifierGroupId { get; set; }
        public ModifierGroup ModifierGroup { get; set; }
        
        // Optional: Sort order of this group for this specific product
        public int SortOrder { get; set; }

        // Good practice to include TenantId here too for global query filters
        public Guid TenantId { get; set; } 
    }

    // 5. DbContext Configuration
    public class PosDbContext : DbContext
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<ModifierGroup> ModifierGroups { get; set; }
        public DbSet<Modifier> Modifiers { get; set; }
        public DbSet<ProductModifierGroup> ProductModifierGroups { get; set; }

        public PosDbContext(DbContextOptions<PosDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- Product Configuration ---
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.TenantId); // Index for performance
            
            // --- ModifierGroup Configuration ---
            modelBuilder.Entity<ModifierGroup>()
                 .HasMany(mg => mg.Modifiers)
                 .WithOne(m => m.ModifierGroup)
                 .HasForeignKey(m => m.ModifierGroupId)
                 .OnDelete(DeleteBehavior.Cascade);

            // --- Modifier Configuration ---
            modelBuilder.Entity<Modifier>()
                .Property(m => m.PriceAdjustment)
                .HasDefaultValue(0);

            // --- M-N Bridge Configuration (Product <-> ModifierGroup) ---
            modelBuilder.Entity<ProductModifierGroup>()
                .HasKey(pmg => new { pmg.ProductId, pmg.ModifierGroupId }); // Composite PK

            modelBuilder.Entity<ProductModifierGroup>()
                .HasOne(pmg => pmg.Product)
                .WithMany(p => p.ProductModifierGroups)
                .HasForeignKey(pmg => pmg.ProductId);

            modelBuilder.Entity<ProductModifierGroup>()
                .HasOne(pmg => pmg.ModifierGroup)
                .WithMany(mg => mg.ProductGroups)
                .HasForeignKey(pmg => pmg.ModifierGroupId);

            // --- Global Query Filter for SaaS (Multi-tenancy) ---
            // Automatically filters data by TenantId for every query
            // Note: You would typically inject a service to get the current TenantId
            // This is just a conceptual example of how to bind it.
            // Expression<Func<BaseEntity, bool>> filterExpr = e => e.TenantId == _currentTenantId;
            // modelBuilder.Entity<Product>().HasQueryFilter(p => p.TenantId == _currentTenantId);
            // ... apply to others ...
        }
    }
}
