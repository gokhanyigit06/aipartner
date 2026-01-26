using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantPos.Api.Data;
using RestaurantPos.Api.Models;

namespace RestaurantPos.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecipeItemsController : ControllerBase
    {
        private readonly PosDbContext _context;

        public RecipeItemsController(PosDbContext context)
        {
            _context = context;
        }

        // POST: api/RecipeItems
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RecipeItem>> CreateRecipeItem(RecipeItem recipeItem)
        {
            recipeItem.Id = Guid.NewGuid();
            recipeItem.TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");

            _context.RecipeItems.Add(recipeItem);
            await _context.SaveChangesAsync();

            return Ok(recipeItem);
        }
        
        // DELETE: api/RecipeItems/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRecipeItem(Guid id)
        {
             var item = await _context.RecipeItems.FindAsync(id);
             if (item == null) return NotFound();

             _context.RecipeItems.Remove(item);
             await _context.SaveChangesAsync();
             return NoContent();
        }
    }
}
