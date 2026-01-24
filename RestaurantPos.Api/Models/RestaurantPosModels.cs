using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantPos.Api.Models
{
    // Enums
    public enum StationType
    {
        Kitchen = 0,
        Bar = 1
    }
    
    public enum StationRouting
    {
        KitchenOnly = 0,
        BarOnly = 1,
        Both = 2
    }
    
    [Flags]
    public enum AllergenType
    {
        None = 0,
        Gluten = 1,
        Dairy = 2,
        Nuts = 4,
        Eggs = 8,
        Fish = 16,
        Shellfish = 32,
        Soy = 64,
        Sesame = 128
    }

    public enum SelectionType
    {
        Single = 0,
        Multiple = 1
    }

    public enum OrderStatus
    {
        New = 0,
        Preparing = 1,
        Ready = 2,
        Served = 3,
        Paid = 4,
        Cancelled = 5
    }

    public enum UserRole
    {
        Admin = 0,
        Waiter = 1,
        Kitchen = 2,
        Cashier = 3
    }
    
    public enum ContractStatus
    {
        Pending = 0,      // Bekliyor
        Signed = 1,       // İmzalandı
        Terminated = 2    // Sonlandırıldı
    }
    
    public enum BloodType
    {
        Unknown = 0,
        APositive = 1,    // A+
        ANegative = 2,    // A-
        BPositive = 3,    // B+
        BNegative = 4,    // B-
        ABPositive = 5,   // AB+
        ABNegative = 6,   // AB-
        OPositive = 7,    // O+
        ONegative = 8     // O-
    }
    
    public class User : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Username { get; set; }
        
        [Required]
        public string PasswordHash { get; set; }
        
        public UserRole Role { get; set; }
        
        // HR/Payroll Fields
        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlySalary { get; set; } = 0;
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal CommissionRate { get; set; } = 0; // e.g., 2.00 for 2%
        
        [MaxLength(100)]
        public string? FullName { get; set; }
        
        // Navigation Property
        public StaffProfile? StaffProfile { get; set; }
    }
    
    // HR - Staff Profile (1-to-1 with User)
    public class StaffProfile : BaseEntity
    {
        // Foreign Key to User
        public Guid UserId { get; set; }
        public User User { get; set; }
        
        // Identity
        [MaxLength(20)]
        public string? StaffNo { get; set; } // Personel No
        
        public BloodType BloodType { get; set; } = BloodType.Unknown;
        
        // Contact
        [MaxLength(20)]
        public string? Phone { get; set; }
        
        [MaxLength(500)]
        public string? Address { get; set; }
        
        [MaxLength(500)]
        public string? PhotoUrl { get; set; }
        
        // Employment
        public DateTime? StartDate { get; set; }
        
        public ContractStatus ContractStatus { get; set; } = ContractStatus.Pending;
        
        // Finance
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetSalary { get; set; } = 0; // Net Maaş
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal SgkPremium { get; set; } = 0; // SGK Primi / Brüt Maliyet
        
        // Shift Pattern
        [MaxLength(200)]
        public string? WeeklyShiftPattern { get; set; } // e.g., "Pzt-Cum: 09:00-18:00"
        
        // Navigation
        public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    }
    
    // HR - Time Entry (Puantaj)
    public class TimeEntry : BaseEntity
    {
        public Guid StaffId { get; set; }
        public StaffProfile Staff { get; set; }
        
        public DateTime Date { get; set; }
        
        public DateTime? ClockIn { get; set; }
        
        public DateTime? ClockOut { get; set; }
        
        // Computed field
        [NotMapped]
        public double TotalHours
        {
            get
            {
                if (ClockIn.HasValue && ClockOut.HasValue)
                {
                    return (ClockOut.Value - ClockIn.Value).TotalHours;
                }
                return 0;
            }
        }
    }

    // Abstract Base for SaaS Multi-tenancy
    public abstract class BaseEntity
    {
        [Key]
        public Guid Id { get; set; }
        public Guid TenantId { get; set; } // SaaS Tenant Indicator
    }

    // 1. Product Model - Enterprise PIM
    public class Product : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        // Pricing - Enterprise Level
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? CostPrice { get; set; } // Maliyet fiyatı
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? DiscountedPrice { get; set; } // İndirimli/Kampanyalı fiyat

        public Guid CategoryId { get; set; } // Foreign Key to a Category

        // Operational Fields
        public bool IsActive { get; set; } = true;
        
        // Allergen Information
        public AllergenType Allergens { get; set; } = AllergenType.None;
        
        // Station Routing (Kitchen/Bar/Both)
        public StationRouting StationRouting { get; set; } = StationRouting.KitchenOnly;
        
        // Legacy field - kept for backward compatibility
        public StationType PreparationStation { get; set; } = StationType.Kitchen;
        
        // Printer Configuration (JSON array of printer GUIDs)
        [MaxLength(500)]
        public string? PrinterIds { get; set; } // Stored as JSON: ["guid1","guid2"]
        
        [MaxLength(500)]
        public string? ImageUrl { get; set; }

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

    // --- Order Models ---

    public enum TableStatus
    {
        Free = 0,
        Occupied = 1,
        Reserved = 2
    }

    // New Table Model
    public class Table : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } // e.g. "Bahçe 1"

        public int Capacity { get; set; }

        public TableStatus Status { get; set; }
    }

    public class Order : BaseEntity
    {
        public string OrderNumber { get; set; }
        public Guid? TableId { get; set; } // Can be nullable if generic order
        public Table Table { get; set; } // Foreign Key Navigation

        [MaxLength(100)]
        public string TableName { get; set; } = string.Empty;
        
        // Waiter tracking for commission calculation
        public Guid? WaiterId { get; set; }
        public User? Waiter { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(50)]
        public string? PaymentMethod { get; set; }
        
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<OrderItem> OrderItems { get; set; }
    }

    public class OrderItem : BaseEntity
    {
        public Guid OrderId { get; set; }
        public Order Order { get; set; }

        public Guid ProductId { get; set; } // Reference to original product
        public Product Product { get; set; } // Navigation Property
        
        [MaxLength(200)]
        public string ProductName { get; set; } // Snapshot

        public int Quantity { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } // Unit Price at the moment of order

        [MaxLength(500)]
        public string? Notes { get; set; }

        // Navigation
        public ICollection<OrderItemModifier> Modifiers { get; set; }
    }

    public class OrderItemModifier : BaseEntity
    {
        public Guid OrderItemId { get; set; }
        public OrderItem OrderItem { get; set; }

        [MaxLength(200)]
        public string ModifierName { get; set; } // Snapshot Name (e.g. "Acılı")

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } // Snapshot Price (e.g. 10.00)
    }

    // Shift/Time Tracking Model
    public class Shift : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; }
        
        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        
        // Calculated field
        public double TotalHours => ClockOut.HasValue 
            ? (ClockOut.Value - ClockIn).TotalHours 
            : 0;
    }
}
