using System;
using System.Collections.Generic;
using System.Linq;
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
    public class RawMaterialsController : ControllerBase
    {
        private readonly PosDbContext _context;

        public RawMaterialsController(PosDbContext context)
        {
            _context = context;
        }

        // GET: api/RawMaterials
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RawMaterial>>> GetRawMaterials()
        {
            return await _context.RawMaterials.OrderBy(m => m.Name).ToListAsync();
        }

        // POST: api/RawMaterials
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RawMaterial>> CreateRawMaterial(RawMaterial rawMaterial)
        {
            rawMaterial.Id = Guid.NewGuid();
            // Default Tenant
            rawMaterial.TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            
            _context.RawMaterials.Add(rawMaterial);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRawMaterials", new { id = rawMaterial.Id }, rawMaterial);
        }

        // PUT: api/RawMaterials/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRawMaterial(Guid id, RawMaterial rawMaterial)
        {
            if (id != rawMaterial.Id)
            {
                return BadRequest();
            }

            _context.Entry(rawMaterial).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RawMaterialExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool RawMaterialExists(Guid id)
        {
            return _context.RawMaterials.Any(e => e.Id == id);
        }
    }
}
