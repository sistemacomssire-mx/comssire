using Comssire.Data;
using Comssire.DTOs.Catalogos;
using Comssire.DTOs.Inventarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers;

[ApiController]
[Route("api/inventarios")]
[Authorize]
public class InventariosController : ControllerBase
{
    private readonly AppDbContext _db;
    public InventariosController(AppDbContext db) => _db = db;

    // ✅ Permisos (policies dinámicas por PermissionPolicyProvider)
    private const string PERM_VER = "inventarios.ver";

    // 1) Select de almacenes
    [HttpGet("almacenes")]
    [Authorize(Policy = PERM_VER)]
    public async Task<ActionResult<List<AlmacenDto>>> GetAlmacenes()
    {
        var data = await _db.FbAlmacenes
            .AsNoTracking()
            .OrderBy(a => a.CveAlm)
            .Select(a => new AlmacenDto
            {
                CveAlm = a.CveAlm,
                Descr = a.Descr,
                Status = a.Status,
                UbiDest = a.UbiDest
            })
            .ToListAsync();

        return Ok(data);
    }

    // 2) Existencias por almacén (incluye existencias en 0)
    // Ej:
    // GET /api/inventarios/3/existencias?q=TORNILLO&page=1&pageSize=50&soloConExistencia=true&orderBy=exist&orderDir=desc
    //
    // orderBy: "exist" | "cveArt" | "descr"
    // orderDir: "asc" | "desc"
    [HttpGet("{cveAlm:int}/existencias")]
    [Authorize(Policy = PERM_VER)]
    public async Task<IActionResult> GetExistenciasPorAlmacen(
        int cveAlm,
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] bool soloConExistencia = false,
        [FromQuery] string orderBy = "exist",
        [FromQuery] string orderDir = "desc"
    )
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 50 : pageSize;

        // MULT (existencias por almacén) JOIN INVE (producto)
        var query =
            from m in _db.FbExistenciasAlmacen.AsNoTracking()
            join p in _db.FbProductos.AsNoTracking()
                on m.CveArt equals p.CveArt
            where m.CveAlm == cveAlm
            select new InventarioItemDto
            {
                CveArt = m.CveArt,
                Descr = p.Descr,
                UniMed = p.UniMed,
                CveAlm = m.CveAlm,
                Exist = m.Exist,
                StockMin = m.StockMin,
                StockMax = m.StockMax,
                PendSurt = m.PendSurt
            };

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim();
            query = query.Where(x =>
                x.CveArt.Contains(q) ||
                (x.Descr != null && x.Descr.Contains(q))
            );
        }

        if (soloConExistencia)
            query = query.Where(x => (x.Exist ?? 0m) > 0m);

        // Orden dinámico
        var dirDesc = string.Equals(orderDir, "desc", StringComparison.OrdinalIgnoreCase);
        orderBy = (orderBy ?? "").Trim().ToLowerInvariant();

        query = orderBy switch
        {
            "cveart" => dirDesc ? query.OrderByDescending(x => x.CveArt) : query.OrderBy(x => x.CveArt),
            "descr" => dirDesc ? query.OrderByDescending(x => x.Descr) : query.OrderBy(x => x.Descr),

            // default: exist (mayor o menor)
            _ => dirDesc
                ? query.OrderByDescending(x => (x.Exist ?? 0m)).ThenBy(x => x.CveArt)
                : query.OrderBy(x => (x.Exist ?? 0m)).ThenBy(x => x.CveArt)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }
}