using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.DTOs;
using RestaurantPos.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly PosDbContext _context;

        public ProductsController(PosDbContext context)
        {
            _context = context;
        }

        // GET: api/Products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            var products = await _context.Products
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    BasePrice = p.BasePrice,
                    CostPrice = p.CostPrice,
                    DiscountedPrice = p.DiscountedPrice,
                    IsActive = p.IsActive,
                    CategoryId = p.CategoryId,
                    Allergens = (int)p.Allergens,
                    StationRouting = (int)p.StationRouting,
                    PrinterIds = p.PrinterIds,
                    ImageUrl = p.ImageUrl,
                    ModifierGroups = p.ProductModifierGroups
                        .OrderBy(pmg => pmg.SortOrder)
                        .Select(pmg => new ModifierGroupDto
                        {
                            Id = pmg.ModifierGroup.Id,
                            Name = pmg.ModifierGroup.Name,
                            SelectionType = (int)pmg.ModifierGroup.SelectionType,
                            MinSelection = pmg.ModifierGroup.MinSelection,
                            MaxSelection = pmg.ModifierGroup.MaxSelection,
                            Modifiers = pmg.ModifierGroup.Modifiers
                                .Select(m => new ModifierDto
                                {
                                    Id = m.Id,
                                    Name = m.Name,
                                    PriceAdjustment = m.PriceAdjustment
                                }).ToList()
                        }).ToList()
                }).ToListAsync();

            return Ok(products);
        }

        // POST: api/Products
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductDto>> CreateProduct(ProductCreateDto dto)
        {
            // 1. Create Product
            var newProduct = new Product
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                BasePrice = dto.BasePrice,
                CostPrice = dto.CostPrice,
                DiscountedPrice = dto.DiscountedPrice,
                CategoryId = dto.CategoryId,
                TenantId = dto.TenantId,
                IsActive = dto.IsActive,
                Allergens = (AllergenType)dto.Allergens,
                StationRouting = (StationRouting)dto.StationRouting,
                PrinterIds = dto.PrinterIds,
                ImageUrl = dto.ImageUrl,
                
                // 2. Create ProductModifierGroups (Bridge) + ModifierGroups + Modifiers
                // We map to ProductModifierGroups because that is the relationship property.
                ProductModifierGroups = dto.ModifierGroups.Select((mg, index) => new ProductModifierGroup
                {
                    SortOrder = index,
                    TenantId = dto.TenantId,
                    // Create the Group entirely new
                    ModifierGroup = new ModifierGroup
                    {
                        Id = Guid.NewGuid(),
                        Name = mg.Name,
                        SelectionType = (SelectionType)mg.SelectionType,
                        MinSelection = mg.MinSelection,
                        MaxSelection = mg.MaxSelection,
                        TenantId = dto.TenantId,
                        Modifiers = mg.Modifiers.Select(m => new Modifier
                        {
                            Id = Guid.NewGuid(),
                            Name = m.Name,
                            PriceAdjustment = m.PriceAdjustment,
                            TenantId = dto.TenantId
                        }).ToList()
                    }
                }).ToList()
            };

            // 4. Save to DB
            _context.Products.Add(newProduct);
            await _context.SaveChangesAsync();

            // Return response (simplified or full)
             return CreatedAtAction(nameof(GetProducts), new { id = newProduct.Id }, new ProductDto 
             { 
                 Id = newProduct.Id, 
                 Name = newProduct.Name 
             });
        }
    }
}
