using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.DTOs
{
    // --- READ DTOs (For GET) ---
    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? CostPrice { get; set; }
        public decimal? DiscountedPrice { get; set; }
        public bool IsActive { get; set; }
        public Guid CategoryId { get; set; }
        public int Allergens { get; set; } // AllergenType as int
        public int StationRouting { get; set; } // StationRouting as int
        public string? PrinterIds { get; set; }
        public string? ImageUrl { get; set; }
        public List<ModifierGroupDto> ModifierGroups { get; set; } = new();
        public List<RecipeItemDto> RecipeItems { get; set; } = new();
    }

    public class ModifierGroupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int SelectionType { get; set; }
        public int MinSelection { get; set; }
        public int MaxSelection { get; set; }
        public List<ModifierDto> Modifiers { get; set; } = new();
    }

    public class ModifierDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal PriceAdjustment { get; set; }
    }

    public class RecipeItemDto
    {
        public Guid Id { get; set; }
        public Guid RawMaterialId { get; set; }
        public string RawMaterialName { get; set; }
        public decimal Amount { get; set; }
        public string Unit { get; set; }
    }

    public class RecipeItemCreateDto
    {
        public Guid RawMaterialId { get; set; }
        public decimal Amount { get; set; }
    }

    // --- CREATE DTOs (For POST) ---
    public class ProductCreateDto
    {
        public string Name { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? CostPrice { get; set; }
        public decimal? DiscountedPrice { get; set; }
        public Guid CategoryId { get; set; }
        public Guid TenantId { get; set; }
        public bool IsActive { get; set; } = true;
        public int Allergens { get; set; } = 0;
        public int StationRouting { get; set; } = 0;
        public string? PrinterIds { get; set; }
        public string? ImageUrl { get; set; }
        
        // Full Nested Structure for Creation
        public List<ModifierGroupCreateDto> ModifierGroups { get; set; } = new();
    }

    public class ModifierGroupCreateDto
    {
        public string Name { get; set; }
        public int SelectionType { get; set; } // 0 or 1
        public int MinSelection { get; set; }
        public int MaxSelection { get; set; }
        public List<ModifierCreateDto> Modifiers { get; set; } = new();
    }

    public class ModifierCreateDto
    {
        public string Name { get; set; }
        public decimal PriceAdjustment { get; set; }
    }
}
