using System.Globalization;
using System.Security.Claims;
using Comssire.Data;
using Comssire.DTOs.ComprasRemision;
using Comssire.Models.ComprasRemision;
using Comssire.Services.ComprasRemision;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers
{
    [ApiController]
    [Route("api/compras-remision")]
    [Authorize(Roles = "Admin")]
    public class ComprasRemisionController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly CompraRemisionPdfService _pdfService;

        public ComprasRemisionController(AppDbContext db, CompraRemisionPdfService pdfService)
        {
            _db = db;
            _pdfService = pdfService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompraRemisionResponseDto>>> GetAll()
        {
            var items = await _db.ComprasRemision
                .AsNoTracking()
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(items.Select(MapToResponse));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CompraRemisionResponseDto>> GetById(Guid id)
        {
            var compra = await _db.ComprasRemision
                .AsNoTracking()
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            return Ok(MapToResponse(compra));
        }

        [HttpPost]
        public async Task<ActionResult<CompraRemisionResponseDto>> Create([FromBody] CompraRemisionCreateDto dto)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "No se pudo resolver el usuario autenticado." });

            var compra = new CompraRemision
            {
                Id = Guid.NewGuid(),
                FolioRemision = Clean(dto.FolioRemision),
                Fecha = dto.Fecha == default ? DateTime.UtcNow : dto.Fecha,
                CveClpv = Clean(dto.CveClpv),
                NumAlmaDefault = dto.NumAlmaDefault <= 0 ? 1 : dto.NumAlmaDefault,
                Observaciones = CleanNullable(dto.Observaciones),
                CreadoPorUserId = userId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                ModGeneradoAt = null,
                ModConsecutivo = null
            };

            _db.ComprasRemision.Add(compra);
            await _db.SaveChangesAsync();

            var created = await LoadCompraRemisionAsync(compra.Id);
            return CreatedAtAction(nameof(GetById), new { id = compra.Id }, MapToResponse(created!));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<CompraRemisionResponseDto>> Update(Guid id, [FromBody] CompraRemisionUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var compra = await _db.ComprasRemision
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            compra.FolioRemision = Clean(dto.FolioRemision);
            compra.Fecha = dto.Fecha == default ? compra.Fecha : dto.Fecha;
            compra.CveClpv = Clean(dto.CveClpv);
            compra.NumAlmaDefault = dto.NumAlmaDefault <= 0 ? 1 : dto.NumAlmaDefault;
            compra.Observaciones = CleanNullable(dto.Observaciones);
            compra.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(MapToResponse(compra));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var compra = await _db.ComprasRemision
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            _db.ComprasRemision.Remove(compra);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        [HttpPost("{id:guid}/partidas")]
        public async Task<ActionResult<CompraRemisionResponseDto>> AddPartida(
   Guid id, [FromBody] CompraRemisionAddPartidaDto dto)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            // Carga SOLO para validar existencia y obtener numAlmaDefault
            var compraInfo = await _db.ComprasRemision
                .AsNoTracking()                          // ← sin tracking, no registra xmin ni nada
                .Select(c => new { c.Id, c.NumAlmaDefault })
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compraInfo == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            var repartoValidation = BuildRepartos(
                dto.Repartos, dto.CantTotal, compraInfo.NumAlmaDefault,
                out var repartos, out var repartoError);

            if (!repartoValidation)
                return BadRequest(new { message = repartoError });

            // Insertar partida directamente, sin tocar la entidad padre
            var partida = new CompraRemisionPartida
            {
                Id = Guid.NewGuid(),
                CompraRemisionId = id,
                CveArt = Clean(dto.CveArt, 16),
                Descripcion = Clean(dto.Descripcion, 40),
                CantTotal = dto.CantTotal,
                CostoUnitario = dto.CostoUnitario,
                PrecioUnitario = dto.PrecioUnitario,
                UniVenta = Clean(string.IsNullOrWhiteSpace(dto.UniVenta) ? "PZ" : dto.UniVenta, 10),
                IvaPct = dto.IvaPct,
                Observaciones = CleanNullable(dto.Observaciones),
                Repartos = repartos
            };

            _db.CompraRemisionPartidas.Add(partida);

            // Actualizar UpdatedAt con ExecuteUpdateAsync — no pasa por el change tracker
            await _db.ComprasRemision
                .Where(c => c.Id == id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.UpdatedAt, DateTime.UtcNow));

            await _db.SaveChangesAsync();

            var compraActualizada = await LoadCompraRemisionAsync(id);
            return Ok(MapToResponse(compraActualizada!));
        }

        [HttpPut("{id:guid}/partidas/{partidaId:guid}")]
        public async Task<ActionResult<CompraRemisionResponseDto>> UpdatePartida(
    Guid id, Guid partidaId, [FromBody] CompraRemisionUpdatePartidaDto dto)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            // ⬇️ Usar una transacción explícita evita estados intermedios inconsistentes
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var compra = await _db.ComprasRemision
                    .Include(c => c.Partidas)
                        .ThenInclude(p => p.Repartos)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (compra == null)
                    return NotFound(new { message = "Compra por nota de remisión no encontrada." });

                var partida = compra.Partidas.FirstOrDefault(p => p.Id == partidaId);
                if (partida == null)
                    return NotFound(new { message = "Partida no encontrada." });

                var repartoValidation = BuildRepartos(dto.Repartos, dto.CantTotal,
                    compra.NumAlmaDefault, out var repartos, out var repartoError);
                if (!repartoValidation)
                    return BadRequest(new { message = repartoError });

                partida.CveArt = Clean(dto.CveArt, 16);
                partida.Descripcion = Clean(dto.Descripcion, 40);
                partida.CantTotal = dto.CantTotal;
                partida.CostoUnitario = dto.CostoUnitario;
                partida.PrecioUnitario = dto.PrecioUnitario;
                partida.UniVenta = Clean(string.IsNullOrWhiteSpace(dto.UniVenta) ? "PZ" : dto.UniVenta, 10);
                partida.IvaPct = dto.IvaPct;
                partida.Observaciones = CleanNullable(dto.Observaciones);

                // ✅ Eliminar solo los que realmente existen (recarga directa para evitar
                //    trabajar con repartos ya eliminados por otro request)
                var repartosExistentes = await _db.CompraRemisionPartidasAlmacen
                    .Where(r => r.CompraRemisionPartidaId == partidaId)
                    .ToListAsync();

                if (repartosExistentes.Any())
                    _db.CompraRemisionPartidasAlmacen.RemoveRange(repartosExistentes);

                foreach (var r in repartos)
                    r.CompraRemisionPartidaId = partidaId;

                await _db.CompraRemisionPartidasAlmacen.AddRangeAsync(repartos);

                compra.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(MapToResponse(compra));
            }
            catch (DbUpdateConcurrencyException)
            {
                await tx.RollbackAsync();
                return Conflict(new { message = "El registro fue modificado por otro proceso. Por favor recarga e intenta de nuevo." });
            }
        }
        [HttpDelete("{id:guid}/partidas/{partidaId:guid}")]
        public async Task<ActionResult<CompraRemisionResponseDto>> DeletePartida(Guid id, Guid partidaId)
        {
            var compra = await _db.ComprasRemision
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            var partida = compra.Partidas.FirstOrDefault(p => p.Id == partidaId);
            if (partida == null)
                return NotFound(new { message = "Partida no encontrada." });

            _db.CompraRemisionPartidas.Remove(partida);
            compra.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(MapToResponse(compra));
        }

        [HttpGet("{id:guid}/mod")]
        public async Task<IActionResult> DownloadMod(Guid id)
        {
            var compra = await _db.ComprasRemision
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            if (compra.Partidas.Count == 0)
                return BadRequest(new { message = "La compra por nota de remisión no tiene partidas." });

            if (!compra.ModConsecutivo.HasValue)
            {
                var nextConsecutivo = (await _db.ComprasRemision
                    .MaxAsync(c => (int?)c.ModConsecutivo) ?? 0) + 1;

                compra.ModConsecutivo = nextConsecutivo;
            }

            compra.ModGeneradoAt = DateTime.UtcNow;
            compra.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var bytes = ModCompraRemisionBuilder.Build(compra);
            var fileName = BuildModFileName(compra);
            return File(bytes, "application/octet-stream", fileName);
        }

        [HttpGet("{id:guid}/pdf")]
        public async Task<IActionResult> DownloadPdf(Guid id)
        {
            var compra = await _db.ComprasRemision
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null)
                return NotFound(new { message = "Compra por nota de remisión no encontrada." });

            var pdf = await _pdfService.BuildCompraRemisionPdfAsync(id);
            var fileName = BuildPdfFileName(compra);
            return File(pdf, "application/pdf", fileName);
        }

        private async Task<CompraRemision?> LoadCompraRemisionAsync(Guid id)
        {
            return await _db.ComprasRemision
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        private static CompraRemisionResponseDto MapToResponse(CompraRemision c)
        {
            var estado = (c.ModGeneradoAt.HasValue || (c.ModConsecutivo ?? 0) > 0)
                ? "Exportada"
                : "Borrador";

            return new CompraRemisionResponseDto
            {
                Id = c.Id,
                FolioRemision = c.FolioRemision,
                Fecha = c.Fecha,
                CveClpv = c.CveClpv,
                NumAlmaDefault = c.NumAlmaDefault,
                Observaciones = c.Observaciones,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                ModGeneradoAt = c.ModGeneradoAt,
                ModConsecutivo = c.ModConsecutivo,
                Estado = estado,
                Partidas = c.Partidas
                    .OrderBy(p => p.CveArt)
                    .Select(p => new CompraRemisionPartidaResponseDto
                    {
                        Id = p.Id,
                        CveArt = p.CveArt,
                        Descripcion = p.Descripcion,
                        CantTotal = p.CantTotal,
                        CostoUnitario = p.CostoUnitario,
                        PrecioUnitario = p.PrecioUnitario,
                        UniVenta = p.UniVenta,
                        IvaPct = p.IvaPct,
                        Observaciones = p.Observaciones,
                        Repartos = p.Repartos
                            .OrderBy(r => r.NumAlm)
                            .Select(r => new CompraRemisionPartidaAlmacenResponseDto
                            {
                                Id = r.Id,
                                NumAlm = r.NumAlm,
                                Cant = r.Cant
                            })
                            .ToList()
                    })
                    .ToList()
            };
        }

        private int? GetCurrentUserId()
        {
            var candidates = new[]
            {
                ClaimTypes.NameIdentifier,
                "sub",
                "userId",
                "uid",
                "id"
            };

            foreach (var key in candidates)
            {
                var value = User.FindFirstValue(key);
                if (int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id))
                    return id;
            }

            return null;
        }

        private static bool BuildRepartos(
            List<CompraRemisionRepartoDto>? source,
            decimal cantTotal,
            int numAlmaDefault,
            out List<CompraRemisionPartidaAlmacen> repartos,
            out string? error)
        {
            repartos = new List<CompraRemisionPartidaAlmacen>();
            error = null;

            if (cantTotal <= 0)
            {
                error = "La cantidad total debe ser mayor a cero.";
                return false;
            }

            if (source == null || source.Count == 0)
            {
                repartos.Add(new CompraRemisionPartidaAlmacen
                {
                    Id = Guid.NewGuid(),
                    NumAlm = numAlmaDefault <= 0 ? 1 : numAlmaDefault,
                    Cant = cantTotal
                });
                return true;
            }

            foreach (var item in source)
            {
                if (item.NumAlm <= 0)
                {
                    error = "Cada reparto debe tener un almacén válido.";
                    return false;
                }

                if (item.Cant <= 0)
                {
                    error = "Cada reparto debe tener una cantidad mayor a cero.";
                    return false;
                }

                repartos.Add(new CompraRemisionPartidaAlmacen
                {
                    Id = Guid.NewGuid(),
                    NumAlm = item.NumAlm,
                    Cant = item.Cant
                });
            }

            var suma = repartos.Sum(x => x.Cant);
            if (Math.Abs(suma - cantTotal) > 0.0001m)
            {
                error = "La suma de repartos debe ser igual a la cantidad total de la partida.";
                return false;
            }

            return true;
        }

        private static string Clean(string? value, int? maxLen = null)
        {
            var v = (value ?? string.Empty).Trim();
            if (maxLen.HasValue && v.Length > maxLen.Value)
                return v[..maxLen.Value];
            return v;
        }

        private static string? CleanNullable(string? value, int? maxLen = null)
        {
            var v = Clean(value, maxLen);
            return string.IsNullOrWhiteSpace(v) ? null : v;
        }

        private static string BuildModFileName(CompraRemision compra)
        {
            var folio = SafeFilePart(compra.FolioRemision);
            var consecutivo = compra.ModConsecutivo?.ToString("D8", CultureInfo.InvariantCulture) ?? "00000000";
            return $"Rem_{consecutivo}_{folio}.mod";
        }

        private static string BuildPdfFileName(CompraRemision compra)
        {
            var folio = SafeFilePart(compra.FolioRemision);
            return $"CompraRemision_{folio}.pdf";
        }

        private static string SafeFilePart(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "SIN_FOLIO";

            var invalid = Path.GetInvalidFileNameChars();
            var cleaned = new string(value.Trim().Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
            return string.IsNullOrWhiteSpace(cleaned) ? "SIN_FOLIO" : cleaned;
        }
    }
}
