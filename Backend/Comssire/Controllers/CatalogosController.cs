using Comssire.Data;
using Comssire.DTOs.Catalogos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers;

[ApiController]
[Route("api/catalogos")]
[Authorize]
public class CatalogosController : ControllerBase
{
    private readonly AppDbContext _db;

    public CatalogosController(AppDbContext db)
    {
        _db = db;
    }

    // =========================================================
    // Helpers
    // =========================================================

    private static string NormalizeSearch(string? search)
        => (search ?? "").Trim();

    private static bool HasSearch(string s)
        => !string.IsNullOrWhiteSpace(s);

    // =========================================================
    // ✅ GET: /api/catalogos/proveedores?search=
    // =========================================================
    [HttpGet("proveedores")]
    public async Task<ActionResult<IEnumerable<ProveedorDto>>> GetProveedores([FromQuery] string? search = null)
    {
        var s = NormalizeSearch(search);

        var q = _db.FbProveedores.AsNoTracking();

        if (HasSearch(s))
        {
            // Para PostgreSQL: ILike es lo mejor (case-insensitive)
            // Si estás usando Npgsql.EntityFrameworkCore.PostgreSQL, esto funciona.
            var like = $"%{s}%";

            q = q.Where(x =>
                EF.Functions.ILike(x.Clave ?? "", like) ||
                EF.Functions.ILike(x.Nombre ?? "", like) ||
                EF.Functions.ILike(x.Rfc ?? "", like)
            );
        }

        var data = await q
            .OrderBy(x => x.Nombre)
            .Take(200)
            .Select(x => new ProveedorDto
            {
                Clave = x.Clave,
                Nombre = x.Nombre,
                Rfc = x.Rfc,
                Status = x.Status
            })
            .ToListAsync();

        return Ok(data);
    }

    // =========================================================
    // ✅ GET: /api/catalogos/almacenes
    // =========================================================
    [HttpGet("almacenes")]
    public async Task<ActionResult<IEnumerable<AlmacenDto>>> GetAlmacenes()
    {
        var data = await _db.FbAlmacenes.AsNoTracking()
            .OrderBy(x => x.CveAlm)
            .Select(x => new AlmacenDto
            {
                CveAlm = x.CveAlm,
                Descr = x.Descr,
                Status = x.Status,
                UbiDest = x.UbiDest
            })
            .ToListAsync();

        return Ok(data);
    }

    // =========================================================
    // ✅ GET: /api/catalogos/productos?search=
    // Busca por código o descripción y regresa UltCosto
    // =========================================================
    [HttpGet("productos")]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> GetProductos([FromQuery] string? search = null)
    {
        var s = NormalizeSearch(search);

        var q = _db.FbProductos.AsNoTracking();

        if (HasSearch(s))
        {
            var like = $"%{s}%";

            q = q.Where(x =>
                EF.Functions.ILike(x.CveArt ?? "", like) ||
                EF.Functions.ILike(x.Descr ?? "", like)
            );
        }

        var data = await q
            .OrderBy(x => x.CveArt)
            .Take(200)
            .Select(x => new ProductoDto
            {
                CveArt = x.CveArt,
                Descr = x.Descr,
                UltCosto = x.UltCosto,
                Exist = x.Exist,
                UniMed = x.UniMed,
                Status = x.Status
            })
            .ToListAsync();

        return Ok(data);
    }

    // =========================================================
    // ✅ GET: /api/catalogos/productos/{cveArt}
    // Para traer descr + ultCosto por código exacto
    // =========================================================
    [HttpGet("productos/{cveArt}")]
    public async Task<ActionResult<ProductoDto>> GetProductoByCodigo([FromRoute] string cveArt)
    {
        var code = (cveArt ?? "").Trim();
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { message = "cveArt requerido" });

        var item = await _db.FbProductos.AsNoTracking()
            .Where(x => x.CveArt == code)
            .Select(x => new ProductoDto
            {
                CveArt = x.CveArt,
                Descr = x.Descr,
                UltCosto = x.UltCosto,
                Exist = x.Exist,
                UniMed = x.UniMed,
                Status = x.Status
            })
            .FirstOrDefaultAsync();

        if (item is null) return NotFound(new { message = "Producto no encontrado" });
        return Ok(item);
    }

    // =========================================================
    // ✅ GET: /api/catalogos/existencias/{cveArt}
    // Stock por almacén
    // =========================================================
    [HttpGet("existencias/{cveArt}")]
    public async Task<ActionResult<IEnumerable<ExistenciaAlmacenDto>>> GetExistenciasPorAlmacen([FromRoute] string cveArt)
    {
        var code = (cveArt ?? "").Trim();
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { message = "cveArt requerido" });

        var data = await _db.FbExistenciasAlmacen.AsNoTracking()
            .Where(x => x.CveArt == code)
            .OrderBy(x => x.CveAlm)
            .Select(x => new ExistenciaAlmacenDto
            {
                CveArt = x.CveArt,
                CveAlm = x.CveAlm,
                Exist = x.Exist,
                StockMin = x.StockMin,
                StockMax = x.StockMax,
                PendSurt = x.PendSurt
            })
            .ToListAsync();

        return Ok(data);
    }
}