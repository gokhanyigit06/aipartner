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
    public class TablesController : ControllerBase
    {
        private readonly PosDbContext _context;

        public TablesController(PosDbContext context)
        {
            _context = context;
        }

        // GET: api/Tables
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Table>>> GetTables()
        {
            return await _context.Tables.OrderBy(t => t.Name).ToListAsync();
        }

        // GET: api/Tables/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Table>> GetTable(Guid id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
            {
                return NotFound();
            }

            return table;
        }

        // GET: api/Tables/{id}/public
        [HttpGet("{id}/public")]
        [AllowAnonymous]
        public async Task<ActionResult<Table>> GetTablePublic(Guid id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
            {
                return NotFound();
            }

            return table;
        }

        // POST: api/Tables
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Table>> CreateTable(Table table)
        {
            table.Id = Guid.NewGuid();
            // Default TenantId for demo
            table.TenantId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTable", new { id = table.Id }, table);
        }

        // DELETE: api/Tables/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTable(Guid id)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null)
            {
                return NotFound();
            }

            _context.Tables.Remove(table);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
        // PUT: api/Tables/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateTableStatus(Guid id, [FromBody] TableStatus status)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null)
            {
                return NotFound();
            }
        
            table.Status = status;
            await _context.SaveChangesAsync();
        
            return NoContent();
        }
        // PUT: api/Tables/{id}/reset
        [HttpPut("{id}/reset")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetTable(Guid id)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null)
            {
                return NotFound();
            }

            // table.IsOccupied = false; // Property does not exist, Status enum is sufficient
            table.Status = TableStatus.Free;
            
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
