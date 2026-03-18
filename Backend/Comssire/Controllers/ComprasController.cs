using Comssire.Data;
using Comssire.DTOs.Compras;
using Comssire.Models;
using Comssire.Models.Compras;
using Comssire.Services;
using Comssire.Services.Compras;
using Comssire.Services.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using System.Security.Claims;

namespace Comssire.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComprasController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ComprasController(AppDbContext db)
        {
            _db = db;
        }

        private int GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrWhiteSpace(sub)) return 0;
            return int.TryParse(sub, out var id) ? id : 0;
        }

        private bool IsAdminCompras()
        {
            return User.IsInRole("Admin")
                || User.Claims.Any(c => c.Type == "perm" && c.Value == "compras.admin");
        }

        private bool CanSee(Compra compra, int userId)
        {
            if (IsAdminCompras()) return true;
            return compra.CreadoPorUserId == userId;
        }

        private bool CanEdit(Compra compra, int userId)
        {
            if (IsAdminCompras()) return true;
            return compra.CreadoPorUserId == userId;
        }

        private bool IsWorkerOwnCompra(Compra compra, int userId)
        {
            if (userId <= 0) return false;
            if (IsAdminCompras()) return false;
            return compra.CreadoPorUserId == userId;
        }

        private static bool IsEditableState(Compra compra, bool isAdmin)
        {
            if (isAdmin) return true;

            return compra.Estado == CompraEstado.Borrador
                || compra.Estado == CompraEstado.Rechazada;
        }

        private static IActionResult? BlockIfNotEditable(Compra compra, bool isAdmin, bool force)
        {
            if (!IsEditableState(compra, isAdmin))
            {
                return new BadRequestObjectResult(new
                {
                    message = $"No puedes modificar una compra en estado {compra.Estado}.",
                    estado = compra.Estado.ToString()
                });
            }

            if (isAdmin && compra.Estado == CompraEstado.Exportada && !force)
            {
                return new ObjectResult(new
                {
                    message = "Esta compra ya fue exportada (MOD generado). Si deseas editarla, confirma la acción.",
                    estado = compra.Estado.ToString(),
                    requireForce = true
                })
                { StatusCode = 409 };
            }

            return null;
        }

        private static DateTime NormalizeFechaCompra(DateTime fecha)
        {
            var day = fecha.Date;
            var normalized = day.AddHours(12);
            return DateTime.SpecifyKind(normalized, DateTimeKind.Utc);
        }

        private string? ValidateBeforeSendOrApprove(Compra compra)
        {
            if (string.IsNullOrWhiteSpace(compra.FolioFactura))
                return "Falta FolioFactura";

            if (compra.Fecha == default)
                return "Falta Fecha";

            if (string.IsNullOrWhiteSpace(compra.CveClpv))
                return "Falta proveedor (CveClpv)";

            if (compra.NumAlmaDefault <= 0)
                return "Falta almacén default (NumAlmaDefault)";

            if (compra.Partidas == null || compra.Partidas.Count == 0)
                return "La compra no tiene partidas.";

            foreach (var p in compra.Partidas)
            {
                if (string.IsNullOrWhiteSpace(p.CveArt))
                    return "Hay partidas sin CveArt.";

                if (p.CantTotal <= 0)
                    return $"Partida {p.CveArt}: CantTotal inválida.";

                if (p.CostoUnitario <= 0)
                    return $"Partida {p.CveArt}: CostoUnitario inválido.";

                if (p.Repartos != null && p.Repartos.Count > 0)
                {
                    var sum = p.Repartos.Sum(r => r.Cant);
                    if (sum != p.CantTotal)
                        return $"Partida {p.CveArt}: el reparto no cuadra. CantTotal={p.CantTotal}, sumaRepartos={sum}.";

                    foreach (var r in p.Repartos)
                    {
                        if (r.NumAlm <= 0)
                            return $"Partida {p.CveArt}: reparto con NumAlm inválido.";

                        if (r.Cant <= 0)
                            return $"Partida {p.CveArt}: reparto con Cant inválida.";
                    }
                }
            }

            return null;
        }

        private static bool WorkerPuedeDescargar(CompraEstado estado)
        {
            return estado == CompraEstado.Aprobada || estado == CompraEstado.Exportada;
        }

        [HttpPost]
        [Authorize(Policy = "compras.crear")]
        public async Task<IActionResult> Crear([FromBody] CompraCreateDto dto)
        {
            var userId = GetUserId();
            if (userId <= 0) return Forbid();

            var folio = (dto.FolioFactura ?? "").Trim();
            var cve = (dto.CveClpv ?? "").Trim();

            var compra = new Compra
            {
                Id = Guid.NewGuid(),
                FolioFactura = folio,
                Fecha = NormalizeFechaCompra(dto.Fecha),
                CveClpv = cve,
                NumAlmaDefault = dto.NumAlmaDefault,
                Observaciones = dto.Observaciones,
                Estado = CompraEstado.Borrador,
                CreatedAt = DateTime.UtcNow,
                CreadoPorUserId = userId
            };

            _db.Compras.Add(compra);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                compra.Id,
                compra.Estado
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = "compras.ver")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var compra = await _db.Compras
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!CanSee(compra, userId)) return Forbid();

            return Ok(compra);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "compras.editar_propias")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CompraUpdateDto dto, [FromQuery] bool force = false)
        {
            var compra = await _db.Compras.FirstOrDefaultAsync(c => c.Id == id);
            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!CanEdit(compra, userId)) return Forbid();

            var isAdmin = IsAdminCompras();
            var blocked = BlockIfNotEditable(compra, isAdmin, force);
            if (blocked != null) return blocked;

            compra.FolioFactura = (dto.FolioFactura ?? "").Trim();
            compra.Fecha = NormalizeFechaCompra(dto.Fecha);
            compra.CveClpv = (dto.CveClpv ?? "").Trim();
            compra.NumAlmaDefault = dto.NumAlmaDefault;
            compra.Observaciones = dto.Observaciones;

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id:guid}/partidas")]
        [Authorize(Policy = "compras.editar_propias")]
        public async Task<IActionResult> AddPartida(Guid id, [FromBody] CompraAddPartidaDto dto, [FromQuery] bool force = false)
        {
            var compra = await _db.Compras
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .Include(c => c.Factura)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!CanEdit(compra, userId)) return Forbid();

            var isAdmin = IsAdminCompras();
            var blocked = BlockIfNotEditable(compra, isAdmin, force);
            if (blocked != null) return blocked;

            var cveArt = (dto.CveArt ?? "").Trim();
            if (string.IsNullOrWhiteSpace(cveArt))
                return BadRequest("CveArt es requerido.");

            if (dto.CantTotal <= 0)
                return BadRequest("CantTotal debe ser mayor a 0.");

            if (dto.CostoUnitario <= 0)
                return BadRequest("CostoUnitario debe ser mayor a 0.");

            if (dto.Repartos != null && dto.Repartos.Count > 0)
            {
                foreach (var r in dto.Repartos)
                {
                    if (r.Cant <= 0) return BadRequest("Reparto con Cant inválida.");
                    if (r.NumAlm <= 0) return BadRequest("Reparto con NumAlm inválido.");
                }

                var sum = dto.Repartos.Sum(x => x.Cant);
                if (sum != dto.CantTotal)
                    return BadRequest($"El reparto no cuadra. CantTotal={dto.CantTotal} sumaRepartos={sum}");
            }

            var partida = new CompraPartida
            {
                Id = Guid.NewGuid(),
                CompraId = compra.Id,
                CveArt = cveArt,
                CantTotal = dto.CantTotal,
                CostoUnitario = dto.CostoUnitario,
                Observaciones = dto.Observaciones,
                IvaPct = 16m
            };

            if (dto.Repartos != null && dto.Repartos.Count > 0)
            {
                partida.Repartos = dto.Repartos.Select(r => new CompraPartidaAlmacen
                {
                    Id = Guid.NewGuid(),
                    CompraPartidaId = partida.Id,
                    NumAlm = r.NumAlm,
                    Cant = r.Cant
                }).ToList();
            }

            _db.CompraPartidas.Add(partida);
            await _db.SaveChangesAsync();

            var compraReload = await _db.Compras
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            return Ok(compraReload);
        }

        [HttpPut("{id:guid}/partidas/{partidaId:guid}")]
        [Authorize(Policy = "compras.editar_propias")]
        public async Task<IActionResult> UpdatePartida(Guid id, Guid partidaId, [FromBody] CompraUpdatePartidaDto dto, [FromQuery] bool force = false)
        {
            var compra = await _db.Compras.FirstOrDefaultAsync(c => c.Id == id);
            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!CanEdit(compra, userId)) return Forbid();

            var isAdmin = IsAdminCompras();
            var blocked = BlockIfNotEditable(compra, isAdmin, force);
            if (blocked != null) return blocked;

            var partida = await _db.CompraPartidas
                .AsTracking()
                .FirstOrDefaultAsync(p => p.Id == partidaId && p.CompraId == id);

            if (partida == null) return NotFound();

            partida.CantTotal = dto.CantTotal;
            partida.CostoUnitario = dto.CostoUnitario;
            partida.Observaciones = dto.Observaciones;

            if (dto.CantTotal <= 0) return BadRequest("CantTotal inválida.");
            if (dto.CostoUnitario <= 0) return BadRequest("CostoUnitario inválido.");

            if (dto.Repartos != null && dto.Repartos.Count > 0)
            {
                foreach (var r in dto.Repartos)
                {
                    if (r.Cant <= 0) return BadRequest("Reparto con Cant inválida.");
                    if (r.NumAlm <= 0) return BadRequest("Reparto con NumAlm inválido.");
                }

                var sum = dto.Repartos.Sum(x => x.Cant);
                if (sum != dto.CantTotal)
                    return BadRequest($"El reparto no cuadra. CantTotal={dto.CantTotal} sumaRepartos={sum}");
            }

            const int maxRetries = 2;

            for (var attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    await using var tx = await _db.Database.BeginTransactionAsync();

                    await _db.SaveChangesAsync();

                    var table = _db.Model.FindEntityType(typeof(CompraPartidaAlmacen))?.GetTableName() ?? "CompraPartidasAlmacen";
                    var schema = _db.Model.FindEntityType(typeof(CompraPartidaAlmacen))?.GetSchema();
                    var fullName = string.IsNullOrWhiteSpace(schema) ? $"\"{table}\"" : $"\"{schema}\".\"{table}\"";

                    var pId = new NpgsqlParameter("p_partidaId", NpgsqlDbType.Uuid) { Value = partidaId };
                    await _db.Database.ExecuteSqlRawAsync(
                        $"DELETE FROM {fullName} WHERE \"CompraPartidaId\" = @p_partidaId;",
                        pId
                    );

                    if (dto.Repartos != null && dto.Repartos.Count > 0)
                    {
                        var nuevos = dto.Repartos.Select(r => new CompraPartidaAlmacen
                        {
                            Id = Guid.NewGuid(),
                            CompraPartidaId = partidaId,
                            NumAlm = r.NumAlm,
                            Cant = r.Cant
                        }).ToList();

                        _db.CompraPartidasAlmacen.AddRange(nuevos);
                        await _db.SaveChangesAsync();
                    }

                    await tx.CommitAsync();
                    return Ok();
                }
                catch (DbUpdateConcurrencyException) when (attempt < maxRetries)
                {
                    _db.ChangeTracker.Clear();

                    compra = await _db.Compras.FirstOrDefaultAsync(c => c.Id == id);
                    if (compra == null) return NotFound();

                    partida = await _db.CompraPartidas
                        .AsTracking()
                        .FirstOrDefaultAsync(p => p.Id == partidaId && p.CompraId == id);

                    if (partida == null) return NotFound();

                    partida.CantTotal = dto.CantTotal;
                    partida.CostoUnitario = dto.CostoUnitario;
                    partida.Observaciones = dto.Observaciones;

                    continue;
                }
                catch (DbUpdateConcurrencyException)
                {
                    return StatusCode(409, new
                    {
                        message = "La partida fue modificada al mismo tiempo. Intenta de nuevo.",
                        detail = "DbUpdateConcurrencyException"
                    });
                }
            }

            return StatusCode(500, new { message = "No se pudo guardar la partida." });
        }

        [HttpDelete("{id:guid}/partidas/{partidaId:guid}")]
        [Authorize(Policy = "compras.editar_propias")]
        public async Task<IActionResult> DeletePartida(Guid id, Guid partidaId, [FromQuery] bool force = false)
        {
            var compra = await _db.Compras.FirstOrDefaultAsync(c => c.Id == id);
            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!CanEdit(compra, userId)) return Forbid();

            var isAdmin = IsAdminCompras();
            var blocked = BlockIfNotEditable(compra, isAdmin, force);
            if (blocked != null) return blocked;

            var partida = await _db.CompraPartidas
                .Include(p => p.Repartos)
                .FirstOrDefaultAsync(p => p.Id == partidaId && p.CompraId == id);

            if (partida == null) return NotFound();

            if (partida.Repartos != null && partida.Repartos.Count > 0)
                _db.CompraPartidasAlmacen.RemoveRange(partida.Repartos);

            _db.CompraPartidas.Remove(partida);
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id:guid}/factura")]
        [Authorize(Policy = "compras.editar_propias")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(10_000_000)]
        public async Task<IActionResult> UploadFactura(
            Guid id,
            [FromForm] UploadFacturaForm form,
            [FromServices] IStorageService storage,
            CancellationToken ct)
        {
            var compra = await _db.Compras
                .Include(c => c.Factura)
                .FirstOrDefaultAsync(c => c.Id == id, ct);

            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!IsWorkerOwnCompra(compra, userId)) return Forbid();

            if (compra.Estado != CompraEstado.Borrador && compra.Estado != CompraEstado.Rechazada)
            {
                return BadRequest(new
                {
                    message = "Solo puedes adjuntar factura cuando la compra está en Borrador o Rechazada.",
                    estado = compra.Estado.ToString()
                });
            }

            var file = form?.File;

            if (file == null || file.Length == 0)
                return BadRequest("Archivo inválido.");

            var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowed.Contains(file.ContentType))
                return BadRequest("Solo se permiten imágenes JPG, PNG o WEBP.");

            if (file.Length > 10 * 1024 * 1024)
                return BadRequest("La imagen excede 10MB.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(ext))
            {
                ext = file.ContentType switch
                {
                    "image/jpeg" => ".jpg",
                    "image/png" => ".png",
                    "image/webp" => ".webp",
                    _ => ".bin"
                };
            }

            var objectKey = $"compras/{compra.Id}/factura/{Guid.NewGuid()}{ext}";
            await storage.UploadAsync(file, objectKey, ct);

            if (compra.Factura != null)
            {
                await storage.DeleteAsync(compra.Factura.ObjectKey, ct);
                compra.Factura.ObjectKey = objectKey;
                compra.Factura.FileNameOriginal = file.FileName;
                compra.Factura.ContentType = file.ContentType;
                compra.Factura.SizeBytes = file.Length;
                compra.Factura.UploadedAt = DateTime.UtcNow;
                compra.Factura.UploadedByUserId = userId;
            }
            else
            {
                compra.Factura = new CompraFactura
                {
                    Id = Guid.NewGuid(),
                    CompraId = compra.Id,
                    ObjectKey = objectKey,
                    FileNameOriginal = file.FileName,
                    ContentType = file.ContentType,
                    SizeBytes = file.Length,
                    UploadedAt = DateTime.UtcNow,
                    UploadedByUserId = userId
                };

                _db.CompraFacturas.Add(compra.Factura);
            }

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                ok = true,
                compraId = compra.Id,
                fileName = file.FileName,
                contentType = file.ContentType,
                sizeBytes = file.Length
            });
        }

        [HttpGet("{id:guid}/factura")]
        [Authorize(Policy = "compras.ver")]
        public async Task<IActionResult> GetFactura(Guid id, [FromServices] IStorageService storage, CancellationToken ct)
        {
            var compra = await _db.Compras
                .Include(c => c.Factura)
                .FirstOrDefaultAsync(c => c.Id == id, ct);

            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!CanSee(compra, userId)) return Forbid();

            if (compra.Factura == null) return NoContent();

            return Ok(new
            {
                compra.Factura.Id,
                compra.Factura.FileNameOriginal,
                compra.Factura.ContentType,
                compra.Factura.SizeBytes,
                compra.Factura.UploadedAt,
                viewUrl = storage.GetPresignedReadUrl(compra.Factura.ObjectKey, TimeSpan.FromMinutes(20))
            });
        }

        [HttpDelete("{id:guid}/factura")]
        [Authorize(Policy = "compras.editar_propias")]
        public async Task<IActionResult> DeleteFactura(Guid id, [FromServices] IStorageService storage, CancellationToken ct)
        {
            var compra = await _db.Compras
                .Include(c => c.Factura)
                .FirstOrDefaultAsync(c => c.Id == id, ct);

            if (compra == null) return NotFound();

            var userId = GetUserId();
            if (!IsWorkerOwnCompra(compra, userId)) return Forbid();

            if (compra.Estado != CompraEstado.Borrador && compra.Estado != CompraEstado.Rechazada)
            {
                return BadRequest(new
                {
                    message = "Solo puedes eliminar la factura cuando la compra está en Borrador o Rechazada.",
                    estado = compra.Estado.ToString()
                });
            }

            if (compra.Factura == null) return Ok();

            await storage.DeleteAsync(compra.Factura.ObjectKey, ct);
            _db.CompraFacturas.Remove(compra.Factura);
            await _db.SaveChangesAsync(ct);
            return Ok();
        }

        [HttpPost("{id:guid}/enviar")]
        [Authorize(Policy = "compras.enviar_aprobacion")]
        public async Task<IActionResult> Enviar(Guid id)
        {
            var compra = await _db.Compras
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .Include(c => c.Factura)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null) return NotFound();

            var userId = GetUserId();
            var isAdmin = IsAdminCompras();

            if (!isAdmin && compra.CreadoPorUserId != userId)
                return Forbid();

            if (compra.Estado != CompraEstado.Borrador && compra.Estado != CompraEstado.Rechazada)
                return BadRequest("Solo puedes enviar compras en estado Borrador o Rechazada.");

            var err = ValidateBeforeSendOrApprove(compra);
            if (err != null) return BadRequest(err);

            if (!isAdmin && compra.Factura == null)
                return BadRequest("Debes anexar la imagen de la factura antes de enviar a aprobación.");

            compra.Estado = CompraEstado.Enviada;
            compra.EnviadoAt = DateTime.UtcNow;
            compra.EnviadoPorUserId = userId;
            compra.MotivoRechazo = null;

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("aprobaciones")]
        [Authorize(Policy = "compras.ver_aprobaciones")]
        public async Task<IActionResult> GetAprobaciones()
        {
            var compras = await _db.Compras
                .Where(c => c.Estado == CompraEstado.Enviada)
                .OrderByDescending(c => c.EnviadoAt)
                .Take(200)
                .ToListAsync();

            var result = compras.Select(c => new
            {
                c.Id,
                c.FolioFactura,
                c.Fecha,
                c.CveClpv,
                c.NumAlmaDefault,
                c.Estado,
                c.EnviadoAt,
                c.CreadoPorUserId
            });

            return Ok(result);
        }

        [HttpPost("{id:guid}/aprobar")]
        [Authorize(Policy = "compras.aprobar")]
        public async Task<IActionResult> Aprobar(Guid id)
        {
            var compra = await _db.Compras
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (compra == null) return NotFound();

            if (compra.Estado != CompraEstado.Enviada)
                return BadRequest("Solo puedes aprobar compras en estado Enviada.");

            var err = ValidateBeforeSendOrApprove(compra);
            if (err != null) return BadRequest(err);

            foreach (var p in compra.Partidas)
            {
                if (p.Repartos != null && p.Repartos.Count > 0)
                {
                    foreach (var r in p.Repartos)
                    {
                        _db.MovimientosInventario.Add(new MovimientoInventario
                        {
                            Fecha = compra.Fecha,
                            Tipo = "ENTRADA_COMPRA",
                            Referencia = compra.FolioFactura,
                            CompraId = compra.Id,
                            CveArt = p.CveArt,
                            NumAlm = r.NumAlm,
                            Cantidad = r.Cant,
                            CostoUnitario = p.CostoUnitario
                        });
                    }
                }
                else
                {
                    _db.MovimientosInventario.Add(new MovimientoInventario
                    {
                        Fecha = compra.Fecha,
                        Tipo = "ENTRADA_COMPRA",
                        Referencia = compra.FolioFactura,
                        CompraId = compra.Id,
                        CveArt = p.CveArt,
                        NumAlm = compra.NumAlmaDefault,
                        Cantidad = p.CantTotal,
                        CostoUnitario = p.CostoUnitario
                    });
                }
            }

            compra.Estado = CompraEstado.Aprobada;
            compra.AprobadoAt = DateTime.UtcNow;
            compra.AprobadoPorUserId = GetUserId();

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id:guid}/rechazar")]
        [Authorize(Policy = "compras.rechazar")]
        public async Task<IActionResult> Rechazar(Guid id, [FromBody] CompraRechazarDto dto)
        {
            var compra = await _db.Compras.FirstOrDefaultAsync(c => c.Id == id);
            if (compra == null) return NotFound();

            if (compra.Estado != CompraEstado.Enviada)
                return BadRequest("Solo puedes rechazar compras en estado Enviada.");

            compra.Estado = CompraEstado.Rechazada;
            compra.RechazadoAt = DateTime.UtcNow;
            compra.RechazadoPorUserId = GetUserId();
            compra.MotivoRechazo = dto.Motivo;

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("{id:guid}/mod")]
        [Authorize(Policy = "compras.generar_mod")]
        public async Task<IActionResult> DescargarMod(Guid id)
        {
            const int maxRetries = 3;

            for (var attempt = 1; attempt <= maxRetries; attempt++)
            {
                var compra = await _db.Compras
                    .Include(c => c.Partidas)
                        .ThenInclude(p => p.Repartos)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (compra == null) return NotFound(new { message = "Compra no existe" });

                var userId = GetUserId();
                if (!CanSee(compra, userId)) return Forbid();

                var isAdmin = IsAdminCompras();

                if (!isAdmin && !WorkerPuedeDescargar(compra.Estado))
                {
                    return BadRequest(new
                    {
                        message = "MOD solo disponible para el trabajador cuando la compra está Aprobada o Exportada.",
                        estado = compra.Estado.ToString()
                    });
                }

                try
                {
                    if (compra.ModConsecutivo == null)
                    {
                        await using var tx = await _db.Database.BeginTransactionAsync();
                        await _db.Entry(compra).ReloadAsync();

                        if (compra.ModConsecutivo == null)
                        {
                            var max = await _db.Compras.MaxAsync(c => (int?)c.ModConsecutivo) ?? 0;
                            compra.ModConsecutivo = max + 1;
                            await _db.SaveChangesAsync();
                        }

                        await tx.CommitAsync();
                    }

                    var bytes = ModCompraBuilder.Build(compra);

                    if (compra.Estado == CompraEstado.Borrador || compra.Estado == CompraEstado.Aprobada)
                    {
                        compra.Estado = CompraEstado.Exportada;
                        compra.ModGeneradoAt = DateTime.UtcNow;
                        await _db.SaveChangesAsync();
                    }

                    var fileName = $"Comp {compra.ModConsecutivo!.Value:000000000}.mod";
                    return File(bytes, "application/octet-stream", fileName);
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (attempt == maxRetries)
                    {
                        return StatusCode(409, new
                        {
                            message = "La compra fue modificada al mismo tiempo. Intenta descargar el MOD de nuevo."
                        });
                    }

                    _db.ChangeTracker.Clear();
                    continue;
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        message = "No se pudo generar el MOD (posiblemente faltan datos).",
                        detail = ex.Message
                    });
                }
            }

            return StatusCode(500, new { message = "No se pudo generar MOD (reintentos agotados)." });
        }

        [HttpGet("{id:guid}/pdf")]
        [Authorize(Policy = "compras.ver")]
        public async Task<IActionResult> DescargarPdf(Guid id, [FromServices] CompraPdfService pdfService)
        {
            try
            {
                var compra = await _db.Compras.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
                if (compra == null) return NotFound(new { message = "Compra no existe" });

                var userId = GetUserId();
                if (!CanSee(compra, userId)) return Forbid();

                var isAdmin = IsAdminCompras();

                if (!isAdmin && !WorkerPuedeDescargar(compra.Estado))
                {
                    return BadRequest(new
                    {
                        message = "El PDF solo está disponible para el trabajador cuando la compra está Aprobada o Exportada.",
                        estado = compra.Estado.ToString()
                    });
                }

                var pdf = await pdfService.BuildCompraPdfAsync(id);
                Response.Headers["Content-Disposition"] = $"inline; filename=\"Compra_{id}.pdf\"";
                return File(pdf, "application/pdf");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generando PDF", detail = ex.Message });
            }
        }

        [HttpGet("historial")]
        [Authorize(Policy = "compras.ver")]
        public async Task<IActionResult> Historial(
            [FromQuery] string? search = null,
            [FromQuery] CompraEstado? estado = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20
        )
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 200) pageSize = 200;

            var userId = GetUserId();
            var isAdmin = IsAdminCompras();

            var q =
                from c in _db.Compras.AsNoTracking()
                join p in _db.FbProveedores.AsNoTracking()
                    on c.CveClpv equals p.Clave into pj
                from p in pj.DefaultIfEmpty()
                select new { c, p };

            if (!isAdmin)
            {
                q = q.Where(x => x.c.CreadoPorUserId == userId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                q = q.Where(x =>
                    x.c.FolioFactura.ToLower().Contains(s) ||
                    x.c.CveClpv.ToLower().Contains(s) ||
                    (x.p != null && x.p.Nombre != null && x.p.Nombre.ToLower().Contains(s))
                );
            }

            if (estado.HasValue)
                q = q.Where(x => x.c.Estado == estado.Value);

            if (from.HasValue)
                q = q.Where(x => x.c.Fecha >= from.Value);

            if (to.HasValue)
                q = q.Where(x => x.c.Fecha <= to.Value);

            var total = await q.CountAsync();

            var items = await q
                .OrderByDescending(x => x.c.Fecha)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.c.Id,
                    x.c.Fecha,
                    x.c.FolioFactura,

                    ProveedorNombre = x.p != null ? x.p.Nombre : "N/D",
                    ProveedorClave = x.c.CveClpv,

                    Estado = x.c.Estado.ToString(),

                    Total =
                        (x.c.Partidas.Sum(p => (decimal?)(p.CantTotal * p.CostoUnitario)) ?? 0m) +
                        (x.c.Partidas.Sum(p => (decimal?)(p.CantTotal * p.CostoUnitario * (p.IvaPct / 100m))) ?? 0m),

                    x.c.ModConsecutivo,
                    x.c.ModGeneradoAt,

                    x.c.MotivoRechazo
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                total,
                page,
                pageSize
            });
        }
    }
}