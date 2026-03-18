using Comssire.Data;
using Comssire.DTOs.Inventarios.Tomas;
using Comssire.Models.Inventarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Comssire.Controllers;

[ApiController]
[Route("api/inventarios/tomas")]
[Authorize]
public class InventariosTomasController : ControllerBase
{
    private readonly AppDbContext _db;
    public InventariosTomasController(AppDbContext db) => _db = db;

    private const string PERM_CREAR = "inventarios.toma.crear";
    private const string PERM_CAPTURAR = "inventarios.toma.capturar";
    private const string PERM_CERRAR = "inventarios.toma.cerrar";
    private const string PERM_REPORTE = "inventarios.toma.reporte";

    // ======================
    // 1) Crear toma + snapshot
    // ======================
    [HttpPost]
    [Authorize(Policy = PERM_CREAR)]
    public async Task<IActionResult> CrearToma([FromBody] CreateTomaDto dto)
    {
        if (dto.CveAlm <= 0) return BadRequest("CveAlm inválido.");

        var existeAlmacen = await _db.FbAlmacenes.AnyAsync(a => a.CveAlm == dto.CveAlm);
        if (!existeAlmacen) return BadRequest("El almacén no existe en Firebird espejo.");

        // Crea encabezado
        var toma = new InvToma
        {
            CveAlm = dto.CveAlm,
            // ABIERTA = en proceso (front lo etiqueta)
            Status = "ABIERTA",
            CreadaEn = DateTime.UtcNow,
            CreadaPorUserId = TryGetUserId()
        };

        _db.InvTomas.Add(toma);
        await _db.SaveChangesAsync(); // para obtener Id

        // Snapshot: trae TODOS los registros de MULT para ese almacén (incluye 0)
        var snapshot = await _db.FbExistenciasAlmacen
            .AsNoTracking()
            .Where(m => m.CveAlm == dto.CveAlm)
            .Select(m => new InvTomaDet
            {
                TomaId = toma.Id,
                CveArt = m.CveArt,
                ExistSistema = (decimal)(m.Exist ?? 0m),
                ExistFisico = null,
                CapturadoEn = null
            })
            .ToListAsync();

        await _db.InvTomasDet.AddRangeAsync(snapshot);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            tomaId = toma.Id,
            cveAlm = toma.CveAlm,
            totalProductos = snapshot.Count
        });
    }

    // ======================
    // 2) Listar tomas (HISTORIAL PROFESIONAL)
    // ======================
    [HttpGet]
    [Authorize(Policy = PERM_REPORTE)]
    public async Task<ActionResult<List<TomaDto>>> Listar(
        [FromQuery] int? cveAlm = null,
        [FromQuery] string? status = null,
        [FromQuery] int? userId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null
    )
    {
        var q = _db.InvTomas.AsNoTracking().AsQueryable();

        if (cveAlm.HasValue) q = q.Where(t => t.CveAlm == cveAlm.Value);
        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim().ToUpperInvariant();
            q = q.Where(t => t.Status == st);
        }

        if (userId.HasValue) q = q.Where(t => t.CreadaPorUserId == userId.Value);

        // Fechas (UTC). from/to se interpretan como UTC si vienen sin Kind.
        if (from.HasValue)
        {
            var f = EnsureUtc(from.Value);
            q = q.Where(t => t.CreadaEn >= f);
        }
        if (to.HasValue)
        {
            // inclusivo hasta el final del día si te mandan una fecha sin hora:
            var t = EnsureUtc(to.Value);
            q = q.Where(x => x.CreadaEn <= t);
        }

        // Traemos datos base y luego resolvemos totales/capturados en una sola pasada
        var tomasBase = await q
            .OrderByDescending(t => t.Id)
            .Select(t => new
            {
                t.Id,
                t.CveAlm,
                t.Status,
                t.CreadaEn,
                t.CerradaEn,
                t.CreadaPorUserId
            })
            .ToListAsync();

        var tomaIds = tomasBase.Select(x => x.Id).ToList();

        var detAgg = await _db.InvTomasDet
            .AsNoTracking()
            .Where(d => tomaIds.Contains(d.TomaId))
            .GroupBy(d => d.TomaId)
            .Select(g => new
            {
                TomaId = g.Key,
                Total = g.Count(),
                Capturados = g.Count(x => x.ExistFisico != null),
                ConDiferencia = g.Count(x => x.ExistFisico != null && (x.ExistFisico.Value - x.ExistSistema) != 0m)
            })
            .ToListAsync();

        var detMap = detAgg.ToDictionary(x => x.TomaId, x => x);

        // Resolver nombres
        var almacenes = await _db.FbAlmacenes
            .AsNoTracking()
            .Where(a => tomasBase.Select(t => t.CveAlm).Distinct().Contains(a.CveAlm))
            .Select(a => new { a.CveAlm, a.Descr })
            .ToListAsync();

        var almMap = almacenes.ToDictionary(x => x.CveAlm, x => x.Descr);

        var userIds = tomasBase.Where(x => x.CreadaPorUserId != null).Select(x => x.CreadaPorUserId!.Value).Distinct().ToList();
        var users = await _db.Usuarios
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Nombre, u.Apellidos })
            .ToListAsync();

        var userMap = users.ToDictionary(x => x.Id, x => $"{x.Nombre} {x.Apellidos}".Trim());

        var outList = tomasBase.Select(t =>
        {
            detMap.TryGetValue(t.Id, out var agg);

            var total = agg?.Total ?? 0;
            var capt = agg?.Capturados ?? 0;
            var conDif = agg?.ConDiferencia ?? 0;

            var almName = almMap.TryGetValue(t.CveAlm, out var descr) ? descr : null;

            string? userName = null;
            if (t.CreadaPorUserId.HasValue && userMap.TryGetValue(t.CreadaPorUserId.Value, out var nm))
                userName = nm;

            return new TomaDto
            {
                Id = t.Id,
                CveAlm = t.CveAlm,
                AlmacenDescr = almName,
                Status = t.Status,
                CreadaEn = t.CreadaEn,
                CerradaEn = t.CerradaEn,
                CreadaPorUserId = t.CreadaPorUserId,
                CreadaPorNombre = userName,
                TotalProductos = total,
                Capturados = capt,
                ConDiferencia = conDif
            };
        }).ToList();

        return Ok(outList);
    }

    // ======================
    // 3) Ver toma con detalle (paginado + búsqueda)
    // ======================
    [HttpGet("{tomaId:long}")]
    [Authorize(Policy = PERM_REPORTE)]
    public async Task<IActionResult> VerToma(
        long tomaId,
        [FromQuery] string? q = null,
        [FromQuery] bool soloNoCapturados = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string orderBy = "cveArt",
        [FromQuery] string orderDir = "asc"
    )
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 50 : pageSize;

        var toma = await _db.InvTomas.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tomaId);
        if (toma == null) return NotFound("Toma no encontrada.");

        var query =
            from d in _db.InvTomasDet.AsNoTracking()
            join p in _db.FbProductos.AsNoTracking() on d.CveArt equals p.CveArt
            where d.TomaId == tomaId
            select new TomaDetalleDto
            {
                CveArt = d.CveArt,
                Descr = p.Descr,
                UniMed = p.UniMed,
                ExistSistema = d.ExistSistema,
                ExistFisico = d.ExistFisico,
                Diferencia = (d.ExistFisico ?? 0m) - d.ExistSistema,
                Capturado = d.ExistFisico != null
            };

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim();
            query = query.Where(x =>
                x.CveArt.Contains(q) ||
                (x.Descr != null && x.Descr.Contains(q))
            );
        }

        if (soloNoCapturados)
            query = query.Where(x => x.Capturado == false);

        // Orden
        var desc = string.Equals(orderDir, "desc", StringComparison.OrdinalIgnoreCase);
        orderBy = (orderBy ?? "").Trim().ToLowerInvariant();

        query = orderBy switch
        {
            "exist" => desc ? query.OrderByDescending(x => x.ExistSistema).ThenBy(x => x.CveArt)
                            : query.OrderBy(x => x.ExistSistema).ThenBy(x => x.CveArt),
            "descr" => desc ? query.OrderByDescending(x => x.Descr).ThenBy(x => x.CveArt)
                            : query.OrderBy(x => x.Descr).ThenBy(x => x.CveArt),
            _ => desc ? query.OrderByDescending(x => x.CveArt)
                      : query.OrderBy(x => x.CveArt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var totalProductos = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId);
        var capturados = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId && d.ExistFisico != null);

        return Ok(new
        {
            toma = new { toma.Id, toma.CveAlm, toma.Status, toma.CreadaEn, toma.CerradaEn },
            resumen = new { totalProductos, capturados, pendientes = totalProductos - capturados },
            total,
            page,
            pageSize,
            items
        });
    }

    // ======================
    // 4) Capturar físico (1 producto)
    // ======================
    [HttpPut("{tomaId:long}/detalle/{cveArt}")]
    [Authorize(Policy = PERM_CAPTURAR)]
    public async Task<IActionResult> CapturarFisico(long tomaId, string cveArt, [FromBody] CapturaFisicoDto dto)
    {
        cveArt = (cveArt ?? "").Trim();
        if (string.IsNullOrWhiteSpace(cveArt)) return BadRequest("CveArt inválido.");

        if (dto.ExistFisico < 0m) return BadRequest("Existencia física no puede ser negativa.");

        var toma = await _db.InvTomas.FirstOrDefaultAsync(t => t.Id == tomaId);
        if (toma == null) return NotFound("Toma no encontrada.");
        if (toma.Status == "CERRADA") return BadRequest("La toma está cerrada.");
        if (toma.Status == "CANCELADA") return BadRequest("La toma está cancelada.");

        var det = await _db.InvTomasDet.FirstOrDefaultAsync(d => d.TomaId == tomaId && d.CveArt == cveArt);
        if (det == null) return NotFound("Producto no existe en la toma (snapshot).");

        det.ExistFisico = dto.ExistFisico;
        det.CapturadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            tomaId,
            cveArt,
            existSistema = det.ExistSistema,
            existFisico = det.ExistFisico,
            diferencia = (det.ExistFisico ?? 0m) - det.ExistSistema
        });
    }

    // ======================
    // 5) Cerrar toma (Finalizar)
    // ======================
    [HttpPost("{tomaId:long}/cerrar")]
    [Authorize(Policy = PERM_CERRAR)]
    public async Task<IActionResult> Cerrar(long tomaId)
    {
        var toma = await _db.InvTomas.FirstOrDefaultAsync(t => t.Id == tomaId);
        if (toma == null) return NotFound("Toma no encontrada.");
        if (toma.Status == "CANCELADA") return BadRequest("La toma está cancelada.");
        if (toma.Status == "CERRADA") return Ok(new { message = "Ya estaba cerrada." });

        // regla: si quieres obligar a capturar todo, descomenta:
        // var pendientes = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId && d.ExistFisico == null);
        // if (pendientes > 0) return BadRequest($"No puedes cerrar: faltan {pendientes} productos por capturar.");

        toma.Status = "CERRADA";
        toma.CerradaEn = DateTime.UtcNow;
        toma.CerradaPorUserId = TryGetUserId();

        await _db.SaveChangesAsync();

        return Ok(new { tomaId, status = toma.Status, cerradaEn = toma.CerradaEn });
    }

    // ======================
    // 6) Cancelar toma
    // ======================
    [HttpPost("{tomaId:long}/cancelar")]
    [Authorize(Policy = PERM_CERRAR)]
    public async Task<IActionResult> Cancelar(long tomaId)
    {
        var toma = await _db.InvTomas.FirstOrDefaultAsync(t => t.Id == tomaId);
        if (toma == null) return NotFound("Toma no encontrada.");
        if (toma.Status == "CERRADA") return BadRequest("No puedes cancelar una toma cerrada.");
        if (toma.Status == "CANCELADA") return Ok(new { message = "Ya estaba cancelada." });

        toma.Status = "CANCELADA";
        toma.CerradaEn = DateTime.UtcNow;
        toma.CerradaPorUserId = TryGetUserId();

        await _db.SaveChangesAsync();

        return Ok(new { tomaId, status = toma.Status, canceladaEn = toma.CerradaEn });
    }

    // ======================
    // 7) Reporte (JSON para revisión pre-finalización)
    // ======================
    [HttpGet("{tomaId:long}/reporte")]
    [Authorize(Policy = PERM_REPORTE)]
    public async Task<IActionResult> Reporte(
        long tomaId,
        [FromQuery] bool soloDiferencias = false,
        [FromQuery] bool soloCapturados = false
    )
    {
        var toma = await _db.InvTomas.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tomaId);
        if (toma == null) return NotFound("Toma no encontrada.");

        var query =
            from d in _db.InvTomasDet.AsNoTracking()
            join p in _db.FbProductos.AsNoTracking() on d.CveArt equals p.CveArt
            where d.TomaId == tomaId
            select new
            {
                d.CveArt,
                p.Descr,
                p.UniMed,
                ExistSistema = d.ExistSistema,
                ExistFisico = d.ExistFisico,
                Diferencia = (d.ExistFisico ?? 0m) - d.ExistSistema,
                Capturado = d.ExistFisico != null
            };

        if (soloCapturados)
            query = query.Where(x => x.Capturado);

        if (soloDiferencias)
            query = query.Where(x => x.Diferencia != 0m);

        var items = await query
            .OrderBy(x => x.CveArt)
            .ToListAsync();

        var totalProductos = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId);
        var capturados = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId && d.ExistFisico != null);
        var conDiferencia = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId && d.ExistFisico != null && (d.ExistFisico.Value - d.ExistSistema) != 0m);
        var sinCapturar = await _db.InvTomasDet.CountAsync(d => d.TomaId == tomaId && d.ExistFisico == null);

        return Ok(new
        {
            resumen = new
            {
                toma.Id,
                toma.CveAlm,
                toma.Status,
                toma.CreadaEn,
                toma.CerradaEn,
                totalProductos,
                capturados,
                sinCapturar,
                conDiferencia
            },
            items
        });
    }

    // ======================
    // 8) PDF profesional (reimpresión / auditoría)
    // ======================
    [HttpGet("{tomaId:long}/pdf")]
    [Authorize(Policy = PERM_REPORTE)]
    public async Task<IActionResult> Pdf(long tomaId)
    {
        var toma = await _db.InvTomas.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tomaId);
        if (toma == null) return NotFound("Toma no encontrada.");

        var alm = await _db.FbAlmacenes.AsNoTracking().FirstOrDefaultAsync(a => a.CveAlm == toma.CveAlm);
        var userName = "N/D";
        if (toma.CreadaPorUserId.HasValue)
        {
            var u = await _db.Usuarios.AsNoTracking().FirstOrDefaultAsync(x => x.Id == toma.CreadaPorUserId.Value);
            if (u != null) userName = $"{u.Nombre} {u.Apellidos}".Trim();
        }

        var items = await (
            from d in _db.InvTomasDet.AsNoTracking()
            join p in _db.FbProductos.AsNoTracking() on d.CveArt equals p.CveArt
            where d.TomaId == tomaId
            orderby d.CveArt
            select new PdfRow
            {
                CveArt = d.CveArt,
                Descr = p.Descr ?? "",
                UniMed = p.UniMed ?? "",
                ExistSistema = d.ExistSistema,
                ExistFisico = d.ExistFisico,
                Diferencia = (d.ExistFisico ?? 0m) - d.ExistSistema,
                Capturado = d.ExistFisico != null
            }
        ).ToListAsync();

        var totalProductos = items.Count;
        var capturados = items.Count(x => x.Capturado);
        var conDiferencia = items.Count(x => x.Capturado && x.Diferencia != 0m);
        var sinCapturar = totalProductos - capturados;

        var meta = new PdfMeta
        {
            Empresa = "Comssire",
            TomaId = toma.Id,
            Fecha = DateTime.UtcNow,
            Usuario = userName,
            Almacen = $"{toma.CveAlm} - {alm?.Descr ?? "N/D"}",
            Status = toma.Status,
            CreadaEn = toma.CreadaEn,
            CerradaEn = toma.CerradaEn,
            TotalProductos = totalProductos,
            Capturados = capturados,
            SinCapturar = sinCapturar,
            ConDiferencia = conDiferencia
        };

        // QuestPDF licencia (Community) -> ok.
        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(25);

                page.Header().Column(col =>
                {
                    col.Item().Text(meta.Empresa).FontSize(18).SemiBold();
                    col.Item().Text($"Reporte de Toma de Inventario #{meta.TomaId}").FontSize(12).SemiBold();

                    col.Item().PaddingTop(6).Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Fecha reporte (UTC): {meta.Fecha:yyyy-MM-dd HH:mm}");
                            c.Item().Text($"Usuario: {meta.Usuario}");
                            c.Item().Text($"Almacén: {meta.Almacen}");
                        });

                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Estatus: {meta.Status}");
                            c.Item().Text($"Creada (UTC): {meta.CreadaEn:yyyy-MM-dd HH:mm}");
                            c.Item().Text($"Cerrada (UTC): {(meta.CerradaEn.HasValue ? meta.CerradaEn.Value.ToString("yyyy-MM-dd HH:mm") : "N/A")}");
                        });
                    });

                    col.Item().PaddingTop(10).LineHorizontal(1);
                });

                page.Content().PaddingTop(10).Column(col =>
                {
                    col.Item().Text("Detalle").FontSize(12).SemiBold();

                    col.Item().PaddingTop(6).Table(t =>
                    {
                        t.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(70);  // Código
                            cols.RelativeColumn(3);   // Producto
                            cols.ConstantColumn(60);  // UM
                            cols.ConstantColumn(70);  // Sistema
                            cols.ConstantColumn(70);  // Físico
                            cols.ConstantColumn(70);  // Dif
                        });

                        static IContainer CellStyle(IContainer c) =>
                            c.PaddingVertical(3).PaddingHorizontal(4);

                        t.Header(h =>
                        {
                            h.Cell().Element(CellStyle).Text("Código").SemiBold();
                            h.Cell().Element(CellStyle).Text("Producto").SemiBold();
                            h.Cell().Element(CellStyle).Text("UM").SemiBold();
                            h.Cell().Element(CellStyle).AlignRight().Text("Sistema").SemiBold();
                            h.Cell().Element(CellStyle).AlignRight().Text("Físico").SemiBold();
                            h.Cell().Element(CellStyle).AlignRight().Text("Dif").SemiBold();
                        });

                        foreach (var it in items)
                        {
                            t.Cell().Element(CellStyle).Text(it.CveArt);
                            t.Cell().Element(CellStyle).Text(it.Descr);
                            t.Cell().Element(CellStyle).Text(it.UniMed);

                            t.Cell().Element(CellStyle).AlignRight().Text(FormatDec(it.ExistSistema));
                            t.Cell().Element(CellStyle).AlignRight().Text(it.ExistFisico.HasValue ? FormatDec(it.ExistFisico.Value) : "—");
                            t.Cell().Element(CellStyle).AlignRight().Text(it.Capturado ? FormatDec(it.Diferencia) : "—");
                        }
                    });

                    col.Item().PaddingTop(12).LineHorizontal(1);

                    col.Item().PaddingTop(8).Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Resumen").FontSize(12).SemiBold();
                            c.Item().Text($"Total productos: {meta.TotalProductos}");
                            c.Item().Text($"Capturados: {meta.Capturados}");
                            c.Item().Text($"Sin capturar: {meta.SinCapturar}");
                            c.Item().Text($"Con diferencia: {meta.ConDiferencia}");
                        });

                        r.RelativeItem().Column(c =>
                        {
                            var totalDifAbs = items.Where(x => x.Capturado).Sum(x => Math.Abs((double)x.Diferencia));
                            c.Item().Text("Estadísticas").FontSize(12).SemiBold();
                            c.Item().Text($"Suma |diferencias|: {totalDifAbs:0.######}");
                            c.Item().Text("Nota: diferencias calculadas como Físico - Sistema.");
                        });
                    });
                });

                page.Footer().AlignRight().Text(t =>
                {
                    t.Span("Página ");
                    t.CurrentPageNumber();
                    t.Span(" / ");
                    t.TotalPages();
                });
            });
        }).GeneratePdf();

        var fileName = $"toma_{tomaId}_{DateTime.UtcNow:yyyyMMdd_HHmm}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    // ----------------------
    // Helpers
    // ----------------------
    private int? TryGetUserId()
    {
        var userIdClaim =
            User.Claims.FirstOrDefault(c =>
                c.Type.EndsWith("/nameidentifier") ||
                c.Type.EndsWith("nameidentifier") ||
                c.Type == "sub"
            )?.Value;

        return int.TryParse(userIdClaim, out var id) ? id : null;
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        if (dt.Kind == DateTimeKind.Utc) return dt;
        if (dt.Kind == DateTimeKind.Local) return dt.ToUniversalTime();
        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    private static string FormatDec(decimal v)
        => v.ToString("0.######");

    private class PdfMeta
    {
        public string Empresa { get; set; } = "";
        public long TomaId { get; set; }
        public DateTime Fecha { get; set; }
        public string Usuario { get; set; } = "";
        public string Almacen { get; set; } = "";
        public string Status { get; set; } = "";
        public DateTime CreadaEn { get; set; }
        public DateTime? CerradaEn { get; set; }
        public int TotalProductos { get; set; }
        public int Capturados { get; set; }
        public int SinCapturar { get; set; }
        public int ConDiferencia { get; set; }
    }

    private class PdfRow
    {
        public string CveArt { get; set; } = "";
        public string Descr { get; set; } = "";
        public string UniMed { get; set; } = "";
        public decimal ExistSistema { get; set; }
        public decimal? ExistFisico { get; set; }
        public decimal Diferencia { get; set; }
        public bool Capturado { get; set; }
    }
}