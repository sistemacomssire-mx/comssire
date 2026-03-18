using Comssire.Data;
using Comssire.DTOs.Sistema;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public RolesController(AppDbContext db)
        {
            _db = db;
        }

        // =========================================================
        // ADMIN: LISTAR ROLES (para combos de UI / alta de usuarios)
        // =========================================================
        [Authorize(Policy = "usuarios.ver")]
        [HttpGet]
        public async Task<ActionResult<List<RolListItemDto>>> GetAll()
        {
            var roles = await _db.Roles
                .AsNoTracking()
                .OrderBy(r => r.Nombre)
                .Select(r => new RolListItemDto
                {
                    Id = r.Id,
                    Nombre = r.Nombre
                })
                .ToListAsync();

            return Ok(roles);
        }
    }
}