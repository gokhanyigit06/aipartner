using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;
using RestaurantPos.Api.DTOs;

namespace RestaurantPos.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly PosDbContext _context;

        public CategoriesController(PosDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder,
                    DisplayMode = (int)c.DisplayMode,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/categories/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategory(Guid id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
                return NotFound();

            return Ok(new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ImageUrl = category.ImageUrl,
                SortOrder = category.SortOrder,
                DisplayMode = (int)category.DisplayMode,
                IsActive = category.IsActive
            });
        }

        // POST: api/categories
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryCreateDto dto)
        {
            var category = new Category
            {
                Id = Guid.NewGuid(),
                TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6"), // TODO: Get from TenantResolver
                Name = dto.Name,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                SortOrder = dto.SortOrder,
                DisplayMode = (CategoryDisplayMode)dto.DisplayMode,
                IsActive = dto.IsActive
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ImageUrl = category.ImageUrl,
                SortOrder = category.SortOrder,
                DisplayMode = (int)category.DisplayMode,
                IsActive = category.IsActive
            });
        }

        // PUT: api/categories/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(Guid id, CategoryUpdateDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound();

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.ImageUrl = dto.ImageUrl;
            category.SortOrder = dto.SortOrder;
            category.DisplayMode = (CategoryDisplayMode)dto.DisplayMode;
            category.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/categories/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound();

            // Check if any products are using this category
            var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
            if (hasProducts)
            {
                return BadRequest(new { message = "Bu kategori ürünler tarafından kullanılıyor. Önce ürünleri başka kategoriye taşıyın." });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/categories/public (for QR menu)
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetPublicCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder,
                    DisplayMode = (int)c.DisplayMode,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(categories);
        }
    }

    // DTOs
    public class CategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
        public int DisplayMode { get; set; }
        public bool IsActive { get; set; }
    }

    public class CategoryCreateDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; } = 0;
        public int DisplayMode { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    public class CategoryUpdateDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
        public int DisplayMode { get; set; }
        public bool IsActive { get; set; }
    }
}
